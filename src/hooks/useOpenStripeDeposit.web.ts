import { useUserWallets } from '@/hooks/useUserWallets';
import {
  useNavigateToStripeOnramp,
  type UseOpenStripeDepositResult,
} from '@/hooks/useOpenStripeDeposit.shared';
import { getStripePublishableKey } from '@/lib/stripe/stripeCredentials';

/**
 * Opens the Stripe embedded onramp deposit screen when an EVM wallet and
 * publishable key are available.
 */
export function useOpenStripeDeposit(): UseOpenStripeDepositResult {
  const { wallets } = useUserWallets();
  const openDeposit = useNavigateToStripeOnramp();

  const ethereumAddress = wallets.find((w) => w.chain === 'ethereum')?.address;
  const canDeposit =
    Boolean(ethereumAddress) && Boolean(getStripePublishableKey());

  return { canDeposit, openDeposit };
}
