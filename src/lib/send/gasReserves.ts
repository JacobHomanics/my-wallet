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
import type { TaxFundingPick } from '@/lib/send/buildPaymentLegsWithTax';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';
import {
  BASE_PRIVY_TRANSFER_GAS_RESERVE_RAW,
  canPayOwnTransferGas,
  hasGasReserve,
  isBaseGasPaymentToken,
  isGasToken,
} from '@/lib/strategies/gasTokens';
import { getTaxConfig } from '@/lib/tax';

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
): GasFundingPick[] {
  const spendableById = new Map(
    spendableTokens.map((token) => [token.id, token] as const),
  );
  const picks: GasFundingPick[] = [];

  for (const wallet of walletTokens) {
    if (!hasGasReserve(wallet) || wallet.rawBalance <= 0n) {
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
    const amountRaw =
      wallet.rawBalance > spendable.rawBalance
        ? wallet.rawBalance - spendable.rawBalance
        : 0n;
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

function buildGasFundingPick(
  wallet: OwnedToken,
  amountRaw: bigint,
): GasFundingPick {
  return {
    token: wallet,
    amountRaw,
    amountFormatted: formatRawTokenBalance(amountRaw, wallet.decimals),
    usd:
      estimateTokenAmountUsd(wallet, amountRaw) ??
      (wallet.usdValue != null && wallet.rawBalance > 0n
        ? wallet.usdValue * (Number(amountRaw) / Number(wallet.rawBalance))
        : 0),
  };
}

/**
 * Gas reserved for the tokens in this payment only (not every gas token in the
 * wallet). Base USDC/EURC/USDT show their own gas; native ETH is omitted when
 * it is not paying for any leg.
 */
export function resolveGasFundingForPayment(
  walletTokens: readonly OwnedToken[],
  allocations: readonly PaymentAllocation[],
  taxFunding: TaxFundingPick | null | undefined,
  feeEstimates?: ReadonlyMap<string, NetworkGasFeeEstimate>,
): GasFundingPick[] {
  const legs = [
    ...allocations.filter((leg) => leg.amountRaw > 0n),
    ...(taxFunding != null && taxFunding.amountRaw > 0n
      ? [{ token: taxFunding.token }]
      : []),
  ];
  if (legs.length === 0) {
    return [];
  }

  const walletById = new Map(
    walletTokens.map((token) => [token.id, token] as const),
  );
  const reserveByTokenId = new Map<string, bigint>();

  for (const leg of legs) {
    const token = leg.token;
    const wallet = walletById.get(token.id) ?? token;
    const estimate = feeEstimates?.get(token.network);

    if (canPayOwnTransferGas(token.network, token.tokenAddress)) {
      const reserve = isBaseGasPaymentToken(token)
        ? selfGasReserveRaw(token.network, wallet)
        : feeReserveRawForNetwork(token.network, wallet, estimate, false);
      const prior = reserveByTokenId.get(token.id) ?? 0n;
      reserveByTokenId.set(token.id, prior + reserve);
      continue;
    }

    const native = walletTokens.find(
      (item) => item.network === token.network && isGasToken(item),
    );
    if (native == null) {
      continue;
    }
    const fee = feeReserveRawForNetwork(
      token.network,
      native,
      estimate,
      true,
    );
    const prior = reserveByTokenId.get(native.id) ?? 0n;
    reserveByTokenId.set(native.id, prior + fee);
  }

  const picks: GasFundingPick[] = [];
  for (const [tokenId, amountRaw] of reserveByTokenId) {
    if (amountRaw <= 0n) {
      continue;
    }
    const wallet = walletById.get(tokenId);
    if (wallet == null) {
      continue;
    }
    picks.push(buildGasFundingPick(wallet, amountRaw));
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

function scalePrivyGasReserveRaw(decimals: number): bigint {
  if (decimals === 6) {
    return BASE_PRIVY_TRANSFER_GAS_RESERVE_RAW;
  }
  if (decimals < 6) {
    return (
      BASE_PRIVY_TRANSFER_GAS_RESERVE_RAW /
      10n ** BigInt(6 - decimals)
    );
  }
  return (
    BASE_PRIVY_TRANSFER_GAS_RESERVE_RAW *
    10n ** BigInt(decimals - 6)
  );
}

function selfGasReserveRaw(
  network: string,
  token: OwnedToken,
): bigint {
  // Privy Transfer API debits a fixed raw headroom on Base stables — do not
  // derive from USD × balance (float drift vs Convex `PRIVY_TRANSFER_GAS_RESERVE_RAW`).
  if (isBaseGasPaymentToken(token)) {
    return scalePrivyGasReserveRaw(token.decimals);
  }

  const fromUsd = usdFeeToRaw(token, typicalFeeUsd(network, true));
  if (fromUsd != null && fromUsd > 0n) {
    return fromUsd;
  }
  return 10_000n;
}

/** Privy Transfer API legs that debit gas from the same Base stablecoin. */
export function baseSelfGasLegCount(options: {
  hasMerchantLeg: boolean;
  hasTaxLeg: boolean;
}): number {
  let count = 0;
  if (options.hasMerchantLeg) {
    count += 1;
  }
  if (options.hasTaxLeg) {
    count += 1;
  }
  return count;
}

/** Typical merchant + service-fee legs when tax-on-top is enabled. */
export function typicalBaseSelfGasLegCount(): number {
  return getTaxConfig().rate > 0 ? 2 : 1;
}

/** Total raw gas headroom for multiple self-gas legs on one token. */
export function totalSelfGasReserveRaw(
  token: OwnedToken,
  legCount: number,
): bigint {
  if (legCount <= 0 || !isBaseGasPaymentToken(token)) {
    return 0n;
  }
  return selfGasReserveRaw(token.network, token) * BigInt(legCount);
}

/** Per-transfer gas headroom for a token that pays its own network fee. */
export function transferGasReserveRaw(token: OwnedToken): bigint {
  if (isBaseGasPaymentToken(token)) {
    return selfGasReserveRaw(token.network, token);
  }
  if (isGasToken(token)) {
    return feeReserveRawForNetwork(token.network, token, undefined, false);
  }
  return 0n;
}

/**
 * Chooses how many EVM balances are actually sendable given current gas funds.
 * Native gas funds other ERC-20s; Base USDC/EURC/USDT only fund themselves.
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

  const gasToken = withBalance.find((token) => isGasToken(token));
  const gasRaw = gasToken?.rawBalance ?? 0n;
  const selfGasTokens = withBalance.filter((token) =>
    isBaseGasPaymentToken(token),
  );
  const needsNativeGasTokens = withBalance
    .filter((token) => !isGasToken(token) && !isBaseGasPaymentToken(token))
    .sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

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
  const reserveByGasPayerId = new Map<string, bigint>();
  let used = 0n;

  for (const token of needsNativeGasTokens) {
    const next = used + erc20Fee;
    if (gasRaw >= next) {
      spendableTokenIds.add(token.id);
      used = next;
    }
  }

  let nativeReserve = used;
  if (gasToken) {
    const leftover = gasRaw - used;
    if (leftover >= nativeFee || (used === 0n && gasRaw >= nativeFee)) {
      spendableTokenIds.add(gasToken.id);
    }

    if (used > 0n) {
      // Native gas funds other ERC-20 legs on this network.
      nativeReserve =
        leftover >= nativeFee ? used + nativeFee : used;
      if (nativeReserve > 0n) {
        reserveByGasPayerId.set(gasToken.id, nativeReserve);
      }
    } else if (selfGasTokens.length === 0 && gasRaw >= nativeFee) {
      // No Base stables in wallet — reserve native gas for native sends.
      reserveByGasPayerId.set(gasToken.id, nativeFee);
    }
    // When self-gas stables cover their own fees, do not reserve native ETH.
  }

  for (const token of selfGasTokens) {
    // Merchant + service-fee legs each pay gas from the same Base stablecoin.
    const reserveRaw = totalSelfGasReserveRaw(
      token,
      typicalBaseSelfGasLegCount(),
    );
    if (token.rawBalance > reserveRaw) {
      spendableTokenIds.add(token.id);
      reserveByGasPayerId.set(token.id, reserveRaw);
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
