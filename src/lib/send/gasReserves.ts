import {
  formatRawTokenBalance,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import { isGasToken } from '@/lib/strategies/gasTokens';

/** Typical EVM transfer gas limits (units). */
export const EVM_NATIVE_TRANSFER_GAS = 21_000n;
export const EVM_ERC20_TRANSFER_GAS = 65_000n;

/**
 * Typical per-tx fee in USD. L2 execution gas is tiny; most cost is L1 data /
 * posting. Anchoring in USD keeps ~$0.20 of ETH on Base/Arb/OP mostly spendable
 * while still leaving enough for a normal transfer.
 */
export const TYPICAL_FEE_USD: Record<string, number> = {
  'eth-mainnet': 1.25,
  'base-mainnet': 0.06,
  'arb-mainnet': 0.06,
  'opt-mainnet': 0.06,
  'polygon-mainnet': 0.02,
  'solana-mainnet': 0.005,
};

/**
 * Raw fallbacks only when the gas token has no USD price to convert from.
 * Also used as a floor for send-time max-fee clamps (EIP-1559 balance checks).
 */
export const FALLBACK_FEE_PER_TX_RAW: Record<string, bigint> = {
  'eth-mainnet': 400_000_000_000_000n, // 0.0004 ETH
  'base-mainnet': 25_000_000_000_000n, // 0.000025 ETH
  'arb-mainnet': 25_000_000_000_000n,
  'opt-mainnet': 25_000_000_000_000n,
  'polygon-mainnet': 20_000_000_000_000_000n, // 0.02 POL
  'solana-mainnet': 50_000n, // 0.00005 SOL
};

const FEE_BUFFER_NUMERATOR = 150n;
const FEE_BUFFER_DENOMINATOR = 100n;

export type NetworkGasFeeEstimate = {
  /** Native raw units from gasPrice × gasLimit (may be tiny on L2s). */
  feePerTxRaw: bigint;
};

function maxBigInt(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

function typicalFeeUsd(network: string): number {
  return TYPICAL_FEE_USD[network] ?? 0.05;
}

export function fallbackFeePerTxRaw(network: string): bigint {
  return (
    FALLBACK_FEE_PER_TX_RAW[network] ?? FALLBACK_FEE_PER_TX_RAW['eth-mainnet']
  );
}

/**
 * Execution-layer fee from an EVM gas price. Callers should still apply the
 * USD typical floor via `applyGasReserves` for L2 L1 data fees.
 */
export function evmFeePerTxRaw(
  gasPriceWei: bigint,
  forTokenTransfer: boolean,
): bigint {
  const gasLimit = forTokenTransfer
    ? EVM_ERC20_TRANSFER_GAS
    : EVM_NATIVE_TRANSFER_GAS;
  return (gasLimit * gasPriceWei * FEE_BUFFER_NUMERATOR) / FEE_BUFFER_DENOMINATOR;
}

/** Converts a USD fee target into raw gas-token units using the token's price. */
export function usdFeeToRaw(token: OwnedToken, feeUsd: number): bigint | null {
  if (
    !(feeUsd > 0) ||
    token.usdValue == null ||
    !(token.usdValue > 0) ||
    token.rawBalance <= 0n
  ) {
    return null;
  }

  const rawNumber = (feeUsd / token.usdValue) * Number(token.rawBalance);
  if (!Number.isFinite(rawNumber) || rawNumber <= 0) {
    return null;
  }

  return BigInt(Math.ceil(rawNumber));
}

function scaleUsd(usdValue: number | null, rawBalance: bigint, nextRaw: bigint): number | null {
  if (usdValue == null || rawBalance <= 0n) {
    return usdValue;
  }
  if (nextRaw <= 0n) {
    return 0;
  }
  if (nextRaw >= rawBalance) {
    return usdValue;
  }
  const scaled = usdValue * (Number(nextRaw) / Number(rawBalance));
  return Number.isFinite(scaled) ? scaled : usdValue;
}

function feeReserveRawForNetwork(
  network: string,
  gasToken: OwnedToken | undefined,
  estimate: NetworkGasFeeEstimate | undefined,
): bigint {
  const fromEstimate = estimate?.feePerTxRaw ?? 0n;
  const fromUsd = gasToken
    ? usdFeeToRaw(gasToken, typicalFeeUsd(network))
    : null;
  const fromFallback = fallbackFeePerTxRaw(network);

  if (fromUsd != null) {
    return maxBigInt(fromEstimate, fromUsd);
  }
  return maxBigInt(fromEstimate, fromFallback);
}

/**
 * Reduces native gas-token balances by a fee reserve so allocation and
 * Available Balance never treat gas money as spendable payment.
 *
 * Reserves **one** typical transfer per network (not one per token). Dust like
 * ~$0.20 of ETH on Base/Arb/OP stays mostly spendable after ~$0.06 for gas.
 */
export function applyGasReserves(
  tokens: OwnedToken[],
  feeEstimates: ReadonlyMap<string, NetworkGasFeeEstimate>,
): OwnedToken[] {
  if (tokens.length === 0) {
    return tokens;
  }

  const networks = new Set(tokens.map((token) => token.network));
  const reserveByNetwork = new Map<string, bigint>();

  for (const network of networks) {
    const onNetwork = tokens.filter(
      (token) => token.network === network && token.rawBalance > 0n,
    );
    if (onNetwork.length === 0) {
      continue;
    }

    const gasToken = onNetwork.find((token) => isGasToken(token));
    const feePerTx = feeReserveRawForNetwork(
      network,
      gasToken,
      feeEstimates.get(network),
    );
    reserveByNetwork.set(network, feePerTx);
  }

  return tokens.map((token) => {
    if (!isGasToken(token)) {
      return token;
    }
    const reserve = reserveByNetwork.get(token.network) ?? 0n;
    if (reserve <= 0n) {
      return token;
    }

    const nextRaw =
      token.rawBalance > reserve ? token.rawBalance - reserve : 0n;
    if (nextRaw === token.rawBalance) {
      return token;
    }

    return {
      ...token,
      rawBalance: nextRaw,
      balanceFormatted: formatRawTokenBalance(nextRaw, token.decimals),
      usdValue: scaleUsd(token.usdValue, token.rawBalance, nextRaw),
    };
  });
}

/** Sum of priced spendable USD after gas reserves. */
export function totalSpendableUsd(tokens: OwnedToken[]): number | null {
  return tokens.reduce<number | null>((sum, token) => {
    if (token.usdValue == null) {
      return sum;
    }
    return (sum ?? 0) + token.usdValue;
  }, null);
}
