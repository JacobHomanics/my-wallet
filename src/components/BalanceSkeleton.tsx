import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';

type BalanceSkeletonProps = {
  accessibilityLabel?: string;
  width?: number;
  height?: number;
  style?: ViewStyle;
};

const DEFAULT_AMOUNT_WIDTH = 168;
const DEFAULT_AMOUNT_HEIGHT = 48;

/**
 * Placeholder for balance text while wallets/balances load.
 */
export function BalanceSkeleton({
  accessibilityLabel = 'Loading balance',
  width = DEFAULT_AMOUNT_WIDTH,
  height = DEFAULT_AMOUNT_HEIGHT,
  style,
}: BalanceSkeletonProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1_000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1_000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [pulse]);

  const amountOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={[styles.row, style]}
    >
      <Animated.View
        style={[
          styles.amount,
          { width, height, opacity: amountOpacity },
        ]}
      />
    </View>
  );
}

export const balanceSkeletonLayout = {
  width: DEFAULT_AMOUNT_WIDTH,
  height: DEFAULT_AMOUNT_HEIGHT,
} as const;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    borderRadius: 6,
    backgroundColor: '#166534',
  },
});
