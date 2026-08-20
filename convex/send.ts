"use node";

import { v } from "convex/values";
import type { PrivyClient } from "@privy-io/node";

import { action } from "./_generated/server";
import { isAutoDepositPaymentLeg, tryAutoDepositReceivedUsdc } from "./lib/autoDepositReceivedUsdc";
import {
  parseVaultSendWithdrawalRecord,
  serializeVaultSendWithdrawal,
  tryRedepositVaultUsdcAfterFailedSend,
  tryWithdrawVaultUsdcForSend,
  type VaultSendWithdrawalRecord,
} from "./lib/withdrawVaultUsdcForSend";
import { sendEvmBatch, sendEvmLeg } from "./lib/evmSend";
import { shouldDeferLegForGasPayment } from "./lib/gasTokens";
import { shouldSponsorGasForNetwork } from "./lib/gasSponsorship";
import { getNetworkChain } from "./lib/networks";
import { getPrivyClient, getAuthorizationContext } from "./lib/privy";
import { sendSolanaLeg } from "./lib/solanaSend";
import { sendTreasuryReward } from "./lib/treasuryReward";
import { calculateRewardPoints } from "./lib/rewardPoints";
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

type SendLeg = {
  network: string;
  networkLabel: string;
  tokenAddress: string | null;
  tokenId: string;
  symbol: string;
  tokenName: string;
  decimals: number;
  logoUrl: string | null;
  recipient: string;
  amountRaw: string;
  amountFormatted: string;
  isTax?: boolean;
};

async function sendEvmLegGroup(params: {
  ctx: Parameters<typeof tryAutoDepositReceivedUsdc>[0]["ctx"];
  privy: PrivyClient;
  authorizationContext: Parameters<
    typeof tryAutoDepositReceivedUsdc
  >[0]["authorizationContext"];
  ethereumWalletId: string;
  ethereumAddress: string;
  network: string;
  legs: SendLeg[];
  previousHash: string | undefined;
  sponsor: boolean;
}): Promise<{ leg: SendLeg; hash: string }[]> {
  const {
    ctx,
    privy,
    authorizationContext,
    ethereumWalletId,
    ethereumAddress,
    network,
    legs,
    previousHash,
    sponsor,
  } = params;

  const sentLegs: { leg: SendLeg; hash: string }[] = [];

  if (previousHash) {
    await waitForEvmReceipt(network, previousHash);
  }

  const autoDepositLegs: SendLeg[] = [];
  const batchableLegs: SendLeg[] = [];
  const pendingAutoDeposits: { leg: SendLeg; txHash: string }[] = [];

  for (const leg of legs) {
    if (
      await isAutoDepositPaymentLeg({
        ctx,
        leg: {
          network: leg.network,
          tokenAddress: leg.tokenAddress,
          symbol: leg.symbol,
          recipient: leg.recipient,
          amountRaw: BigInt(leg.amountRaw),
          amountFormatted: leg.amountFormatted,
          isTax: leg.isTax,
        },
      })
    ) {
      autoDepositLegs.push(leg);
    } else {
      batchableLegs.push(leg);
    }
  }

  let lastHash = previousHash;

  for (const leg of autoDepositLegs) {
    if (lastHash) {
      await waitForEvmReceipt(network, lastHash);
    }

    lastHash = await sendEvmLeg({
      privy,
      authorizationContext,
      walletId: ethereumWalletId,
      fromAddress: ethereumAddress,
      network,
      tokenAddress: leg.tokenAddress,
      recipient: leg.recipient,
      amountRaw: BigInt(leg.amountRaw),
      decimals: leg.decimals,
      sponsor,
    });

    sentLegs.push({ leg, hash: lastHash });
    pendingAutoDeposits.push({ leg, txHash: lastHash });
  }

  if (batchableLegs.length === 0) {
    if (sentLegs.length === 0) {
      throw new Error(`No EVM transactions were sent on ${network}`);
    }
  } else {
    if (lastHash) {
      await waitForEvmReceipt(network, lastHash);
    }

    if (batchableLegs.length >= 2) {
      const hash = await sendEvmBatch({
        privy,
        authorizationContext,
        walletId: ethereumWalletId,
        fromAddress: ethereumAddress,
        network,
        legs: batchableLegs.map((item) => ({
          tokenAddress: item.tokenAddress,
          recipient: item.recipient,
          amountRaw: BigInt(item.amountRaw),
          decimals: item.decimals,
        })),
        sponsor,
      });
      for (const leg of batchableLegs) {
        sentLegs.push({ leg, hash });
      }
      lastHash = hash;
    } else {
      const leg = batchableLegs[0]!;
      lastHash = await sendEvmLeg({
        privy,
        authorizationContext,
        walletId: ethereumWalletId,
        fromAddress: ethereumAddress,
        network,
        tokenAddress: leg.tokenAddress,
        recipient: leg.recipient,
        amountRaw: BigInt(leg.amountRaw),
        decimals: leg.decimals,
        sponsor,
      });
      sentLegs.push({ leg, hash: lastHash });
    }
  }

  for (const { leg, txHash } of pendingAutoDeposits) {
    await tryAutoDepositReceivedUsdc({
      ctx,
      privy,
      authorizationContext,
      leg: {
        network: leg.network,
        tokenAddress: leg.tokenAddress,
        symbol: leg.symbol,
        recipient: leg.recipient,
        amountRaw: BigInt(leg.amountRaw),
        amountFormatted: leg.amountFormatted,
        isTax: leg.isTax,
      },
      txHash,
    });
  }

  return sentLegs;
}

