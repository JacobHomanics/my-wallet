import { getNetworkChain } from '@/lib/alchemy/networks';
import type { SendTokenParams } from '@/hooks/useSendTransaction.shared';
import { fetchNativeBalanceWei } from '@/lib/send/prepareEvmSend';
import { getEvmNativeCurrency } from '@/lib/send/rpc';
import { simulateEvmTransfer } from '@/lib/send/simulateEvmTransfer';
import { simulateSolanaTransfer } from '@/lib/send/simulateSolanaTransfer';
import { fetchSolBalanceLamports } from '@/lib/send/solanaFees';
import {
  networkSupportsStablecoinGas,
  shouldDeferLegForGasPayment,
} from '@/lib/strategies/gasTokens';

export type SimulatePaymentLegsParams = {
  legs: readonly SendTokenParams[];
  ethereumFrom: string | null;
  solanaFrom: string | null;
};

/**
 * Orders legs like the real send path (non-gas first) and simulates every leg
 * against current chain state, tracking projected native balances so later
 * legs account for earlier fees. Throws before any broadcast if any leg fails.
 */
export async function simulatePaymentLegs(
  params: SimulatePaymentLegsParams,
): Promise<void> {
  if (params.legs.length === 0) {
    throw new Error('Nothing to send');
  }

  const orderedLegs = [...params.legs].sort((a, b) => {
    const aGas = shouldDeferLegForGasPayment(a.token) ? 1 : 0;
    const bGas = shouldDeferLegForGasPayment(b.token) ? 1 : 0;
    return aGas - bGas;
  });

  /** Remaining native balance after prior simulated legs, keyed by network. */
  const nativeRemaining = new Map<string, bigint>();

  for (const leg of orderedLegs) {
    const chain = getNetworkChain(leg.token.network);
    const label = `${leg.token.symbol} on ${leg.token.networkLabel}`;

    try {
      if (chain === 'ethereum') {
        if (!params.ethereumFrom) {
          throw new Error('No Ethereum wallet available');
        }

        const balance = await getOrFetchNative(
          nativeRemaining,
          leg.token.network,
          () => fetchNativeBalanceWei(leg.token.network, params.ethereumFrom!),
        );

        const result = await simulateEvmTransfer({
          network: leg.token.network,
          from: params.ethereumFrom,
          recipient: leg.recipient,
          tokenAddress: leg.token.tokenAddress,
          amountRaw: leg.amountRaw,
          nativeBalanceWei: balance,
        });

        nativeRemaining.set(
          leg.token.network,
          subtractDebit(
            balance,
            result.nativeDebitWei,
            leg.token.network,
            'evm',
            networkSupportsStablecoinGas(leg.token.network),
          ),
        );
      } else {
        if (!params.solanaFrom) {
          throw new Error('No Solana wallet available');
        }

        const balance = await getOrFetchNative(
          nativeRemaining,
          leg.token.network,
          () => fetchSolBalanceLamports(params.solanaFrom!),
        );

        const result = await simulateSolanaTransfer({
          fromAddress: params.solanaFrom,
          recipient: leg.recipient,
          amountRaw: leg.amountRaw,
          tokenAddress: leg.token.tokenAddress,
          decimals: leg.token.decimals,
          balanceLamports: balance,
        });

        nativeRemaining.set(
          leg.token.network,
          subtractDebit(
            balance,
            result.nativeDebitLamports,
            leg.token.network,
            'solana',
          ),
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Cannot send ${label}: ${message}`, { cause: error });
    }
  }
}

async function getOrFetchNative(
  cache: Map<string, bigint>,
  network: string,
  fetchBalance: () => Promise<bigint>,
): Promise<bigint> {
  const cached = cache.get(network);
  if (cached != null) {
    return cached;
  }
  const balance = await fetchBalance();
  cache.set(network, balance);
  return balance;
}

function subtractDebit(
  balance: bigint,
  debit: bigint,
  network: string,
  chain: 'evm' | 'solana',
  skipInsufficientNativeCheck = false,
): bigint {
  if (debit <= 0n) {
    return balance;
  }
  if (balance < debit) {
    if (skipInsufficientNativeCheck) {
      return balance;
    }
    throw new Error(
      chain === 'evm'
        ? `Not enough ${getEvmNativeCurrency(network).symbol} left on this network to cover fees for the remaining transfers.`
        : 'This transfer needs more SOL for network fees than is currently available to spend.',
    );
  }
  return balance - debit;
}
