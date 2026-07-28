import { getNetworkChain } from '@/lib/alchemy/networks';
import {
  fallbackFeePerTxRaw,
  type NetworkGasFeeEstimate,
} from '@/lib/send/gasReserves';
import { estimateEvmFeeFields } from '@/lib/send/prepareEvmSend';

/**
 * Fetches a per-tx native fee for each network.
 * Uses the same EVM fee math as simulate/send (`estimateEvmFeeFields`) so
 * Available Balance never overstates what can actually be paid for gas.
 * `forTokenTransferByNetwork` chooses ERC-20/SPL-sized gas when true.
 */
export async function fetchGasFeeEstimates(options: {
  networks: readonly string[];
  forTokenTransferByNetwork: ReadonlyMap<string, boolean>;
  signal?: AbortSignal;
}): Promise<Map<string, NetworkGasFeeEstimate>> {
  const { networks, forTokenTransferByNetwork, signal } = options;
  const unique = [...new Set(networks)];
  const estimates = new Map<string, NetworkGasFeeEstimate>();

  await Promise.all(
    unique.map(async (network) => {
      if (signal?.aborted) {
        return;
      }

      const forTokenTransfer = forTokenTransferByNetwork.get(network) ?? true;

      try {
        if (getNetworkChain(network) === 'solana') {
          estimates.set(network, {
            feePerTxRaw: fallbackFeePerTxRaw(network, forTokenTransfer),
          });
          return;
        }

        const fees = await estimateEvmFeeFields(network, forTokenTransfer);
        if (signal?.aborted) {
          return;
        }
        estimates.set(network, {
          feePerTxRaw: fees.maxFeeWei,
        });
      } catch {
        estimates.set(network, {
          feePerTxRaw: fallbackFeePerTxRaw(network, forTokenTransfer),
        });
      }
    }),
  );

  return estimates;
}
