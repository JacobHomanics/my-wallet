import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

import { getAlchemyRpcUrl } from "./networks";

export type EnsResolveResult = {
  name: string;
  address: string;
};

/**
 * Resolve an ENS name to an Ethereum address via mainnet RPC.
 * Requires `ALCHEMY_API_KEY` in Convex env.
 */
export async function resolveEnsName(
  name: string,
): Promise<EnsResolveResult | null> {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  let normalized: string;
  try {
    normalized = normalize(trimmed);
  } catch {
    return null;
  }

  const client = createPublicClient({
    chain: mainnet,
    transport: http(getAlchemyRpcUrl("eth-mainnet")),
  });

  const address = await client.getEnsAddress({ name: normalized });
  if (!address) {
    return null;
  }

  return { name: normalized, address };
}
