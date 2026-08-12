import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useAction } from 'convex/react';

import { api } from '../../convex/_generated/api';
import type {
  SendTokenParams,
  SendTransactionResult,
} from '@/hooks/useSendTransaction.shared';
import { useSendTransaction } from '@/hooks/useSendTransaction';
import { useUserWallets } from '@/hooks/useUserWallets';
import { getNetworkChain } from '@/lib/alchemy/networks';
import { shouldSponsorGasForNetwork } from '@/lib/privy/gasSponsorshipNetworks';
import type { SendBroadcastMode } from '@/lib/send/broadcastMode';
import { createEvmNonceAllocator } from '@/lib/send/evmNonce';
import { waitForEvmReceipt } from '@/lib/send/waitForEvmReceipt';
import { isGasToken } from '@/lib/strategies/gasTokens';

export type SendPaymentLegResult = {
  hash: string;
  chain: 'ethereum' | 'solana';
  tokenId: string;
  symbol: string;
  amount: string;
  network: string;
  networkLabel: string;
  tokenName: string;
  logoUrl: string | null;
  isTax?: boolean;
};

export type SendPaymentOutcome = {
  legs: SendPaymentLegResult[];
  /** Null when broadcast on-device or when reward failed. */
  rewardAmount: string | null;
  rewardHash: string | null;
  /** True when payment succeeded but treasury reward failed (backend only). */
  rewardFailed: boolean;
};

export type SendPaymentOptions = {
  broadcastMode?: SendBroadcastMode;
  /** When true, sponsor gas on Privy-supported networks only. */
  gasSponsorship?: boolean;
};

export type SendPaymentResult = {
  ready: boolean;
  sending: boolean;
  sendPayment: (
    legs: (SendTokenParams & {
      amountFormatted: string;
      isTax?: boolean;
    })[],
    options?: SendPaymentOptions,
  ) => Promise<SendPaymentOutcome>;
};

type PaymentLeg = SendTokenParams & {
  amountFormatted: string;
  isTax?: boolean;
};

function orderPaymentLegs(legs: PaymentLeg[]): PaymentLeg[] {
  return [...legs].sort((a, b) => {
    const aGas = isGasToken(a.token) ? 1 : 0;
    const bGas = isGasToken(b.token) ? 1 : 0;
    return aGas - bGas;
  });
}

function toConvexLeg(leg: PaymentLeg) {
  return {
    network: leg.token.network,
    networkLabel: leg.token.networkLabel,
    tokenAddress: leg.token.tokenAddress,
    tokenId: leg.token.id,
    symbol: leg.token.symbol,
    tokenName: leg.token.name,
    decimals: leg.token.decimals,
    logoUrl: leg.token.logoUrl,
    recipient: leg.recipient,
    amountRaw: leg.amountRaw.toString(),
    amountFormatted: leg.amountFormatted,
    isTax: leg.isTax === true,
  };
}

function mapConvexLegResults(
  legs: {
    hash: string;
    chain: 'ethereum' | 'solana';
    tokenId: string;
    symbol: string;
    amount: string;
    network: string;
    networkLabel: string;
    tokenName: string;
    logoUrl: string | null;
    isTax?: boolean;
  }[],
): SendPaymentLegResult[] {
  return legs.map((leg) => ({
    hash: leg.hash,
    chain: leg.chain,
    tokenId: leg.tokenId,
    symbol: leg.symbol,
    amount: leg.amount,
    network: leg.network,
    networkLabel: leg.networkLabel,
    tokenName: leg.tokenName,
    logoUrl: leg.logoUrl,
    isTax: leg.isTax === true,
  }));
}

/**
 * Simulates locally, then broadcasts payment legs via Convex (backend) or
 * Privy client wallets (frontend). Backend mode also sends a treasury reward.
 *
 * Frontend EVM legs use sequential pending nonces and wait for prior
 * same-network receipts to avoid "replacement transaction underpriced".
 */
