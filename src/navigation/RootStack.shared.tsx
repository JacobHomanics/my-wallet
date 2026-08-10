import type { ComponentType } from 'react';

import { MainTabs } from '@/navigation/MainTabs';
import {
  ROOT_STACK_INITIAL_ROUTE,
  type RootStackParamList,
} from '@/navigation/types';
import { ExportWalletScreen } from '@/screens/ExportWalletScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { LoginVerifyScreen } from '@/screens/LoginVerifyScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { SplashScreen } from '@/screens/SplashScreen';
import { WelcomeScreen } from '@/screens/WelcomeScreen';

export { ROOT_STACK_INITIAL_ROUTE };

export const rootStackScreens = {
  splash: SplashScreen,
  welcome: WelcomeScreen,
  login: LoginScreen,
  loginVerify: LoginVerifyScreen,
  exportWallet: ExportWalletScreen,
  onboarding: OnboardingScreen,
  main: MainTabs,
} as const satisfies Record<keyof RootStackParamList, ComponentType<object>>;
