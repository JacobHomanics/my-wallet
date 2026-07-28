import {
  evmTransferGasLimit,
} from '@/lib/send/gasReserves';
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

const GAS_LIMIT_BUFFER_NUMERATOR = 130n;
const GAS_LIMIT_BUFFER_DENOMINATOR = 100n;

function isBalanceRelatedEstimateError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('gas required exceeds allowance') ||
    lower.includes('insufficient funds') ||
    lower.includes('insufficient balance') ||
    lower.includes('exceeds the balance')
  );
}

async function ethEstimateGas(
  network: string,
  call: Record<string, string>,
): Promise<bigint> {
  const response = await fetch(getAlchemyRpcUrl(network), {
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
  return gas;
}

function withGasBuffer(gas: bigint): `0x${string}` {
  const buffered =
    (gas * GAS_LIMIT_BUFFER_NUMERATOR) / GAS_LIMIT_BUFFER_DENOMINATOR;
  return toHexQuantity(buffered > 0n ? buffered : gas);
}

/**
 * Estimates gas via Alchemy `eth_estimateGas` for Privy Expo sends.
 * Privy fee fields stay auto-populated; we only supply a non-zero gas limit.
 *
 * Near-max native sends often fail estimate with "gas required exceeds
 * allowance" because value + fees exceed balance — retry without `value`
 * (gas units don't depend on it for a plain transfer) or use defaults.
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

  const forTokenTransfer = params.data != null;
  const floor = evmTransferGasLimit(params.network, forTokenTransfer);

  try {
    const estimated = await ethEstimateGas(params.network, call);
    const buffered = BigInt(withGasBuffer(estimated));
    return toHexQuantity(buffered > floor ? buffered : floor);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!isBalanceRelatedEstimateError(message)) {
      throw error;
    }

    // Native transfer: gas is independent of value — estimate with value 0.
    if (params.data == null && params.value != null) {
      try {
        const { value: _ignored, ...withoutValue } = call;
        const estimated = await ethEstimateGas(params.network, {
          ...withoutValue,
          value: '0x0',
        });
        const buffered = BigInt(withGasBuffer(estimated));
        return toHexQuantity(buffered > floor ? buffered : floor);
      } catch {
        return toHexQuantity(floor);
      }
    }

    // ERC-20 / contract call: fall back to network floor.
    return toHexQuantity(floor);
  }
}
