import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAppTax } from '@/hooks/useAppTax';
import { useChainPriority } from '@/hooks/useChainPriority';
import type { AllocationInputUnit } from '@/hooks/useAllocationInputUnit';
import { registerDisplayCurrencyChangeListener } from '@/hooks/useDisplayCurrency';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import {
  allocationsFromManualLegs,
  getSendDraftSnapshot,
  manualLegsFromAllocations,
  updateSendDraft,
} from '@/hooks/useSendDraft';
import {
  estimateTokenAmountUsd,
  formatRawTokenBalance,
  parseTokenAmountToRaw,
  parseUsdAmountToTokenRaw,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkChain } from '@/lib/alchemy/networks';
import { compareChainFamilies, type ChainPriorityId } from '@/lib/chainPriority';
import {
  reserveTaxHeadroomOnTokens,
  resolveTaxFunding,
  type TaxFundingPick,
} from '@/lib/send/buildPaymentLegsWithTax';
import {
  allocatePaymentUsd,
  type PaymentAllocation,
} from '@/lib/strategies/allocatePayment';
import type { PaymentStrategyId } from '@/lib/strategies';
import { isValidRecipientAddress } from '@/lib/validation';

export type SendFormState = {
  /** USD amount the user is trying to send. */
  amount: string;
  /**
   * Merchant payment USD (base + optional tip), before Available Balance
   * capping. Payer also owes tax on top — see `taxUsd` / `payerTotalUsd`.
   */
  requestedUsd: number | null;
  /** Tax USD added on top of the merchant payment. */
  taxUsd: number;
  /** Merchant + tax USD the payer must cover. */
  payerTotalUsd: number | null;
  /** Single-token funding pick for the tax transfer, when available. */
  taxFunding: TaxFundingPick | null;
  allocations: PaymentAllocation[];
  /** Per-token input strings shown in advanced (may be mid-edit). */
  allocationInputs: Record<string, string>;
  /** Chain families that appear in the current allocation. */
  chains: ('ethereum' | 'solana')[];
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
  removeAllocation: (tokenId: string) => void;
  addAllocation: (tokenId: string) => void;
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
  chainPriorityId: ChainPriorityId,
): ('ethereum' | 'solana')[] {
  const set = new Set<'ethereum' | 'solana'>();
  for (const leg of allocations) {
    set.add(getNetworkChain(leg.token.network));
  }
  return [...set].sort((a, b) =>
    compareChainFamilies(a, b, chainPriorityId),
  );
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

    // Clamp to spendable balance (fee reserves may shrink gas tokens after draft).
    const amountRaw =
      leg.amountRaw > token.rawBalance ? token.rawBalance : leg.amountRaw;

    const usd =
      amountRaw <= 0n
        ? 0
        : (estimateTokenAmountUsd(token, amountRaw) ??
          (token.usdValue != null && token.rawBalance > 0n
            ? token.usdValue * (Number(amountRaw) / Number(token.rawBalance))
            : leg.usd));

    const amountFormatted =
      amountRaw !== leg.amountRaw || !leg.amountFormatted
        ? formatRawTokenBalance(amountRaw, token.decimals)
        : leg.amountFormatted;

    return [{ token, amountRaw, amountFormatted, usd: usd ?? 0 }];
  });
}

