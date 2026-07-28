import {
  formatRawTokenBalance,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import { isGasToken } from '@/lib/strategies/gasTokens';

/** Typical EVM transfer gas limits (units). */
export const EVM_NATIVE_TRANSFER_GAS = 21_000n;
export const EVM_ERC20_TRANSFER_GAS = 65_000n;

/**
 * Minimum native fee reserved per tx. L2 `gasPrice * gasLimit` understates the
 * real cost (OP-stack L1 data fee, Arb posting, spikes), which caused
 * "gas required exceeds allowance" when sending the full Available Balance.
 */
export const MIN_FEE_PER_TX_RAW: Record<string, bigint> = {
  'eth-mainnet': 1_500_000_000_000_000n, // 0.0015 ETH
  'base-mainnet': 120_000_000_000_000n, // 0.00012 ETH
  'arb-mainnet': 120_000_000_000_000n,
  'opt-mainnet': 120_000_000_000_000n,
  'polygon-mainnet': 50_000_000_000_000_000n, // 0.05 POL
  'solana-mainnet': 200_000n, // 0.0002 SOL
};

/** Same floors used when live fee fetches fail. */
export const FALLBACK_FEE_PER_TX_RAW = MIN_FEE_PER_TX_RAW;

const FEE_BUFFER_NUMERATOR = 200n;
const FEE_BUFFER_DENOMINATOR = 100n;

export type NetworkGasFeeEstimate = {
  /** Native raw units charged for one transfer on this network. */
  feePerTxRaw: bigint;
};

function maxBigInt(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

/**
 * Builds a per-tx fee from an EVM gas price (wei) and whether legs may be ERC-20.
 * Always at least `MIN_FEE_PER_TX_RAW` so L2 L1 data fees are covered.
 */
export function evmFeePerTxRaw(
  network: string,
  gasPriceWei: bigint,
  forTokenTransfer: boolean,
): bigint {
  const gasLimit = forTokenTransfer
    ? EVM_ERC20_TRANSFER_GAS
    : EVM_NATIVE_TRANSFER_GAS;
  const fromPrice =
    (gasLimit * gasPriceWei * FEE_BUFFER_NUMERATOR) / FEE_BUFFER_DENOMINATOR;
  return maxBigInt(fromPrice, minFeePerTxRaw(network));
}

export function minFeePerTxRaw(network: string): bigint {
  return MIN_FEE_PER_TX_RAW[network] ?? MIN_FEE_PER_TX_RAW['eth-mainnet'];
}

export function fallbackFeePerTxRaw(network: string): bigint {
  return minFeePerTxRaw(network);
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

/**
 * Reduces native gas-token balances by a fee reserve so allocation and
 * Available Balance never treat gas money as spendable payment.
 *
 * Reserves `feePerTx * potentialLegs` per network (one leg per non-zero
 * balance on that network), so a displayed available amount can be sent.
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

    const estimate = feeEstimates.get(network);
    const feePerTx = estimate?.feePerTxRaw ?? fallbackFeePerTxRaw(network);

    const potentialLegs = BigInt(onNetwork.length);
    reserveByNetwork.set(network, feePerTx * potentialLegs);
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
