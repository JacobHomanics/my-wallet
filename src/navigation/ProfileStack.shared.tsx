import type { ComponentType } from 'react';

import type { ProfileStackParamList } from '@/navigation/types';
import { OnrampSettingsScreen } from '@/screens/OnrampSettingsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { ProfileSettingsScreen } from '@/screens/ProfileSettingsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export const PROFILE_STACK_INITIAL_ROUTE: keyof ProfileStackParamList = 'index';

export const profileStackScreens = {
  index: ProfileScreen,
  settings: SettingsScreen,
  profileSettings: ProfileSettingsScreen,
  onrampSettings: OnrampSettingsScreen,
} as const satisfies Record<keyof ProfileStackParamList, ComponentType<object>>;
