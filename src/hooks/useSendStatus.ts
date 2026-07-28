import { useCallback, useState } from 'react';

/**
 * In-screen send error state (Alert is unreliable on react-native-web).
 */
export function useSendStatus() {
  const [error, setErrorState] = useState<string | null>(null);

  const clearStatus = useCallback(() => {
    setErrorState(null);
  }, []);

  const setError = useCallback((message: string) => {
    setErrorState(message);
  }, []);

  return {
    error,
    clearStatus,
    setError,
  };
}
