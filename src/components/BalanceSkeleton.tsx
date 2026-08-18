import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type BalanceSkeletonProps = {
  accessibilityLabel?: string;
};

const AMOUNT_WIDTH = 168;

/**
 * Placeholder for the home-screen total balance while wallets/balances load.
 */
export function BalanceSkeleton({
  accessibilityLabel = 'Loading balance',
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
      style={styles.row}
    >
      <Animated.View style={[styles.amount, { opacity: amountOpacity }]} />
    </View>
  );
}

export const balanceSkeletonLayout = {
  width: AMOUNT_WIDTH,
  height: 48,
} as const;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    width: AMOUNT_WIDTH,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#166534',
  },
});
