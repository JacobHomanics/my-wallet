const EVM_ADDRESS = /\b(0x[a-fA-F0-9]{40})\b/;

export type NostrResolveResult = {
  nip05: string;
  pubkey: string;
  displayName: string | null;
  avatarUrl: string | null;
  evmAddress: string | null;
};

type Nip05Document = {
  names?: Record<string, string>;
};

type NostrProfileContent = {
  name?: string;
  display_name?: string;
  picture?: string;
  about?: string;
  lud16?: string;
};

function normalizeNip05(value: string): string | null {
  const trimmed = value.trim().toLowerCase().replace(/^@/, "");
  if (!trimmed.includes("@")) {
    return null;
  }

  const [name, domain] = trimmed.split("@");
  if (!name || !domain || !domain.includes(".")) {
    return null;
  }

  return `${name}@${domain}`;
}

async function fetchJson<T>(url: string, timeoutMs = 5000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveNip05Pubkey(nip05: string): Promise<string | null> {
  const [name, domain] = nip05.split("@");
  const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
  const doc = await fetchJson<Nip05Document>(url);
  const pubkey = doc?.names?.[name]?.trim();
  return pubkey || null;
}

function extractEvmAddress(content: NostrProfileContent): string | null {
  const fields = [content.about, content.lud16, content.name, content.display_name];
  for (const field of fields) {
    const match = field?.match(EVM_ADDRESS);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

async function fetchNostrProfile(
  pubkey: string,
): Promise<NostrProfileContent | null> {
  const urls = [
    `https://api.nostr.band/v0/kinds/0?authors=${encodeURIComponent(pubkey)}&limit=1`,
    `https://relay.nostr.band/v0/kinds/0?authors=${encodeURIComponent(pubkey)}&limit=1`,
  ];

  for (const url of urls) {
    const payload = await fetchJson<{
      events?: Array<{ content?: string }>;
    }>(url, 4000);
    const raw = payload?.events?.[0]?.content;
    if (!raw) {
      continue;
    }

    try {
      return JSON.parse(raw) as NostrProfileContent;
    } catch {
      continue;
    }
  }

  return null;
}

/** Resolve a NIP-05 identifier to a pubkey and optional EVM address from profile metadata. */
export async function resolveNostrNip05(
  value: string,
): Promise<NostrResolveResult | null> {
  const nip05 = normalizeNip05(value);
  if (!nip05) {
    return null;
  }

  const pubkey = await resolveNip05Pubkey(nip05);
  if (!pubkey) {
    return null;
  }

  const profile = await fetchNostrProfile(pubkey);
  const displayName =
    profile?.display_name?.trim() || profile?.name?.trim() || null;
  const avatarUrl = profile?.picture?.trim() || null;
  const evmAddress = profile ? extractEvmAddress(profile) : null;

  return {
    nip05,
    pubkey,
    displayName,
    avatarUrl,
    evmAddress,
  };
}

export { normalizeNip05 };
