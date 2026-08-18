import {
  estimateTokenAmountUsd,
  formatRawTokenBalance,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import {
  SOLANA_ACCOUNT_RENT_LAMPORTS,
  SOLANA_SPL_RESERVE_LAMPORTS,
  SOLANA_TX_FEE_LAMPORTS,
  solanaSpendableFeeBudget,
} from '@/lib/send/solanaFees';
import {
  canPayNetworkGas,
  isBaseGasPaymentToken,
  isGasToken,
  networkSupportsStablecoinGas,
} from '@/lib/strategies/gasTokens';
import { isNativeTokenAddress } from '@/lib/alchemy/tokenLogos';

/** Typical EVM transfer gas limits (units). */
export const EVM_NATIVE_TRANSFER_GAS = 21_000n;
export const EVM_ERC20_TRANSFER_GAS = 65_000n;

/**
 * Per-network gas floors. Arbitrum rejects plain 21k transfers with
 * "intrinsic gas too low"; other L2s often need a little headroom too.
 */
export function evmTransferGasLimit(
  network: string,
  forTokenTransfer: boolean,
): bigint {
  if (forTokenTransfer) {
    if (network === 'arb-mainnet') {
      return 150_000n;
    }
    if (
      network === 'base-mainnet' ||
      network === 'opt-mainnet' ||
      network === 'polygon-mainnet' ||
      network === 'avax-mainnet'
    ) {
      return 80_000n;
    }
    return EVM_ERC20_TRANSFER_GAS;
  }

  if (network === 'arb-mainnet') {
    return 100_000n;
  }
  if (
    network === 'base-mainnet' ||
    network === 'opt-mainnet' ||
    network === 'polygon-mainnet' ||
    network === 'avax-mainnet'
  ) {
    return 30_000n;
  }
  return EVM_NATIVE_TRANSFER_GAS;
}

/**
 * Typical per-tx fee in USD. L2 execution gas is tiny; most cost is L1 data /
 * posting. Anchoring in USD keeps dust ETH on Base/Arb/OP mostly spendable
 * while still leaving enough for a normal transfer.
 */
export const TYPICAL_FEE_USD: Record<string, number> = {
  'eth-mainnet': 1.25,
  'base-mainnet': 0.02,
  'arb-mainnet': 0.02,
  'opt-mainnet': 0.02,
  'polygon-mainnet': 0.02,
  'avax-mainnet': 0.03,
  // SPL sends may need ~0.002 SOL ATA rent for a new recipient token account.
  'solana-mainnet': 0.35,
};

/**
 * Raw fallbacks only when the gas token has no USD price to convert from.
 * Aligned with prepareEvmSend L2 L1 pads / Solana ATA rent so Available Balance
 * matches what sends actually need.
 */
export const FALLBACK_FEE_PER_TX_RAW: Record<string, bigint> = {
  'eth-mainnet': 400_000_000_000_000n, // 0.0004 ETH
  // ~$0.02–0.04 at typical ETH prices; real Base/OP/Arb transfers are often less.
  'base-mainnet': 10_000_000_000_000n, // 0.00001 ETH
  'arb-mainnet': 10_000_000_000_000n,
  'opt-mainnet': 10_000_000_000_000n,
  'polygon-mainnet': 20_000_000_000_000_000n, // 0.02 POL
  'avax-mainnet': 1_000_000_000_000_000n, // 0.001 AVAX
  'solana-mainnet': SOLANA_SPL_RESERVE_LAMPORTS,
};

const FEE_BUFFER_NUMERATOR = 150n;
const FEE_BUFFER_DENOMINATOR = 100n;

export type NetworkGasFeeEstimate = {
  /** Native raw units from gasPrice × gasLimit (may be tiny on L2s). */
  feePerTxRaw: bigint;
};

export type GasFundingPick = {
  token: OwnedToken;
  amountRaw: bigint;
  amountFormatted: string;
  usd: number;
};

/**
 * Gas reserved on fee-paying tokens (wallet balance minus spendable).
 * When `usedNetworks` is set, only gas tokens on those networks are included.
 */
export function resolveGasFunding(
  walletTokens: readonly OwnedToken[],
  spendableTokens: readonly OwnedToken[],
  usedNetworks?: ReadonlySet<string>,
  txCountByNetwork?: ReadonlyMap<string, number>,
): GasFundingPick[] {
  const spendableById = new Map(
    spendableTokens.map((token) => [token.id, token] as const),
  );
  const picks: GasFundingPick[] = [];

  for (const wallet of walletTokens) {
    if (!canPayNetworkGas(wallet) || wallet.rawBalance <= 0n) {
      continue;
    }
    if (
      usedNetworks != null &&
      usedNetworks.size > 0 &&
      !usedNetworks.has(wallet.network)
    ) {
      continue;
    }
    const spendable = spendableById.get(wallet.id);
    if (spendable == null) {
      continue;
    }
    let amountRaw =
      wallet.rawBalance > spendable.rawBalance
        ? wallet.rawBalance - spendable.rawBalance
        : 0n;

    if (
      amountRaw >= wallet.rawBalance &&
      isBaseGasPaymentToken(wallet) &&
      spendable.rawBalance === 0n
    ) {
      const txCount = Math.max(1, txCountByNetwork?.get(wallet.network) ?? 1);
      const feeRaw = usdFeeToRaw(
        wallet,
        typicalFeeUsd(wallet.network, true) * txCount,
      );
      if (feeRaw != null && feeRaw > 0n) {
        amountRaw = feeRaw > wallet.rawBalance ? wallet.rawBalance : feeRaw;
      }
    }

    if (amountRaw <= 0n) {
      continue;
    }

    picks.push({
      token: wallet,
      amountRaw,
      amountFormatted: formatRawTokenBalance(amountRaw, wallet.decimals),
      usd:
        estimateTokenAmountUsd(wallet, amountRaw) ??
        (wallet.usdValue != null && wallet.rawBalance > 0n
          ? wallet.usdValue * (Number(amountRaw) / Number(wallet.rawBalance))
          : 0),
    });
  }

  return picks.sort((a, b) => b.usd - a.usd);
}

function maxBigInt(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

function typicalFeeUsd(network: string, forSplTransfer: boolean): number {
  if (network === 'solana-mainnet' && !forSplTransfer) {
    return 0.002;
  }
  return TYPICAL_FEE_USD[network] ?? 0.05;
}

export function fallbackFeePerTxRaw(
  network: string,
  forSplTransfer = true,
): bigint {
  if (network === 'solana-mainnet') {
    return forSplTransfer
      ? SOLANA_SPL_RESERVE_LAMPORTS
      : SOLANA_TX_FEE_LAMPORTS;
  }
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
  network = 'eth-mainnet',
): bigint {
  const gasLimit = evmTransferGasLimit(network, forTokenTransfer);
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
  forTokenTransfer: boolean,
): bigint {
  const fromEstimate = estimate?.feePerTxRaw ?? 0n;
  const fromFallback = fallbackFeePerTxRaw(network, forTokenTransfer);

  // Solana + L2 fees are anchored in native units (tx fee / ATA rent / L1 data
  // pad). Do not derive the reserve from USD — a dust gas balance priced at
  // $0.08 can make a $0.05 fee target exceed the whole balance and wrongly
  // hide funded ERC-20s / SPLs from Available Balance.
  if (
    network === 'solana-mainnet' ||
    network === 'base-mainnet' ||
    network === 'opt-mainnet' ||
    network === 'arb-mainnet' ||
    network === 'polygon-mainnet' ||
    network === 'avax-mainnet'
  ) {
    return maxBigInt(fromEstimate, fromFallback);
  }

  const fromUsd = gasToken
    ? usdFeeToRaw(gasToken, typicalFeeUsd(network, forTokenTransfer))
    : null;

  if (
    fromUsd != null &&
    gasToken != null &&
    fromUsd <= gasToken.rawBalance
  ) {
    return maxBigInt(fromEstimate, maxBigInt(fromUsd, fromFallback));
  }
  return maxBigInt(fromEstimate, fromFallback);
}

/**
 * Native fee reserve for emptying every positive balance on a network that
 * can actually be funded with on-hand gas.
 */
export function networkFeeReserveRaw(
  network: string,
  onNetwork: OwnedToken[],
  estimate: NetworkGasFeeEstimate | undefined,
): bigint {
  const withBalance = onNetwork.filter((token) => token.rawBalance > 0n);
  if (withBalance.length === 0) {
    return 0n;
  }

  if (network === 'solana-mainnet') {
    const plan = planSolanaFeeReserve(withBalance);
    return plan?.reserveLamports ?? 0n;
  }

  const plan = planEvmFeeReserve(network, withBalance, estimate);
  if (plan == null) {
    return 0n;
  }
  let total = 0n;
  for (const reserve of plan.reserveByGasPayerId.values()) {
    total += reserve;
  }
  return total;
}

export type EvmFeeReservePlan = {
  /** Raw units reserved on each fee-paying token. */
  reserveByGasPayerId: Map<string, bigint>;
  spendableTokenIds: Set<string>;
};

function sortGasPayersForReserve(gasPayers: OwnedToken[]): OwnedToken[] {
  return [...gasPayers].sort((a, b) => {
    const aStable = isBaseGasPaymentToken(a) ? 0 : 1;
    const bStable = isBaseGasPaymentToken(b) ? 0 : 1;
    if (aStable !== bStable) {
      return aStable - bStable;
    }
    return (b.usdValue ?? 0) - (a.usdValue ?? 0);
  });
}

function allocateReserveUsdToGasPayers(
  gasPayers: OwnedToken[],
  reserveUsd: number,
): Map<string, bigint> {
  const reserveByGasPayerId = new Map<string, bigint>();
  if (!(reserveUsd > 0)) {
    return reserveByGasPayerId;
  }

  let remainingUsd = reserveUsd;
  for (const payer of sortGasPayersForReserve(gasPayers)) {
    if (remainingUsd <= 0) {
      break;
    }
    const payerUsd = payer.usdValue ?? 0;
    if (!(payerUsd > 0)) {
      continue;
    }
    const takeUsd = Math.min(remainingUsd, payerUsd);
    const raw = usdFeeToRaw(payer, takeUsd);
    if (raw == null || raw <= 0n) {
      continue;
    }
    reserveByGasPayerId.set(
      payer.id,
      (reserveByGasPayerId.get(payer.id) ?? 0n) + raw,
    );
    remainingUsd -= takeUsd;
  }

  return reserveByGasPayerId;
}

function planBaseStablecoinGasReserve(
  onNetwork: OwnedToken[],
): EvmFeeReservePlan | null {
  const withBalance = onNetwork.filter((token) => token.rawBalance > 0n);
  const gasPayers = withBalance.filter((token) => canPayNetworkGas(token));
  const stableGasPayers = gasPayers.filter((token) =>
    isBaseGasPaymentToken(token),
  );
  if (stableGasPayers.length === 0) {
    return null;
  }

  const paymentTokens = withBalance
    .filter((token) => !canPayNetworkGas(token))
    .sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));
  const nativePayer = gasPayers.find((token) =>
    isNativeTokenAddress(token.tokenAddress),
  );

  const totalGasUsd = gasPayers.reduce(
    (sum, token) => sum + (token.usdValue ?? 0),
    0,
  );
  const erc20FeeUsd = typicalFeeUsd('base-mainnet', true);
  const nativeFeeUsd = typicalFeeUsd('base-mainnet', false);

  const spendableTokenIds = new Set<string>();
  let usedUsd = 0;

  for (const token of paymentTokens) {
    if (totalGasUsd - usedUsd >= erc20FeeUsd) {
      spendableTokenIds.add(token.id);
      usedUsd += erc20FeeUsd;
    }
  }

  if (nativePayer != null && totalGasUsd - usedUsd >= nativeFeeUsd) {
    spendableTokenIds.add(nativePayer.id);
    usedUsd += nativeFeeUsd;
  }

  for (const payer of stableGasPayers) {
    if (spendableTokenIds.has(payer.id)) {
      continue;
    }
    if (totalGasUsd - usedUsd >= erc20FeeUsd) {
      spendableTokenIds.add(payer.id);
      usedUsd += erc20FeeUsd;
    }
  }

  if (spendableTokenIds.size === 0) {
    return null;
  }

  return {
    reserveByGasPayerId: allocateReserveUsdToGasPayers(gasPayers, usedUsd),
    spendableTokenIds,
  };
}

