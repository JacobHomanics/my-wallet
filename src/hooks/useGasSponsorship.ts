import { useCallback } from 'react';

import { appConfig } from '@/configs/app.config';
import { getDefaultGasSponsorship } from '@/hooks/useDefaultGasSponsorship';
import {
  getSendDraftSnapshot,
  updateSendDraft,
  useSendDraft,
} from '@/hooks/useSendDraft';

/** Whether the developer enabled gas sponsorship in app config. */
export function isGasSponsorshipAvailable(): boolean {
  return appConfig.gasSponsorship;
}

function resolveGasSponsorship(
  broadcastMode: 'backend' | 'frontend',
  draftGasSponsorship: boolean | null,
): boolean {
  if (!isGasSponsorshipAvailable() || broadcastMode === 'frontend') {
    return false;
  }
  return draftGasSponsorship ?? getDefaultGasSponsorship();
}

/**
 * Resolved gas sponsorship for the current send (user preference when the
 * developer enabled the feature). Disabled for frontend (device) broadcast.
 */
export function useGasSponsorship(): {
  gasSponsorship: boolean;
  setGasSponsorship: (enabled: boolean) => void;
  gasSponsorshipAvailable: boolean;
} {
  const draft = useSendDraft();
  const gasSponsorshipAvailable = isGasSponsorshipAvailable();
  const gasSponsorship = gasSponsorshipAvailable
    ? resolveGasSponsorship(draft.broadcastMode, draft.gasSponsorship)
    : false;

  const setGasSponsorship = useCallback(
    (enabled: boolean) => {
      if (!gasSponsorshipAvailable) {
        return;
      }
      if (enabled && getSendDraftSnapshot().broadcastMode === 'frontend') {
        return;
      }
      updateSendDraft({ gasSponsorship: enabled });
    },
    [gasSponsorshipAvailable],
  );

  return {
    gasSponsorship,
    setGasSponsorship,
    gasSponsorshipAvailable,
  };
}

/** Resolved gas sponsorship for the in-memory send draft (non-hook callers). */
export function getSendGasSponsorship(): boolean {
  const draft = getSendDraftSnapshot();
  return resolveGasSponsorship(draft.broadcastMode, draft.gasSponsorship);
}
