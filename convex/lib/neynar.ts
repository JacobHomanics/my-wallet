const NEYNAR_SEARCH_URL = "https://api.neynar.com/v2/farcaster/user/search/";

export type NeynarUserHit = {
  fid: number;
  username: string;
  displayName: string | null;
  pfpUrl: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
};

type NeynarVerifiedAddresses = {
  eth_addresses?: string[];
  sol_addresses?: string[];
  primary?: {
    eth_address?: string | null;
    sol_address?: string | null;
  };
};

type NeynarUser = {
  fid?: number;
  username?: string;
  display_name?: string | null;
  pfp_url?: string | null;
  verified_addresses?: NeynarVerifiedAddresses;
};

type NeynarSearchResponse = {
  result?: {
    users?: NeynarUser[];
  };
};

function pickEvmAddress(verified: NeynarVerifiedAddresses | undefined): string | null {
  const primary = verified?.primary?.eth_address?.trim();
  if (primary) {
    return primary;
  }
  const first = verified?.eth_addresses?.[0]?.trim();
  return first || null;
}

function pickSolanaAddress(
  verified: NeynarVerifiedAddresses | undefined,
): string | null {
  const primary = verified?.primary?.sol_address?.trim();
  if (primary) {
    return primary;
  }
  const first = verified?.sol_addresses?.[0]?.trim();
  return first || null;
}

function normalizeUser(user: NeynarUser): NeynarUserHit | null {
  if (typeof user.fid !== "number" || typeof user.username !== "string") {
    return null;
  }

  const username = user.username.trim();
  if (!username) {
    return null;
  }

  return {
    fid: user.fid,
    username,
    displayName:
      typeof user.display_name === "string" && user.display_name.trim()
        ? user.display_name.trim()
        : null,
    pfpUrl:
      typeof user.pfp_url === "string" && user.pfp_url.trim()
        ? user.pfp_url.trim()
        : null,
    evmAddress: pickEvmAddress(user.verified_addresses),
    solanaAddress: pickSolanaAddress(user.verified_addresses),
  };
}

/**
 * Search Farcaster usernames via Neynar. Uses verified addresses only
 * (never custody). Requires `NEYNAR_API_KEY` in Convex env.
 */
export async function searchUsers(
  query: string,
  limit = 8,
): Promise<NeynarUserHit[]> {
  const apiKey = process.env.NEYNAR_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("NEYNAR_API_KEY is not configured");
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const url = new URL(NEYNAR_SEARCH_URL);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 10)));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Neynar search failed (${response.status})${body ? `: ${body}` : ""}`,
    );
  }

  const data = (await response.json()) as NeynarSearchResponse;
  const users = data.result?.users ?? [];

  return users
    .map(normalizeUser)
    .filter((hit): hit is NeynarUserHit => hit != null);
}
