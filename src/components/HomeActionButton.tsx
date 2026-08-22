import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/theme/types';

const ICON_SIZE = 28;

export type HomeActionIcon =
  | {
    set?: 'ionicons';
    name: ComponentProps<typeof Ionicons>['name'];
  }
  | {
    set: 'material';
    name: ComponentProps<typeof MaterialCommunityIcons>['name'];
  };

type HomeActionButtonProps = {
  label: string;
  onPress: () => void;
  icon: HomeActionIcon;
};

/**
 * Square home action tile: icon in the block, label underneath like a tab item.
 */
export function HomeActionButton({
  label,
  onPress,
  icon,
}: HomeActionButtonProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const iconColor = colors.primaryText;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={(pressState) => {
        const hovered =
          'hovered' in pressState && Boolean(pressState.hovered);
        return [
          styles.wrap,
          hovered && styles.wrapHovered,
          pressState.pressed && styles.wrapPressed,
        ];
      }}
    >
      <View style={styles.button}>
        {icon.set === 'material' ? (
          <MaterialCommunityIcons
            name={icon.name}
            size={ICON_SIZE}
            color={iconColor}
          />
        ) : (
          <Ionicons name={icon.name} size={ICON_SIZE} color={iconColor} />
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      gap: 8,
    },
    wrapHovered: {
      opacity: 0.92,
    },
    wrapPressed: {
      opacity: 0.85,
    },
    button: {
      width: 72,
      height: 72,
      borderRadius: 14,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      color: c.text,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 16,
      textAlign: 'center',
    },
  });
}
