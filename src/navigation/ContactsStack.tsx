import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  CONTACTS_STACK_INITIAL_ROUTE,
  contactsStackScreens,
} from '@/navigation/ContactsStack.shared';
import type { ContactsStackParamList } from '@/navigation/types';

const NativeStack = createNativeStackNavigator<ContactsStackParamList>();

export function ContactsStack() {
  return (
    <NativeStack.Navigator
      initialRouteName={CONTACTS_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <NativeStack.Screen name="index" component={contactsStackScreens.index} />
      <NativeStack.Screen
        name="newContact"
        component={contactsStackScreens.newContact}
      />
      <NativeStack.Screen
        name="newFarcasterContact"
        component={contactsStackScreens.newFarcasterContact}
      />
      <NativeStack.Screen
        name="newRawAddressContact"
        component={contactsStackScreens.newRawAddressContact}
      />
      <NativeStack.Screen
        name="contactDetails"
        component={contactsStackScreens.contactDetails}
      />
    </NativeStack.Navigator>
  );
}
