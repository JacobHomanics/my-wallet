import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { HomeActionIcon } from '@/components/HomeActionButton';
import { useDepositBankTipsModal } from '@/hooks/useDepositBankTipsModal';
import { useOpenFreshSend } from '@/hooks/useOpenFreshSend';
import { useOpenStripeDeposit } from '@/hooks/useOpenStripeDeposit';
import { useWithdrawUnsupportedModal } from '@/hooks/useWithdrawUnsupportedModal';
import type { HomeStackParamList } from '@/navigation/types';

export type HomeAction = {
  key: string;
  label: string;
  onPress: () => void;
  icon: HomeActionIcon;
};

export type HomeActionRow = {
  key: string;
  items: HomeAction[];
};

/**
 * Deposit, withdraw, pay, receive, and request tiles on the home screen.
 */
export function useHomeActions() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const openFreshSend = useOpenFreshSend();
  const { canDeposit, openDeposit } = useOpenStripeDeposit();
  const depositTips = useDepositBankTipsModal(openDeposit);
  const withdraw = useWithdrawUnsupportedModal();

  const rows = useMemo<HomeActionRow[]>(() => {
    const depositWithdraw: HomeAction[] = [];

    if (canDeposit) {
      depositWithdraw.push({
        key: 'deposit',
        label: 'Deposit',
        onPress: depositTips.openDepositTips,
        icon: {
          set: 'material',
          name: 'bank-outline',
          badge: { name: 'arrow-down' },
        },
      });
    }

    depositWithdraw.push({
      key: 'withdraw',
      label: 'Withdraw',
      onPress: withdraw.openWithdraw,
      icon: {
        set: 'material',
        name: 'bank-outline',
        badge: { name: 'arrow-up' },
      },
    });

    return [
      { key: 'depositWithdraw', items: depositWithdraw },
      {
        key: 'payReceiveRequest',
        items: [
          {
            key: 'pay',
            label: 'Pay',
            onPress: openFreshSend,
            icon: { name: 'arrow-up' },
          },
          {
            key: 'receive',
            label: 'Receive',
            onPress: () => {
              navigation.navigate('receive');
            },
            icon: { name: 'arrow-down' },
          },
          {
            key: 'request',
            label: 'Request',
            onPress: () => {
              navigation.navigate('request');
            },
            icon: { name: 'cash-outline' },
          },
        ],
      },
    ];
  }, [
    canDeposit,
    depositTips.openDepositTips,
    navigation,
    openFreshSend,
    withdraw.openWithdraw,
  ]);

  return { rows, depositTips, withdraw };
}
