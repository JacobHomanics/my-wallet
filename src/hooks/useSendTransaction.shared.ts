import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';

export type SendTokenParams = {
  token: OwnedToken;
  recipient: string;
  amountRaw: bigint;
  /**
   * Explicit EVM nonce (hex). Required for back-to-back same-network sends so
   * Privy/viem don't reuse a pending nonce ("replacement transaction underpriced").
   */
  nonce?: `0x${string}`;
  /** Privy gas sponsorship — app pays network fees when true. */
  sponsor?: boolean;
};

export type SendTokenResult = {
  hash: string;
  chain: 'ethereum' | 'solana';
};

export type SendTransactionResult = {
  ready: boolean;
  sending: boolean;
  send: (params: SendTokenParams) => Promise<SendTokenResult>;
  /**
   * Simulates every leg (non-gas first) and throws if any would fail.
   * Does not broadcast.
   */
  simulatePayment: (
    legs: SendTokenParams[],
    gasSponsored?: boolean,
  ) => Promise<void>;
};
