/**
 * Process-wide lock so login verify + EnsureEmbeddedWallets cannot
 * concurrently create duplicate embedded wallets.
 */
let ensurePromise: Promise<void> | null = null;

export function runExclusiveEnsure(
  task: () => Promise<void>,
): Promise<void> {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    try {
      await task();
    } finally {
      ensurePromise = null;
    }
  })();

  return ensurePromise;
}
