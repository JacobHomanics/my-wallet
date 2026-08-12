import { useCallback } from 'react';

import { getDefaultGasSponsorship } from '@/hooks/useDefaultGasSponsorship';
import {
  getSendDraftSnapshot,
  updateSendDraft,
  useSendDraft,
} from '@/hooks/useSendDraft';

/**
 * Resolved gas sponsorship for the current send (draft override or settings default).
 * Disabled while sending from this device (frontend broadcast).
 */
export function useGasSponsorship(): {
  gasSponsorship: boolean;
  setGasSponsorship: (enabled: boolean) => void;
} {
  const draft = useSendDraft();
  const frontendSend = draft.broadcastMode === 'frontend';
  const gasSponsorship = frontendSend
    ? false
    : (draft.gasSponsorship ?? getDefaultGasSponsorship());

  const setGasSponsorship = useCallback((enabled: boolean) => {
    if (enabled && getSendDraftSnapshot().broadcastMode === 'frontend') {
      return;
    }
    updateSendDraft({ gasSponsorship: enabled });
  }, []);

  return {
    gasSponsorship,
    setGasSponsorship,
  };
}

/** Resolved gas sponsorship for the in-memory send draft. */
export function getSendGasSponsorship(): boolean {
  const draft = getSendDraftSnapshot();
  if (draft.broadcastMode === 'frontend') {
    return false;
  }
  return draft.gasSponsorship ?? getDefaultGasSponsorship();
}
