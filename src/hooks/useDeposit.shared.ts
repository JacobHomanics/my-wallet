export type DepositResult = {
  deposit: () => Promise<void>;
  canDeposit: boolean;
  isDepositing: boolean;
  error: string | null;
};

/** Base mainnet USDC — default deposit destination for web add-funds. */
export const DEFAULT_DEPOSIT_CHAIN = 'eip155:8453' as const;
export const DEFAULT_DEPOSIT_ASSET =
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
