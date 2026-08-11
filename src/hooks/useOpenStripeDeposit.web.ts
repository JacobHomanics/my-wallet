import { useDepositMethodPicker } from '@/hooks/useDepositMethodPicker';
import type { UseOpenStripeDepositResult } from '@/hooks/useOpenStripeDeposit.shared';
import { useUserWallets } from '@/hooks/useUserWallets';
import { getStripePublishableKey } from '@/lib/stripe/stripeCredentials';

/**
 * Opens the deposit method picker when an EVM wallet and publishable key
 * are available.
 */
export function useOpenStripeDeposit(): UseOpenStripeDepositResult {
  const { wallets } = useUserWallets();
  const { pickerOpen, openPicker, closePicker, onSelectMethod, defaultMethod } =
    useDepositMethodPicker();

  const ethereumAddress = wallets.find((w) => w.chain === 'ethereum')?.address;
  const canDeposit =
    Boolean(ethereumAddress) && Boolean(getStripePublishableKey());

  return {
    canDeposit,
    openDeposit: openPicker,
    depositPickerOpen: pickerOpen,
    defaultDepositMethod: defaultMethod,
    closeDepositPicker: closePicker,
    onSelectDepositMethod: onSelectMethod,
  };
}
