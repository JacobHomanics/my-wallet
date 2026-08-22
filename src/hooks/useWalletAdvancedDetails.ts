import { useConfirmExportPrivateKey } from '@/hooks/useConfirmExportPrivateKey';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import { useUserWallets } from '@/hooks/useUserWallets';

/**
 * Wallet cards + show/hide state for the account number advanced-details footer.
 */
export function useWalletAdvancedDetails() {
  const { isAdvanced, showAdvanced, toggleAdvanced, showAdvancedToggle } =
    useShowAdvanced('wallets');
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
    showAdvancedToggle,
    showWallets: showAdvanced,
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
