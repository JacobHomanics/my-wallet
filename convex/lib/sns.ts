import { Connection } from "@solana/web3.js";
import { resolve as resolveSnsDomain } from "@bonfida/spl-name-service";

const SOLANA_MAINNET =
  process.env.SOLANA_RPC_URL?.trim() ||
  "https://api.mainnet-beta.solana.com";

export type SnsResolveResult = {
  domain: string;
  solanaAddress: string;
};

function normalizeSnsDomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase().replace(/^@/, "");
  if (!trimmed) {
    return null;
  }

  if (trimmed.endsWith(".sol") || trimmed.endsWith(".sns")) {
    return trimmed;
  }

  return `${trimmed}.sol`;
}

function createConnection(): Connection {
  return new Connection(SOLANA_MAINNET, "confirmed");
}

/** Resolve a .sol / .sns domain to a Solana address. */
export async function resolveSnsName(
  value: string,
): Promise<SnsResolveResult | null> {
  const domain = normalizeSnsDomain(value);
  if (!domain) {
    return null;
  }

  try {
    const owner = await resolveSnsDomain(createConnection(), domain);
    return {
      domain,
      solanaAddress: owner.toBase58(),
    };
  } catch {
    return null;
  }
}

export { normalizeSnsDomain };
