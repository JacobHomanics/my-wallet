function collectMessages(error: unknown, parts: string[], depth: number): void {
  if (error == null || depth > 5) {
    return;
  }

  if (typeof error === 'string') {
    parts.push(error);
    return;
  }

  if (typeof error !== 'object') {
    return;
  }

  const record = error as Record<string, unknown>;
  if (typeof record.message === 'string') {
    parts.push(record.message);
  }
  if (typeof record.details === 'string') {
    parts.push(record.details);
  }
  if (typeof record.shortMessage === 'string') {
    parts.push(record.shortMessage);
  }

  if (record.cause != null) {
    collectMessages(record.cause, parts, depth + 1);
  }
  if (record.error != null) {
    collectMessages(record.error, parts, depth + 1);
  }
}

export function getEvmSendErrorText(error: unknown): string {
  const parts: string[] = [];
  collectMessages(error, parts, 0);
  return parts.join(' — ').toLowerCase();
}

/** Base / EIP-7702 delegated wallets allow one pending tx at a time. */
export function isInFlightDelegatedLimitError(error: unknown): boolean {
  return getEvmSendErrorText(error).includes(
    'in-flight transaction limit reached for delegated accounts',
  );
}

/** Transient send failures that are safe to retry after waiting. */
export function isRetryableEvmSendError(error: unknown): boolean {
  const lower = getEvmSendErrorText(error);
  return (
    isInFlightDelegatedLimitError(error) ||
    lower.includes('replacement transaction underpriced') ||
    lower.includes('already known') ||
    lower.includes('nonce too low')
  );
}
