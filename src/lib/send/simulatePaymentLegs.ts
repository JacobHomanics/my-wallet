import { fetchErc20Balance } from '@/lib/send/fetchErc20Balance';
import { getNetworkChain } from '@/lib/alchemy/networks';
import type { SendTokenParams } from '@/hooks/useSendTransaction.shared';
import { fetchNativeBalanceWei } from '@/lib/send/prepareEvmSend';
import { getEvmNativeCurrency } from '@/lib/send/rpc';
import { simulateEvmTransfer } from '@/lib/send/simulateEvmTransfer';
import { simulateSolanaTransfer } from '@/lib/send/simulateSolanaTransfer';
import { fetchSolBalanceLamports } from '@/lib/send/solanaFees';
import {
  isBaseGasPaymentToken,
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
  /** Remaining ERC-20 balance for Privy self-gas stables, keyed by token id. */
  const selfGasTokenRemaining = new Map<string, bigint>();

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

        const tokenBalance = isBaseGasPaymentToken(leg.token)
          ? await getOrFetchSelfGasToken(
              selfGasTokenRemaining,
              leg.token,
              () =>
                fetchErc20Balance({
                  network: leg.token.network,
                  tokenAddress: leg.token.tokenAddress!,
                  holder: params.ethereumFrom!,
                }),
            )
          : undefined;

        const result = await simulateEvmTransfer({
          network: leg.token.network,
          from: params.ethereumFrom,
          recipient: leg.recipient,
          tokenAddress: leg.token.tokenAddress,
          amountRaw: leg.amountRaw,
          nativeBalanceWei: balance,
          gasSponsored: leg.sponsor === true,
          tokenBalanceRaw: tokenBalance,
          token: leg.token,
        });

        nativeRemaining.set(
          leg.token.network,
          subtractDebit(
            balance,
            result.nativeDebitWei,
            leg.token.network,
            'evm',
            isBaseGasPaymentToken(leg.token),
          ),
        );

        if (result.tokenDebitRaw > 0n && tokenBalance != null) {
          selfGasTokenRemaining.set(
            leg.token.id,
            subtractTokenDebit(tokenBalance, result.tokenDebitRaw, leg.token.symbol),
          );
        }
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
          gasSponsored: leg.sponsor === true,
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

async function getOrFetchSelfGasToken(
  cache: Map<string, bigint>,
  token: { id: string },
  fetchBalance: () => Promise<bigint>,
): Promise<bigint> {
  const cached = cache.get(token.id);
  if (cached != null) {
    return cached;
  }
  const balance = await fetchBalance();
  cache.set(token.id, balance);
  return balance;
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

function subtractTokenDebit(
  balance: bigint,
  debit: bigint,
  symbol: string,
): bigint {
  if (debit <= 0n) {
    return balance;
  }
  if (balance < debit) {
    throw new Error(
      `Not enough ${symbol} left to cover the remaining transfers and network fees.`,
    );
  }
  return balance - debit;
}
