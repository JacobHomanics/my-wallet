import { getNetworkChain } from '@/lib/alchemy/networks';
import {
  evmFeePerTxRaw,
  fallbackFeePerTxRaw,
  type NetworkGasFeeEstimate,
} from '@/lib/send/gasReserves';
import { getAlchemyRpcUrl } from '@/lib/send/rpc';

type JsonRpcResponse = {
  result?: string;
  error?: { message?: string };
};

async function fetchEvmGasPriceWei(network: string): Promise<bigint> {
  const response = await fetch(getAlchemyRpcUrl(network), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_gasPrice',
      params: [],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gas price failed (HTTP ${response.status})`);
  }

  const json = (await response.json()) as JsonRpcResponse;
  if (json.error || typeof json.result !== 'string') {
    throw new Error(json.error?.message ?? 'Gas price returned invalid result');
  }

  const price = BigInt(json.result);
  if (price <= 0n) {
    throw new Error('Gas price returned zero');
  }
  return price;
}

/**
 * Fetches a rough per-tx native fee for each network.
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
            feePerTxRaw: fallbackFeePerTxRaw(network),
          });
          return;
        }

        const gasPriceWei = await fetchEvmGasPriceWei(network);
        if (signal?.aborted) {
          return;
        }
        estimates.set(network, {
          feePerTxRaw: evmFeePerTxRaw(gasPriceWei, forTokenTransfer),
        });
      } catch {
        estimates.set(network, {
          feePerTxRaw: fallbackFeePerTxRaw(network),
        });
      }
    }),
  );

  return estimates;
}
