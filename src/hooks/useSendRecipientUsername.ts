import { useQuery } from 'convex/react';

import { useSendDraft } from '@/hooks/useSendDraft';
import { api } from '../../convex/_generated/api';

/**
 * Recipient username from the send draft, or looked up by account number.
 */
export function useSendRecipientUsername(): string | null {
  const { accountNumber, recipientUsername } = useSendDraft();
  const trimmedIdentity = accountNumber.trim();

  const user = useQuery(
    api.users.getByIdentityId,
    !recipientUsername && trimmedIdentity
      ? { identityId: trimmedIdentity }
      : 'skip',
  );

  if (recipientUsername?.trim()) {
    return recipientUsername.trim().replace(/^@/, '');
  }

  const lookedUp =
    typeof user?.username === 'string' ? user.username.trim() : '';
  return lookedUp || null;
}
