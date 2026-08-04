import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Slow looping progress (0→1) for holographic foil shimmer sweeps.
 */
export function useHoloShimmer(durationMs = 2800) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [durationMs, progress]);

  return progress;
}
