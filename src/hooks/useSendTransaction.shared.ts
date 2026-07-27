import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';

export type SendTokenParams = {
  token: OwnedToken;
  recipient: string;
  amountRaw: bigint;
};

export type SendTokenResult = {
  hash: string;
  chain: 'ethereum' | 'solana';
};

export type SendTransactionResult = {
  ready: boolean;
  sending: boolean;
  send: (params: SendTokenParams) => Promise<SendTokenResult>;
};
