import { getAlchemyRpcUrl, toHexQuantity } from '@/lib/send/rpc';

export type EstimateEvmGasParams = {
  network: string;
  from: string;
  to: string;
  data?: `0x${string}`;
  value?: `0x${string}`;
};

type JsonRpcError = {
  code?: number;
  message?: string;
};

type JsonRpcResponse = {
  result?: string;
  error?: JsonRpcError;
};

/**
 * Estimates gas via Alchemy `eth_estimateGas` for Privy Expo sends.
 * Privy fee fields stay auto-populated; we only supply a non-zero gas limit.
 */
export async function estimateEvmGas(
  params: EstimateEvmGasParams,
): Promise<`0x${string}`> {
  const call: Record<string, string> = {
    from: params.from,
    to: params.to,
  };
  if (params.data != null) {
    call.data = params.data;
  }
  if (params.value != null) {
    call.value = params.value;
  }

  const response = await fetch(getAlchemyRpcUrl(params.network), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_estimateGas',
      params: [call],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gas estimate failed (HTTP ${response.status})`);
  }

  const json = (await response.json()) as JsonRpcResponse;
  if (json.error) {
    throw new Error(
      json.error.message ?? 'Gas estimate failed — transaction may revert',
    );
  }

  const result = json.result;
  if (typeof result !== 'string' || !result.startsWith('0x')) {
    throw new Error('Gas estimate returned an invalid result');
  }

  const gas = BigInt(result);
  if (gas <= 0n) {
    throw new Error('Gas estimate returned zero');
  }

  return toHexQuantity(gas);
}
