/**
 * Keep EVM chain IDs in sync with src/lib/alchemy/networkDefinitions.ts
 */
const EVM_CHAIN_IDS: Record<string, number> = {
  "eth-mainnet": 1,
  "base-mainnet": 8453,
  "arb-mainnet": 42161,
  "opt-mainnet": 10,
  "polygon-mainnet": 137,
  "avax-mainnet": 43114,
  "bnb-mainnet": 56,
  "unichain-mainnet": 130,
  "gnosis-mainnet": 100,
  "plasma-mainnet": 9745,
  "berachain-mainnet": 80094,
  "warden-mainnet": 8765,
  "flow-mainnet": 747,
  "fluent-mainnet": 25363,
  "edge-mainnet": 3343,
  "monad-mainnet": 143,
  "worldchain-mainnet": 480,
  "story-mainnet": 1514,
  "ronin-mainnet": 2020,
  "megaeth-mainnet": 4326,
  "ink-mainnet": 57073,
  "shape-mainnet": 360,
  "robinhood-mainnet": 4663,
  "tempo-mainnet": 4217,
  "eth-sepolia": 11155111,
  "base-sepolia": 84532,
  "opt-sepolia": 11155420,
  "polygon-amoy": 80002,
  "arb-sepolia": 421614,
  "unichain-sepolia": 1301,
  "megaeth-testnet": 6342,
  "ronin-saigon": 2021,
  "monad-testnet": 10143,
  "ink-sepolia": 763373,
  "fluent-testnet": 20994,
  "edge-testnet": 33431,
  "robinhood-testnet": 46630,
  "shape-sepolia": 11011,
  "tempo-testnet": 42429,
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const NATIVE_SENTINEL = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export function isSolanaNetwork(network: string): boolean {
  return network === "solana-mainnet" || network === "solana-devnet";
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
