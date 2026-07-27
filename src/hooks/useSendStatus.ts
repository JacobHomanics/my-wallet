import { useCallback, useState } from 'react';

export type SendSuccessStatus = {
  kind: 'success';
  hash: string;
  amount: string;
  symbol: string;
};

export type SendErrorStatus = {
  kind: 'error';
  message: string;
};

export type SendStatus = SendSuccessStatus | SendErrorStatus | null;

/**
 * In-screen send outcome (Alert is unreliable on react-native-web).
 */
export function useSendStatus() {
  const [status, setStatus] = useState<SendStatus>(null);

  const clearStatus = useCallback(() => {
    setStatus(null);
  }, []);

  const setSuccess = useCallback(
    (input: Omit<SendSuccessStatus, 'kind'>) => {
      setStatus({ kind: 'success', ...input });
    },
    [],
  );

  const setError = useCallback((message: string) => {
    setStatus({ kind: 'error', message });
  }, []);

  return {
    status,
    clearStatus,
    setSuccess,
    setError,
  };
}
