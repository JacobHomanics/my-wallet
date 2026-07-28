import type { ComponentType } from 'react';

import type { HomeStackParamList } from '@/navigation/types';
import { ConfirmSendScreen } from '@/screens/ConfirmSendScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ReceiveQrScreen } from '@/screens/ReceiveQrScreen';
import { ReceiveScreen } from '@/screens/ReceiveScreen';
import { SendScreen } from '@/screens/SendScreen';
import { SentScreen } from '@/screens/SentScreen';
import { TokenDetailsScreen } from '@/screens/TokenDetailsScreen';

export const HOME_STACK_INITIAL_ROUTE: keyof HomeStackParamList = 'index';

export const homeStackScreens = {
  index: HomeScreen,
  tokenDetails: TokenDetailsScreen,
  receive: ReceiveScreen,
  receiveQr: ReceiveQrScreen,
  send: SendScreen,
  confirmSend: ConfirmSendScreen,
  sent: SentScreen,
} as const satisfies Record<keyof HomeStackParamList, ComponentType<object>>;
