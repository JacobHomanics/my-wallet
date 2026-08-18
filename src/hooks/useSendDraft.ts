import { useCallback, useSyncExternalStore } from 'react';

import type { AllocationInputUnit } from '@/hooks/useAllocationInputUnit';
import type { PaymentStrategyId } from '@/lib/strategies';
import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import type { SendBroadcastMode } from '@/lib/send/broadcastMode';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';
import { tryDecodeWalletIdentity } from '@/lib/walletIdentity';

export type SendDraftManualLeg = {
  tokenId: string;
  amountRaw: string;
  amountFormatted: string;
  usd: number;
};

export type SendDraft = {
  accountNumber: string;
  ethereumRecipient: string;
  solanaRecipient: string;
  /** Platform username for the recipient when known (e.g. from contacts/search). */
  recipientUsername: string | null;
  /** Display name for the recipient when known (e.g. external contact). */
  recipientName: string | null;
  /** Profile photo URL for the recipient when known. */
  recipientProfilePhotoUrl: string | null;
  /** True when the recipient is a Farcaster profile. */
  recipientIsFarcaster: boolean;
  /** True when the recipient is an ENS profile. */
  recipientIsEns: boolean;
  amount: string;
  /**
   * When true (e.g. receive QR payment request), editing token legs must not
   * rewrite the requested amount.
   */
  amountLocked: boolean;
  /** Priced token legs that override strategy allocation. */
  manualLegs: SendDraftManualLeg[] | null;
  /** Unpriced bonus legs (e.g. CashBox Points) sent on top of the USD payment. */
  additionalLegs: SendDraftManualLeg[] | null;
  allocationInputs: Record<string, string>;
  allocationInputUnit: AllocationInputUnit;
  /** When set, overrides the default strategy for this send only. */
  strategyId: PaymentStrategyId | null;
  /**
   * Where payment legs are broadcast: Convex backend (rewards) or device
   * wallets (no rewards).
   */
  broadcastMode: SendBroadcastMode;
  /**
   * When true for this send, include vault USDC in available balance and
   * withdraw from the vault before broadcasting.
   */
  useVaultUsdc: boolean;
};

type DraftListener = () => void;

const DEFAULT_SEND_DRAFT: SendDraft = {
  accountNumber: '',
  ethereumRecipient: '',
  solanaRecipient: '',
  recipientUsername: null,
  recipientName: null,
  recipientProfilePhotoUrl: null,
  recipientIsFarcaster: false,
  recipientIsEns: false,
  amount: '',
  amountLocked: false,
  manualLegs: null,
  additionalLegs: null,
  allocationInputs: {},
  allocationInputUnit: 'token',
  strategyId: null,
  broadcastMode: 'backend',
  useVaultUsdc: true,
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

/** Apply send / confirm-send route params into the draft (e.g. receive QR deep links). */
export function hydrateSendDraftFromConfirmParams(params: {
  usdAmount?: string;
  identity?: string;
  ethereumRecipient?: string;
  solanaRecipient?: string;
  recipientUsername?: string | null;
  recipientName?: string | null;
  recipientProfilePhotoUrl?: string | null;
  recipientIsFarcaster?: boolean;
  recipientIsEns?: boolean;
}): void {
  const amount = params.usdAmount?.trim() ?? '';
  const decoded = tryDecodeWalletIdentity(params.identity);
  const username = params.recipientUsername?.trim().replace(/^@/, '') || null;
  const name = params.recipientName?.trim() || null;
  const profilePhotoUrl = params.recipientProfilePhotoUrl?.trim() || null;
  sendDraft = {
    ...DEFAULT_SEND_DRAFT,
    accountNumber: params.identity?.trim() ?? '',
    ethereumRecipient:
      decoded?.evmAddress ?? params.ethereumRecipient?.trim() ?? '',
    solanaRecipient:
      decoded?.solanaAddress ?? params.solanaRecipient?.trim() ?? '',
    recipientUsername: username,
    recipientName: name,
    recipientProfilePhotoUrl: profilePhotoUrl,
    recipientIsFarcaster: Boolean(params.recipientIsFarcaster),
    recipientIsEns: Boolean(params.recipientIsEns),
    amount,
    amountLocked: Boolean(params.usdAmount?.trim()),
  };
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

  const setAllocationInputUnit = useCallback((allocationInputUnit: AllocationInputUnit) => {
    updateSendDraft({ allocationInputUnit });
  }, []);

  const setBroadcastMode = useCallback((broadcastMode: SendBroadcastMode) => {
    updateSendDraft({ broadcastMode });
  }, []);

  const setUseVaultUsdc = useCallback((useVaultUsdc: boolean) => {
    updateSendDraft({ useVaultUsdc });
  }, []);

  return {
    allocationInputUnit: draft.allocationInputUnit,
    setAllocationInputUnit,
    broadcastMode: draft.broadcastMode,
    setBroadcastMode,
    useVaultUsdc: draft.useVaultUsdc,
    setUseVaultUsdc,
  };
}
