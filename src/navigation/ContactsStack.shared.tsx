import type { ComponentType } from 'react';

import type { ContactsStackParamList } from '@/navigation/types';
import { ContactDetailsScreen } from '@/screens/ContactDetailsScreen';
import { ContactsScreen } from '@/screens/ContactsScreen';
import { NewContactScreen } from '@/screens/NewContactScreen';
import { NewEnsContactScreen } from '@/screens/NewEnsContactScreen';
import { NewFarcasterContactScreen } from '@/screens/NewFarcasterContactScreen';
import { NewRawAddressContactScreen } from '@/screens/NewRawAddressContactScreen';

export const CONTACTS_STACK_INITIAL_ROUTE: keyof ContactsStackParamList =
  'index';

export const contactsStackScreens = {
  index: ContactsScreen,
  newContact: NewContactScreen,
  newFarcasterContact: NewFarcasterContactScreen,
  newEnsContact: NewEnsContactScreen,
  newRawAddressContact: NewRawAddressContactScreen,
  contactDetails: ContactDetailsScreen,
} as const satisfies Record<
  keyof ContactsStackParamList,
  ComponentType<object>
>;
