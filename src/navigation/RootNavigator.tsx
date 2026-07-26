import { StatusBar } from 'expo-status-bar';

import { useSplashGate } from '@/hooks/useSplashGate';
import { HomeScreen } from '@/screens/HomeScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { SplashScreen } from '@/screens/SplashScreen';

export function RootNavigator() {
  const { screen } = useSplashGate();

  return (
    <>
      {screen === 'splash' && <SplashScreen />}
      {screen === 'home' && <HomeScreen />}
      {screen === 'login' && <LoginScreen />}
      <StatusBar style="dark" />
    </>
  );
}
