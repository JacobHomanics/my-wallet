function collectMessages(error: unknown, parts: string[], depth: number): void {
  if (error == null || depth > 5) {
    return;
  }

  if (typeof error === 'string') {
    parts.push(error);
    return;
  }

  if (typeof error !== "object") {
    return;
  }

  const record = error as Record<string, unknown>;
  if (typeof record.message === "string") {
    parts.push(record.message);
  }
  if (typeof record.details === "string") {
    parts.push(record.details);
  }
  if (typeof record.shortMessage === "string") {
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
  return parts.join(" — ").toLowerCase();
}

export function isInFlightDelegatedLimitError(error: unknown): boolean {
  return getEvmSendErrorText(error).includes(
    "in-flight transaction limit reached for delegated accounts",
  );
}

export function isRetryableEvmSendError(error: unknown): boolean {
  const lower = getEvmSendErrorText(error);
  return (
    isInFlightDelegatedLimitError(error) ||
    lower.includes("replacement transaction underpriced") ||
    lower.includes("already known") ||
    lower.includes("nonce too low")
  );
}

/** Transient earn-deposit failures worth retrying after a short wait. */
export function isRetryableAutoDepositError(error: unknown): boolean {
  const lower = getEvmSendErrorText(error);
  return (
    isRetryableEvmSendError(error) ||
    lower.includes("insufficient balance") ||
    lower.includes("insufficient funds") ||
    lower.includes("still pending") ||
    lower.includes("still processing")
  );
}
