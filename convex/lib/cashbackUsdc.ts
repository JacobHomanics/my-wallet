import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

import {
  CASHBACK_USDC_ADDRESS,
  CASHBACK_USDC_DECIMALS,
} from "./cashbackConfig";
import { loadCashbackPrivateKey } from "./loadKeystores";
import { getAlchemyRpcUrl } from "./networks";

const DEFAULT_CASHBACK_CHAIN_ID = 8453;

function getCashbackChain(chainId: number) {
  if (chainId === base.id) {
    return base;
  }
  if (chainId === baseSepolia.id) {
    return baseSepolia;
  }
  throw new Error(`Unsupported cashback chain id: ${chainId}`);
}

function getCashbackNetworkSlug(chainId: number): string {
  if (chainId === base.id) {
    return "base-mainnet";
  }
  if (chainId === baseSepolia.id) {
    return "base-sepolia";
  }
  throw new Error(`Unsupported cashback chain id: ${chainId}`);
}

export type CashbackUsdcTransferResult = {
  hash: string;
  amountRaw: bigint;
};

/**
 * Transfer USDC from the cashback treasury to the user.
 * Cashback key is decrypted from `convex/keystores/cashback.json`.
 */
export async function sendCashbackUsdc(
  recipientAddress: string,
  amountRaw: bigint,
): Promise<CashbackUsdcTransferResult> {
  if (amountRaw <= 0n) {
    throw new Error("USDC transfer amount must be positive");
  }

  const privateKey = await loadCashbackPrivateKey();
  const chainId = Number(
    process.env.CASHBACK_CHAIN_ID ??
      process.env.REWARD_CHAIN_ID ??
      DEFAULT_CASHBACK_CHAIN_ID,
  );
  const chain = getCashbackChain(chainId);
  const tokenAddress = CASHBACK_USDC_ADDRESS as Address;

  const account = privateKeyToAccount(privateKey);
  const transport = http(getAlchemyRpcUrl(getCashbackNetworkSlug(chainId)));

  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({
    account,
    chain,
    transport,
  });

  const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });

  if (balance < amountRaw) {
    throw new Error(
      `Insufficient cashback USDC balance. Required: ${formatUnits(amountRaw, CASHBACK_USDC_DECIMALS)}, Available: ${formatUnits(balance, CASHBACK_USDC_DECIMALS)}`,
    );
  }

  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipientAddress as Address, amountRaw],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error(`Cashback USDC transfer failed: ${hash}`);
  }

  return { hash, amountRaw };
}
