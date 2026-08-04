import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { useHoloShimmer } from '@/hooks/useHoloShimmer';

type HoloTapGentlyButtonProps = {
  accessibilityLabel: string;
  onPress: () => void;
};

const WIDTH = 148;
const HEIGHT = 28;

/**
 * Iridescent foil sticker that invites a light tap — used to export a private key.
 */
export function HoloTapGentlyButton({
  accessibilityLabel,
  onPress,
}: HoloTapGentlyButtonProps) {
  const shimmer = useHoloShimmer();
  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-WIDTH, WIDTH * 1.4],
  });

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressablePressed,
      ]}
    >
      <View style={styles.foil}>
        <Svg height={HEIGHT} style={StyleSheet.absoluteFill} width={WIDTH}>
          <Defs>
            <LinearGradient id="holoBase" x1="0%" x2="100%" y1="0%" y2="100%">
              <Stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.95" />
              <Stop offset="22%" stopColor="#e9d5ff" stopOpacity="0.9" />
              <Stop offset="45%" stopColor="#fde68a" stopOpacity="0.95" />
              <Stop offset="68%" stopColor="#86efac" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.95" />
            </LinearGradient>
          </Defs>
          <Rect
            fill="url(#holoBase)"
            height={HEIGHT}
            rx={7}
            ry={7}
            width={WIDTH}
          />
        </Svg>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerX }, { skewX: '-18deg' }],
            },
          ]}
        >
          <Svg height={HEIGHT} width={36}>
            <Defs>
              <LinearGradient
                id="holoSweep"
                x1="0%"
                x2="100%"
                y1="0%"
                y2="0%"
              >
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <Stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
                <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect fill="url(#holoSweep)" height={HEIGHT} width={36} />
          </Svg>
        </Animated.View>

        <View style={styles.labelWrap} pointerEvents="none">
          <Text style={styles.label}>tap gently - private key</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 8,
  },
  pressablePressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  foil: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#67e8f9',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  shimmer: {
    ...StyleSheet.absoluteFill,
    width: 36,
  },
  labelWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#0f172a',
    textTransform: 'lowercase',
  },
});
