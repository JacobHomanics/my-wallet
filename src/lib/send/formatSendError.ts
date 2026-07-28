/**
 * Maps send / simulation failures to a short user-facing message.
 */
export function formatSendError(_error: unknown): string {
  return 'There was an error. Please try again later.';
}
