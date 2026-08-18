const EVM_CHAIN_IDS: Record<string, number> = {
  "eth-mainnet": 1,
  "base-mainnet": 8453,
  "arb-mainnet": 42161,
  "opt-mainnet": 10,
  "polygon-mainnet": 137,
  "avax-mainnet": 43114,
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const NATIVE_SENTINEL = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export function isSolanaNetwork(network: string): boolean {
  return network === "solana-mainnet";
}

export function getNetworkChain(network: string): "ethereum" | "solana" {
  return isSolanaNetwork(network) ? "solana" : "ethereum";
}

export function getEvmChainId(network: string): number {
  const chainId = EVM_CHAIN_IDS[network];
  if (chainId == null) {
    throw new Error(`Unsupported EVM network: ${network}`);
  }
  return chainId;
}

export function getEvmCaip2(network: string): `eip155:${number}` {
  return `eip155:${getEvmChainId(network)}`;
}

/** Map a CAIP-2 chain id (e.g. `eip155:8453`) to an Alchemy network id. */
export function getNetworkFromCaip2(caip2: string): string | null {
  const match = /^eip155:(\d+)$/.exec(caip2.trim());
  if (!match) {
    return null;
  }

  const chainId = Number(match[1]);
  for (const [network, id] of Object.entries(EVM_CHAIN_IDS)) {
    if (id === chainId) {
      return network;
    }
  }

  return null;
}

export function getAlchemyRpcUrl(network: string): string {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ALCHEMY_API_KEY");
  }
  return `https://${network}.g.alchemy.com/v2/${apiKey}`;
}

export function isNativeTokenAddress(
  tokenAddress: string | null | undefined,
): boolean {
  if (tokenAddress == null) {
    return true;
  }
  const normalized = tokenAddress.trim().toLowerCase();
  return (
    normalized === "" ||
    normalized === ZERO_ADDRESS ||
    normalized === NATIVE_SENTINEL
  );
}

export function toHexQuantity(value: bigint): `0x${string}` {
  return `0x${value.toString(16)}`;
}
