import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  parseUnits,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

import { loadTreasuryPrivateKey } from "./loadKeystores";
import { getAlchemyRpcUrl } from "./networks";

const DEFAULT_REWARD_TOKEN =
  "0x4ed932ac83f77a5d4f3d950ab9ba90882ed06e55" as const;
/** Whole Ziti Points tokens sent after a successful backend payment. */
const REWARD_TOKEN_AMOUNT = "10";
const DEFAULT_REWARD_CHAIN_ID = 8453;

function getRewardChain(chainId: number) {
  if (chainId === base.id) {
    return base;
  }
  if (chainId === baseSepolia.id) {
    return baseSepolia;
  }
  throw new Error(`Unsupported reward chain id: ${chainId}`);
}

function getRewardNetworkSlug(chainId: number): string {
  if (chainId === base.id) {
    return "base-mainnet";
  }
  if (chainId === baseSepolia.id) {
    return "base-sepolia";
  }
  throw new Error(`Unsupported reward chain id: ${chainId}`);
}

export type TreasuryRewardResult = {
  hash: string;
  /** Whole-token amount sent. */
  amount: string;
};

/**
 * Transfer reward ERC-20 tokens from the treasury to the user (not a mint).
 * Treasury key is decrypted from `convex/keystores/treasury.json`.
 */
export async function sendTreasuryReward(
  recipientAddress: string,
): Promise<TreasuryRewardResult> {
  const privateKey = await loadTreasuryPrivateKey();

  const chainId = Number(
    process.env.REWARD_CHAIN_ID ?? DEFAULT_REWARD_CHAIN_ID,
  );
  const chain = getRewardChain(chainId);
  const tokenAddress = (process.env.REWARD_TOKEN_ADDRESS ??
    DEFAULT_REWARD_TOKEN) as Address;
  const amountWhole = REWARD_TOKEN_AMOUNT;

  const account = privateKeyToAccount(privateKey);
  const transport = http(getAlchemyRpcUrl(getRewardNetworkSlug(chainId)));

  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({
    account,
    chain,
    transport,
  });

  const decimals = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "decimals",
  });

  const amount = parseUnits(amountWhole, decimals);

  const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });

  if (balance < amount) {
    throw new Error(
      `Insufficient treasury balance. Required: ${formatUnits(amount, decimals)}, Available: ${formatUnits(balance, decimals)}`,
    );
  }

  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipientAddress as Address, amount],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`Treasury reward transfer failed: ${hash}`);
  }

  return { hash, amount: amountWhole };
}
