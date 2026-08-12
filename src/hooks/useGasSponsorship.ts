import { useCallback } from 'react';

import { updateSendDraft, useSendDraft } from '@/hooks/useSendDraft';

/**
 * Privy gas sponsorship — when enabled the app pays network fees (`sponsor: true`).
 */
export function useGasSponsorship() {
  const draft = useSendDraft();

  const setGasSponsorship = useCallback((gasSponsorship: boolean) => {
    updateSendDraft({ gasSponsorship });
  }, []);

  return {
    gasSponsorship: draft.gasSponsorship,
    setGasSponsorship,
  };
}
