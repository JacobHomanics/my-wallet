import { useEffect, useEffectEvent } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

const DEFAULT_POLL_INTERVAL_MS = 5_000;

/**
 * Silently refetches balances on an interval while the screen is focused and
 * the app is in the foreground.
 */
export function usePollTokenBalances(
  poll: () => void,
  options?: {
    enabled?: boolean;
    intervalMs?: number;
  },
) {
  const isFocused = useIsFocused();
  const enabled = options?.enabled ?? true;
  const intervalMs = options?.intervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const onPoll = useEffectEvent(poll);

  useEffect(() => {
    if (!enabled || !isFocused) {
      return;
    }

    const tick = () => {
      if (AppState.currentState !== 'active') {
        return;
      }
      onPoll();
    };

    const timer = setInterval(tick, intervalMs);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        tick();
      }
    };
    const subscription = AppState.addEventListener('change', onAppState);

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [enabled, intervalMs, isFocused]);
}
