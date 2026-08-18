import { useEffect, useMemo, useRef, useState } from 'react';

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
  type SendDraftManualLeg,
} from '@/hooks/useSendDraft';
import {
  defaultUnpricedTokenAllocation,
  estimateTokenAmountUsd,
  formatRawTokenBalance,
  isUnpricedToken,
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
import { tryDecodeWalletIdentity } from '@/lib/walletIdentity';

function resolveSendRecipients(
  accountNumber: string,
  ethereumRecipient: string,
  solanaRecipient: string,
): { ethereum: string; solana: string } {
  const decoded = tryDecodeWalletIdentity(accountNumber);
  return {
    ethereum: ethereumRecipient.trim() || decoded?.evmAddress || '',
    solana: solanaRecipient.trim() || decoded?.solanaAddress || '',
  };
}

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
  resolvedEthereumRecipient: string;
  resolvedSolanaRecipient: string;
  ethereumRecipientValid: boolean;
  solanaRecipientValid: boolean;
  recipientsValid: boolean;
  amountValid: boolean;
  /** True when USD amount is set but holdings cannot cover it. */
  insufficientFunds: boolean;
  /** User edited token legs in advanced details (vs strategy-only allocation). */
  isManualPayment: boolean;
  /** Hint for why Continue is disabled, when applicable. */
  continueBlockedReason: string | null;
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
  walletTokens: OwnedToken[],
  spendableTokens: OwnedToken[],
  tokensForMerchantAllocation: OwnedToken[],
): PaymentAllocation[] {
  return allocations.flatMap((leg) => {
    const token = walletTokens.find((item) => item.id === leg.token.id);
    if (!token) {
      return [];
    }

    const maxRaw = maxManualAllocationRaw(
      token,
      tokensForMerchantAllocation,
      spendableTokens,
    );

    // Clamp to spendable balance (gas reserves + tax headroom).
    const amountRaw = leg.amountRaw > maxRaw ? maxRaw : leg.amountRaw;

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

function splitStoredLegs(
  manualLegs: SendDraftManualLeg[] | null,
  additionalLegs: SendDraftManualLeg[] | null,
  walletTokens: OwnedToken[],
): {
  merchant: PaymentAllocation[] | null;
  additional: PaymentAllocation[];
} {
  const fromAdditional =
    allocationsFromManualLegs(additionalLegs, walletTokens) ?? [];
  const fromManual =
    allocationsFromManualLegs(manualLegs, walletTokens) ?? [];

  if (fromManual.length === 0) {
    return { merchant: null, additional: fromAdditional };
  }

  const merchant: PaymentAllocation[] = [];
  const additional: PaymentAllocation[] = [...fromAdditional];

  for (const leg of fromManual) {
    if (isUnpricedToken(leg.token)) {
      if (!additional.some((item) => item.token.id === leg.token.id)) {
        additional.push(leg);
      }
      continue;
    }
    merchant.push(leg);
  }

  return {
    merchant: merchant.length > 0 ? merchant : null,
    additional,
  };
}

function mergeAllocationLists(
  merchant: PaymentAllocation[],
  additional: PaymentAllocation[],
): PaymentAllocation[] {
  const merchantIds = new Set(merchant.map((leg) => leg.token.id));
  return [
    ...merchant,
    ...additional.filter((leg) => !merchantIds.has(leg.token.id)),
  ];
}

function maxManualAllocationRaw(
  walletToken: OwnedToken,
  tokensForMerchantAllocation: OwnedToken[],
  spendableTokens: OwnedToken[],
): bigint {
  if (isUnpricedToken(walletToken)) {
    return walletToken.rawBalance > 0n ? walletToken.rawBalance : 0n;
  }

  const merchantCap =
    tokensForMerchantAllocation.find((item) => item.id === walletToken.id) ??
    spendableTokens.find((item) => item.id === walletToken.id) ??
    walletToken;

  return merchantCap.rawBalance > 0n ? merchantCap.rawBalance : 0n;
}

export function useSendForm(
  walletTokens: OwnedToken[],
  spendableTokens: OwnedToken[],
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
  const initialIdentity = tryDecodeWalletIdentity(initialDraft.accountNumber);
  const [ethereumRecipient, setEthereumRecipientState] = useState(
    initialDraft.ethereumRecipient || initialIdentity?.evmAddress || '',
  );
  const [solanaRecipient, setSolanaRecipientState] = useState(
    initialDraft.solanaRecipient || initialIdentity?.solanaAddress || '',
  );
  const [amount, setAmountState] = useState(initialDraft.amount);
  const [amountLocked, setAmountLocked] = useState(initialDraft.amountLocked);
  const [amountUsd, setAmountUsd] = useState<number | null>(null);
  const initialStoredLegs = splitStoredLegs(
    initialDraft.manualLegs,
    initialDraft.additionalLegs,
    walletTokens,
  );
  const [manualMerchantAllocations, setManualMerchantAllocations] = useState<
    PaymentAllocation[] | null
  >(initialStoredLegs.merchant);
  const [additionalAllocations, setAdditionalAllocations] = useState<
    PaymentAllocation[]
  >(initialStoredLegs.additional);
  const [preferredAdditionalDismissed, setPreferredAdditionalDismissed] =
    useState(false);
  const [allocationInputs, setAllocationInputs] = useState<
    Record<string, string>
  >(initialDraft.allocationInputs);
  const strategyKeyRef = useRef<string | null>(null);
  const allocationUnitRef = useRef<AllocationInputUnit | null>(null);
  const additionalUsdRef = useRef<number | null>(null);
  const manualMerchantAllocationsRef = useRef<PaymentAllocation[] | null>(
    manualMerchantAllocations,
  );
  const additionalAllocationsRef = useRef(additionalAllocations);

  useEffect(() => {
    manualMerchantAllocationsRef.current = manualMerchantAllocations;
  }, [manualMerchantAllocations]);

  useEffect(() => {
    additionalAllocationsRef.current = additionalAllocations;
  }, [additionalAllocations]);

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
    setManualMerchantAllocations(null);
    setAllocationInputs((current) => {
      const additionalIds = new Set(
        additionalAllocations.map((leg) => leg.token.id),
      );
      return Object.fromEntries(
        Object.entries(current).filter(([tokenId]) =>
          additionalIds.has(tokenId),
        ),
      );
    });
  }, [additionalAllocations, tipUsd]);

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
      return spendableTokens;
    }
    const taxUsdNeeded = taxUsdFor(targetUsd);
    if (!(taxUsdNeeded > 0)) {
      return spendableTokens;
    }
    return reserveTaxHeadroomOnTokens(spendableTokens, taxUsdNeeded);
  }, [spendableTokens, targetUsd, taxUsdFor]);

  const strategyPreferredTokenId = useMemo(() => {
    if (!preferredTokenId) {
      return null;
    }
    const preferred = walletTokens.find((item) => item.id === preferredTokenId);
    if (preferred != null && isUnpricedToken(preferred)) {
      return null;
    }
    return preferredTokenId;
  }, [preferredTokenId, walletTokens]);

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
      preferredTokenId: strategyPreferredTokenId,
    });
  }, [
    selectedChainPriorityId,
    strategyId,
    strategyPreferredTokenId,
    targetUsd,
    tokensForMerchantAllocation,
  ]);

  // Strategy / preferred-token changes discard manual merchant leg edits.
  useEffect(() => {
    const key = `${strategyId}:${strategyPreferredTokenId ?? ''}`;
    if (strategyKeyRef.current === null) {
      strategyKeyRef.current = key;
      return;
    }
    if (strategyKeyRef.current === key) {
      return;
    }
    strategyKeyRef.current = key;
    setManualMerchantAllocations(null);
    setAllocationInputs((current) => {
      const additionalIds = new Set(
        additionalAllocations.map((leg) => leg.token.id),
      );
      return Object.fromEntries(
        Object.entries(current).filter(([tokenId]) =>
          additionalIds.has(tokenId),
        ),
      );
    });
  }, [additionalAllocations, strategyId, strategyPreferredTokenId]);

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

  const draftStoredLegs = useMemo(
    () =>
      splitStoredLegs(
        getSendDraftSnapshot().manualLegs,
        getSendDraftSnapshot().additionalLegs,
        walletTokens,
      ),
    [walletTokens],
  );

  const preferredAdditionalSeed = useMemo((): PaymentAllocation[] => {
    if (
      preferredAdditionalDismissed ||
      additionalAllocations.length > 0 ||
      !preferredTokenId
    ) {
      return [];
    }

    const preferred = walletTokens.find((item) => item.id === preferredTokenId);
    if (
      !preferred ||
      preferred.rawBalance <= 0n ||
      !isUnpricedToken(preferred)
    ) {
      return [];
    }

    return [
      {
        token: preferred,
        ...defaultUnpricedTokenAllocation(preferred),
        usd: 0,
      },
    ];
  }, [
    additionalAllocations.length,
    preferredAdditionalDismissed,
    preferredTokenId,
    walletTokens,
  ]);

  const resolvedManualMerchant = (() => {
    const manual = manualMerchantAllocations ?? draftStoredLegs.merchant;
    return manual != null && manual.length > 0 ? manual : null;
  })();
  const isManualPayment = resolvedManualMerchant != null;

  const merchantAllocations = useMemo(() => {
    const base =
      resolvedManualMerchant != null
        ? resolvedManualMerchant
        : strategyPlan.allocations;
    return refreshAllocationTokens(
      base,
      walletTokens,
      spendableTokens,
      tokensForMerchantAllocation,
    );
  }, [
    resolvedManualMerchant,
    spendableTokens,
    strategyPlan.allocations,
    tokensForMerchantAllocation,
    walletTokens,
  ]);

  useEffect(() => {
    if (manualMerchantAllocations == null) {
      return;
    }
    const clamped = refreshAllocationTokens(
      manualMerchantAllocations,
      walletTokens,
      spendableTokens,
      tokensForMerchantAllocation,
    );
    const changed = clamped.some(
      (leg, index) =>
        leg.amountRaw !== manualMerchantAllocations[index]?.amountRaw,
    );
    if (!changed) {
      return;
    }
    setManualMerchantAllocations(clamped);
    if (!amountLocked && tipUsd <= 0) {
      const totalUsd = clamped.reduce((sum, leg) => sum + leg.usd, 0);
      setAmountState(totalUsd > 0 ? formatAmountInputFromUsd(totalUsd) : '');
      setAmountUsd(totalUsd > 0 ? totalUsd : null);
    }
  }, [
    amountLocked,
    formatAmountInputFromUsd,
    manualMerchantAllocations,
    spendableTokens,
    tipUsd,
    tokensForMerchantAllocation,
    walletTokens,
  ]);

  const additionalLegs = useMemo(() => {
    const base =
      additionalAllocations.length > 0
        ? additionalAllocations
        : preferredAdditionalSeed;
    return refreshAllocationTokens(
      base,
      walletTokens,
      spendableTokens,
      tokensForMerchantAllocation,
    );
  }, [
    additionalAllocations,
    preferredAdditionalSeed,
    spendableTokens,
    tokensForMerchantAllocation,
    walletTokens,
  ]);

  const allocations = useMemo(
    () => mergeAllocationLists(merchantAllocations, additionalLegs),
    [additionalLegs, merchantAllocations],
  );

  useEffect(() => {
    updateSendDraft({
      ethereumRecipient,
      solanaRecipient,
      amount,
      amountLocked,
      manualLegs: manualLegsFromAllocations(
        isManualPayment ? merchantAllocations : null,
      ),
      additionalLegs: manualLegsFromAllocations(
        additionalLegs.length > 0 ? additionalLegs : null,
      ),
      allocationInputs,
    });
  }, [
    additionalLegs,
    allocationInputs,
    amount,
    amountLocked,
    ethereumRecipient,
    isManualPayment,
    merchantAllocations,
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

  const resolvedRecipients = resolveSendRecipients(
    getSendDraftSnapshot().accountNumber,
    ethereumRecipient,
    solanaRecipient,
  );

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
    () => resolveTaxFunding(allocations, walletTokens, taxUsd),
    [allocations, taxUsd, walletTokens],
  );

  // Merchant legs must fit; tax must fit on a single leftover token.
  const legsWithinBalance = useMemo(() => {
    const legsFit = allocations.every((leg) => {
      const maxRaw = maxManualAllocationRaw(
        leg.token,
        tokensForMerchantAllocation,
        spendableTokens,
      );
      return leg.amountRaw <= maxRaw;
    });
    return legsFit && (taxUsd <= 0 || taxFunding != null);
  }, [allocations, spendableTokens, taxFunding, taxUsd, tokensForMerchantAllocation]);
  const hasPositiveLeg = allocations.some((leg) => leg.amountRaw > 0n);
  const hasPositiveMerchantLeg = merchantAllocations.some(
    (leg) => leg.amountRaw > 0n,
  );
  const isTokenOnlyPayment = !amountValid && hasPositiveLeg;

  const filledUsd = merchantAllocations.reduce((sum, leg) => sum + leg.usd, 0);

  const remainingUsd =
    targetUsd != null ? Math.max(0, targetUsd - filledUsd) : strategyPlan.remainingUsd;

  const tokenOnlyCanFulfill = isTokenOnlyPayment && legsWithinBalance;

  const manualCanFulfill = hasPositiveMerchantLeg && legsWithinBalance;

  const strategyCanFulfill =
    amountValid && strategyPlan.canFulfill && legsWithinBalance;

  const canFulfill = isTokenOnlyPayment
    ? tokenOnlyCanFulfill
    : isManualPayment
      ? manualCanFulfill
      : strategyCanFulfill;

  const payerExceedsAvailable =
    maxAvailableUsd != null &&
    payerTotalUsd != null &&
    payerTotalUsd > maxAvailableUsd + 0.015;

  const insufficientFunds = isTokenOnlyPayment
    ? hasPositiveLeg && !legsWithinBalance
    : isManualPayment
      ? hasPositiveMerchantLeg && !legsWithinBalance
      : amountValid &&
        (payerExceedsAvailable
          ? true
          : !(strategyPlan.canFulfill && legsWithinBalance));

  const canContinue =
    hasPositiveLeg &&
    canFulfill &&
    recipientsValid &&
    (!amountValid || !payerExceedsAvailable) &&
    (!needsEthereumRecipient || resolvedRecipients.ethereum.length > 0) &&
    (!needsSolanaRecipient || resolvedRecipients.solana.length > 0);

  const continueBlockedReason = (() => {
    if (canContinue) {
      return null;
    }
    if (!hasPositiveLeg) {
      return 'Enter an amount for at least one token in advanced details.';
    }
    if (!recipientsValid) {
      return 'Recipient address is invalid.';
    }
    if (needsEthereumRecipient && !resolvedRecipients.ethereum) {
      return 'This payment needs an EVM recipient address.';
    }
    if (needsSolanaRecipient && !resolvedRecipients.solana) {
      return 'This payment needs a Solana recipient address.';
    }
    if (insufficientFunds) {
      return 'Insufficient funds for this payment (including service fee and gas).';
    }
    if (!canFulfill && isTokenOnlyPayment) {
      return 'Adjust token amounts to fit your available balance.';
    }
    if (!canFulfill && isManualPayment) {
      if (taxUsd > 0 && taxFunding == null) {
        return 'Leave enough balance on one token to cover the service fee.';
      }
      return 'Adjust token amounts to fit your available balance.';
    }
    if (!canFulfill) {
      return 'Insufficient funds for this payment (including service fee and gas).';
    }
    if (amountValid && payerExceedsAvailable) {
      return 'Payment total exceeds your available balance.';
    }
    return 'Complete payment details to continue.';
  })();

  const setEthereumRecipient = (value: string) => {
    setEthereumRecipientState(value);
  };

  const setSolanaRecipient = (value: string) => {
    setSolanaRecipientState(value);
  };

  const setAmount = (value: string) => {
    const sanitized = sanitizeAmountInput(value);
    setAmountLocked(false);
    setAmountState(sanitized);
    const usd = parseDisplayInputToUsd(sanitized);
    if (usd != null) {
      setAmountUsd(usd);
    } else if (!sanitized.trim() || sanitized === '.') {
      setAmountUsd(null);
    }
    if (
      manualMerchantAllocationsRef.current == null ||
      manualMerchantAllocationsRef.current.length === 0
    ) {
      setManualMerchantAllocations(null);
      setAllocationInputs((current) => {
        const additionalIds = new Set(
          additionalAllocationsRef.current.map((leg) => leg.token.id),
        );
        return Object.fromEntries(
          Object.entries(current).filter(([tokenId]) =>
            additionalIds.has(tokenId),
          ),
        );
      });
    }
  };

  const applyMerchantLegEdits = (
    next: PaymentAllocation[],
    syncAmount: boolean,
  ) => {
    setManualMerchantAllocations(next.length > 0 ? next : null);
    if (!syncAmount || amountLocked || tipUsd > 0) {
      return;
    }
    const totalUsd = next.reduce((sum, leg) => sum + leg.usd, 0);
    setAmountState(totalUsd > 0 ? formatAmountInputFromUsd(totalUsd) : '');
    setAmountUsd(totalUsd > 0 ? totalUsd : null);
  };

  const setAllocationAmount = (tokenId: string, value: string) => {
      const sanitized = sanitizeAmountInput(value);
      setAllocationInputs((current) => ({
        ...current,
        [tokenId]: sanitized,
      }));

      const additionalIndex = additionalAllocations.findIndex(
        (leg) => leg.token.id === tokenId,
      );
      if (additionalIndex >= 0) {
        const token =
          walletTokens.find((item) => item.id === tokenId) ??
          additionalAllocations[additionalIndex].token;
        const maxRaw = maxManualAllocationRaw(
          token,
          tokensForMerchantAllocation,
          spendableTokens,
        );

        if (sanitized.trim() === '' || sanitized === '.') {
          const next = [...additionalAllocations];
          next[additionalIndex] = {
            token,
            amountRaw: 0n,
            amountFormatted: sanitized,
            usd: 0,
          };
          setAdditionalAllocations(next);
          return;
        }

        const amountRaw = (() => {
          if (allocationInputUnit === 'usd') {
            return parseTokenAmountToRaw(sanitized, token.decimals);
          }
          return parseTokenAmountToRaw(sanitized, token.decimals);
        })();
        if (amountRaw == null) {
          return;
        }

        const clamped = amountRaw > maxRaw ? maxRaw : amountRaw;
        const amountFormatted =
          allocationInputUnit === 'usd'
            ? formatRawTokenBalance(clamped, token.decimals)
            : sanitized;

        const next = [...additionalAllocations];
        next[additionalIndex] = {
          token,
          amountRaw: clamped,
          amountFormatted,
          usd: 0,
        };
        setAdditionalAllocations(next);
        return;
      }

      const merchantBase =
        manualMerchantAllocations ??
        strategyPlan.allocations.map((leg) => ({ ...leg }));
      const index = merchantBase.findIndex((leg) => leg.token.id === tokenId);
      if (index < 0) {
        return;
      }

      const token =
        walletTokens.find((item) => item.id === tokenId) ?? merchantBase[index].token;
      const maxRaw = maxManualAllocationRaw(
        token,
        tokensForMerchantAllocation,
        spendableTokens,
      );
      const merchantCap = { ...token, rawBalance: maxRaw };

      if (sanitized.trim() === '' || sanitized === '.') {
        const next = [...merchantBase];
        next[index] = {
          token,
          amountRaw: 0n,
          amountFormatted: sanitized,
          usd: 0,
        };
        applyMerchantLegEdits(next, false);
        return;
      }

      const amountRaw = (() => {
        if (allocationInputUnit === 'usd') {
          const usdForToken = parseDisplayInputToUsd(sanitized);
          if (usdForToken != null) {
            const fromUsd = parseUsdAmountToTokenRaw(
              String(usdForToken),
              merchantCap,
            );
            if (fromUsd != null) {
              return fromUsd;
            }
          }
          return parseTokenAmountToRaw(sanitized, token.decimals);
        }
        return parseTokenAmountToRaw(sanitized, token.decimals);
      })();
      if (amountRaw == null) {
        return;
      }
      const clamped = amountRaw > maxRaw ? maxRaw : amountRaw;
      const amountFormatted =
        allocationInputUnit === 'usd' &&
        parseUsdAmountToTokenRaw(
          String(parseDisplayInputToUsd(sanitized) ?? ''),
          merchantCap,
        ) == null
          ? sanitized
          : allocationInputUnit === 'usd'
            ? formatRawTokenBalance(clamped, token.decimals)
            : sanitized;
      const estimatedUsd = estimateTokenAmountUsd(token, clamped);
      const usd = (() => {
        if (estimatedUsd != null) {
          return estimatedUsd;
        }
        if (allocationInputUnit === 'usd') {
          const usdForToken = parseDisplayInputToUsd(sanitized);
          if (
            usdForToken != null &&
            parseUsdAmountToTokenRaw(String(usdForToken), merchantCap) != null
          ) {
            return usdForToken;
          }
        }
        return 0;
      })();

      const next = [...merchantBase];
      next[index] = {
        token,
        amountRaw: clamped,
        amountFormatted,
        usd,
      };
      applyMerchantLegEdits(next, true);
  };

  const removeAllocation = (tokenId: string) => {
      if (additionalAllocations.some((leg) => leg.token.id === tokenId)) {
        if (tokenId === preferredTokenId) {
          setPreferredAdditionalDismissed(true);
        }
        setAdditionalAllocations(
          additionalAllocations.filter((leg) => leg.token.id !== tokenId),
        );
        setAllocationInputs((current) => {
          const { [tokenId]: _removed, ...rest } = current;
          return rest;
        });
        return;
      }

      const merchantBase =
        manualMerchantAllocations ??
        strategyPlan.allocations.map((leg) => ({ ...leg }));
      const next = merchantBase.filter((leg) => leg.token.id !== tokenId);
      setAllocationInputs((current) => {
        const { [tokenId]: _removed, ...rest } = current;
        return rest;
      });
      applyMerchantLegEdits(next, true);
  };

  const addAllocation = (tokenId: string) => {
      const token = walletTokens.find((item) => item.id === tokenId);
      if (!token) {
        return;
      }

      if (isUnpricedToken(token)) {
        if (additionalAllocations.some((leg) => leg.token.id === tokenId)) {
          return;
        }

        const initial = defaultUnpricedTokenAllocation(token);
        setAdditionalAllocations([
          ...additionalAllocations,
          {
            token,
            amountRaw: initial.amountRaw,
            amountFormatted: initial.amountFormatted,
            usd: 0,
          },
        ]);
        setAllocationInputs((current) => ({
          ...current,
          [tokenId]: initial.amountFormatted,
        }));
        return;
      }

      const merchantBase =
        manualMerchantAllocations ??
        strategyPlan.allocations.map((leg) => ({ ...leg }));
      if (merchantBase.some((leg) => leg.token.id === tokenId)) {
        return;
      }

      const hasRequestedAmount = requestedUsd != null && requestedUsd > 0;
      const amountRaw = hasRequestedAmount
        ? maxManualAllocationRaw(
            token,
            tokensForMerchantAllocation,
            spendableTokens,
          )
        : 0n;
      const amountFormatted =
        amountRaw > 0n
          ? formatRawTokenBalance(amountRaw, token.decimals)
          : '';
      const usd = estimateTokenAmountUsd(token, amountRaw) ?? 0;

      const next: PaymentAllocation[] = [
        ...merchantBase,
        {
          token,
          amountRaw,
          amountFormatted,
          usd,
        },
      ];
      setAllocationInputs((current) => ({
        ...current,
        [tokenId]: amountFormatted,
      }));
      applyMerchantLegEdits(next, hasRequestedAmount);
  };

  const resolvedAllocationInputs = useMemo(() => {
    const resolved: Record<string, string> = { ...allocationInputs };
    for (const leg of allocations) {
      const fromLeg =
        allocationInputUnit === 'usd' && !isUnpricedToken(leg.token)
          ? leg.usd > 0
            ? formatAmountInputFromUsd(leg.usd)
            : leg.amountFormatted
          : leg.amountFormatted;

      const existing = resolved[leg.token.id];
      if (existing == null) {
        resolved[leg.token.id] = fromLeg;
        continue;
      }

      const existingRaw =
        allocationInputUnit === 'usd' && !isUnpricedToken(leg.token)
          ? (() => {
              const usdValue = parseDisplayInputToUsd(existing);
              if (usdValue == null) {
                return null;
              }
              return parseUsdAmountToTokenRaw(String(usdValue), leg.token);
            })()
          : parseTokenAmountToRaw(existing, leg.token.decimals);

      if (existingRaw != null && existingRaw > leg.amountRaw) {
        resolved[leg.token.id] = fromLeg;
      }
    }
    return resolved;
  }, [
    allocationInputUnit,
    allocationInputs,
    allocations,
    formatAmountInputFromUsd,
    parseDisplayInputToUsd,
  ]);

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
    resolvedEthereumRecipient: resolvedRecipients.ethereum,
    resolvedSolanaRecipient: resolvedRecipients.solana,
    ethereumRecipientValid,
    solanaRecipientValid,
    recipientsValid,
    amountValid,
    insufficientFunds,
    isManualPayment,
    continueBlockedReason,
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
  accountNumber = '',
): string {
  const resolved = resolveSendRecipients(
    accountNumber,
    ethereumRecipient,
    solanaRecipient,
  );
  return getNetworkChain(allocation.token.network) === 'solana'
    ? resolved.solana
    : resolved.ethereum;
}
