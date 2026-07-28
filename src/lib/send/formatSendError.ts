/**
 * Unwraps Privy / viem / Solana RPC errors into a short user-facing message.
 */
export function formatSendError(error: unknown): string {
  const parts: string[] = [];
  collectMessages(error, parts, 0);

  const joined = parts.join(' — ');
  const lower = joined.toLowerCase();

  if (
    lower.includes('insufficient funds') ||
    lower.includes('insufficient lamports') ||
    lower.includes('gas required exceeds allowance') ||
    lower.includes('exceeds the balance')
  ) {
    // Prefer our preflight messages when present.
    const specific = parts.find(
      (part) =>
        /not enough sol/i.test(part) ||
        /token account/i.test(part) ||
        /not enough eth/i.test(part) ||
        /not enough native/i.test(part),
    );
    if (specific) {
      return specific;
    }
    return 'Insufficient funds for this transfer after network fees.';
  }

  if (
    lower.includes('transaction simulation failed') ||
    lower === 'simulation failed'
  ) {
    const detail = parts.find(
      (part) =>
        !/^transaction simulation failed$/i.test(part.trim()) &&
        !/^simulation failed$/i.test(part.trim()),
    );
    if (detail) {
      return `Transaction simulation failed: ${detail}`;
    }
    return 'Transaction simulation failed.';
  }

  return parts[0] || 'Transaction failed';
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
