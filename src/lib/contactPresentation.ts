import type { ContactListItem } from '@/hooks/useContacts';
import type { IdentityBadgeKind } from '@/lib/identityProtocols';

export function getContactIdentityBadge(
  contact: Pick<
    ContactListItem,
    | 'isFarcaster'
    | 'isEns'
    | 'isBasename'
    | 'isLens'
    | 'isSns'
    | 'isNostr'
  >,
): IdentityBadgeKind | null {
  if (contact.isFarcaster) return 'farcaster';
  if (contact.isEns) return 'ens';
  if (contact.isBasename) return 'basename';
  if (contact.isLens) return 'lens';
  if (contact.isSns) return 'sns';
  if (contact.isNostr) return 'nostr';
  return null;
}

export function isPlatformContact(
  contact: Pick<
    ContactListItem,
    | 'isFarcaster'
    | 'isEns'
    | 'isBasename'
    | 'isLens'
    | 'isSns'
    | 'isNostr'
  >,
): boolean {
  return getContactIdentityBadge(contact) != null;
}