/**
 * Withdraw vault USDC into the sender wallet when needed (frontend broadcast path).
 */
export const prepareVaultUsdcForSend = action({
  args: {
    ethereumWalletId: v.string(),
    ethereumAddress: v.string(),
    legs: v.array(sendLegValidator),
    useVaultUsdc: v.boolean(),
    gasSponsorship: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<VaultSendWithdrawalRecord | null> => {
    if (args.legs.length === 0) {
      return null;
    }

    const privy = getPrivyClient();
    const authorizationContext = getAuthorizationContext();
    const ethereumWalletId = await resolveWalletId(
      privy,
      args.ethereumAddress,
      args.ethereumWalletId,
      "ethereum",
    );

    const withdrawal = await tryWithdrawVaultUsdcForSend({
      ctx,
      privy,
      authorizationContext,
      ethereumAddress: args.ethereumAddress,
      ethereumWalletId,
      legs: args.legs,
      useVaultUsdc: args.useVaultUsdc,
      gasSponsorshipEnabled: args.gasSponsorship === true,
    });

    return withdrawal ? serializeVaultSendWithdrawal(withdrawal) : null;
  },
});

const vaultSendWithdrawalValidator = v.object({
  withdrawnRaw: v.string(),
  walletBalanceBefore: v.string(),
  vaultId: v.string(),
  vaultNetwork: v.string(),
  tokenAddress: v.string(),
  decimals: v.number(),
});

/** Return vault USDC to the earn vault after a send fails post-withdrawal. */
export const redepositVaultUsdcAfterFailedSend = action({
  args: {
    ethereumWalletId: v.string(),
    ethereumAddress: v.string(),
    withdrawal: vaultSendWithdrawalValidator,
  },
  handler: async (_ctx, args): Promise<void> => {
    const privy = getPrivyClient();
    const authorizationContext = getAuthorizationContext();
    const ethereumWalletId = await resolveWalletId(
      privy,
      args.ethereumAddress,
      args.ethereumWalletId,
      "ethereum",
    );

    await tryRedepositVaultUsdcAfterFailedSend({
      privy,
      authorizationContext,
      ethereumAddress: args.ethereumAddress,
      ethereumWalletId,
      withdrawal: parseVaultSendWithdrawalRecord(args.withdrawal),
    });
  },
});

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
    /** Priced merchant payment USD used to calculate CashBox Points reward. */
    paymentUsd: v.optional(v.number()),
    legs: v.array(sendLegValidator),
    useVaultUsdc: v.boolean(),
  },
  handler: async (ctx, args): Promise<SendPaymentResult> => {
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
      const aGas = shouldDeferLegForGasPayment(a.network, a.tokenAddress) ? 1 : 0;
      const bGas = shouldDeferLegForGasPayment(b.network, b.tokenAddress) ? 1 : 0;
      return aGas - bGas;
    });

    const gasSponsorshipEnabled = args.gasSponsorship === true;

    let vaultWithdrawal: Awaited<ReturnType<typeof tryWithdrawVaultUsdcForSend>> =
      null;

    try {
      vaultWithdrawal = await tryWithdrawVaultUsdcForSend({
        ctx,
        privy,
        authorizationContext,
        ethereumAddress: args.ethereumAddress,
        ethereumWalletId,
        legs: orderedLegs,
        useVaultUsdc: args.useVaultUsdc,
        gasSponsorshipEnabled,
      });

      const results: SendPaymentLegResult[] = [];
      const lastEvmHashByNetwork = new Map<string, string>();

      let legIndex = 0;
      while (legIndex < orderedLegs.length) {
        const leg = orderedLegs[legIndex]!;
        const chain = getNetworkChain(leg.network);
        const sponsor = shouldSponsorGasForNetwork(
          leg.network,
          gasSponsorshipEnabled,
        );

        if (chain === "ethereum") {
          const network = leg.network;
          const evmGroup = [];
          while (
            legIndex < orderedLegs.length &&
            getNetworkChain(orderedLegs[legIndex]!.network) === "ethereum" &&
            orderedLegs[legIndex]!.network === network
          ) {
            evmGroup.push(orderedLegs[legIndex]!);
            legIndex += 1;
          }

          const previousHash = lastEvmHashByNetwork.get(network);

          const sentLegs = await sendEvmLegGroup({
            ctx,
            privy,
            authorizationContext,
            ethereumWalletId,
            ethereumAddress: args.ethereumAddress,
            network,
            legs: evmGroup,
            previousHash,
            sponsor,
          });

          const lastSent = sentLegs[sentLegs.length - 1];
          if (lastSent) {
            lastEvmHashByNetwork.set(network, lastSent.hash);
          }

          for (const { leg: item, hash } of sentLegs) {
            results.push({
              hash,
              chain: "ethereum",
              tokenId: item.tokenId,
              symbol: item.symbol,
              amount: item.amountFormatted,
              network: item.network,
              networkLabel: item.networkLabel,
              tokenName: item.tokenName,
              logoUrl: item.logoUrl,
              isTax: item.isTax === true,
            });
          }
          continue;
        }

        const amountRaw = BigInt(leg.amountRaw);
        legIndex += 1;

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
        const rewardPoints = calculateRewardPoints(args.paymentUsd ?? 0);
        if (rewardPoints > 0) {
          try {
            const reward = await sendTreasuryReward(
              args.ethereumAddress,
              String(rewardPoints),
            );
            rewardHash = reward.hash;
            rewardAmount = reward.amount;
          } catch (error) {
            rewardFailed = true;
            console.error("Treasury reward failed after successful payment", error);
          }
        }
      }

      return {
        legs: results,
        rewardHash,
        rewardAmount,
        rewardFailed,
      };
    } catch (error) {
      if (vaultWithdrawal) {
        await tryRedepositVaultUsdcAfterFailedSend({
          privy,
          authorizationContext,
          ethereumAddress: args.ethereumAddress,
          ethereumWalletId,
          withdrawal: vaultWithdrawal,
        });
      }
      throw error;
    }
  },
});
