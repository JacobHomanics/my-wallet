import { useCallback, useState } from 'react';
import { useAction } from 'convex/react';

import { api } from '../../convex/_generated/api';
import type {
  SendTokenParams,
  SendTransactionResult,
} from '@/hooks/useSendTransaction.shared';
import { useSendTransaction } from '@/hooks/useSendTransaction';
import { useUserWallets } from '@/hooks/useUserWallets';
import { isNativeTokenAddress } from '@/lib/alchemy/tokenLogos';

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
  rewardAmount: string;
  rewardHash: string;
};

export type SendPaymentResult = {
  ready: boolean;
  sending: boolean;
  sendPayment: (
    legs: (SendTokenParams & {
      amountFormatted: string;
      isTax?: boolean;
    })[],
  ) => Promise<SendPaymentOutcome>;
};

/**
 * Simulates locally, then broadcasts payment legs via Convex (`@privy-io/node`).
 * On success the backend also sends a treasury reward token transfer.
 */
export function useSendPayment(): SendPaymentResult {
  const { ready: txReady, simulatePayment } = useSendTransaction();
  const { ready: walletsReady, wallets } = useUserWallets();
  const sendPaymentAction = useAction(api.send.sendPayment);
  const [sending, setSending] = useState(false);

  const ethereumWallet = wallets.find((wallet) => wallet.chain === 'ethereum');
  const solanaWallet = wallets.find((wallet) => wallet.chain === 'solana');

  const ready = txReady && walletsReady;

  const sendPayment = useCallback(
    async (
      legs: (SendTokenParams & {
        amountFormatted: string;
        isTax?: boolean;
      })[],
    ): Promise<SendPaymentOutcome> => {
      if (legs.length === 0) {
        throw new Error('Nothing to send');
      }
      if (!ethereumWallet?.address) {
        throw new Error('No Ethereum wallet available');
      }

      const needsSolana = legs.some(
        (leg) => leg.token.network === 'solana-mainnet',
      );
      if (needsSolana && !solanaWallet?.address) {
        throw new Error('No Solana wallet available');
      }

      setSending(true);
      try {
        const orderedLegs = [...legs].sort((a, b) => {
          const aGas = isNativeTokenAddress(a.token.tokenAddress) ? 1 : 0;
          const bGas = isNativeTokenAddress(b.token.tokenAddress) ? 1 : 0;
          return aGas - bGas;
        });

        await simulatePayment(
          orderedLegs.map((leg) => ({
            token: leg.token,
            recipient: leg.recipient,
            amountRaw: leg.amountRaw,
          })),
        );

        const result = await sendPaymentAction({
          ethereumWalletId: ethereumWallet.id ?? '',
          solanaWalletId: solanaWallet?.id ?? null,
          ethereumAddress: ethereumWallet.address,
          solanaAddress: solanaWallet?.address ?? null,
          legs: orderedLegs.map((leg) => ({
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
          })),
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
        };
      } finally {
        setSending(false);
      }
    },
    [ethereumWallet, sendPaymentAction, simulatePayment, solanaWallet],
  );

  return { ready, sending, sendPayment };
}

export type { SendTransactionResult };
