import type { ComponentType } from 'react';

import type { ProfileStackParamList } from '@/navigation/types';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export const PROFILE_STACK_INITIAL_ROUTE: keyof ProfileStackParamList = 'index';

export const profileStackScreens = {
  index: ProfileScreen,
  settings: SettingsScreen,
} as const satisfies Record<keyof ProfileStackParamList, ComponentType<object>>;
