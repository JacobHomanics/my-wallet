import type { ComponentType } from 'react';

import type { HomeStackParamList } from '@/navigation/types';
import { HomeScreen } from '@/screens/HomeScreen';
import { TokenDetailsScreen } from '@/screens/TokenDetailsScreen';

export const HOME_STACK_INITIAL_ROUTE: keyof HomeStackParamList = 'index';

export const homeStackScreens = {
  index: HomeScreen,
  tokenDetails: TokenDetailsScreen,
} as const satisfies Record<keyof HomeStackParamList, ComponentType<object>>;