/**
 * Chooses how many EVM balances are actually sendable given current gas funds.
 * Prefer highest-USD ERC-20s first; leftover native above one transfer fee stays
 * spendable. Avoids all-or-nothing so dust ETH does not hide a funded USDC.
 */
export function planEvmFeeReserve(
  network: string,
  onNetwork: OwnedToken[],
  estimate: NetworkGasFeeEstimate | undefined,
): EvmFeeReservePlan | null {
  const withBalance = onNetwork.filter((token) => token.rawBalance > 0n);
  if (withBalance.length === 0) {
    return null;
  }

  if (networkSupportsStablecoinGas(network)) {
    const basePlan = planBaseStablecoinGasReserve(withBalance);
    if (basePlan != null) {
      return basePlan;
    }
  }

  const gasToken = withBalance.find((token) => isGasToken(token));
  const gasRaw = gasToken?.rawBalance ?? 0n;
  const erc20Tokens = [
    ...withBalance.filter((token) => !isGasToken(token)),
  ].sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

  const erc20Fee = feeReserveRawForNetwork(
    network,
    gasToken,
    estimate,
    true,
  );
  const nativeFee = feeReserveRawForNetwork(
    network,
    gasToken,
    estimate,
    false,
  );

  const spendableTokenIds = new Set<string>();
  let used = 0n;

  for (const token of erc20Tokens) {
    const next = used + erc20Fee;
    if (gasRaw >= next) {
      spendableTokenIds.add(token.id);
      used = next;
    }
  }

  const reserveByGasPayerId = new Map<string, bigint>();
  let reserveWei = used;
  if (gasToken) {
    const leftover = gasRaw - used;
    if (leftover >= nativeFee) {
      reserveWei = used + nativeFee;
      spendableTokenIds.add(gasToken.id);
    } else if (spendableTokenIds.size === 0 && gasRaw >= nativeFee) {
      reserveWei = nativeFee;
      spendableTokenIds.add(gasToken.id);
    }
    if (reserveWei > 0n) {
      reserveByGasPayerId.set(gasToken.id, reserveWei);
    }
  }

  if (spendableTokenIds.size === 0) {
    return null;
  }

  return { reserveByGasPayerId, spendableTokenIds };
}

