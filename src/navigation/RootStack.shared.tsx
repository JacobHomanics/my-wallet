import type { ComponentType } from 'react';

import { MainTabs } from '@/navigation/MainTabs';
import {
  ROOT_STACK_INITIAL_ROUTE,
  type RootStackParamList,
} from '@/navigation/types';
import { LoginScreen } from '@/screens/LoginScreen';
import { LoginVerifyScreen } from '@/screens/LoginVerifyScreen';
import { SplashScreen } from '@/screens/SplashScreen';
import { TokenDetailsScreen } from '@/screens/TokenDetailsScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';

export { ROOT_STACK_INITIAL_ROUTE };

export const rootStackScreens = {
  splash: SplashScreen,
  welcome: WelcomeScreen,
  login: LoginScreen,
  loginVerify: LoginVerifyScreen,
  main: MainTabs,
  tokenDetails: TokenDetailsScreen,
} as const satisfies Record<keyof RootStackParamList, ComponentType<object>>;
