import { useCallback, useState } from 'react';

import { useExportPrivateKey } from '@/hooks/useExportPrivateKey';
import type { UserWallet } from '@/hooks/useUserWallets.shared';

/**
 * Opens a confirm modal before exporting a private key.
 */
export function useConfirmExportPrivateKey() {
  const {
    exportPrivateKey,
    exportWebViewUri,
    closeExportWebView,
  } = useExportPrivateKey();
  const [pendingWallet, setPendingWallet] = useState<UserWallet | null>(null);

  const requestExport = useCallback((wallet: UserWallet) => {
    setPendingWallet(wallet);
  }, []);

  const cancelConfirm = useCallback(() => {
    setPendingWallet(null);
  }, []);

  const confirmExport = useCallback(() => {
    if (!pendingWallet) {
      return;
    }

    const wallet = pendingWallet;
    setPendingWallet(null);
    void exportPrivateKey(wallet, { skipConfirm: true }).catch((error) => {
      console.error(error);
    });
  }, [exportPrivateKey, pendingWallet]);

  return {
    pendingWallet,
    confirmVisible: pendingWallet != null,
    requestExport,
    cancelConfirm,
    confirmExport,
    exportWebViewUri,
    closeExportWebView,
  };
}