/**
 * Chooses how many Solana balances are actually sendable given current SOL.
 * Prefer highest-USD SPLs first; leftover SOL above rent + tx fee stays spendable.
 *
 * The fee payer’s system-account rent (~0.00089 SOL) is never spendable.
 */
export function planSolanaFeeReserve(onNetwork: OwnedToken[]): {
  reserveLamports: bigint;
  spendableTokenIds: Set<string>;
} | null {
  const withBalance = onNetwork.filter((token) => token.rawBalance > 0n);
  if (withBalance.length === 0) {
    return null;
  }

  const gasToken = withBalance.find((token) => isGasToken(token));
  const gasRaw = gasToken?.rawBalance ?? 0n;
  const feeBudget = solanaSpendableFeeBudget(gasRaw);
  const splTokens = [...withBalance.filter((token) => !isGasToken(token))].sort(
    (a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0),
  );

  const spendableTokenIds = new Set<string>();
  let used = 0n;

  for (const spl of splTokens) {
    const next = used + SOLANA_SPL_RESERVE_LAMPORTS;
    if (feeBudget >= next) {
      spendableTokenIds.add(spl.id);
      used = next;
    }
  }

  let reserveLamports = SOLANA_ACCOUNT_RENT_LAMPORTS + used;
  if (gasToken) {
    const leftoverBudget = feeBudget - used;
    if (leftoverBudget >= SOLANA_TX_FEE_LAMPORTS) {
      reserveLamports =
        SOLANA_ACCOUNT_RENT_LAMPORTS + used + SOLANA_TX_FEE_LAMPORTS;
      spendableTokenIds.add(gasToken.id);
    } else if (
      spendableTokenIds.size === 0 &&
      feeBudget >= SOLANA_TX_FEE_LAMPORTS
    ) {
      reserveLamports =
        SOLANA_ACCOUNT_RENT_LAMPORTS + SOLANA_TX_FEE_LAMPORTS;
      spendableTokenIds.add(gasToken.id);
    } else if (spendableTokenIds.size > 0) {
      // Dust above rent after SPL locks — keep it for fees, not spendable SOL.
      reserveLamports = gasRaw;
    }
  }

  if (spendableTokenIds.size === 0) {
    return null;
  }

  return { reserveLamports, spendableTokenIds };
}

