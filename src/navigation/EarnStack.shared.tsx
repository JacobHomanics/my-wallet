import type { ComponentType } from 'react';

import type { EarnStackParamList } from '@/navigation/types';
import { EarnScreen } from '@/screens/EarnScreen';

export const EARN_STACK_INITIAL_ROUTE: keyof EarnStackParamList = 'index';

export const earnStackScreens = {
  index: EarnScreen,
} as const satisfies Record<keyof EarnStackParamList, ComponentType<object>>;
