import { useEffect, useSyncExternalStore } from 'react';

import type { SendableContact } from '@/hooks/useSendToContact';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import type { IdentityBadgeKind } from '@/lib/identityProtocols';
import {
  readPersistedJson,
  writePersistedJson,
} from '@/lib/persistedJsonStorage';

const STORAGE_KEY = 'recentSendRecipients';
const MAX_RECENTS = 10;

export type RecentSendRecipient = SendableContact & {
  id: string;
  label: string;
  subtitle: string | null;
  identityBadge: IdentityBadgeKind | null;
  lastUsedAt: number;
};

type RecentSendRecipientListener = () => void;

let recents: RecentSendRecipient[] = [];
let hydrated = false;
let hydrateStarted = false;
const listeners = new Set<RecentSendRecipientListener>();

function subscribe(listener: RecentSendRecipientListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  listeners.forEach((listener) => {
    listener();
  });
}

function getSnapshot(): RecentSendRecipient[] {
  return recents;
}

async function hydrateRecents(): Promise<void> {
  if (hydrated) {
    return;
  }
  hydrated = true;
  recents =
    (await readPersistedJson<RecentSendRecipient[]>(STORAGE_KEY)) ?? [];
  notify();
}

function startHydrate(): void {
  if (hydrateStarted) {
    return;
  }
  hydrateStarted = true;
  void hydrateRecents();
}

function identitySubtitle(identityId: string): string {
  return `Account ${formatWalletAddress(identityId, 6, 4)}`;
}

function recentRecipientId(contact: SendableContact): string | null {
  const identityId = contact.identityId?.trim();
  if (identityId) {
    return `identity:${identityId}`;
  }

  const evm = contact.evmAddress?.trim().toLowerCase() ?? null;
  const sol = contact.solanaAddress?.trim() ?? null;
  if (evm && sol) {
    return `wallets:${evm}:${sol}`;
  }
  if (evm) {
    return `evm:${evm}`;
  }
  if (sol) {
    return `sol:${sol}`;
  }

  return null;
}

function resolveIdentityBadge(
  contact: SendableContact,
): IdentityBadgeKind | null {
  if (contact.identityBadge) {
    return contact.identityBadge;
  }
  if (contact.isFarcaster) {
    return 'farcaster';
  }
  if (contact.isEns) {
    return 'ens';
  }
  if (contact.isBasename) {
    return 'basename';
  }
  if (contact.isLens) {
    return 'lens';
  }
  if (contact.isSns) {
    return 'sns';
  }
  if (contact.isNostr) {
    return 'nostr';
  }
  return null;
}

function displayForRecent(contact: SendableContact): {
  label: string;
  subtitle: string | null;
} {
  const username = contact.username?.trim().replace(/^@/, '') || null;
  const name = contact.name?.trim() || null;
  const identityId = contact.identityId?.trim() || null;
  const evm = contact.evmAddress?.trim() || null;
  const sol = contact.solanaAddress?.trim() || null;

  if (username) {
    return {
      label: `@${username}`,
      subtitle: identityId ? identitySubtitle(identityId) : null,
    };
  }

  if (name) {
    return {
      label: name,
      subtitle:
        identityId != null
          ? identitySubtitle(identityId)
          : evm != null
            ? formatWalletAddress(evm, 6, 4)
            : sol != null
              ? formatWalletAddress(sol, 6, 4)
              : null,
    };
  }

  if (identityId) {
    return {
      label: formatWalletAddress(identityId, 10, 8),
      subtitle: null,
    };
  }

  if (evm && sol) {
    return {
      label: `${formatWalletAddress(evm, 6, 4)} · ${formatWalletAddress(sol, 6, 4)}`,
      subtitle: null,
    };
  }

  if (evm) {
    return { label: formatWalletAddress(evm, 6, 4), subtitle: null };
  }

  if (sol) {
    return { label: formatWalletAddress(sol, 6, 4), subtitle: null };
  }

  return { label: 'Recipient', subtitle: null };
}

function toRecentSendRecipient(contact: SendableContact): RecentSendRecipient | null {
  const id = recentRecipientId(contact);
  if (id == null) {
    return null;
  }

  const { label, subtitle } = displayForRecent(contact);
  return {
    id,
    identityId: contact.identityId?.trim() || null,
    evmAddress: contact.evmAddress?.trim() || null,
    solanaAddress: contact.solanaAddress?.trim() || null,
    username: contact.username?.trim().replace(/^@/, '') || null,
    name: contact.name?.trim() || null,
    profilePhotoUrl: contact.profilePhotoUrl?.trim() || null,
    isFarcaster: contact.isFarcaster === true,
    isEns: contact.isEns === true,
    identityBadge: resolveIdentityBadge(contact),
    label,
    subtitle,
    lastUsedAt: Date.now(),
  };
}

function persistRecents(next: RecentSendRecipient[]): void {
  recents = next;
  notify();
  void writePersistedJson(STORAGE_KEY, next);
}

export function addRecentSendRecipient(contact: SendableContact): void {
  startHydrate();

  const entry = toRecentSendRecipient(contact);
  if (entry == null) {
    return;
  }

  const withoutDuplicate = recents.filter((item) => item.id !== entry.id);
  persistRecents([entry, ...withoutDuplicate].slice(0, MAX_RECENTS));
}

/**
 * Recently chosen send recipients, persisted locally for quick re-selection.
 */
export function useRecentSendRecipients(): {
  recents: RecentSendRecipient[];
  ready: boolean;
} {
  useEffect(() => {
    startHydrate();
  }, []);

  const list = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    recents: list,
    ready: hydrated,
  };
}
