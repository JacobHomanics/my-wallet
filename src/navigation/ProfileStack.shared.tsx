import type { ComponentType } from 'react';

import type { ProfileStackParamList } from '@/navigation/types';
import { EarnSettingsScreen } from '@/screens/EarnSettingsScreen';
import { OnrampSettingsScreen } from '@/screens/OnrampSettingsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { ProfileSettingsScreen } from '@/screens/ProfileSettingsScreen';
import { SendSettingsScreen } from '@/screens/SendSettingsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export const PROFILE_STACK_INITIAL_ROUTE: keyof ProfileStackParamList = 'index';

export const profileStackScreens = {
  index: ProfileScreen,
  settings: SettingsScreen,
  profileSettings: ProfileSettingsScreen,
  onrampSettings: OnrampSettingsScreen,
  sendSettings: SendSettingsScreen,
  earnSettings: EarnSettingsScreen,
} as const satisfies Record<keyof ProfileStackParamList, ComponentType<object>>;
