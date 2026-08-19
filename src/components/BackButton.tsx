import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {StyleSheet,  Pressable } from 'react-native';

import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import type { RootStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

type BackButtonProps = {
  onPress?: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
};

export function BackButton({
  onPress,
  accessibilityLabel = 'Go back',
  disabled = false,
}: BackButtonProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDesktopWeb = useIsDesktopWeb();

  if (isDesktopWeb) {
    return null;
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={12}
      onPress={() => {
        if (disabled) {
          return;
        }
        if (onPress) {
          onPress();
          return;
        }
        navigation.goBack();
      }}
      style={({ pressed }) => [
        styles.backButton,
        pressed && !disabled && styles.backButtonPressed,
        disabled && styles.backButtonDisabled,
      ]}
    >
      <Ionicons name="chevron-back" size={28} color={colors.primary} />
    </Pressable>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.76,
  },
  backButtonDisabled: {
    opacity: 0.45,
  },
});
}
