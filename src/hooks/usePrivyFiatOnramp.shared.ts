export type PrivyFiatOnrampStatus = 'submitted' | 'confirmed';

/** Outcome of `startFund`, including user cancel. */
export type PrivyFiatOnrampOutcome = PrivyFiatOnrampStatus | 'exited';

export type UsePrivyFiatOnrampResult = {
  isAvailable: boolean;
  isFunding: boolean;
  status: PrivyFiatOnrampStatus | null;
  error: string | null;
  startFund: () => Promise<PrivyFiatOnrampOutcome | null>;
};

/** Privy rejects with this when the user closes the fiat onramp modal. */
export function isPrivyFiatOnrampUserExit(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? '');
  return /user exited flow|user cancelled funding/i.test(message);
}
