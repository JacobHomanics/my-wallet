import type { ComponentType } from 'react';

import type { HomeStackParamList } from '@/navigation/types';
import { ConfirmSendScreen } from '@/screens/ConfirmSendScreen';
import { ContactDetailsScreen } from '@/screens/ContactDetailsScreen';
import { ContactsScreen } from '@/screens/ContactsScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { NewContactScreen } from '@/screens/NewContactScreen';
import { ReceiveQrScreen } from '@/screens/ReceiveQrScreen';
import { ReceiveScreen } from '@/screens/ReceiveScreen';
import { RequestScreen } from '@/screens/RequestScreen';
import { RewardsScreen } from '@/screens/RewardsScreen';
import { SendAmountScreen } from '@/screens/SendAmountScreen';
import { SendScreen } from '@/screens/SendScreen';
import { SentScreen } from '@/screens/SentScreen';
import { TokenDetailsScreen } from '@/screens/TokenDetailsScreen';
import { TransactionsScreen } from '@/screens/TransactionsScreen';

export const HOME_STACK_INITIAL_ROUTE: keyof HomeStackParamList = 'index';

export const homeStackScreens = {
  index: HomeScreen,
  tokenDetails: TokenDetailsScreen,
  rewards: RewardsScreen,
  transactions: TransactionsScreen,
  contacts: ContactsScreen,
  newContact: NewContactScreen,
  contactDetails: ContactDetailsScreen,
  receive: ReceiveScreen,
  request: RequestScreen,
  receiveQr: ReceiveQrScreen,
  send: SendScreen,
  sendAmount: SendAmountScreen,
  confirmSend: ConfirmSendScreen,
  sent: SentScreen,
} as const satisfies Record<keyof HomeStackParamList, ComponentType<object>>;
