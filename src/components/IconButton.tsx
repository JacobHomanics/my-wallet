import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

type IconButtonProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  size?: number;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Circular icon button used for header actions, help, copy, and close controls.
 */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  disabled = false,
  size = 44,
  iconSize,
  color,
  backgroundColor,
  hitSlop = 8,
  style,
}: IconButtonProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const glyphSize = iconSize ?? Math.max(18, Math.round(size * 0.5));

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={() => {
        if (disabled) {
          return;
        }
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor ?? colors.surfaceMuted,
        },
        style,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Ionicons
        name={icon}
        size={glyphSize}
        color={color ?? colors.primary}
      />
    </Pressable>
  );
}

function createStyles(_c: ThemeColors) {
  return StyleSheet.create({
    button: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPressed: {
      opacity: 0.76,
    },
    buttonDisabled: {
      opacity: 0.45,
    },
  });
}
