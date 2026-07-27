import type { ComponentType } from 'react';

import type { HomeStackParamList } from '@/navigation/types';
import { ConfirmSendScreen } from '@/screens/ConfirmSendScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { SendScreen } from '@/screens/SendScreen';
import { TokenDetailsScreen } from '@/screens/TokenDetailsScreen';

export const HOME_STACK_INITIAL_ROUTE: keyof HomeStackParamList = 'index';

export const homeStackScreens = {
  index: HomeScreen,
  tokenDetails: TokenDetailsScreen,
  send: SendScreen,
  confirmSend: ConfirmSendScreen,
} as const satisfies Record<keyof HomeStackParamList, ComponentType<object>>;
