/**
 * Process-wide lock so two payment flows cannot broadcast EVM txs concurrently
 * and hit the delegated-account in-flight limit.
 */
let sendPromise: Promise<unknown> | null = null;

export function runExclusiveSend<T>(task: () => Promise<T>): Promise<T> {
  if (sendPromise) {
    return sendPromise as Promise<T>;
  }

  sendPromise = (async () => {
    try {
      return await task();
    } finally {
      sendPromise = null;
    }
  })();

  return sendPromise as Promise<T>;
}
