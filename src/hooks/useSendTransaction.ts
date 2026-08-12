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
import { clampNativeSolSendValue } from '@/lib/send/clampNativeSolSendValue';
import { encodeErc20Transfer } from '@/lib/send/encodeErc20Transfer';
import {
  prepareErc20EvmSend,
  prepareNativeEvmSend,
} from '@/lib/send/prepareEvmSend';
import { getEvmChainId, toHexQuantity } from '@/lib/send/rpc';
import { simulatePaymentLegs } from '@/lib/send/simulatePaymentLegs';
import { assertSolanaFeePayerFunds } from '@/lib/send/solanaFees';
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

  const resolveAddresses = useCallback(() => {
    const ethereumWallet =
      getEmbeddedConnectedWallet(ethereumWallets) ?? ethereumWallets[0];
    const solanaWallet = solanaWallets[0];
    return {
      ethereumFrom: ethereumWallet?.address ?? null,
      solanaFrom: solanaWallet?.address ?? null,
    };
  }, [ethereumWallets, solanaWallets]);

  const simulatePayment = useCallback(
    async (
      legs: SendTokenParams[],
      gasSponsored = false,
    ): Promise<void> => {
      const { ethereumFrom, solanaFrom } = resolveAddresses();
      await simulatePaymentLegs({
        legs,
        ethereumFrom,
        solanaFrom,
        gasSponsored,
      });
    },
    [resolveAddresses],
  );

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

          // Headless: Privy's confirmation modal uses DOM/Headless UI and
          // crashes under react-native-web (hooks mismatch → white screen).
          // The Send screen is already the confirmation UI.
          const request = isNative
            ? await (async () => {
                const prepared = await prepareNativeEvmSend({
                  network: params.token.network,
                  from: wallet.address,
                  to: params.recipient.trim(),
                  amountRaw: params.amountRaw,
                });
                return {
                  to: params.recipient.trim(),
                  value: prepared.value,
                  gas: prepared.gas,
                  maxFeePerGas: prepared.maxFeePerGas,
                  maxPriorityFeePerGas: prepared.maxPriorityFeePerGas,
                  chainId,
                  ...(params.nonce != null
                    ? { nonce: Number(BigInt(params.nonce)) }
                    : {}),
                };
              })()
            : await (async () => {
                const data = encodeErc20Transfer(
                  params.recipient.trim(),
                  params.amountRaw,
                );
                const fees = await prepareErc20EvmSend({
                  network: params.token.network,
                  from: wallet.address,
                  to: params.token.tokenAddress!,
                  data,
                });
                return {
                  ...fees,
                  to: params.token.tokenAddress!,
                  data,
                  value: toHexQuantity(0n),
                  chainId,
                  ...(params.nonce != null
                    ? { nonce: Number(BigInt(params.nonce)) }
                    : {}),
                };
              })();

          const { hash } = await sendTransaction(request, {
            address: wallet.address,
            uiOptions: { showWalletUIs: false },
            ...(params.sponsor ? { sponsor: true } : {}),
          });

          return { hash, chain: 'ethereum' };
        }

        const wallet = solanaWallets[0];
        if (!wallet) {
          throw new Error('No Solana wallet available');
        }

        const isNative = isNativeTokenAddress(params.token.tokenAddress);
        if (!params.sponsor) {
          await assertSolanaFeePayerFunds({
            fromAddress: wallet.address,
            recipient: params.recipient.trim(),
            mint: params.token.tokenAddress,
            isNative,
          });
        }
        const amountRaw = isNative
          ? await clampNativeSolSendValue({
              fromAddress: wallet.address,
              amountRaw: params.amountRaw,
            })
          : params.amountRaw;

        const transaction = await buildSolanaTransferTransaction({
          fromAddress: wallet.address,
          recipient: params.recipient.trim(),
          amountRaw,
          tokenAddress: params.token.tokenAddress,
          decimals: params.token.decimals,
        });

        const { signature } = await signAndSendTransaction({
          transaction,
          wallet,
          chain: 'solana:mainnet',
          options: {
            uiOptions: { showWalletUIs: false },
            // Alchemy Solana often lacks `signatureSubscribe`; return after broadcast.
            optimisticBroadcast: true,
            ...(params.sponsor ? { sponsor: true } : {}),
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

  return { ready, sending, send, simulatePayment };
}
