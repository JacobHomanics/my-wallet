import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { HomeStackParamList } from '@/navigation/types';
import { HomeScreen } from '@/screens/HomeScreen';
import { TokenDetailsScreen } from '@/screens/TokenDetailsScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="homeIndex" component={HomeScreen} />
      <Stack.Screen name="tokenDetails" component={TokenDetailsScreen} />
    </Stack.Navigator>
  );
}
