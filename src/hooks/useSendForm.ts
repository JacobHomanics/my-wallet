import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  estimateTokenAmountUsd,
  formatUsdAmountInput,
  parseTokenAmountToRaw,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkChain } from '@/lib/alchemy/networks';
import {
  allocatePaymentUsd,
  parseUsdInput,
  type PaymentAllocation,
} from '@/lib/strategies/allocatePayment';
import type { PaymentStrategyId } from '@/lib/strategies';
import { isValidRecipientAddress } from '@/lib/validation';

export type SendFormState = {
  /** USD amount the user is trying to send. */
  amount: string;
  allocations: PaymentAllocation[];
  /** Per-token input strings shown in advanced (may be mid-edit). */
  allocationInputs: Record<string, string>;
  /** Chain families that appear in the current allocation. */
  chains: Array<'ethereum' | 'solana'>;
  needsEthereumRecipient: boolean;
  needsSolanaRecipient: boolean;
  filledUsd: number;
  remainingUsd: number;
  canFulfill: boolean;
  ethereumRecipient: string;
  solanaRecipient: string;
  ethereumRecipientValid: boolean;
  solanaRecipientValid: boolean;
  recipientsValid: boolean;
  amountValid: boolean;
  /** True when USD amount is set but holdings cannot cover it. */
  insufficientFunds: boolean;
  canContinue: boolean;
  setEthereumRecipient: (value: string) => void;
  setSolanaRecipient: (value: string) => void;
  setAmount: (value: string) => void;
  setAllocationAmount: (tokenId: string, value: string) => void;
};

function sanitizeAmountInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) {
    return cleaned;
  }
  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, '')
  );
}

function chainsFromAllocations(
  allocations: PaymentAllocation[],
): Array<'ethereum' | 'solana'> {
  const set = new Set<'ethereum' | 'solana'>();
  for (const leg of allocations) {
    set.add(getNetworkChain(leg.token.network));
  }
  return [...set];
}

function refreshAllocationTokens(
  allocations: PaymentAllocation[],
  tokens: OwnedToken[],
): PaymentAllocation[] {
  return allocations.flatMap((leg) => {
    const token = tokens.find((item) => item.id === leg.token.id);
    if (!token) {
      return [];
    }
    const usd =
      estimateTokenAmountUsd(token, leg.amountRaw) ??
      (token.usdValue != null && token.rawBalance > 0n
        ? token.usdValue * (Number(leg.amountRaw) / Number(token.rawBalance))
        : leg.usd);
    return [{ ...leg, token, usd: usd ?? 0 }];
  });
}

