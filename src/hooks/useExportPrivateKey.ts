import { useExportWallet as useExportEthereumWallet } from '@privy-io/react-auth';
import { useExportWallet as useExportSolanaWallet } from '@privy-io/react-auth/solana';
import { useCallback } from 'react';

import {
  postExportResultToNative,
  type ExportPrivateKeyResult,
} from '@/hooks/useExportPrivateKey.shared';
import type { UserWallet } from '@/hooks/useUserWallets.shared';

/**
 * Opens Privy’s secure export modal for an embedded Ethereum or Solana wallet.
 * Confirmation UI lives in `useConfirmExportPrivateKey`.
 * @see https://docs.privy.io/wallets/wallets/export
 */
export function useExportPrivateKey(): ExportPrivateKeyResult {
  const { exportWallet: exportEthereumWallet } = useExportEthereumWallet();
  const { exportWallet: exportSolanaWallet } = useExportSolanaWallet();

  const exportPrivateKey = useCallback(
    async (wallet: UserWallet, _options?: { skipConfirm?: boolean }) => {
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
