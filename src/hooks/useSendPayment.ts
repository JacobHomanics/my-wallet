import { useCallback, useState } from 'react';
import { useAction } from 'convex/react';

import { api } from '../../convex/_generated/api';
import type {
  SendTokenParams,
  SendTokenResult,
  SendTransactionResult,
} from '@/hooks/useSendTransaction.shared';
import { useSendTransaction } from '@/hooks/useSendTransaction';
import { useUserWallets } from '@/hooks/useUserWallets';
import { getNetworkChain } from '@/lib/alchemy/networks';
import type { SendBroadcastMode } from '@/lib/send/broadcastMode';
import { createEvmNonceAllocator } from '@/lib/send/evmNonce';
import { retrySendOperation } from '@/lib/send/retrySendOperation';
import { runExclusiveSend } from '@/lib/send/runExclusiveSend';
import { waitForEvmReceipt } from '@/lib/send/waitForEvmReceipt';
import { waitForEvmSendSlot } from '@/lib/send/waitForEvmSendSlot';
import { shouldDeferLegForGasPayment } from '@/lib/strategies/gasTokens';

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
  useVaultUsdc?: boolean;
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

function toConvexSendLegs(legs: PaymentLeg[]) {
  return legs.map((leg) => ({
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
  }));
}

function orderPaymentLegs(legs: PaymentLeg[]): PaymentLeg[] {
  return [...legs].sort((a, b) => {
    const aGas = shouldDeferLegForGasPayment(a.token) ? 1 : 0;
    const bGas = shouldDeferLegForGasPayment(b.token) ? 1 : 0;
    return aGas - bGas;
  });
}

async function sendFrontendEvmLeg(params: {
  send: SendTransactionResult['send'];
  leg: PaymentLeg;
  fromAddress: string;
  nonceAllocator: ReturnType<typeof createEvmNonceAllocator> | null;
  previousHash: string | undefined;
}): Promise<SendTokenResult> {
  const { send, leg, fromAddress, nonceAllocator, previousHash } = params;

  return retrySendOperation(async () => {
    if (previousHash) {
      await waitForEvmReceipt(leg.token.network, previousHash);
      nonceAllocator?.invalidate(leg.token.network);
    }

    await waitForEvmSendSlot(leg.token.network, fromAddress);

    const nonce = nonceAllocator
      ? await nonceAllocator.take(leg.token.network)
      : undefined;

    return send({
      token: leg.token,
      recipient: leg.recipient,
      amountRaw: leg.amountRaw,
      nonce,
    });
  });
}

/**
 * Simulates locally, then broadcasts payment legs via Convex (backend) or
 * Privy client wallets (frontend). Backend mode also sends a treasury reward.
 *
 * Frontend EVM legs wait for a free send slot, use sequential pending nonces,
 * and retry when Base/EIP-7702 in-flight limits are hit.
 */
export function useSendPayment(): SendPaymentResult {
  const { ready: txReady, send, simulatePayment } = useSendTransaction();
  const { ready: walletsReady, wallets } = useUserWallets();
  const sendPaymentAction = useAction(api.send.sendPayment);
  const prepareVaultUsdcForSend = useAction(api.send.prepareVaultUsdcForSend);
  const redepositVaultUsdcAfterFailedSend = useAction(
    api.send.redepositVaultUsdcAfterFailedSend,
  );
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

      return runExclusiveSend(async () => {
        const broadcastMode = options?.broadcastMode ?? 'backend';
        const useVaultUsdc = options?.useVaultUsdc ?? true;
        const orderedLegs = orderPaymentLegs(legs);

        setSending(true);
        let vaultWithdrawal: Awaited<
          ReturnType<typeof prepareVaultUsdcForSend>
        > = null;

        try {
          const convexLegs = toConvexSendLegs(orderedLegs);

          if (ethereumWallet?.address) {
            vaultWithdrawal = await prepareVaultUsdcForSend({
              ethereumWalletId: ethereumWallet.id ?? '',
              ethereumAddress: ethereumWallet.address,
              legs: convexLegs,
              useVaultUsdc,
            });
          }

          await simulatePayment(
            orderedLegs.map((leg) => ({
              token: leg.token,
              recipient: leg.recipient,
              amountRaw: leg.amountRaw,
            })),
          );

          if (broadcastMode === 'frontend') {
            const ethereumFrom = ethereumWallet?.address ?? null;
            if (!ethereumFrom) {
              throw new Error('No Ethereum wallet available');
            }

            const results: SendPaymentLegResult[] = [];
            const lastEvmHashByNetwork = new Map<string, string>();
            const nonceAllocator = ethereumFrom
              ? createEvmNonceAllocator(ethereumFrom)
              : null;

            let legIndex = 0;
            while (legIndex < orderedLegs.length) {
              const leg = orderedLegs[legIndex]!;
              const chain = getNetworkChain(leg.token.network);

              if (chain === 'ethereum') {
                if (!ethereumFrom) {
                  throw new Error('No Ethereum wallet available');
                }

                const network = leg.token.network;
                const evmGroup: PaymentLeg[] = [];
                while (
                  legIndex < orderedLegs.length &&
                  getNetworkChain(orderedLegs[legIndex]!.token.network) ===
                    'ethereum' &&
                  orderedLegs[legIndex]!.token.network === network
                ) {
                  evmGroup.push(orderedLegs[legIndex]!);
                  legIndex += 1;
                }

                let previousHash = lastEvmHashByNetwork.get(network);
                for (const item of evmGroup) {
                  const result = await sendFrontendEvmLeg({
                    send,
                    leg: item,
                    fromAddress: ethereumFrom,
                    nonceAllocator,
                    previousHash,
                  });
                  previousHash = result.hash;
                  lastEvmHashByNetwork.set(network, result.hash);

                  results.push({
                    hash: result.hash,
                    chain: result.chain,
                    tokenId: item.token.id,
                    symbol: item.token.symbol,
                    amount: item.amountFormatted,
                    network: item.token.network,
                    networkLabel: item.token.networkLabel,
                    tokenName: item.token.name,
                    logoUrl: item.token.logoUrl,
                    isTax: item.isTax === true,
                  });
                }
                continue;
              }

              const result = await send({
                token: leg.token,
                recipient: leg.recipient,
                amountRaw: leg.amountRaw,
              });

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
              legIndex += 1;
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
            legs: convexLegs,
            useVaultUsdc,
          });

          return {
            legs: result.legs.map((leg) => ({
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
            })),
            rewardAmount: result.rewardAmount,
            rewardHash: result.rewardHash,
            rewardFailed: result.rewardFailed === true,
          };
        } catch (error) {
          if (vaultWithdrawal && ethereumWallet?.address) {
            try {
              await redepositVaultUsdcAfterFailedSend({
                ethereumWalletId: ethereumWallet.id ?? '',
                ethereumAddress: ethereumWallet.address,
                withdrawal: vaultWithdrawal,
              });
            } catch (redepositError) {
              console.error(
                '[vault-send] redeposit after failed payment failed',
                redepositError,
              );
            }
          }
          throw error;
        } finally {
          setSending(false);
        }
      });
    },
    [
      ethereumWallet,
      send,
      prepareVaultUsdcForSend,
      redepositVaultUsdcAfterFailedSend,
      sendPaymentAction,
      simulatePayment,
      solanaWallet,
    ],
  );

  return { ready, sending, sendPayment };
}

export type { SendTransactionResult };
