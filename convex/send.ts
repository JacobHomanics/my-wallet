"use node";

import { v } from "convex/values";
import type { PrivyClient } from "@privy-io/node";

import { action } from "./_generated/server";
import { sendEvmLeg } from "./lib/evmSend";
import { getNetworkChain, isNativeTokenAddress } from "./lib/networks";
import { getPrivyClient, getAuthorizationContext } from "./lib/privy";
import { sendSolanaLeg } from "./lib/solanaSend";
import { sendTreasuryReward } from "./lib/treasuryReward";
import { waitForEvmReceipt } from "./lib/waitForEvmReceipt";

const sendLegValidator = v.object({
  network: v.string(),
  networkLabel: v.string(),
  tokenAddress: v.union(v.string(), v.null()),
  tokenId: v.string(),
  symbol: v.string(),
  tokenName: v.string(),
  decimals: v.number(),
  logoUrl: v.union(v.string(), v.null()),
  recipient: v.string(),
  amountRaw: v.string(),
  amountFormatted: v.string(),
  isTax: v.optional(v.boolean()),
});

export type SendPaymentLegResult = {
  hash: string;
  chain: "ethereum" | "solana";
  tokenId: string;
  symbol: string;
  amount: string;
  network: string;
  networkLabel: string;
  tokenName: string;
  logoUrl: string | null;
  isTax?: boolean;
};

export type SendPaymentResult = {
  legs: SendPaymentLegResult[];
  rewardHash: string | null;
  rewardAmount: string | null;
  /** True when payment legs succeeded but the treasury reward transfer failed. */
  rewardFailed: boolean;
};

async function resolveWalletId(
  privy: PrivyClient,
  address: string,
  providedId: string | null | undefined,
  chainLabel: string,
): Promise<string> {
  if (providedId && providedId.trim().length > 0) {
    return providedId.trim();
  }

  const wallet = await privy.wallets().getWalletByAddress({ address });
  if (!wallet?.id) {
    throw new Error(`Could not resolve Privy ${chainLabel} wallet id for ${address}`);
  }
  return wallet.id;
}

/**
 * Broadcast user payment legs via Privy, then send CashBox Points from treasury.
 */
export const sendPayment = action({
  args: {
    ethereumWalletId: v.string(),
    solanaWalletId: v.union(v.string(), v.null()),
    ethereumAddress: v.string(),
    solanaAddress: v.union(v.string(), v.null()),
    gasSponsorship: v.optional(v.boolean()),
    skipReward: v.optional(v.boolean()),
    legs: v.array(sendLegValidator),
  },
  handler: async (_ctx, args): Promise<SendPaymentResult> => {
    if (args.legs.length === 0) {
      throw new Error("Nothing to send");
    }

    const privy = getPrivyClient();
    const authorizationContext = getAuthorizationContext();

    const ethereumWalletId = await resolveWalletId(
      privy,
      args.ethereumAddress,
      args.ethereumWalletId,
      "ethereum",
    );

    const needsSolana = args.legs.some(
      (leg) => getNetworkChain(leg.network) === "solana",
    );
    let solanaWalletId: string | null = null;
    if (needsSolana) {
      if (!args.solanaAddress) {
        throw new Error("Solana wallet is required for Solana payment legs");
      }
      solanaWalletId = await resolveWalletId(
        privy,
        args.solanaAddress,
        args.solanaWalletId,
        "solana",
      );
    }

    const orderedLegs = [...args.legs].sort((a, b) => {
      const aGas = isNativeTokenAddress(a.tokenAddress) ? 1 : 0;
      const bGas = isNativeTokenAddress(b.tokenAddress) ? 1 : 0;
      return aGas - bGas;
    });

    const results: SendPaymentLegResult[] = [];
    const lastEvmHashByNetwork = new Map<string, string>();
    const sponsor = args.gasSponsorship === true;

    for (const leg of orderedLegs) {
      const chain = getNetworkChain(leg.network);
      const amountRaw = BigInt(leg.amountRaw);

      if (chain === "ethereum") {
        const previousHash = lastEvmHashByNetwork.get(leg.network);
        if (previousHash) {
          await waitForEvmReceipt(leg.network, previousHash);
        }

        const hash = await sendEvmLeg({
          privy,
          authorizationContext,
          walletId: ethereumWalletId,
          network: leg.network,
          tokenAddress: leg.tokenAddress,
          recipient: leg.recipient,
          amountRaw,
          sponsor,
        });

        lastEvmHashByNetwork.set(leg.network, hash);
        results.push({
          hash,
          chain: "ethereum",
          tokenId: leg.tokenId,
          symbol: leg.symbol,
          amount: leg.amountFormatted,
          network: leg.network,
          networkLabel: leg.networkLabel,
          tokenName: leg.tokenName,
          logoUrl: leg.logoUrl,
          isTax: leg.isTax === true,
        });
        continue;
      }

      if (!solanaWalletId || !args.solanaAddress) {
        throw new Error("Solana wallet is required for Solana payment legs");
      }

      const hash = await sendSolanaLeg({
        privy,
        authorizationContext,
        walletId: solanaWalletId,
        fromAddress: args.solanaAddress,
        tokenAddress: leg.tokenAddress,
        recipient: leg.recipient,
        amountRaw,
        decimals: leg.decimals,
        sponsor,
      });

      results.push({
        hash,
        chain: "solana",
        tokenId: leg.tokenId,
        symbol: leg.symbol,
        amount: leg.amountFormatted,
        network: leg.network,
        networkLabel: leg.networkLabel,
        tokenName: leg.tokenName,
        logoUrl: leg.logoUrl,
        isTax: leg.isTax === true,
      });
    }

    let rewardHash: string | null = null;
    let rewardAmount: string | null = null;
    let rewardFailed = false;

    if (args.skipReward !== true) {
      try {
        const reward = await sendTreasuryReward(args.ethereumAddress);
        rewardHash = reward.hash;
        rewardAmount = reward.amount;
      } catch (error) {
        rewardFailed = true;
        console.error("Treasury reward failed after successful payment", error);
      }
    }

    return {
      legs: results,
      rewardHash,
      rewardAmount,
      rewardFailed,
    };
  },
});
