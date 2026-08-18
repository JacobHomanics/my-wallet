import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type BalanceSkeletonProps = {
  accessibilityLabel?: string;
};

/**
 * Placeholder for the home-screen total balance while wallets/balances load.
 */
export function BalanceSkeleton({
  accessibilityLabel = 'Loading balance',
}: BalanceSkeletonProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={styles.row}
    >
      <Animated.View style={[styles.amount, { opacity }]} />
      <Animated.View style={[styles.help, { opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  amount: {
    width: 220,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#bbf7d0',
  },
  help: {
    width: 22,
    height: 22,
    marginTop: 4,
    borderRadius: 11,
    backgroundColor: '#bbf7d0',
  },
});
