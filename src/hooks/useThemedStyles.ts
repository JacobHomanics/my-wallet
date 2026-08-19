import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/theme/types';

function isRegisteredStyleSheet<T extends StyleSheet.NamedStyles<T>>(
  styles: T | StyleSheet.NamedStyles<T>,
): styles is T {
  const first = Object.values(styles)[0];
  return typeof first === 'number';
}

export function useThemedStyles<T>(
  factory: (colors: ThemeColors) => T,
): T {
  const colors = useThemeColors();
  return useMemo(() => {
    const styles = factory(colors);
    if (isRegisteredStyleSheet(styles as StyleSheet.NamedStyles<T>)) {
      return styles;
    }
    return StyleSheet.create(styles as StyleSheet.NamedStyles<T>) as T;
  }, [colors, factory]);
}
