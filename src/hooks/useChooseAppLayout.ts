import { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { HomeActionIcon } from '@/components/HomeActionButton';
import { useAppLayout } from '@/hooks/useAppLayout';
import { DEFAULT_APP_LAYOUT_ID, type AppLayoutId } from '@/lib/appLayout';
import type { RootStackParamList } from '@/navigation/types';

export type ChooseAppLayoutAction = {
  id: AppLayoutId;
  label: string;
  hint?: string;
  icon: HomeActionIcon;
  selected: boolean;
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

const LAYOUT_OPTION_HINTS: Record<AppLayoutId, string> = {
  default: 'I just want to send money to my friends.',
  advanced: 'I know too much about the money of the internet.',
};

/**
 * First-run layout choice: draft a selection, then persist on continue.
 */
export function useChooseAppLayout(): {
  actions: ChooseAppLayoutAction[];
  canContinue: boolean;
  continueWithLayout: () => void;
  skipWithDefaultLayout: () => void;
} {
  const { options, setAppLayout } = useAppLayout();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedId, setSelectedId] = useState<AppLayoutId | null>(null);

  const finishWithLayout = useCallback(
    (id: AppLayoutId) => {
      setAppLayout(id);
      navigation.reset({
        index: 0,
        routes: [{ name: 'main' }],
      });
    },
    [navigation, setAppLayout],
  );

  const continueWithLayout = useCallback(() => {
    if (!selectedId) {
      return;
    }
    finishWithLayout(selectedId);
  }, [finishWithLayout, selectedId]);

  const skipWithDefaultLayout = useCallback(() => {
    finishWithLayout(DEFAULT_APP_LAYOUT_ID);
  }, [finishWithLayout]);

  const actions = useMemo(
    () =>
      options.map((option) => ({
        id: option.id,
        label: LAYOUT_OPTION_LABELS[option.id],
        hint: LAYOUT_OPTION_HINTS[option.id],
        icon: LAYOUT_OPTION_ICONS[option.id],
        selected: option.id === selectedId,
        onPress: () => {
          setSelectedId(option.id);
        },
      })),
    [options, selectedId],
  );

  return {
    actions,
    canContinue: selectedId != null,
    continueWithLayout,
    skipWithDefaultLayout,
  };
}
