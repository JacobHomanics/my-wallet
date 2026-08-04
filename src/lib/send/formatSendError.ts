/**
 * Maps send / simulation failures to a short user-facing message.
 * Prefer our preflight copy; keep opaque Privy/RPC noise generic.
 */
export function formatSendError(error: unknown): string {
  const parts: string[] = [];
  collectMessages(error, parts, 0);

  const joined = parts.join(' — ');
  const lower = joined.toLowerCase();

  const actionable = parts.find(
    (part) =>
      /^cannot send /i.test(part) ||
      /not enough (eth|sol)\b/i.test(part) ||
      /needs more sol for network fees/i.test(part) ||
      /token transfer would fail/i.test(part) ||
      /recipient address is invalid/i.test(part) ||
      /no ethereum wallet/i.test(part) ||
      /no solana wallet/i.test(part) ||
      /nothing to send/i.test(part),
  );
  if (actionable) {
    return actionable;
  }

  if (
    lower.includes('insufficient funds') ||
    lower.includes('insufficient lamports') ||
    lower.includes('gas required exceeds allowance') ||
    lower.includes('exceeds the balance')
  ) {
    return 'Insufficient funds for this transfer after network fees.';
  }

  if (
    lower.includes('transaction simulation failed') ||
    lower === 'simulation failed'
  ) {
    return 'Transaction simulation failed. Try a slightly smaller amount.';
  }

  if (
    lower.includes('replacement transaction underpriced') ||
    lower.includes('already known') ||
    lower.includes('nonce too low')
  ) {
    return 'A previous transfer on this network is still confirming. Please wait a moment and try again.';
  }

  return 'There was an error. Please try again later.';
}

function collectMessages(
  error: unknown,
  parts: string[],
  depth: number,
): void {
  if (error == null || depth > 5) {
    return;
  }

  if (typeof error === 'string') {
    pushUnique(parts, error);
    return;
  }

  if (typeof error !== 'object') {
    return;
  }

  const record = error as Record<string, unknown>;
  if (typeof record.message === 'string') {
    pushUnique(parts, record.message);
  }
  if (typeof record.details === 'string') {
    pushUnique(parts, record.details);
  }
  if (typeof record.shortMessage === 'string') {
    pushUnique(parts, record.shortMessage);
  }

  if (record.cause != null) {
    collectMessages(record.cause, parts, depth + 1);
  }
  if (record.error != null) {
    collectMessages(record.error, parts, depth + 1);
  }
  if (Array.isArray(record.logs)) {
    for (const log of record.logs) {
      if (typeof log === 'string' && /error|insufficient|failed/i.test(log)) {
        pushUnique(parts, log);
      }
    }
  }
}

function pushUnique(parts: string[], message: string): void {
  const trimmed = message.trim();
  if (!trimmed) {
    return;
  }
  if (parts.some((part) => part === trimmed || part.includes(trimmed))) {
    return;
  }
  parts.push(trimmed);
}
