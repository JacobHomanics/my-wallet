import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import {
  buildExportWalletUrl,
  confirmExportPrivateKey,
  type ExportPrivateKeyResult,
} from '@/hooks/useExportPrivateKey.shared';
import type { UserWallet } from '@/hooks/useUserWallets.shared';
import { getShareableAppOrigin } from '@/navigation/linking';

/**
 * Native key export opens a hosted web page in a WebView (Privy requires a
 * browser context for `exportWallet`).
 * @see https://docs.privy.io/recipes/mobile-key-export
 */
export function useExportPrivateKey(): ExportPrivateKeyResult {
  const [exportWebViewUri, setExportWebViewUri] = useState<string | null>(null);

  const closeExportWebView = useCallback(() => {
    setExportWebViewUri(null);
  }, []);

  const exportPrivateKey = useCallback(
    async (wallet: UserWallet, options?: { skipConfirm?: boolean }) => {
      const origin = getShareableAppOrigin();
      if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
        Alert.alert(
          'Export unavailable',
          'Set EXPO_PUBLIC_APP_ORIGIN to your published web app URL to export private keys on mobile.',
        );
        return;
      }

      if (!options?.skipConfirm) {
        const confirmed = await confirmExportPrivateKey(wallet);
        if (!confirmed) {
          return;
        }
      }

      setExportWebViewUri(buildExportWalletUrl(wallet));
    },
    [],
  );

  return {
    exportPrivateKey,
    exportWebViewUri,
    closeExportWebView,
  };
}
