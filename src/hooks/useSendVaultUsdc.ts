import { useCallback } from 'react';

import { updateSendDraft, useSendDraft } from '@/hooks/useSendDraft';
import { useVaultSendSettings } from '@/hooks/useVaultSendSettings';

/**
 * Per-send vault USDC toggle combined with the user's global Settings preference.
 */
export function useSendVaultUsdc() {
  const { enabled: globallyEnabled, isLoading: globalLoading } =
    useVaultSendSettings();
  const perSendEnabled = useSendDraft().useVaultUsdc;

  const enabled = globallyEnabled && perSendEnabled;

  const setPerSendEnabled = useCallback((value: boolean) => {
    updateSendDraft({ useVaultUsdc: value });
  }, []);

  return {
    /** Vault USDC is included for this send (global + per-send). */
    enabled,
    globallyEnabled,
    perSendEnabled,
    setPerSendEnabled,
    globalLoading,
  };
}
