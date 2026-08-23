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
    badge: 16,
    radius: 14,
    label: 13,
    lineHeight: 16,
    gap: 8,
  },
  large: {
    button: 120,
    icon: 48,
    badge: 24,
    radius: 22,
    label: 16,
    lineHeight: 20,
    gap: 12,
  },
} as const;

export type HomeActionGlyph =
  | {
    set?: 'ionicons';
    name: ComponentProps<typeof Ionicons>['name'];
  }
  | {
    set: 'material';
    name: ComponentProps<typeof MaterialCommunityIcons>['name'];
  };

export type HomeActionIcon = HomeActionGlyph & {
  badge?: HomeActionGlyph;
};

type HomeActionButtonProps = {
  label: string;
  onPress: () => void;
  icon: HomeActionIcon;
  size?: HomeActionButtonSize;
  selected?: boolean;
};

function ActionGlyph({
  glyph,
  size,
  color,
}: {
  glyph: HomeActionGlyph;
  size: number;
  color: string;
}) {
  if (glyph.set === 'material') {
    return (
      <MaterialCommunityIcons
        name={glyph.name}
        size={size}
        color={color}
      />
    );
  }

  return <Ionicons name={glyph.name} size={size} color={color} />;
}

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
      <View
        style={[
          styles.iconCluster,
          { width: metrics.icon, height: metrics.icon },
        ]}
      >
        <ActionGlyph color={iconColor} glyph={icon} size={metrics.icon} />
        {icon.badge ? (
          <View
            style={[
              styles.badge,
              {
                width: metrics.badge,
                height: metrics.badge,
                borderRadius: metrics.badge / 2,
              },
            ]}
          >
            <ActionGlyph
              color={iconColor}
              glyph={icon.badge}
              size={Math.round(metrics.badge * 0.88)}
            />
          </View>
        ) : null}
      </View>
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
      overflow: 'visible',
    },
    iconCluster: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      right: -6,
      bottom: -6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    label: {
      color: c.text,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}
