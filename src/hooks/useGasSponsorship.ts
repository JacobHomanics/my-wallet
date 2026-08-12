import { useCallback } from 'react';

import { getDefaultGasSponsorship } from '@/hooks/useDefaultGasSponsorship';
import {
  getSendDraftSnapshot,
  updateSendDraft,
  useSendDraft,
} from '@/hooks/useSendDraft';

/**
 * Resolved gas sponsorship for the current send (draft override or settings default).
 */
export function useGasSponsorship(): {
  gasSponsorship: boolean;
  setGasSponsorship: (enabled: boolean) => void;
} {
  const draft = useSendDraft();
  const gasSponsorship = draft.gasSponsorship ?? getDefaultGasSponsorship();

  const setGasSponsorship = useCallback((enabled: boolean) => {
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
  return draft.gasSponsorship ?? getDefaultGasSponsorship();
}
