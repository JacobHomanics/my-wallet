import type { ContactListItem } from '@/hooks/useContacts';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import {
  RECEIVE_PREVIEW_IDENTITY_ID,
  RECEIVE_PREVIEW_USERNAME,
} from '@/lib/receivePreview';

const PREVIEW_EVM_FIANCE = '0xf1a4ce000000000000000000000000000013e37';
const PREVIEW_EVM_FRIEND = '0xbe57f0000000000000000000000000000013370';
const PREVIEW_EVM_LANDLORD = '0x1a4d10000000000000000000000000000013e37';
const PREVIEW_SOLANA_SIBLING = '51b111ng11111111111111111111111111111111';
const PREVIEW_SOLANA_NEIGHBOR = 'Ne1ghbor11111111111111111111111111111111';

function addressSubtitle(
  evmAddress: string | null,
  solanaAddress: string | null,
): string | null {
  const parts: string[] = [];
  if (evmAddress) {
    parts.push(`EVM ${formatWalletAddress(evmAddress, 6, 4)}`);
  }
  if (solanaAddress) {
    parts.push(`Solana ${formatWalletAddress(solanaAddress, 6, 4)}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

function userContact(
  id: string,
  username: string,
  evmAddress: string | null = null,
  solanaAddress: string | null = null,
  identityId: string | null = null,
): ContactListItem {
  return {
    id,
    username,
    name: null,
    evmAddress,
    solanaAddress,
    identityId,
    profilePhotoUrl: null,
    farcasterFid: null,
    farcasterUsername: null,
    ensName: null,
    label: `@${username}`,
    subtitle: addressSubtitle(evmAddress, solanaAddress),
    isExternal: false,
    isFarcaster: false,
    isEns: false,
  };
}

function farcasterContact(
  id: string,
  username: string,
  fid: number,
): ContactListItem {
  return {
    id,
    username,
    name: null,
    evmAddress: null,
    solanaAddress: null,
    identityId: null,
    profilePhotoUrl: null,
    farcasterFid: fid,
    farcasterUsername: username,
    ensName: null,
    label: `@${username}`,
    subtitle: null,
    isExternal: false,
    isFarcaster: true,
    isEns: false,
  };
}

function ensContact(id: string, ensName: string): ContactListItem {
  return {
    id,
    username: null,
    name: ensName,
    evmAddress: null,
    solanaAddress: null,
    identityId: null,
    profilePhotoUrl: null,
    farcasterFid: null,
    farcasterUsername: null,
    ensName,
    label: ensName,
    subtitle: null,
    isExternal: false,
    isFarcaster: false,
    isEns: true,
  };
}

function walletContact(
  id: string,
  name: string,
  evmAddress: string | null,
  solanaAddress: string | null,
): ContactListItem {
  return {
    id,
    username: null,
    name,
    evmAddress,
    solanaAddress,
    identityId: null,
    profilePhotoUrl: null,
    farcasterFid: null,
    farcasterUsername: null,
    ensName: null,
    label: name,
    subtitle: addressSubtitle(evmAddress, solanaAddress),
    isExternal: true,
    isFarcaster: false,
    isEns: false,
  };
}

export const CONTACTS_PREVIEW: ContactListItem[] = [
  userContact(
    'preview-best',
    RECEIVE_PREVIEW_USERNAME,
    null,
    null,
    RECEIVE_PREVIEW_IDENTITY_ID,
  ),
  userContact(
    'preview-fiance',
    'YourFiance',
    PREVIEW_EVM_FIANCE,
    null,
    'YourF1ance5amp1e',
  ),
  userContact(
    'preview-best-friend',
    'YourBestFriend',
    PREVIEW_EVM_FRIEND,
    null,
    'YourBe5tFr1end',
  ),
  userContact(
    'preview-annoying',
    'ThatAnnoyingFriend',
    null,
    null,
    '7h47Annoy1ng',
  ),
  userContact(
    'preview-roommate',
    'YourRoommate',
    null,
    null,
    'YourR00mma7e',
  ),
  farcasterContact('preview-fc-coworker', 'YourCoworker', 1337),
  farcasterContact('preview-fc-groupchat', 'ThatGroupChatAdmin', 420),
  ensContact('preview-ens-fiance', 'yourfiance.eth'),
  ensContact('preview-ens-best-friend', 'yourbestfriend.eth'),
  walletContact(
    'preview-wallet-evm',
    'YourLandlord',
    PREVIEW_EVM_LANDLORD,
    null,
  ),
  walletContact(
    'preview-wallet-solana',
    'YourSibling',
    null,
    PREVIEW_SOLANA_SIBLING,
  ),
  walletContact(
    'preview-wallet-multi',
    'ThatOneNeighbor',
    PREVIEW_EVM_LANDLORD,
    PREVIEW_SOLANA_NEIGHBOR,
  ),
];
