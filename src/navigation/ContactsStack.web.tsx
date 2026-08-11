import { createStackNavigator } from '@react-navigation/stack';

import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import {
  CONTACTS_STACK_INITIAL_ROUTE,
  contactsStackScreens,
} from '@/navigation/ContactsStack.shared';
import type { ContactsStackParamList } from '@/navigation/types';

const WebStack = createStackNavigator<ContactsStackParamList>();

export function ContactsStack() {
  const isDesktopWeb = useIsDesktopWeb();

  return (
    <WebStack.Navigator
      initialRouteName={CONTACTS_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: isDesktopWeb ? 'none' : 'slide_from_right',
        cardStyle: {
          flex: 1,
          backgroundColor: '#FFF4E6',
          height: '100%',
        },
      }}
    >
      <WebStack.Screen name="index" component={contactsStackScreens.index} />
      <WebStack.Screen
        name="newContact"
        component={contactsStackScreens.newContact}
      />
      <WebStack.Screen
        name="newFarcasterContact"
        component={contactsStackScreens.newFarcasterContact}
      />
      <WebStack.Screen
        name="newEnsContact"
        component={contactsStackScreens.newEnsContact}
      />
      <WebStack.Screen
        name="newRawAddressContact"
        component={contactsStackScreens.newRawAddressContact}
      />
      <WebStack.Screen
        name="contactDetails"
        component={contactsStackScreens.contactDetails}
      />
    </WebStack.Navigator>
  );
}