export function useSendPayment(): SendPaymentResult {
  const { ready: txReady, send, simulatePayment } = useSendTransaction();
  const { ready: walletsReady, wallets } = useUserWallets();
  const sendPaymentAction = useAction(api.send.sendPayment);
  const [sending, setSending] = useState(false);

  const ethereumWallet = wallets.find((wallet) => wallet.chain === 'ethereum');
  const solanaWallet = wallets.find((wallet) => wallet.chain === 'solana');

  const ready = txReady && walletsReady;

  const sendPayment = useCallback(
    async (
      legs: PaymentLeg[],
      options?: SendPaymentOptions,
    ): Promise<SendPaymentOutcome> => {
      if (legs.length === 0) {
        throw new Error('Nothing to send');
      }

      const broadcastMode = options?.broadcastMode ?? 'backend';
      const gasSponsorship = options?.gasSponsorship ?? false;
      const orderedLegs = orderPaymentLegs(legs);
      const sponsorForNetwork = (network: string) =>
        shouldSponsorGasForNetwork(network, gasSponsorship);

      setSending(true);
      try {
        await simulatePayment(
          orderedLegs.map((leg) => ({
            token: leg.token,
            recipient: leg.recipient,
            amountRaw: leg.amountRaw,
            sponsor: sponsorForNetwork(leg.token.network),
          })),
        );

        const relayLegViaBackend = async (leg: PaymentLeg) => {
          if (!ethereumWallet?.address) {
            throw new Error('No Ethereum wallet available');
          }
          const needsSolana = leg.token.network === 'solana-mainnet';
          if (needsSolana && !solanaWallet?.address) {
            throw new Error('No Solana wallet available');
          }

          const result = await sendPaymentAction({
            ethereumWalletId: ethereumWallet.id ?? '',
            solanaWalletId: solanaWallet?.id ?? null,
            ethereumAddress: ethereumWallet.address,
            solanaAddress: solanaWallet?.address ?? null,
            gasSponsorship: true,
            skipReward: true,
            legs: [toConvexLeg(leg)],
          });

          return mapConvexLegResults(result.legs);
        };

        if (broadcastMode === 'frontend') {
          const allSponsoredNative =
            Platform.OS !== 'web' &&
            orderedLegs.every((leg) => sponsorForNetwork(leg.token.network));

          if (allSponsoredNative) {
            if (!ethereumWallet?.address) {
              throw new Error('No Ethereum wallet available');
            }
            const needsSolana = orderedLegs.some(
              (leg) => leg.token.network === 'solana-mainnet',
            );
            if (needsSolana && !solanaWallet?.address) {
              throw new Error('No Solana wallet available');
            }

            const result = await sendPaymentAction({
              ethereumWalletId: ethereumWallet.id ?? '',
              solanaWalletId: solanaWallet?.id ?? null,
              ethereumAddress: ethereumWallet.address,
              solanaAddress: solanaWallet?.address ?? null,
              gasSponsorship: true,
              skipReward: true,
              legs: orderedLegs.map(toConvexLeg),
            });

            return {
              legs: mapConvexLegResults(result.legs),
              rewardAmount: null,
              rewardHash: null,
              rewardFailed: false,
            };
          }

          const ethereumFrom = ethereumWallet?.address ?? null;
          const results: SendPaymentLegResult[] = [];
          const lastEvmHashByNetwork = new Map<string, string>();
          const nonceAllocator = ethereumFrom
            ? createEvmNonceAllocator(ethereumFrom)
            : null;

          for (const leg of orderedLegs) {
            if (Platform.OS !== 'web' && sponsorForNetwork(leg.token.network)) {
              const relayed = await relayLegViaBackend(leg);
              results.push(...relayed);
              continue;
            }

            const chain = getNetworkChain(leg.token.network);
            let nonce: `0x${string}` | undefined;

            if (chain === 'ethereum') {
              const previousHash = lastEvmHashByNetwork.get(leg.token.network);
              if (previousHash) {
                await waitForEvmReceipt(leg.token.network, previousHash);
                nonceAllocator?.invalidate(leg.token.network);
              }
              if (nonceAllocator) {
                nonce = await nonceAllocator.take(leg.token.network);
              }
            }

            const result = await send({
              token: leg.token,
              recipient: leg.recipient,
              amountRaw: leg.amountRaw,
              nonce,
              sponsor: sponsorForNetwork(leg.token.network),
            });

            if (result.chain === 'ethereum') {
              lastEvmHashByNetwork.set(leg.token.network, result.hash);
            }

            results.push({
              hash: result.hash,
              chain: result.chain,
              tokenId: leg.token.id,
              symbol: leg.token.symbol,
              amount: leg.amountFormatted,
              network: leg.token.network,
              networkLabel: leg.token.networkLabel,
              tokenName: leg.token.name,
              logoUrl: leg.token.logoUrl,
              isTax: leg.isTax === true,
            });
          }

          return {
            legs: results,
            rewardAmount: null,
            rewardHash: null,
            rewardFailed: false,
          };
        }

        if (!ethereumWallet?.address) {
          throw new Error('No Ethereum wallet available');
        }

        const needsSolana = orderedLegs.some(
          (leg) => leg.token.network === 'solana-mainnet',
        );
        if (needsSolana && !solanaWallet?.address) {
          throw new Error('No Solana wallet available');
        }

        const result = await sendPaymentAction({
          ethereumWalletId: ethereumWallet.id ?? '',
          solanaWalletId: solanaWallet?.id ?? null,
          ethereumAddress: ethereumWallet.address,
          solanaAddress: solanaWallet?.address ?? null,
          gasSponsorship,
          legs: orderedLegs.map(toConvexLeg),
        });

        return {
          legs: mapConvexLegResults(result.legs),
          rewardAmount: result.rewardAmount,
          rewardHash: result.rewardHash,
          rewardFailed: result.rewardFailed === true,
        };
      } finally {
        setSending(false);
      }
    },
    [
      ethereumWallet,
      send,
      sendPaymentAction,
      simulatePayment,
      solanaWallet,
    ],
  );

  return { ready, sending, sendPayment };
}

export type { SendTransactionResult };
