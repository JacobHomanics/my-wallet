import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { UseOpenStripeDepositResult } from '@/hooks/useOpenStripeDeposit.shared';
import { useOnrampSettings } from '@/hooks/useOnrampSettings';
import { useUserWallets } from '@/hooks/useUserWallets';
import type { HomeStackParamList } from '@/navigation/types';
import { getStripePublishableKey } from '@/lib/stripe/stripeCredentials';

/**
 * Opens the configured onramp screen when an EVM wallet is available.
 */
export function useOpenStripeDeposit(): UseOpenStripeDepositResult {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { selectedProviderId } = useOnrampSettings();
  const { wallets } = useUserWallets();

  const ethereumAddress = wallets.find((w) => w.chain === 'ethereum')?.address;
  const hasPublishableKey = Boolean(getStripePublishableKey());
  const canDeposit =
    Boolean(ethereumAddress) &&
    (selectedProviderId === 'stripe-embedded-components' ||
      hasPublishableKey);

  const openDeposit = useCallback(() => {
    if (selectedProviderId === 'stripe-embedded') {
      navigation.navigate('stripeOnramp');
      return;
    }
    if (selectedProviderId === 'stripe-headless') {
      navigation.navigate('stripeHeadlessOnramp');
      return;
    }
    navigation.navigate('stripeOnrampComponents');
  }, [navigation, selectedProviderId]);

  return {
    canDeposit,
    openDeposit,
  };
}
