import type { ComponentType } from 'react';

import type { RewardsStackParamList } from '@/navigation/types';
import { RewardsScreen } from '@/screens/RewardsScreen';

export const REWARDS_STACK_INITIAL_ROUTE: keyof RewardsStackParamList = 'index';

export const rewardsStackScreens = {
  index: RewardsScreen,
} as const satisfies Record<keyof RewardsStackParamList, ComponentType<object>>;
