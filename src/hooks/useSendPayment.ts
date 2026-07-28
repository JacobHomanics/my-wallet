import { useCallback, useState } from 'react';

import type {
  SendTokenParams,
  SendTokenResult,
  SendTransactionResult,
} from '@/hooks/useSendTransaction.shared';
import { useSendTransaction } from '@/hooks/useSendTransaction';

export type SendPaymentLegResult = SendTokenResult & {
  tokenId: string;
  symbol: string;
  amount: string;
  network: string;
  networkLabel: string;
  tokenName: string;
  logoUrl: string | null;
};

export type SendPaymentResult = {
  ready: boolean;
  sending: boolean;
  sendPayment: (
    legs: (SendTokenParams & {
      amountFormatted: string;
    })[],
  ) => Promise<SendPaymentLegResult[]>;
};

/**
 * Sends one or more token transfer legs sequentially (multi-token payments).
 */
export function useSendPayment(): SendPaymentResult {
  const { ready, send } = useSendTransaction();
  const [sending, setSending] = useState(false);

  const sendPayment = useCallback(
    async (
      legs: (SendTokenParams & { amountFormatted: string })[],
    ): Promise<SendPaymentLegResult[]> => {
      if (legs.length === 0) {
        throw new Error('Nothing to send');
      }

      setSending(true);
      const results: SendPaymentLegResult[] = [];

      try {
        for (const leg of legs) {
          const result = await send({
            token: leg.token,
            recipient: leg.recipient,
            amountRaw: leg.amountRaw,
          });
          results.push({
            ...result,
            tokenId: leg.token.id,
            symbol: leg.token.symbol,
            amount: leg.amountFormatted,
            network: leg.token.network,
            networkLabel: leg.token.networkLabel,
            tokenName: leg.token.name,
            logoUrl: leg.token.logoUrl,
          });
        }
        return results;
      } finally {
        setSending(false);
      }
    },
    [send],
  );

  return { ready, sending, sendPayment };
}

export type { SendTransactionResult };
