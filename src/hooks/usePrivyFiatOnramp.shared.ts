export type PrivyFiatOnrampStatus = 'submitted' | 'confirmed';

export type UsePrivyFiatOnrampResult = {
  isAvailable: boolean;
  isFunding: boolean;
  status: PrivyFiatOnrampStatus | null;
  error: string | null;
  startFund: () => Promise<PrivyFiatOnrampStatus | null>;
};
