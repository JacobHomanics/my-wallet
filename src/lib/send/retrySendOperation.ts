import { isRetryableEvmSendError } from '@/lib/send/evmSendErrors';

const DEFAULT_MAX_ATTEMPTS = 6;
const DEFAULT_BASE_DELAY_MS = 800;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type RetrySendOperationOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
};

/**
 * Retries a send when Base/EIP-7702 in-flight limits or nonce races occur.
 */
export async function retrySendOperation<T>(
  operation: () => Promise<T>,
  options?: RetrySendOperationOptions,
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const shouldRetry = options?.shouldRetry ?? isRetryableEvmSendError;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      const delayMs = baseDelayMs * attempt;
      options?.onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError;
}
