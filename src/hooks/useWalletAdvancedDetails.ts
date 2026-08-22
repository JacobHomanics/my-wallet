import { useAppLayout } from '@/hooks/useAppLayout';
import { useConfirmExportPrivateKey } from '@/hooks/useConfirmExportPrivateKey';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import { useUserWallets } from '@/hooks/useUserWallets';

/**
 * Wallet cards + show/hide state for the account number advanced-details footer.
 */
export function useWalletAdvancedDetails() {
  const { isAdvanced } = useAppLayout();
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();
  const showWallets = isAdvanced || showAdvanced;
  const { ready, wallets } = useUserWallets();
  const { displayName } = useProfileIdentity();
  const { copy, isCopied } = useCopyToClipboard();
  const {
    pendingWallet,
    confirmVisible,
    requestExport,
    cancelConfirm,
    confirmExport,
    exportWebViewUri,
    closeExportWebView,
  } = useConfirmExportPrivateKey();

  return {
    isAdvanced,
    showAdvanced,
    toggleAdvanced,
    showWallets,
    ready,
    wallets,
    displayName,
    copy,
    isCopied,
    pendingWallet,
    confirmVisible,
    requestExport,
    cancelConfirm,
    confirmExport,
    exportWebViewUri,
    closeExportWebView,
  };
}
