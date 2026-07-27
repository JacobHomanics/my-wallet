import { useCallback, useState } from 'react';
import {
  getEmbeddedConnectedWallet,
  useSendTransaction as usePrivySendTransaction,
  useWallets,
} from '@privy-io/react-auth';
import {
  useSignAndSendTransaction,
  useWallets as useSolanaWallets,
} from '@privy-io/react-auth/solana';

import {
  encodeSolanaSignature,
  buildSolanaTransferTransaction,
} from '@/lib/send/buildSolanaTransfer';
import { encodeErc20Transfer } from '@/lib/send/encodeErc20Transfer';
import { getEvmChainId, toHexQuantity } from '@/lib/send/rpc';
import { getNetworkChain } from '@/lib/alchemy/networks';
import { isNativeTokenAddress } from '@/lib/alchemy/tokenLogos';
import type {
  SendTokenParams,
  SendTokenResult,
  SendTransactionResult,
} from '@/hooks/useSendTransaction.shared';

/**
 * Sends EVM (native + ERC-20) and Solana (SOL + SPL) transfers via Privy (web).
 */
export function useSendTransaction(): SendTransactionResult {
  const { sendTransaction } = usePrivySendTransaction();
  const { wallets: ethereumWallets, ready: ethereumReady } = useWallets();
  const { wallets: solanaWallets, ready: solanaReady } = useSolanaWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const [sending, setSending] = useState(false);

  const ready = ethereumReady && solanaReady;

  const send = useCallback(
    async (params: SendTokenParams): Promise<SendTokenResult> => {
      setSending(true);

      try {
        const chain = getNetworkChain(params.token.network);

        if (chain === 'ethereum') {
          const wallet =
            getEmbeddedConnectedWallet(ethereumWallets) ?? ethereumWallets[0];
          if (!wallet) {
            throw new Error('No Ethereum wallet available');
          }

          const chainId = getEvmChainId(params.token.network);
          const isNative = isNativeTokenAddress(params.token.tokenAddress);

          const { hash } = await sendTransaction(
            isNative
              ? {
                  to: params.recipient.trim(),
                  value: toHexQuantity(params.amountRaw),
                  chainId,
                }
              : {
                  to: params.token.tokenAddress!,
                  data: encodeErc20Transfer(
                    params.recipient.trim(),
                    params.amountRaw,
                  ),
                  value: toHexQuantity(0n),
                  chainId,
                },
            {
              address: wallet.address,
              uiOptions: { showWalletUIs: true },
            },
          );

          return { hash, chain: 'ethereum' };
        }

        const wallet = solanaWallets[0];
        if (!wallet) {
          throw new Error('No Solana wallet available');
        }

        const transaction = await buildSolanaTransferTransaction({
          fromAddress: wallet.address,
          recipient: params.recipient.trim(),
          amountRaw: params.amountRaw,
          tokenAddress: params.token.tokenAddress,
          decimals: params.token.decimals,
        });

        const { signature } = await signAndSendTransaction({
          transaction,
          wallet,
          chain: 'solana:mainnet',
          options: {
            uiOptions: { showWalletUIs: true },
          },
        });

        return {
          hash: encodeSolanaSignature(signature),
          chain: 'solana',
        };
      } finally {
        setSending(false);
      }
    },
    [
      ethereumWallets,
      sendTransaction,
      signAndSendTransaction,
      solanaWallets,
    ],
  );

  return { ready, sending, send };
}