/**
 * Reduces native gas-token balances by a fee reserve so allocation and
 * Available Balance never treat gas money as spendable payment.
 *
 * Tokens that cannot be funded with on-hand gas (e.g. SPL without enough SOL
 * for ATA rent) are treated as unspendable so Available Balance never shows
 * an amount that requires topping up native gas.
 */
export function applyGasReserves(
  tokens: OwnedToken[],
  feeEstimates: ReadonlyMap<string, NetworkGasFeeEstimate>,
): OwnedToken[] {
  if (tokens.length === 0) {
    return tokens;
  }

  const networks = new Set(tokens.map((token) => token.network));
  const reserveByTokenId = new Map<string, bigint>();
  const spendableIdsByNetwork = new Map<string, Set<string> | 'all' | 'none'>();

  for (const network of networks) {
    const onNetwork = tokens.filter((token) => token.network === network);
    if (onNetwork.every((token) => token.rawBalance <= 0n)) {
      continue;
    }

    if (network === 'solana-mainnet') {
      const plan = planSolanaFeeReserve(onNetwork);
      if (plan == null) {
        spendableIdsByNetwork.set(network, 'none');
      } else {
        const gasToken = onNetwork.find((token) => isGasToken(token));
        if (gasToken != null && plan.reserveLamports > 0n) {
          reserveByTokenId.set(gasToken.id, plan.reserveLamports);
        }
        spendableIdsByNetwork.set(network, plan.spendableTokenIds);
      }
      continue;
    }

    const plan = planEvmFeeReserve(
      network,
      onNetwork,
      feeEstimates.get(network),
    );
    if (plan == null) {
      spendableIdsByNetwork.set(network, 'none');
    } else {
      for (const [tokenId, reserve] of plan.reserveByGasPayerId) {
        reserveByTokenId.set(tokenId, reserve);
      }
      spendableIdsByNetwork.set(network, plan.spendableTokenIds);
    }
  }

  return tokens.map((token) => {
    const reserve = reserveByTokenId.get(token.id) ?? 0n;
    const spendable = spendableIdsByNetwork.get(token.network) ?? 'all';

    const isSpendable =
      spendable === 'all' ||
      (spendable !== 'none' && spendable.has(token.id));

    if (!isSpendable) {
      if (token.rawBalance <= 0n && (token.usdValue == null || token.usdValue === 0)) {
        return token;
      }
      return {
        ...token,
        rawBalance: 0n,
        balanceFormatted: formatRawTokenBalance(0n, token.decimals),
        usdValue: token.usdValue == null ? null : 0,
      };
    }

    if (!canPayNetworkGas(token) || reserve <= 0n) {
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
