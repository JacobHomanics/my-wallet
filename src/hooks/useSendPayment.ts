import { useCallback, useState } from 'react';

import type {
  SendTokenParams,
  SendTokenResult,
  SendTransactionResult,
} from '@/hooks/useSendTransaction.shared';
import { useSendTransaction } from '@/hooks/useSendTransaction';
import { useUserWallets } from '@/hooks/useUserWallets';
import { getNetworkChain } from '@/lib/alchemy/networks';
import { createEvmNonceAllocator } from '@/lib/send/evmNonce';
import { waitForEvmReceipt } from '@/lib/send/waitForEvmReceipt';
import { isGasToken } from '@/lib/strategies/gasTokens';

export type SendPaymentLegResult = SendTokenResult & {
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
  ready: boolean;
  sending: boolean;
  sendPayment: (
    legs: (SendTokenParams & {
      amountFormatted: string;
      isTax?: boolean;
    })[],
  ) => Promise<SendPaymentLegResult[]>;
};

/**
 * Sends one or more token transfer legs sequentially (multi-token payments).
 * Simulates every leg first; only broadcasts if all simulations succeed.
 *
 * EVM legs get explicit sequential nonces from `pending` count, and we wait
 * for prior same-network receipts so Privy can't reuse a mempool nonce
 * ("replacement transaction underpriced").
 */
export function useSendPayment(): SendPaymentResult {
  const { ready, send, simulatePayment } = useSendTransaction();
  const { wallets } = useUserWallets();
  const [sending, setSending] = useState(false);

  const ethereumFrom =
    wallets.find((wallet) => wallet.chain === 'ethereum')?.address ?? null;

  const sendPayment = useCallback(
    async (
      legs: (SendTokenParams & {
        amountFormatted: string;
        isTax?: boolean;
      })[],
    ): Promise<SendPaymentLegResult[]> => {
      if (legs.length === 0) {
        throw new Error('Nothing to send');
      }

      setSending(true);
      const results: SendPaymentLegResult[] = [];

      // Non-gas first so native fee reserves stay in the wallet until SPLs /
      // ERC-20s that need them have been sent.
      const orderedLegs = [...legs].sort((a, b) => {
        const aGas = isGasToken(a.token) ? 1 : 0;
        const bGas = isGasToken(b.token) ? 1 : 0;
        return aGas - bGas;
      });

      /** Last broadcast hash per EVM network — confirm before next on same net. */
      const lastEvmHashByNetwork = new Map<string, string>();
      const nonceAllocator = ethereumFrom
        ? createEvmNonceAllocator(ethereumFrom)
        : null;

      try {
        // All-or-nothing preflight: do not broadcast anything unless every
        // leg simulates successfully (including cumulative gas on shared nets).
        await simulatePayment(
          orderedLegs.map((leg) => ({
            token: leg.token,
            recipient: leg.recipient,
            amountRaw: leg.amountRaw,
          })),
        );

        for (const leg of orderedLegs) {
          const chain = getNetworkChain(leg.token.network);
          let nonce: `0x${string}` | undefined;

          if (chain === 'ethereum') {
            const previousHash = lastEvmHashByNetwork.get(leg.token.network);
            if (previousHash) {
              await waitForEvmReceipt(leg.token.network, previousHash);
              // Re-read pending nonce after confirmation in case Privy ignored
              // the nonce we passed on the prior leg.
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
          });

          if (result.chain === 'ethereum') {
            lastEvmHashByNetwork.set(leg.token.network, result.hash);
          }

          results.push({
            ...result,
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
        return results;
      } finally {
        setSending(false);
      }
    },
    [ethereumFrom, send, simulatePayment],
  );

  return { ready, sending, sendPayment };
}

export type { SendTransactionResult };
