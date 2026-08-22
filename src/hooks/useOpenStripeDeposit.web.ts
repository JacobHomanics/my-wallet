import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { UseOpenStripeDepositResult } from '@/hooks/useOpenStripeDeposit.shared';
import { useOnrampSettings } from '@/hooks/useOnrampSettings';
import type { HomeStackParamList } from '@/navigation/types';
import { getStripePublishableKey } from '@/lib/stripe/stripeCredentials';

/**
 * Opens the configured onramp screen.
 */
export function useOpenStripeDeposit(): UseOpenStripeDepositResult {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { selectedProviderId } = useOnrampSettings();

  const hasPublishableKey = Boolean(getStripePublishableKey());
  const canDeposit =
    selectedProviderId === 'stripe-embedded-components' || hasPublishableKey;

  const openDeposit = useCallback(() => {
    if (selectedProviderId === 'stripe-embedded') {
      navigation.navigate('stripeOnramp');
      return;
    }
    navigation.navigate('stripeOnrampComponents');
  }, [navigation, selectedProviderId]);

  return {
    canDeposit,
    openDeposit,
  };
}
