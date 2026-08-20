export type Tier1ProtocolId =
  | 'basename'
  | 'lens'
  | 'sns'
  | 'nostr';

export type IdentityBadgeKind =
  | 'farcaster'
  | 'ens'
  | Tier1ProtocolId;

export type Tier1ProtocolConfig = {
  id: Tier1ProtocolId;
  title: string;
  placeholder: string;
  hint: string;
  emptyMessage: string;
  mode: 'resolve' | 'search';
  badgeColor: string;
  group: 'names' | 'social';
};

export const TIER1_PROTOCOLS: Record<Tier1ProtocolId, Tier1ProtocolConfig> = {
  basename: {
    id: 'basename',
    title: 'Basename',
    placeholder: 'name or name.base.eth',
    hint: 'Resolve a Basename on Base to add them.',
    emptyMessage: 'No Basename found.',
    mode: 'resolve',
    badgeColor: '#0052FF',
    group: 'names',
  },
  lens: {
    id: 'lens',
    title: 'Lens',
    placeholder: 'Lens handle',
    hint: 'Search Lens handles to add them.',
    emptyMessage: 'No Lens users found.',
    mode: 'search',
    badgeColor: '#008000',
    group: 'social',
  },
  sns: {
    id: 'sns',
    title: 'SNS',
    placeholder: 'name or name.sol',
    hint: 'Resolve a Solana Name Service domain to add them.',
    emptyMessage: 'No SNS domain found.',
    mode: 'resolve',
    badgeColor: '#9945FF',
    group: 'names',
  },
  nostr: {
    id: 'nostr',
    title: 'Nostr',
    placeholder: 'user@domain (NIP-05)',
    hint: 'Resolve a NIP-05 profile with a wallet address in metadata.',
    emptyMessage: 'No Nostr profile found.',
    mode: 'resolve',
    badgeColor: '#8B5CF6',
    group: 'social',
  },
};

export const TIER1_PROTOCOL_LIST = Object.values(TIER1_PROTOCOLS);

export function isTier1ProtocolId(value: string): value is Tier1ProtocolId {
  return value in TIER1_PROTOCOLS;
}

export function formatIdentityLabel(
  kind: IdentityBadgeKind,
  label: string,
): string {
  if (kind === 'ens') {
    return label;
  }
  if (label.startsWith('@')) {
    return label;
  }
  if (kind === 'lens') {
    return `@lens/${label.replace(/^lens\//i, '')}`;
  }
  if (kind === 'basename' || kind === 'sns' || kind === 'nostr') {
    return label.includes('.') || kind === 'nostr' ? label : `@${label}`;
  }
  return `@${label}`;
}
