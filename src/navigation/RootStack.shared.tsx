import type { ComponentType } from 'react';

import { HomeScreen } from '@/screens/HomeScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { SplashScreen } from '@/screens/SplashScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import {
  ROOT_STACK_INITIAL_ROUTE,
  type RootStackParamList,
} from '@/navigation/types';

export { ROOT_STACK_INITIAL_ROUTE };

export const rootStackScreens = {
  splash: SplashScreen,
  welcome: WelcomeScreen,
  login: LoginScreen,
  home: HomeScreen,
} as const satisfies Record<keyof RootStackParamList, ComponentType<object>>;
