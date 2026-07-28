import {
  formatRawTokenBalance,
  parseUsdAmountToTokenRaw,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkChain } from '@/lib/alchemy/networks';
import { isGasToken } from '@/lib/strategies/gasTokens';
import { isStablecoin } from '@/lib/strategies/stablecoins';
import type { PaymentStrategyId } from '@/lib/strategies';

export type PaymentAllocation = {
  token: OwnedToken;
  /** USD taken from this token for the payment. */
  usd: number;
  amountRaw: bigint;
  amountFormatted: string;
};

export type AllocatePaymentResult = {
  allocations: PaymentAllocation[];
  filledUsd: number;
  remainingUsd: number;
  canFulfill: boolean;
  /** Chain families used by the allocations. */
  chains: ('ethereum' | 'solana')[];
};

const FILL_TOLERANCE_USD = 0.005;

function tokenUsd(token: OwnedToken): number {
  return token.usdValue != null && token.usdValue > 0 ? token.usdValue : 0;
}

function allocationFromUsd(
  token: OwnedToken,
  takeUsd: number,
): PaymentAllocation | null {
  if (takeUsd <= FILL_TOLERANCE_USD) {
    return null;
  }

  const amountRaw = parseUsdAmountToTokenRaw(takeUsd.toFixed(8), token);
  if (amountRaw == null || amountRaw <= 0n) {
    return null;
  }

  const sentUsd =
    token.usdValue != null && token.rawBalance > 0n
      ? token.usdValue * (Number(amountRaw) / Number(token.rawBalance))
      : takeUsd;

  return {
    token,
    usd: sentUsd,
    amountRaw,
    amountFormatted: formatRawTokenBalance(
      amountRaw,
      token.decimals,
      token.decimals,
    ),
  };
}

function mergeAllocationResults(
  first: Omit<AllocatePaymentResult, 'chains'>,
  second: Omit<AllocatePaymentResult, 'chains'>,
): Omit<AllocatePaymentResult, 'chains'> {
  const remainingUsd = second.remainingUsd;
  return {
    allocations: [...first.allocations, ...second.allocations],
    filledUsd: first.filledUsd + second.filledUsd,
    remainingUsd,
    canFulfill: remainingUsd <= FILL_TOLERANCE_USD,
  };
}

/**
 * Splits `usdAmount` evenly across `tokens`, respecting each token's USD
 * balance and redistributing shortfalls to tokens with remaining capacity.
 */
function evenSplitAmong(
  tokens: OwnedToken[],
  usdAmount: number,
): Omit<AllocatePaymentResult, 'chains'> {
  if (tokens.length === 0 || !(usdAmount > 0)) {
    return {
      allocations: [],
      filledUsd: 0,
      remainingUsd: Math.max(0, usdAmount),
      canFulfill: false,
    };
  }

  const assignedUsd = new Array<number>(tokens.length).fill(0);
  const capacities = tokens.map((token) => tokenUsd(token));
  let leftToFill = usdAmount;

  while (leftToFill > FILL_TOLERANCE_USD) {
    const eligible = tokens
      .map((_, index) => index)
      .filter((index) => assignedUsd[index] < capacities[index] - FILL_TOLERANCE_USD);
    if (eligible.length === 0) {
      break;
    }

    const share = leftToFill / eligible.length;
    let progress = false;
    for (const index of eligible) {
      const room = capacities[index] - assignedUsd[index];
      const take = Math.min(share, room);
      if (take > FILL_TOLERANCE_USD / eligible.length) {
        assignedUsd[index] += take;
        leftToFill -= take;
        progress = true;
      }
    }
    if (!progress) {
      break;
    }
  }

  const allocations: PaymentAllocation[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const leg = allocationFromUsd(tokens[index], assignedUsd[index]);
    if (leg) {
      allocations.push(leg);
    }
  }

  const filledUsd = usdAmount - Math.max(0, leftToFill);
  return {
    allocations,
    filledUsd,
    remainingUsd: Math.max(0, leftToFill),
    canFulfill: leftToFill <= FILL_TOLERANCE_USD,
  };
}

/** Even split across non-gas tokens; gas tokens fill any remainder. */
function allocateEvenSplit(
  tokens: OwnedToken[],
  usdAmount: number,
): Omit<AllocatePaymentResult, 'chains'> {
  const priced = tokens.filter((token) => tokenUsd(token) > 0);
  const nonGas = priced.filter((token) => !isGasToken(token));
  const gas = priced.filter((token) => isGasToken(token));

  if (nonGas.length > 0) {
    const primary = evenSplitAmong(nonGas, usdAmount);
    return allocateRemainderFromGas(gas, primary);
  }

  return evenSplitAmong(gas, usdAmount);
}

function allocateRemainderFromGas(
  gas: OwnedToken[],
  prior: Omit<AllocatePaymentResult, 'chains'>,
): Omit<AllocatePaymentResult, 'chains'> {
  if (prior.canFulfill || gas.length === 0) {
    return prior;
  }

  const gasFill = evenSplitAmong(gas, prior.remainingUsd);
  if (gasFill.canFulfill) {
    return mergeAllocationResults(prior, gasFill);
  }

  const greedyGas = allocateFromOrderedTokens(
    [...gas].sort((a, b) => tokenUsd(b) - tokenUsd(a)),
    prior.remainingUsd,
  );
  return mergeAllocationResults(prior, greedyGas);
}

