import type { UserWallet } from '@/hooks/useUserWallets.shared';
import {
  RECEIVE_PREVIEW_IDENTITY_ID,
  RECEIVE_PREVIEW_USERNAME,
} from '@/lib/receivePreview';

export const PROFILE_PREVIEW_USERNAME = RECEIVE_PREVIEW_USERNAME;
export const PROFILE_PREVIEW_IDENTITY_ID = RECEIVE_PREVIEW_IDENTITY_ID;

export const PROFILE_PREVIEW_WALLETS: UserWallet[] = [
  {
    chain: 'ethereum',
    label: 'Ethereum',
    address: '0xSAMPLE0000000000000000000000000FAKE',
  },
  {
    chain: 'solana',
    label: 'Solana',
    address: 'SAMPLENotARealWallet1111111111111FAKE',
  },
];
