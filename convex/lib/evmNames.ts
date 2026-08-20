import { createPublicClient, http, type Address } from "viem";
import { mainnet } from "viem/chains";
import { normalize, toCoinType } from "viem/ens";

import { getAlchemyRpcUrl } from "./networks";

export type EvmNameResolveResult = {
  name: string;
  address: Address;
  avatarUrl: string | null;
};

function createMainnetEnsClient() {
  return createPublicClient({
    chain: mainnet,
    transport: http(getAlchemyRpcUrl("eth-mainnet")),
  });
}

/**
 * Resolve an ENS-compatible name on mainnet (.base.eth, .eth, etc.).
 */
export async function resolveEvmName(
  name: string,
  options?: { coinType?: bigint },
): Promise<EvmNameResolveResult | null> {
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

  const client = createMainnetEnsClient();

  const address = await client.getEnsAddress({
    name: normalized,
    ...(options?.coinType != null ? { coinType: options.coinType } : {}),
  });
  if (!address) {
    return null;
  }

  let avatarUrl: string | null = null;
  try {
    avatarUrl = await client.getEnsAvatar({ name: normalized });
  } catch {
    avatarUrl = null;
  }

  return { name: normalized, address, avatarUrl };
}

export { normalize, toCoinType };
