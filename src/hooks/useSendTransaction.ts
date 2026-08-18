import { useCallback, useState } from 'react';
import {
  getEmbeddedConnectedWallet,
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
import {
  getEvmAddChainParams,
  getEvmChainId,
  getSolanaRpcUrl,
  toHexQuantity,
} from '@/lib/send/rpc';
import { sendPrivyEvmTransaction } from '@/lib/send/sendPrivyEvmTransaction';
import { simulatePaymentLegs } from '@/lib/send/simulatePaymentLegs';
import { assertSolanaFeePayerFunds } from '@/lib/send/solanaFees';
import { getNetworkChain } from '@/lib/alchemy/networks';
import { isNativeTokenAddress } from '@/lib/alchemy/tokenLogos';
import type {
  SendTokenParams,
  SendTokenResult,
  SendTransactionResult,
} from '@/hooks/useSendTransaction.shared';

type Eip1193Provider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
};

async function ensureEvmChain(
  provider: Eip1193Provider,
  network: string,
): Promise<void> {
  const chainId = getEvmChainId(network);
  const hexChainId = toHexQuantity(BigInt(chainId));

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
  } catch (error) {
    const code =
      typeof error === 'object' &&
      error &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'number'
        ? (error as { code: number }).code
        : null;

    if (code !== 4902 && code !== -32603) {
      throw error;
    }

    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [getEvmAddChainParams(network)],
    });
  }
}

/**
 * Sends EVM (native + ERC-20) and Solana (SOL + SPL) transfers via Privy (web).
 */
export function useSendTransaction(): SendTransactionResult {
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
    async (legs: SendTokenParams[]): Promise<void> => {
      const { ethereumFrom, solanaFrom } = resolveAddresses();
      await simulatePaymentLegs({ legs, ethereumFrom, solanaFrom });
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

          const provider = (await wallet.getEthereumProvider()) as Eip1193Provider;
          const accounts = (await provider.request({
            method: 'eth_requestAccounts',
          })) as string[];
          const from = accounts[0] ?? wallet.address;

          await ensureEvmChain(provider, params.token.network);

          const network = params.token.network;
          const isNative = isNativeTokenAddress(params.token.tokenAddress);

          if (isNative) {
            const prepared = await prepareNativeEvmSend({
              network,
              from,
              to: params.recipient.trim(),
              amountRaw: params.amountRaw,
            });
            const hash = await sendPrivyEvmTransaction({
              provider,
              network,
              from,
              to: params.recipient.trim(),
              value: prepared.value,
              gas: prepared.gas,
              maxFeePerGas: prepared.maxFeePerGas,
              maxPriorityFeePerGas: prepared.maxPriorityFeePerGas,
              nonce: params.nonce,
            });
            return { hash, chain: 'ethereum' };
          }

          const data = encodeErc20Transfer(
            params.recipient.trim(),
            params.amountRaw,
          );
          const fees = await prepareErc20EvmSend({
            network,
            from,
            to: params.token.tokenAddress!,
            data,
          });
          const hash = await sendPrivyEvmTransaction({
            provider,
            network,
            from,
            to: params.token.tokenAddress!,
            data,
            gas: fees.gas,
            maxFeePerGas: fees.maxFeePerGas,
            maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
            nonce: params.nonce,
          });

          return { hash, chain: 'ethereum' };
        }

        const wallet = solanaWallets[0];
        if (!wallet) {
          throw new Error('No Solana wallet available');
        }

        const isNative = isNativeTokenAddress(params.token.tokenAddress);
        await assertSolanaFeePayerFunds({
          fromAddress: wallet.address,
          recipient: params.recipient.trim(),
          mint: params.token.tokenAddress,
          isNative,
        });
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
            optimisticBroadcast: true,
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
    [ethereumWallets, signAndSendTransaction, solanaWallets],
  );

  return { ready, sending, send, simulatePayment };
}
