import { useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { HomeActionIcon } from '@/components/HomeActionButton';
import { useAppLayout } from '@/hooks/useAppLayout';
import type { AppLayoutId } from '@/lib/appLayout';
import type { RootStackParamList } from '@/navigation/types';

export type ChooseAppLayoutAction = {
  id: AppLayoutId;
  label: string;
  icon: HomeActionIcon;
  onPress: () => void;
};

const LAYOUT_OPTION_ICONS: Record<AppLayoutId, HomeActionIcon> = {
  default: { name: 'phone-portrait-outline' },
  advanced: { name: 'flash-outline' },
};

const LAYOUT_OPTION_LABELS: Record<AppLayoutId, string> = {
  default: 'Default',
  advanced: 'Advanced',
};

/**
 * First-run layout choice: persist the selection and continue into the app.
 */
export function useChooseAppLayout(): {
  actions: ChooseAppLayoutAction[];
} {
  const { options, setAppLayout } = useAppLayout();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const chooseLayout = useCallback(
    (id: AppLayoutId) => {
      setAppLayout(id);
      navigation.reset({
        index: 0,
        routes: [{ name: 'main' }],
      });
    },
    [navigation, setAppLayout],
  );

  const actions = useMemo(
    () =>
      options.map((option) => ({
        id: option.id,
        label: LAYOUT_OPTION_LABELS[option.id],
        icon: LAYOUT_OPTION_ICONS[option.id],
        onPress: () => {
          chooseLayout(option.id);
        },
      })),
    [chooseLayout, options],
  );

  return {
    actions,
  };
}
