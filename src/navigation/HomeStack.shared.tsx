import type { ComponentType } from 'react';

import type { HomeStackParamList } from '@/navigation/types';
import { ConfirmSendScreen } from '@/screens/ConfirmSendScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ReceiveQrScreen } from '@/screens/ReceiveQrScreen';
import { ReceiveScreen } from '@/screens/ReceiveScreen';
import { RequestScreen } from '@/screens/RequestScreen';
import { SendAdvancedSearchScreen } from '@/screens/SendAdvancedSearchScreen';
import { SendAmountScreen } from '@/screens/SendAmountScreen';
import { SendScreen } from '@/screens/SendScreen';
import { SentScreen } from '@/screens/SentScreen';
import { StripeOnrampScreen } from '@/screens/StripeOnrampScreen';
import { TokenDetailsScreen } from '@/screens/TokenDetailsScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen';

export const HOME_STACK_INITIAL_ROUTE: keyof HomeStackParamList = 'index';

export const homeStackScreens = {
  index: HomeScreen,
  tokenDetails: TokenDetailsScreen,
  transactions: TransactionsScreen,
  receive: ReceiveScreen,
  request: RequestScreen,
  stripeOnramp: StripeOnrampScreen,
  receiveQr: ReceiveQrScreen,
  send: SendScreen,
  sendAdvancedSearch: SendAdvancedSearchScreen,
  sendAmount: SendAmountScreen,
  confirmSend: ConfirmSendScreen,
  sent: SentScreen,
} as const satisfies Record<keyof HomeStackParamList, ComponentType<object>>;
