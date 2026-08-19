import type { AuthorizationContext, PrivyClient } from "@privy-io/node";
import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  http,
  parseUnits,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

import {
  formatUsdcRaw,
  parseWholePointsAmount,
  pointsWholeToUsdcRaw,
} from "./cashbackConfig";
import { sendCashbackUsdc } from "./cashbackUsdc";
import { sendEvmLeg } from "./evmSend";
import { shouldSponsorGasForNetwork } from "./gasSponsorship";
import { loadTreasuryPrivateKey } from "./loadKeystores";
import { getAlchemyRpcUrl } from "./networks";
import { waitForEvmReceipt } from "./waitForEvmReceipt";
import { appConfig } from "../config/app.config";

const DEFAULT_REWARD_TOKEN =
  "0x4ed932ac83f77a5d4f3d950ab9ba90882ed06e55" as const;
const DEFAULT_REWARD_CHAIN_ID = 8453;
const REWARD_NETWORK = "base-mainnet";

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

export type RedeemPointsParams = {
  privy: PrivyClient;
  authorizationContext: AuthorizationContext;
  ethereumWalletId: string;
  ethereumAddress: string;
  pointsAmount: string;
};

export type RedeemPointsResult = {
  pointsAmount: string;
  usdcAmount: string;
  pointsHash: string;
  usdcHash: string;
};

export async function redeemPointsForUsdc(
  params: RedeemPointsParams,
): Promise<RedeemPointsResult> {
  const pointsWhole = parseWholePointsAmount(params.pointsAmount);
  const usdcRaw = pointsWholeToUsdcRaw(pointsWhole);
  const usdcAmount = formatUsdcRaw(usdcRaw);

  const chainId = Number(
    process.env.REWARD_CHAIN_ID ?? DEFAULT_REWARD_CHAIN_ID,
  );
  const chain = getRewardChain(chainId);
  const tokenAddress = (process.env.REWARD_TOKEN_ADDRESS ??
    DEFAULT_REWARD_TOKEN) as Address;

  const treasuryPrivateKey = await loadTreasuryPrivateKey();
  const treasuryAddress = privateKeyToAccount(treasuryPrivateKey).address;

  const transport = http(getAlchemyRpcUrl(getRewardNetworkSlug(chainId)));
  const publicClient = createPublicClient({ chain, transport });

  const decimals = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "decimals",
  });

  const pointsRaw = parseUnits(pointsWhole.toString(), decimals);
  const userBalance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [params.ethereumAddress as Address],
  });

  if (userBalance < pointsRaw) {
    throw new Error(
      `Insufficient CashBox Points. Required: ${formatUnits(pointsRaw, decimals)}, Available: ${formatUnits(userBalance, decimals)}`,
    );
  }

  const pointsHash = await sendEvmLeg({
    privy: params.privy,
    authorizationContext: params.authorizationContext,
    walletId: params.ethereumWalletId,
    fromAddress: params.ethereumAddress,
    network: REWARD_NETWORK,
    tokenAddress,
    recipient: treasuryAddress,
    amountRaw: pointsRaw,
    decimals,
    sponsor: shouldSponsorGasForNetwork(
      REWARD_NETWORK,
      appConfig.gasSponsorship,
    ),
  });
  await waitForEvmReceipt(REWARD_NETWORK, pointsHash);

  const { hash: usdcHash } = await sendCashbackUsdc(
    params.ethereumAddress,
    usdcRaw,
  );

  return {
    pointsAmount: pointsWhole.toString(),
    usdcAmount,
    pointsHash,
    usdcHash,
  };
}
