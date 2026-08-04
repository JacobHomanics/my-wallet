import { Alert, Platform } from 'react-native';

import type { UserWallet } from '@/hooks/useUserWallets.shared';
import { createShareableAppURL } from '@/navigation/linking';

export type ExportPrivateKeyTarget = {
  address: string;
  chain: UserWallet['chain'];
};

export type ExportPrivateKeyResult = {
  exportPrivateKey: (
    wallet: UserWallet,
    options?: { skipConfirm?: boolean },
  ) => Promise<void>;
  /** Native-only: URI for the hosted export WebView, or null when closed. */
  exportWebViewUri: string | null;
  closeExportWebView: () => void;
};

export function buildExportWalletUrl(wallet: UserWallet): string {
  return createShareableAppURL('export', {
    address: wallet.address,
    chain: wallet.chain,
  });
}

/**
 * Confirm before revealing a private key. Uses `window.confirm` on web because
 * RN Web's multi-button Alert is unreliable.
 */
export function confirmExportPrivateKey(wallet: UserWallet): Promise<boolean> {
  const message =
    `Export your ${wallet.label} private key? Anyone with this key can ` +
    'control the funds in this wallet.';

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return Promise.resolve(window.confirm(message));
  }

  return new Promise((resolve) => {
    Alert.alert('Export private key', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      {
        text: 'Export',
        style: 'destructive',
        onPress: () => resolve(true),
      },
    ]);
  });
}

export function postExportResultToNative(message: {
  status: 'success' | 'error';
  error?: string;
}) {
  if (typeof window === 'undefined') {
    return;
  }

  const json = JSON.stringify(message);
  const reactNativeWebView = (
    window as Window & {
      ReactNativeWebView?: { postMessage: (data: string) => void };
    }
  ).ReactNativeWebView;

  if (reactNativeWebView) {
    reactNativeWebView.postMessage(json);
  }
}