export function useSendForm(
  tokens: OwnedToken[],
  strategyId: PaymentStrategyId,
  preferredTokenId?: string | null,
): SendFormState {
  const [ethereumRecipient, setEthereumRecipientState] = useState('');
  const [solanaRecipient, setSolanaRecipientState] = useState('');
  const [amount, setAmountState] = useState('');
  const [manualAllocations, setManualAllocations] = useState<
    PaymentAllocation[] | null
  >(null);
  const [allocationInputs, setAllocationInputs] = useState<
    Record<string, string>
  >({});

  const usdAmount = useMemo(() => parseUsdInput(amount), [amount]);

  const strategyPlan = useMemo(() => {
    if (usdAmount == null || usdAmount <= 0) {
      return {
        allocations: [] as PaymentAllocation[],
        filledUsd: 0,
        remainingUsd: 0,
        canFulfill: false,
        chains: [] as Array<'ethereum' | 'solana'>,
      };
    }

    return allocatePaymentUsd({
      tokens,
      usdAmount,
      strategyId,
      preferredTokenId,
    });
  }, [preferredTokenId, strategyId, tokens, usdAmount]);

  // Strategy / preferred-token changes discard manual leg edits.
  useEffect(() => {
    setManualAllocations(null);
    setAllocationInputs({});
  }, [strategyId, preferredTokenId]);

  // Keep manual legs pointed at fresh token balances when prices refresh.
  useEffect(() => {
    setManualAllocations((current) => {
      if (current == null) {
        return current;
      }
      return refreshAllocationTokens(current, tokens);
    });
  }, [tokens]);

  const allocations = useMemo(() => {
    if (manualAllocations != null) {
      return manualAllocations;
    }
    return strategyPlan.allocations;
  }, [manualAllocations, strategyPlan.allocations]);

  const chains = useMemo(
    () =>
      manualAllocations != null
        ? chainsFromAllocations(manualAllocations)
        : strategyPlan.chains,
    [manualAllocations, strategyPlan.chains],
  );

  const needsEthereumRecipient = chains.includes('ethereum');
  const needsSolanaRecipient = chains.includes('solana');

  const ethereumRecipientValid = useMemo(() => {
    if (!needsEthereumRecipient) {
      return true;
    }
    return isValidRecipientAddress(ethereumRecipient, 'ethereum');
  }, [ethereumRecipient, needsEthereumRecipient]);

  const solanaRecipientValid = useMemo(() => {
    if (!needsSolanaRecipient) {
      return true;
    }
    return isValidRecipientAddress(solanaRecipient, 'solana');
  }, [needsSolanaRecipient, solanaRecipient]);

  const recipientsValid = ethereumRecipientValid && solanaRecipientValid;

  const amountValid = usdAmount != null && usdAmount > 0;

  const legsWithinBalance = allocations.every(
    (leg) => leg.amountRaw <= leg.token.rawBalance,
  );
  const hasPositiveLeg = allocations.some((leg) => leg.amountRaw > 0n);

  const canFulfill =
    manualAllocations != null
      ? amountValid && hasPositiveLeg && legsWithinBalance
      : strategyPlan.canFulfill;

  const insufficientFunds =
    amountValid &&
    (manualAllocations != null ? !canFulfill : !strategyPlan.canFulfill);

  const filledUsd =
    manualAllocations != null
      ? manualAllocations.reduce((sum, leg) => sum + leg.usd, 0)
      : strategyPlan.filledUsd;

  const remainingUsd =
    manualAllocations != null
      ? Math.max(0, (usdAmount ?? 0) - filledUsd)
      : strategyPlan.remainingUsd;

  const canContinue =
    amountValid &&
    canFulfill &&
    hasPositiveLeg &&
    recipientsValid &&
    (!needsEthereumRecipient || ethereumRecipient.trim().length > 0) &&
    (!needsSolanaRecipient || solanaRecipient.trim().length > 0);

  const setEthereumRecipient = useCallback((value: string) => {
    setEthereumRecipientState(value);
  }, []);

  const setSolanaRecipient = useCallback((value: string) => {
    setSolanaRecipientState(value);
  }, []);

  const setAmount = useCallback((value: string) => {
    setAmountState(sanitizeAmountInput(value));
    setManualAllocations(null);
    setAllocationInputs({});
  }, []);

  const setAllocationAmount = useCallback(
    (tokenId: string, value: string) => {
      const sanitized = sanitizeAmountInput(value);
      setAllocationInputs((current) => ({
        ...current,
        [tokenId]: sanitized,
      }));

      const base =
        manualAllocations ??
        strategyPlan.allocations.map((leg) => ({ ...leg }));
      const index = base.findIndex((leg) => leg.token.id === tokenId);
      if (index < 0) {
        return;
      }

      const token =
        tokens.find((item) => item.id === tokenId) ?? base[index].token;

      if (sanitized.trim() === '' || sanitized === '.') {
        const next = [...base];
        next[index] = {
          token,
          amountRaw: 0n,
          amountFormatted: sanitized,
          usd: 0,
        };
        setManualAllocations(next);
        const totalUsd = next.reduce((sum, leg) => sum + leg.usd, 0);
        setAmountState(totalUsd > 0 ? formatUsdAmountInput(totalUsd) : '');
        return;
      }

      const amountRaw = parseTokenAmountToRaw(sanitized, token.decimals);
      if (amountRaw == null) {
        return;
      }

      const usd = estimateTokenAmountUsd(token, amountRaw) ?? 0;
      const next = [...base];
      next[index] = {
        token,
        amountRaw,
        amountFormatted: sanitized,
        usd,
      };
      setManualAllocations(next);
      const totalUsd = next.reduce((sum, leg) => sum + leg.usd, 0);
      setAmountState(totalUsd > 0 ? formatUsdAmountInput(totalUsd) : '');
    },
    [manualAllocations, strategyPlan.allocations, tokens],
  );

  const resolvedAllocationInputs = useMemo(() => {
    const resolved: Record<string, string> = { ...allocationInputs };
    for (const leg of allocations) {
      if (resolved[leg.token.id] == null) {
        resolved[leg.token.id] = leg.amountFormatted;
      }
    }
    return resolved;
  }, [allocationInputs, allocations]);

  return {
    amount,
    allocations,
    allocationInputs: resolvedAllocationInputs,
    chains,
    needsEthereumRecipient,
    needsSolanaRecipient,
    filledUsd,
    remainingUsd,
    canFulfill,
    ethereumRecipient,
    solanaRecipient,
    ethereumRecipientValid,
    solanaRecipientValid,
    recipientsValid,
    amountValid,
    insufficientFunds,
    canContinue,
    setEthereumRecipient,
    setSolanaRecipient,
    setAmount,
    setAllocationAmount,
  };
}

/** Recipient address for a payment leg based on its token chain. */
export function recipientForAllocation(
  allocation: PaymentAllocation,
  ethereumRecipient: string,
  solanaRecipient: string,
): string {
  return getNetworkChain(allocation.token.network) === 'solana'
    ? solanaRecipient.trim()
    : ethereumRecipient.trim();
}
