import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/theme/types';

export type HomeActionButtonSize = 'default' | 'large';

const BUTTON_SIZES = {
  default: {
    button: 72,
    icon: 28,
    radius: 14,
    label: 13,
    lineHeight: 16,
    gap: 8,
  },
  large: {
    button: 120,
    icon: 48,
    radius: 22,
    label: 16,
    lineHeight: 20,
    gap: 12,
  },
} as const;

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
  size?: HomeActionButtonSize;
  selected?: boolean;
};

/**
 * Square home action tile: icon in the block, label underneath like a tab item.
 */
export function HomeActionButton({
  label,
  onPress,
  icon,
  size = 'default',
  selected,
}: HomeActionButtonProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const metrics = BUTTON_SIZES[size];
  const iconColor = colors.primaryText;
  const showSelection = selected !== undefined;

  const tile = (
    <View
      style={[
        styles.button,
        {
          width: metrics.button,
          height: metrics.button,
          borderRadius: metrics.radius,
        },
      ]}
    >
      {icon.set === 'material' ? (
        <MaterialCommunityIcons
          name={icon.name}
          size={metrics.icon}
          color={iconColor}
        />
      ) : (
        <Ionicons name={icon.name} size={metrics.icon} color={iconColor} />
      )}
    </View>
  );

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={showSelection ? { selected } : undefined}
      onPress={onPress}
      style={(pressState) => {
        const hovered =
          'hovered' in pressState && Boolean(pressState.hovered);
        return [
          styles.wrap,
          { gap: metrics.gap },
          hovered && styles.wrapHovered,
          pressState.pressed && styles.wrapPressed,
        ];
      }}
    >
      {showSelection ? (
        <View
          style={[
            styles.buttonRing,
            { borderRadius: metrics.radius + 6 },
            selected && styles.buttonRingSelected,
          ]}
        >
          {tile}
        </View>
      ) : (
        tile
      )}
      <Text
        style={[
          styles.label,
          { fontSize: metrics.label, lineHeight: metrics.lineHeight },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
    },
    wrapHovered: {
      opacity: 0.92,
    },
    wrapPressed: {
      opacity: 0.85,
    },
    buttonRing: {
      padding: 4,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    buttonRingSelected: {
      borderColor: c.primary,
    },
    button: {
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      color: c.text,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}
