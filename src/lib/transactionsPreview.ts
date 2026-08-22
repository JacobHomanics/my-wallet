import type { WalletTransaction } from '@/lib/alchemy/fetchWalletTransactions';
import { getNetworkLabel } from '@/lib/alchemy/networks';

const DAY_MS = 24 * 60 * 60 * 1000;

const PREVIEW_EVM_FIANCE = '0xf1a4ce000000000000000000000000000013e37';
const PREVIEW_EVM_FRIEND = '0xbe57f0000000000000000000000000000013370';
const PREVIEW_EVM_LANDLORD = '0x1a4d10000000000000000000000000000013e37';
const PREVIEW_SOLANA_SIBLING = '51b111ng11111111111111111111111111111111';
const PREVIEW_EVM_NEIGHBOR = '0x0e1ghb00000000000000000000000000001337';

function previewTx(input: {
  id: string;
  daysAgo: number;
  usdDelta: number;
  recipients: string[];
  network: string;
}): WalletTransaction {
  return {
    id: input.id,
    timestampMs: Date.now() - input.daysAgo * DAY_MS,
    usdDelta: input.usdDelta,
    tokenAmount: input.usdDelta,
    tokenSymbol: 'USDC',
    recipients: input.recipients,
    network: input.network,
    networkLabel: getNetworkLabel(input.network),
    hash: `preview-${input.id}`,
  };
}

/** Sample history for the Transactions screen when signed out. */
export const TRANSACTIONS_PREVIEW: WalletTransaction[] = [
  previewTx({
    id: 'received-fiance',
    daysAgo: 1,
    usdDelta: 13.37,
    recipients: [PREVIEW_EVM_FIANCE],
    network: 'base-mainnet',
  }),
  previewTx({
    id: 'paid-landlord',
    daysAgo: 3,
    usdDelta: -4.2,
    recipients: [PREVIEW_EVM_LANDLORD],
    network: 'base-mainnet',
  }),
  previewTx({
    id: 'received-friend',
    daysAgo: 6,
    usdDelta: 20,
    recipients: [PREVIEW_EVM_FRIEND],
    network: 'base-mainnet',
  }),
  previewTx({
    id: 'paid-sibling',
    daysAgo: 10,
    usdDelta: -8.8,
    recipients: [PREVIEW_SOLANA_SIBLING],
    network: 'solana-mainnet',
  }),
  previewTx({
    id: 'received-neighbor',
    daysAgo: 14,
    usdDelta: 5,
    recipients: [PREVIEW_EVM_NEIGHBOR],
    network: 'base-mainnet',
  }),
];
