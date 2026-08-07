import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  HOME_STACK_INITIAL_ROUTE,
  homeStackScreens,
} from '@/navigation/HomeStack.shared';
import type { HomeStackParamList } from '@/navigation/types';

const NativeStack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <NativeStack.Navigator
      initialRouteName={HOME_STACK_INITIAL_ROUTE}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <NativeStack.Screen name="index" component={homeStackScreens.index} />
      <NativeStack.Screen
        name="tokenDetails"
        component={homeStackScreens.tokenDetails}
      />
      <NativeStack.Screen
        name="transactions"
        component={homeStackScreens.transactions}
      />
      <NativeStack.Screen
        name="contacts"
        component={homeStackScreens.contacts}
      />
      <NativeStack.Screen
        name="newContact"
        component={homeStackScreens.newContact}
      />
      <NativeStack.Screen
        name="contactDetails"
        component={homeStackScreens.contactDetails}
      />
      <NativeStack.Screen name="receive" component={homeStackScreens.receive} />
      <NativeStack.Screen name="request" component={homeStackScreens.request} />
      <NativeStack.Screen
        name="receiveQr"
        component={homeStackScreens.receiveQr}
      />
      <NativeStack.Screen name="send" component={homeStackScreens.send} />
      <NativeStack.Screen
        name="sendAmount"
        component={homeStackScreens.sendAmount}
      />
      <NativeStack.Screen
        name="confirmSend"
        component={homeStackScreens.confirmSend}
      />
      <NativeStack.Screen name="sent" component={homeStackScreens.sent} />
    </NativeStack.Navigator>
  );
}