/** Greedy stablecoins first, then even split other non-gas tokens, then gas. */
function allocatePrioritizeStablecoinsThenEvenSplit(
  tokens: OwnedToken[],
  usdAmount: number,
  preferredTokenId?: string | null,
): Omit<AllocatePaymentResult, 'chains'> {
  const priced = tokens.filter((token) => tokenUsd(token) > 0);
  const nonGas = priced.filter((token) => !isGasToken(token));
  const gas = priced.filter((token) => isGasToken(token));
  const stables = nonGas.filter((token) => isStablecoin(token));
  const nonStables = nonGas.filter((token) => !isStablecoin(token));

  if (nonGas.length === 0) {
    return evenSplitAmong(gas, usdAmount);
  }

  let result: Omit<AllocatePaymentResult, 'chains'> = {
    allocations: [],
    filledUsd: 0,
    remainingUsd: usdAmount,
    canFulfill: false,
  };

  if (stables.length > 0) {
    const ordered = sortForStrategy(
      stables,
      'prioritize-stablecoins',
      preferredTokenId,
    );
    result = allocateFromOrderedTokens(ordered, usdAmount);
    if (result.canFulfill) {
      return result;
    }
  }

  if (nonStables.length > 0 && result.remainingUsd > FILL_TOLERANCE_USD) {
    const evenSplit = evenSplitAmong(nonStables, result.remainingUsd);
    result =
      stables.length > 0
        ? mergeAllocationResults(result, evenSplit)
        : evenSplit;
  } else if (stables.length === 0 && nonStables.length > 0) {
    result = evenSplitAmong(nonStables, usdAmount);
  }

  return allocateRemainderFromGas(gas, result);
}

function sortForStrategy(
  tokens: OwnedToken[],
  strategyId: PaymentStrategyId,
  preferredTokenId?: string | null,
): OwnedToken[] {
  const ranked = [...tokens];
  ranked.sort((a, b) => {
    if (preferredTokenId) {
      if (a.id === preferredTokenId && b.id !== preferredTokenId) {
        return -1;
      }
      if (b.id === preferredTokenId && a.id !== preferredTokenId) {
        return 1;
      }
    }

    if (strategyId === 'prioritize-stablecoins') {
      const aStable = isStablecoin(a) ? 1 : 0;
      const bStable = isStablecoin(b) ? 1 : 0;
      if (aStable !== bStable) {
        return bStable - aStable;
      }
    }

    return tokenUsd(b) - tokenUsd(a);
  });
  return ranked;
}

function allocateFromOrderedTokens(
  ordered: OwnedToken[],
  usdAmount: number,
): Omit<AllocatePaymentResult, 'chains'> {
  const allocations: PaymentAllocation[] = [];
  let remaining = usdAmount;

  for (const token of ordered) {
    if (remaining <= FILL_TOLERANCE_USD) {
      break;
    }
    const available = tokenUsd(token);
    if (available <= 0) {
      continue;
    }

    const takeUsd = Math.min(remaining, available);
    const leg = allocationFromUsd(token, takeUsd);
    if (!leg) {
      continue;
    }

    allocations.push(leg);
    remaining -= leg.usd;
  }

  const filledUsd = usdAmount - Math.max(0, remaining);
  const canFulfill = remaining <= FILL_TOLERANCE_USD;

  return {
    allocations,
    filledUsd,
    remainingUsd: Math.max(0, remaining),
    canFulfill,
  };
}

function chainsFromAllocations(
  allocations: PaymentAllocation[],
): ('ethereum' | 'solana')[] {
  const set = new Set<'ethereum' | 'solana'>();
  for (const leg of allocations) {
    set.add(getNetworkChain(leg.token.network));
  }
  return [...set];
}

/**
 * Picks one or more tokens across any chain to fulfill a USD payment.
 */
export function allocatePaymentUsd(options: {
  tokens: OwnedToken[];
  usdAmount: number;
  strategyId: PaymentStrategyId;
  preferredTokenId?: string | null;
}): AllocatePaymentResult {
  const { tokens, usdAmount, strategyId, preferredTokenId } = options;

  if (!(usdAmount > 0) || !Number.isFinite(usdAmount)) {
    return {
      allocations: [],
      filledUsd: 0,
      remainingUsd: 0,
      canFulfill: false,
      chains: [],
    };
  }

  const result = (() => {
    switch (strategyId) {
      case 'even-split':
        return allocateEvenSplit(tokens, usdAmount);
      case 'prioritize-stablecoins-even-split':
        return allocatePrioritizeStablecoinsThenEvenSplit(
          tokens,
          usdAmount,
          preferredTokenId,
        );
      case 'prioritize-stablecoins':
      default: {
        const priced = tokens.filter((token) => tokenUsd(token) > 0);
        const nonGas = priced.filter((token) => !isGasToken(token));
        const gas = priced.filter((token) => isGasToken(token));

        if (nonGas.length > 0) {
          const ordered = sortForStrategy(nonGas, strategyId, preferredTokenId);
          const primary = allocateFromOrderedTokens(ordered, usdAmount);
          return allocateRemainderFromGas(gas, primary);
        }

        const ordered = sortForStrategy(gas, strategyId, preferredTokenId);
        return allocateFromOrderedTokens(ordered, usdAmount);
      }
    }
  })();

  return {
    ...result,
    chains: chainsFromAllocations(result.allocations),
  };
}

/** Parses a USD amount input string into a finite number, or null. */
export function parseUsdInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '.' || trimmed.startsWith('-')) {
    return null;
  }
  if (!/^\d+(\.\d*)?$/.test(trimmed) && !/^\.\d+$/.test(trimmed)) {
    return null;
  }
  const usd = Number(trimmed);
  if (!Number.isFinite(usd) || usd < 0) {
    return null;
  }
  return usd;
}