export function useSendForm(
  tokens: OwnedToken[],
  strategyId: PaymentStrategyId,
  preferredTokenId?: string | null,
  allocationInputUnit: AllocationInputUnit = 'token',
  /** Floored Available Balance cap — amounts at/above this send the full cap. */
  maxAvailableUsd?: number | null,
  /** Optional tip / additional USD added on top of the base amount. */
  additionalUsd?: number | null,
): SendFormState {
  const { selectedChainPriorityId } = useChainPriority();
  const { taxUsdFor, payerTotalUsdFor, maxMerchantUsdFor } = useAppTax();
  const {
    formatAmountInputFromUsd,
    parseDisplayInputToUsd,
  } = useFiatDisplay();
  const initialDraft = getSendDraftSnapshot();
  const [ethereumRecipient, setEthereumRecipientState] = useState(
    initialDraft.ethereumRecipient,
  );
  const [solanaRecipient, setSolanaRecipientState] = useState(
    initialDraft.solanaRecipient,
  );
  const [amount, setAmountState] = useState(initialDraft.amount);
  const [amountLocked, setAmountLocked] = useState(initialDraft.amountLocked);
  const [amountUsd, setAmountUsd] = useState<number | null>(null);
  const [manualAllocations, setManualAllocations] = useState<
    PaymentAllocation[] | null
  >(() => allocationsFromManualLegs(initialDraft.manualLegs, tokens));
  const [allocationInputs, setAllocationInputs] = useState<
    Record<string, string>
  >(initialDraft.allocationInputs);
  const strategyKeyRef = useRef<string | null>(null);
  const allocationUnitRef = useRef<AllocationInputUnit | null>(null);
  const additionalUsdRef = useRef<number | null>(null);

  useEffect(() => {
    return registerDisplayCurrencyChangeListener(() => {
      setAllocationInputs({});
    });
  }, []);

  const tipUsd =
    additionalUsd != null && additionalUsd > 0 ? additionalUsd : 0;
  const usdAmount = amountUsd ?? parseDisplayInputToUsd(amount);
  const requestedUsd =
    usdAmount != null && usdAmount > 0 ? usdAmount + tipUsd : usdAmount;

  // Tip changes need a fresh strategy allocation (manual legs stay at base).
  useEffect(() => {
    if (additionalUsdRef.current === null) {
      additionalUsdRef.current = tipUsd;
      return;
    }
    if (additionalUsdRef.current === tipUsd) {
      return;
    }
    additionalUsdRef.current = tipUsd;
    setManualAllocations(null);
    setAllocationInputs({});
  }, [tipUsd]);

  /**
   * Merchant allocation target. Only soft-cap tiny display rounding past the
   * max affordable merchant amount (available / (1 + tax)). Do not treat
   * "typed available balance" as max merchant — that would hide insufficient
   * funds when tax makes the grand total exceed holdings.
   */
  const targetUsd = (() => {
    if (requestedUsd == null || !(requestedUsd > 0)) {
      return requestedUsd;
    }
    if (maxAvailableUsd == null || !(maxAvailableUsd >= 0)) {
      return requestedUsd;
    }
    const maxMerchant = maxMerchantUsdFor(maxAvailableUsd);
    if (requestedUsd <= maxMerchant + 0.000001) {
      return Math.min(requestedUsd, maxMerchant);
    }
    // Slight overshoot of max sendable merchant (display rounding).
    if (requestedUsd <= maxMerchant + 0.015) {
      return maxMerchant;
    }
    return requestedUsd;
  })();

  /** Leave headroom on one preferred token so a single tax transfer can fit. */
  const tokensForMerchantAllocation = useMemo(() => {
    if (targetUsd == null || !(targetUsd > 0)) {
      return tokens;
    }
    const taxUsdNeeded = taxUsdFor(targetUsd);
    if (!(taxUsdNeeded > 0)) {
      return tokens;
    }
    return reserveTaxHeadroomOnTokens(tokens, taxUsdNeeded);
  }, [targetUsd, taxUsdFor, tokens]);

  const strategyPlan = useMemo(() => {
    if (targetUsd == null || targetUsd <= 0) {
      return {
        allocations: [] as PaymentAllocation[],
        filledUsd: 0,
        remainingUsd: 0,
        canFulfill: false,
        chains: [] as ('ethereum' | 'solana')[],
      };
    }

    return allocatePaymentUsd({
      tokens: tokensForMerchantAllocation,
      usdAmount: targetUsd,
      strategyId,
      chainPriorityId: selectedChainPriorityId,
      preferredTokenId,
    });
  }, [
    preferredTokenId,
    selectedChainPriorityId,
    strategyId,
    targetUsd,
    tokensForMerchantAllocation,
  ]);

  // Strategy / preferred-token changes discard manual leg edits.
  useEffect(() => {
    const key = `${strategyId}:${preferredTokenId ?? ''}`;
    if (strategyKeyRef.current === null) {
      strategyKeyRef.current = key;
      return;
    }
    if (strategyKeyRef.current === key) {
      return;
    }
    strategyKeyRef.current = key;
    setManualAllocations(null);
    setAllocationInputs({});
  }, [strategyId, preferredTokenId]);

  // Switching token ↔ USD input remaps display from resolved legs.
  useEffect(() => {
    if (allocationUnitRef.current === null) {
      allocationUnitRef.current = allocationInputUnit;
      return;
    }
    if (allocationUnitRef.current === allocationInputUnit) {
      return;
    }
    allocationUnitRef.current = allocationInputUnit;
    setAllocationInputs({});
  }, [allocationInputUnit]);

  const draftManualFromTokens = useMemo(() => {
    if (tokens.length === 0) {
      return null;
    }
    return allocationsFromManualLegs(
      getSendDraftSnapshot().manualLegs,
      tokens,
    );
  }, [tokens]);

  const resolvedManualBase = manualAllocations ?? draftManualFromTokens;

  const allocations = useMemo(() => {
    const base =
      resolvedManualBase != null
        ? resolvedManualBase
        : strategyPlan.allocations;
    return refreshAllocationTokens(base, tokens);
  }, [resolvedManualBase, strategyPlan.allocations, tokens]);

  useEffect(() => {
    updateSendDraft({
      ethereumRecipient,
      solanaRecipient,
      amount,
      amountLocked,
      manualLegs: manualLegsFromAllocations(
        resolvedManualBase != null ? allocations : null,
      ),
      allocationInputs,
    });
  }, [
    allocationInputs,
    allocations,
    amount,
    amountLocked,
    ethereumRecipient,
    resolvedManualBase,
    solanaRecipient,
  ]);

  const chains = useMemo(
    () => chainsFromAllocations(allocations, selectedChainPriorityId),
    [allocations, selectedChainPriorityId],
  );

  const needsEthereumRecipient = chains.includes('ethereum');
  const needsSolanaRecipient = chains.includes('solana');

  const ethereumRecipientValid = useMemo(() => {
    const trimmed = ethereumRecipient.trim();
    if (!trimmed) {
      return true;
    }
    return isValidRecipientAddress(trimmed, 'ethereum');
  }, [ethereumRecipient]);

  const solanaRecipientValid = useMemo(() => {
    const trimmed = solanaRecipient.trim();
    if (!trimmed) {
      return true;
    }
    return isValidRecipientAddress(trimmed, 'solana');
  }, [solanaRecipient]);

  const recipientsValid = ethereumRecipientValid && solanaRecipientValid;

  const amountValid = usdAmount != null && usdAmount > 0;

  const taxUsd =
    targetUsd != null && targetUsd > 0 ? taxUsdFor(targetUsd) : 0;
  const payerTotalUsd =
    targetUsd != null && targetUsd > 0
      ? payerTotalUsdFor(targetUsd)
      : requestedUsd != null && requestedUsd > 0
        ? payerTotalUsdFor(requestedUsd)
        : null;

  const taxFunding = useMemo(
    () => resolveTaxFunding(allocations, tokens, taxUsd),
    [allocations, taxUsd, tokens],
  );

  // Merchant legs must fit; tax must fit on a single leftover token.
  const legsWithinBalance =
    allocations.every((leg) => leg.amountRaw <= leg.token.rawBalance) &&
    (taxUsd <= 0 || taxFunding != null);
  const hasPositiveLeg = allocations.some((leg) => leg.amountRaw > 0n);

  const filledUsd = allocations.reduce((sum, leg) => sum + leg.usd, 0);

  const remainingUsd =
    targetUsd != null ? Math.max(0, targetUsd - filledUsd) : strategyPlan.remainingUsd;

  const coversRequestedAmount =
    targetUsd != null && filledUsd + 0.005 >= targetUsd;

  const canFulfill =
    resolvedManualBase != null
      ? amountValid &&
        hasPositiveLeg &&
        legsWithinBalance &&
        (!amountLocked || coversRequestedAmount)
      : strategyPlan.canFulfill && legsWithinBalance;

  const payerExceedsAvailable =
    maxAvailableUsd != null &&
    payerTotalUsd != null &&
    payerTotalUsd > maxAvailableUsd + 0.015;

  const insufficientFunds =
    amountValid &&
    (payerExceedsAvailable
      ? true
      : resolvedManualBase != null
        ? !canFulfill
        : !(strategyPlan.canFulfill && legsWithinBalance));

  const canContinue =
    amountValid &&
    canFulfill &&
    hasPositiveLeg &&
    recipientsValid &&
    !payerExceedsAvailable &&
    (!needsEthereumRecipient || ethereumRecipient.trim().length > 0) &&
    (!needsSolanaRecipient || solanaRecipient.trim().length > 0);

  const setEthereumRecipient = useCallback((value: string) => {
    setEthereumRecipientState(value);
  }, []);

  const setSolanaRecipient = useCallback((value: string) => {
    setSolanaRecipientState(value);
  }, []);

  const setAmount = useCallback((value: string) => {
    const sanitized = sanitizeAmountInput(value);
    setAmountLocked(false);
    setAmountState(sanitized);
    const usd = parseDisplayInputToUsd(sanitized);
    if (usd != null) {
      setAmountUsd(usd);
    } else if (!sanitized.trim() || sanitized === '.') {
      setAmountUsd(null);
    }
    setManualAllocations(null);
    setAllocationInputs({});
  }, [parseDisplayInputToUsd]);

  const syncAmountFromLegs = useCallback(
    (next: PaymentAllocation[]) => {
      // Keep the base amount stable when a tip is applied, otherwise leg edits
      // would fold the tip into the draft amount and double-count it.
      if (amountLocked || tipUsd > 0) {
        return;
      }
      const totalUsd = next.reduce((sum, leg) => sum + leg.usd, 0);
      setAmountState(totalUsd > 0 ? formatAmountInputFromUsd(totalUsd) : '0');
      setAmountUsd(totalUsd > 0 ? totalUsd : null);
    },
    [amountLocked, formatAmountInputFromUsd, tipUsd],
  );

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
      // Cap merchant input so the preferred tax funding token keeps headroom.
      const merchantCap =
        tokensForMerchantAllocation.find((item) => item.id === tokenId) ??
        token;

      if (sanitized.trim() === '' || sanitized === '.') {
        const next = [...base];
        next[index] = {
          token,
          amountRaw: 0n,
          amountFormatted: sanitized,
          usd: 0,
        };
        setManualAllocations(next);
        syncAmountFromLegs(next);
        return;
      }

      const amountRaw = (() => {
        const parsed =
          allocationInputUnit === 'usd'
            ? (() => {
                const usdForToken = parseDisplayInputToUsd(sanitized);
                return usdForToken != null
                  ? parseUsdAmountToTokenRaw(String(usdForToken), merchantCap)
                  : null;
              })()
            : parseTokenAmountToRaw(sanitized, token.decimals);
        if (parsed == null) {
          return null;
        }
        return parsed > merchantCap.rawBalance
          ? merchantCap.rawBalance
          : parsed;
      })();
      if (amountRaw == null) {
        return;
      }

      const amountFormatted =
        allocationInputUnit === 'usd'
          ? formatRawTokenBalance(amountRaw, token.decimals)
          : sanitized;
      const estimatedUsd = estimateTokenAmountUsd(token, amountRaw);
      const parsedUsd =
        allocationInputUnit === 'usd'
          ? (parseDisplayInputToUsd(sanitized) ?? 0)
          : 0;
      const usd = estimatedUsd ?? parsedUsd;

      const next = [...base];
      next[index] = {
        token,
        amountRaw,
        amountFormatted,
        usd,
      };
      setManualAllocations(next);
      syncAmountFromLegs(next);
    },
    [
      allocationInputUnit,
      manualAllocations,
      parseDisplayInputToUsd,
      strategyPlan.allocations,
      syncAmountFromLegs,
      tokens,
      tokensForMerchantAllocation,
    ],
  );

  const removeAllocation = useCallback(
    (tokenId: string) => {
      const base =
        manualAllocations ??
        strategyPlan.allocations.map((leg) => ({ ...leg }));
      const next = base.filter((leg) => leg.token.id !== tokenId);
      setManualAllocations(next);
      setAllocationInputs((current) => {
        const { [tokenId]: _removed, ...rest } = current;
        return rest;
      });
      syncAmountFromLegs(next);
    },
    [manualAllocations, strategyPlan.allocations, syncAmountFromLegs],
  );

  const addAllocation = useCallback(
    (tokenId: string) => {
      const token = tokens.find((item) => item.id === tokenId);
      if (!token) {
        return;
      }

      const base =
        manualAllocations ??
        strategyPlan.allocations.map((leg) => ({ ...leg }));
      if (base.some((leg) => leg.token.id === tokenId)) {
        return;
      }

      const next: PaymentAllocation[] = [
        ...base,
        {
          token,
          amountRaw: 0n,
          amountFormatted: '',
          usd: 0,
        },
      ];
      setManualAllocations(next);
      setAllocationInputs((current) => ({
        ...current,
        [tokenId]: '',
      }));
    },
    [manualAllocations, strategyPlan.allocations, tokens],
  );

  const resolvedAllocationInputs = useMemo(() => {
    const resolved: Record<string, string> = { ...allocationInputs };
    for (const leg of allocations) {
      if (resolved[leg.token.id] == null) {
        resolved[leg.token.id] =
          allocationInputUnit === 'usd'
            ? formatAmountInputFromUsd(leg.usd)
            : leg.amountFormatted;
      }
    }
    return resolved;
  }, [allocationInputUnit, allocationInputs, allocations, formatAmountInputFromUsd]);

  return {
    amount,
    requestedUsd,
    taxUsd,
    payerTotalUsd,
    taxFunding,
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
    removeAllocation,
    addAllocation,
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
