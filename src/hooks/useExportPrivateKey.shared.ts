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
