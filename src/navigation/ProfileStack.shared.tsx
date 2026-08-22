import type { ComponentType } from 'react';

import type { ProfileStackParamList } from '@/navigation/types';
import { AppearanceSettingsScreen } from '@/screens/AppearanceSettingsScreen';
import { EarnSettingsScreen } from '@/screens/EarnSettingsScreen';
import { OnrampSettingsScreen } from '@/screens/OnrampSettingsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { ProfileSettingsScreen } from '@/screens/ProfileSettingsScreen';
import { SendSettingsScreen } from '@/screens/SendSettingsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { MoneySettingsScreen } from '@/screens/MoneySettingsScreen';

export const PROFILE_STACK_INITIAL_ROUTE: keyof ProfileStackParamList = 'index';

export const profileStackScreens = {
  index: ProfileScreen,
  settings: SettingsScreen,
  profileSettings: ProfileSettingsScreen,
  appearanceSettings: AppearanceSettingsScreen,
  moneySettings: MoneySettingsScreen,
  onrampSettings: OnrampSettingsScreen,
  sendSettings: SendSettingsScreen,
  earnSettings: EarnSettingsScreen,
} as const satisfies Record<keyof ProfileStackParamList, ComponentType<object>>;
