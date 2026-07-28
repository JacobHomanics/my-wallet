import {
  formatRawTokenBalance,
  parseUsdAmountToTokenRaw,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkChain } from '@/lib/alchemy/networks';
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
  chain: 'ethereum' | 'solana' | null;
};

function tokenUsd(token: OwnedToken): number {
  return token.usdValue != null && token.usdValue > 0 ? token.usdValue : 0;
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
): Omit<AllocatePaymentResult, 'chain'> {
  const allocations: PaymentAllocation[] = [];
  let remaining = usdAmount;

  for (const token of ordered) {
    if (remaining <= 0.0000001) {
      break;
    }
    const available = tokenUsd(token);
    if (available <= 0) {
      continue;
    }

    const takeUsd = Math.min(remaining, available);
    const amountRaw = parseUsdAmountToTokenRaw(
      takeUsd.toFixed(8),
      token,
    );
    if (amountRaw == null || amountRaw <= 0n) {
      continue;
    }

    // Recompute USD from raw so display matches what we send.
    const sentUsd =
      token.usdValue != null && token.rawBalance > 0n
        ? token.usdValue * (Number(amountRaw) / Number(token.rawBalance))
        : takeUsd;

    allocations.push({
      token,
      usd: sentUsd,
      amountRaw,
      amountFormatted: formatRawTokenBalance(
        amountRaw,
        token.decimals,
        token.decimals,
      ),
    });
    remaining -= sentUsd;
  }

  const filledUsd = Math.max(0, usdAmount - Math.max(0, remaining));
  const canFulfill = remaining <= 0.005; // ~half-cent tolerance

  return {
    allocations,
    filledUsd,
    remainingUsd: Math.max(0, remaining),
    canFulfill,
  };
}

/**
 * Picks one or more tokens to fulfill a USD payment using the active strategy.
 * All legs share a single chain family so one recipient address works.
 */
export function allocatePaymentUsd(options: {
  tokens: OwnedToken[];
  usdAmount: number;
  strategyId: PaymentStrategyId;
  /** When set, only use tokens on this chain. */
  chain?: 'ethereum' | 'solana' | null;
  preferredTokenId?: string | null;
}): AllocatePaymentResult {
  const { tokens, usdAmount, strategyId, chain, preferredTokenId } = options;

  if (!(usdAmount > 0) || !Number.isFinite(usdAmount)) {
    return {
      allocations: [],
      filledUsd: 0,
      remainingUsd: 0,
      canFulfill: false,
      chain: chain ?? null,
    };
  }

  const priced = tokens.filter((token) => tokenUsd(token) > 0);

  const tryChain = (
    chainFilter: 'ethereum' | 'solana',
  ): AllocatePaymentResult => {
    const scoped = priced.filter(
      (token) => getNetworkChain(token.network) === chainFilter,
    );
    const ordered = sortForStrategy(scoped, strategyId, preferredTokenId);
    const result = allocateFromOrderedTokens(ordered, usdAmount);
    return { ...result, chain: chainFilter };
  };

  if (chain === 'ethereum' || chain === 'solana') {
    return tryChain(chain);
  }

  const ethereum = tryChain('ethereum');
  const solana = tryChain('solana');

  // Prefer a plan that fully covers; then higher fill; then more stables.
  const score = (plan: AllocatePaymentResult) => {
    const stableUsd = plan.allocations.reduce(
      (sum, leg) => sum + (isStablecoin(leg.token) ? leg.usd : 0),
      0,
    );
    return (
      (plan.canFulfill ? 1_000_000_000 : 0) +
      plan.filledUsd * 1_000 +
      stableUsd
    );
  };

  if (score(ethereum) >= score(solana)) {
    return ethereum.allocations.length > 0 || solana.allocations.length === 0
      ? ethereum
      : solana;
  }
  return solana;
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
