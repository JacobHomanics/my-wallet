import { createStackNavigator } from '@react-navigation/stack';

import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useThemeColors } from '@/hooks/useThemeColors';

import {
  CONTACTS_STACK_INITIAL_ROUTE,
  contactsStackScreens,
} from '@/navigation/ContactsStack.shared';
import type { ContactsStackParamList } from '@/navigation/types';

const WebStack = createStackNavigator<ContactsStackParamList>();

export function ContactsStack() {
  const isDesktopWeb = useIsDesktopWeb();
  const colors = useThemeColors();

  return (
    <WebStack.Navigator
      initialRouteName={CONTACTS_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: isDesktopWeb ? 'none' : 'slide_from_right',
        cardStyle: {
          flex: 1,
          backgroundColor: colors.bg,
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
        name="newBasenameContact"
        component={contactsStackScreens.newBasenameContact}
      />
      <WebStack.Screen
        name="newLensContact"
        component={contactsStackScreens.newLensContact}
      />
      <WebStack.Screen
        name="newSnsContact"
        component={contactsStackScreens.newSnsContact}
      />
      <WebStack.Screen
        name="newNostrContact"
        component={contactsStackScreens.newNostrContact}
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
