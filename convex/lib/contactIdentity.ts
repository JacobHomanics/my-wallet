import type { Doc } from "../_generated/dataModel";

export type ContactIdentityKind =
  | "farcaster"
  | "ens"
  | "basename"
  | "lens"
  | "sns"
  | "nostr";

export type ContactIdentityFlags = {
  isFarcaster: boolean;
  isEns: boolean;
  isBasename: boolean;
  isLens: boolean;
  isSns: boolean;
  isNostr: boolean;
};

export type ContactIdentityView = ContactIdentityFlags & {
  username: string | null;
  profilePhotoUrl: string | null;
  isExternal: boolean;
};

export function getContactIdentityFlags(
  contact: Doc<"contacts">,
): ContactIdentityFlags {
  return {
    isFarcaster: contact.farcasterFid != null,
    isEns: Boolean(contact.ensName?.trim()),
    isBasename: Boolean(contact.basename?.trim()),
    isLens: Boolean(contact.lensAccount?.trim()),
    isSns: Boolean(contact.snsDomain?.trim()),
    isNostr: Boolean(contact.nostrPubkey?.trim()),
  };
}

export function getContactIdentityView(
  contact: Doc<"contacts">,
  userProfile?: {
    username: string | null;
    identityId: string | null;
    profilePhotoUrl: string | null;
  },
): ContactIdentityView {
  const flags = getContactIdentityFlags(contact);
  const hasPlatformIdentity = Object.values(flags).some(Boolean);

  if (contact.contactUserId && userProfile) {
    return {
      ...flags,
      username: userProfile.username,
      profilePhotoUrl: userProfile.profilePhotoUrl,
      isExternal: false,
    };
  }

  if (flags.isFarcaster) {
    return {
      ...flags,
      username: contact.farcasterUsername ?? null,
      profilePhotoUrl: contact.farcasterPfpUrl ?? null,
      isExternal: false,
    };
  }

  if (flags.isEns) {
    return {
      ...flags,
      username: null,
      profilePhotoUrl: contact.ensAvatarUrl ?? null,
      isExternal: false,
    };
  }

  if (flags.isBasename) {
    return {
      ...flags,
      username: contact.basename ?? null,
      profilePhotoUrl: contact.basenameAvatarUrl ?? null,
      isExternal: false,
    };
  }

  if (flags.isLens) {
    return {
      ...flags,
      username: contact.lensHandle ?? null,
      profilePhotoUrl: contact.lensAvatarUrl ?? null,
      isExternal: false,
    };
  }

  if (flags.isSns) {
    return {
      ...flags,
      username: contact.snsDomain ?? null,
      profilePhotoUrl: null,
      isExternal: false,
    };
  }

  if (flags.isNostr) {
    return {
      ...flags,
      username: contact.nostrNip05 ?? null,
      profilePhotoUrl: contact.nostrAvatarUrl ?? null,
      isExternal: false,
    };
  }

  return {
    ...flags,
    username: null,
    profilePhotoUrl: null,
    isExternal: !contact.contactUserId && !hasPlatformIdentity,
  };
}
