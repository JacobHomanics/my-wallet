import { useCallback, useSyncExternalStore } from 'react';

import type { AllocationInputUnit } from '@/hooks/useAllocationInputUnit';
import type { PaymentStrategyId } from '@/lib/strategies';
import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';

export type SendDraftManualLeg = {
  tokenId: string;
  amountRaw: string;
  amountFormatted: string;
  usd: number;
};

export type SendDraft = {
  ethereumRecipient: string;
  solanaRecipient: string;
  amount: string;
  manualLegs: SendDraftManualLeg[] | null;
  allocationInputs: Record<string, string>;
  allocationInputUnit: AllocationInputUnit;
  showAdvanced: boolean;
  /** When set, overrides the default strategy for this send only. */
  strategyId: PaymentStrategyId | null;
};

type DraftListener = () => void;

const DEFAULT_SEND_DRAFT: SendDraft = {
  ethereumRecipient: '',
  solanaRecipient: '',
  amount: '',
  manualLegs: null,
  allocationInputs: {},
  allocationInputUnit: 'token',
  showAdvanced: false,
  strategyId: null,
};

let sendDraft: SendDraft = { ...DEFAULT_SEND_DRAFT };
const listeners = new Set<DraftListener>();

function subscribe(listener: DraftListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSendDraftSnapshot(): SendDraft {
  return sendDraft;
}

export function updateSendDraft(partial: Partial<SendDraft>): void {
  sendDraft = { ...sendDraft, ...partial };
  listeners.forEach((listener) => {
    listener();
  });
}

export function resetSendDraft(): void {
  sendDraft = { ...DEFAULT_SEND_DRAFT };
  listeners.forEach((listener) => {
    listener();
  });
}

export function manualLegsFromAllocations(
  allocations: PaymentAllocation[] | null,
): SendDraftManualLeg[] | null {
  if (allocations == null) {
    return null;
  }

  return allocations.map((leg) => ({
    tokenId: leg.token.id,
    amountRaw: leg.amountRaw.toString(),
    amountFormatted: leg.amountFormatted,
    usd: leg.usd,
  }));
}

export function allocationsFromManualLegs(
  legs: SendDraftManualLeg[] | null,
  tokens: OwnedToken[],
): PaymentAllocation[] | null {
  if (legs == null || legs.length === 0) {
    return null;
  }

  const allocations: PaymentAllocation[] = [];
  for (const leg of legs) {
    const token = tokens.find((item) => item.id === leg.tokenId);
    if (!token) {
      continue;
    }

    let amountRaw: bigint;
    try {
      amountRaw = BigInt(leg.amountRaw);
    } catch {
      continue;
    }

    allocations.push({
      token,
      amountRaw,
      amountFormatted: leg.amountFormatted,
      usd: leg.usd,
    });
  }

  return allocations.length > 0 ? allocations : null;
}

/**
 * In-memory draft for the send flow so values survive confirm ↔ send navigation.
 */
export function useSendDraft(): SendDraft {
  return useSyncExternalStore(subscribe, getSendDraftSnapshot, getSendDraftSnapshot);
}

export function useSendDraftUi() {
  const draft = useSendDraft();

  const setShowAdvanced = useCallback((showAdvanced: boolean) => {
    updateSendDraft({ showAdvanced });
  }, []);

  const toggleAdvanced = useCallback(() => {
    updateSendDraft({ showAdvanced: !getSendDraftSnapshot().showAdvanced });
  }, []);

  const setAllocationInputUnit = useCallback((allocationInputUnit: AllocationInputUnit) => {
    updateSendDraft({ allocationInputUnit });
  }, []);

  return {
    showAdvanced: draft.showAdvanced,
    setShowAdvanced,
    toggleAdvanced,
    allocationInputUnit: draft.allocationInputUnit,
    setAllocationInputUnit,
  };
}
