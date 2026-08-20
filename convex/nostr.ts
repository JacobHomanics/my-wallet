import { v } from "convex/values";

import { action } from "./_generated/server";
import { resolveNostrNip05 } from "./lib/nostr";

/** Resolve a NIP-05 identifier to pubkey and optional EVM address. */
export const resolve = action({
  args: { nip05: v.string() },
  handler: async (_ctx, { nip05 }) => {
    const trimmed = nip05.trim();
    if (!trimmed) {
      return null;
    }
    return await resolveNostrNip05(trimmed);
  },
});
