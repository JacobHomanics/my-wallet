import { useExportWallet as useExportEthereumWallet } from '@privy-io/react-auth';
import { useExportWallet as useExportSolanaWallet } from '@privy-io/react-auth/solana';
import { useCallback } from 'react';

import {
  confirmExportPrivateKey,
  postExportResultToNative,
  type ExportPrivateKeyResult,
} from '@/hooks/useExportPrivateKey.shared';
import type { UserWallet } from '@/hooks/useUserWallets.shared';

/**
 * Opens Privy’s secure export modal for an embedded Ethereum or Solana wallet.
 * @see https://docs.privy.io/wallets/wallets/export
 */
export function useExportPrivateKey(): ExportPrivateKeyResult {
  const { exportWallet: exportEthereumWallet } = useExportEthereumWallet();
  const { exportWallet: exportSolanaWallet } = useExportSolanaWallet();

  const exportPrivateKey = useCallback(
    async (wallet: UserWallet, options?: { skipConfirm?: boolean }) => {
      if (!options?.skipConfirm) {
        const confirmed = await confirmExportPrivateKey(wallet);
        if (!confirmed) {
          return;
        }
      }

      try {
        if (wallet.chain === 'ethereum') {
          await exportEthereumWallet({ address: wallet.address });
        } else {
          await exportSolanaWallet({ address: wallet.address });
        }
        postExportResultToNative({ status: 'success' });
      } catch (error) {
        postExportResultToNative({
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [exportEthereumWallet, exportSolanaWallet],
  );

  return {
    exportPrivateKey,
    exportWebViewUri: null,
    closeExportWebView: () => {},
  };
}
