const LENS_GRAPHQL_URL = "https://api.lens.xyz/graphql";

export type LensAccountHit = {
  account: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  evmAddress: string;
};

type LensAccountItem = {
  address?: string;
  username?: { localName?: string | null } | null;
  metadata?: { picture?: string | null; name?: string | null } | null;
};

type LensAccountsResponse = {
  data?: {
    accounts?: {
      items?: LensAccountItem[];
    };
  };
  errors?: Array<{ message?: string }>;
};

async function lensGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(LENS_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Lens API failed (${response.status})${body ? `: ${body}` : ""}`,
    );
  }

  return (await response.json()) as T;
}

function normalizeHit(item: LensAccountItem): LensAccountHit | null {
  const account = item.address?.trim();
  const handle = item.username?.localName?.trim();
  if (!account || !handle) {
    return null;
  }

  return {
    account,
    handle,
    displayName: item.metadata?.name?.trim() || null,
    avatarUrl: item.metadata?.picture?.trim() || null,
    evmAddress: account,
  };
}

const SEARCH_ACCOUNTS_QUERY = `
  query SearchLensAccounts($query: String!) {
    accounts(
      request: {
        filter: { searchBy: { localNameQuery: $query } }
        orderBy: BEST_MATCH
        pageSize: TEN
      }
    ) {
      items {
        address
        username {
          localName
        }
        metadata {
          ... on AccountMetadata {
            name
            picture
          }
        }
      }
    }
  }
`;

/** Prefix search Lens handles via the public Lens GraphQL API. */
export async function searchLensAccounts(
  query: string,
  limit = 8,
): Promise<LensAccountHit[]> {
  const trimmed = query.trim().replace(/^@/, "").replace(/^lens\//i, "");
  if (!trimmed) {
    return [];
  }

  const data = await lensGraphql<LensAccountsResponse>(SEARCH_ACCOUNTS_QUERY, {
    query: trimmed,
  });

  if (data.errors?.length) {
    throw new Error(data.errors[0]?.message ?? "Lens search failed");
  }

  return (data.data?.accounts?.items ?? [])
    .map(normalizeHit)
    .filter((hit): hit is LensAccountHit => hit != null)
    .slice(0, limit);
}

const ACCOUNT_BY_HANDLE_QUERY = `
  query LensAccountByHandle($handle: String!) {
    accounts(
      request: {
        filter: { usernames: [{ localName: $handle }] }
        orderBy: BEST_MATCH
        pageSize: TEN
      }
    ) {
      items {
        address
        username {
          localName
        }
        metadata {
          ... on AccountMetadata {
            name
            picture
          }
        }
      }
    }
  }
`;

/** Resolve an exact Lens local handle to an account. */
export async function resolveLensHandle(
  handle: string,
): Promise<LensAccountHit | null> {
  const trimmed = handle.trim().replace(/^@/, "").replace(/^lens\//i, "");
  if (!trimmed) {
    return null;
  }

  const data = await lensGraphql<LensAccountsResponse>(ACCOUNT_BY_HANDLE_QUERY, {
    handle: trimmed,
  });

  if (data.errors?.length) {
    throw new Error(data.errors[0]?.message ?? "Lens resolve failed");
  }

  const exact = (data.data?.accounts?.items ?? [])
    .map(normalizeHit)
    .find((hit) => hit?.handle.toLowerCase() === trimmed.toLowerCase());

  return exact ?? normalizeHit(data.data?.accounts?.items?.[0] ?? {}) ?? null;
}
