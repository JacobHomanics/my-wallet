import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { HomeStackParamList } from '@/navigation/types';

export type UseOpenStripeDepositResult = {
  canDeposit: boolean;
  openDeposit: () => void;
};

/** Navigates to the Stripe embedded onramp screen. */
export function useNavigateToStripeOnramp() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  return useCallback(() => {
    navigation.navigate('stripeOnramp');
  }, [navigation]);
}
