import { estimateEvmGas } from '@/lib/send/estimateEvmGas';
import { getEvmChainId, toHexQuantity } from '@/lib/send/rpc';

type Eip1193Provider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
};

export type SendPrivyEvmTransactionParams = {
  provider: Eip1193Provider;
  network: string;
  from: string;
  to: string;
  data?: `0x${string}`;
  value?: `0x${string}`;
};

type PopulatedTx = Record<string, unknown>;

function toHexField(value: unknown): `0x${string}` | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'bigint' || typeof value === 'number') {
    return toHexQuantity(BigInt(value));
  }
  if (typeof value === 'string' && value.startsWith('0x')) {
    return value as `0x${string}`;
  }
  return undefined;
}

/**
 * Privy Expo `eth_sendTransaction` populates via viem (`gas`) then signs via
 * wallet API (`gasLimit` → `gas_limit`). That rename is missing, so signed txs
 * often get gas_limit 0 → "intrinsic gas too low".
 *
 * Work around by populate → copy gas→gasLimit → sign → sendRaw.
 */
export async function sendPrivyEvmTransaction(
  params: SendPrivyEvmTransactionParams,
): Promise<string> {
  const chainId = toHexQuantity(BigInt(getEvmChainId(params.network)));

  const estimatedGas = await estimateEvmGas({
    network: params.network,
    from: params.from,
    to: params.to,
    data: params.data,
    value: params.value,
  });

  const request: PopulatedTx = {
    from: params.from,
    to: params.to,
    chainId,
    gas: estimatedGas,
    gasLimit: estimatedGas,
  };
  if (params.data != null) {
    request.data = params.data;
  }
  if (params.value != null) {
    request.value = params.value;
  }

  const populated = (await params.provider.request({
    method: 'eth_populateTransactionRequest',
    params: [request],
  })) as PopulatedTx;

  const gasLimit =
    toHexField(populated.gasLimit) ??
    toHexField(populated.gas) ??
    estimatedGas;

  const toSign: PopulatedTx = {
    ...populated,
    chainId: toHexField(populated.chainId) ?? chainId,
    gas: gasLimit,
    // Wallet API `toWalletApiUnsignedEthTransaction` only reads `gasLimit`.
    gasLimit,
  };

  const signedRaw = await params.provider.request({
    method: 'eth_signTransaction',
    params: [toSign],
  });
  const signed = unwrapHexResult(signedRaw, 'signed transaction');

  const hashRaw = await params.provider.request({
    method: 'eth_sendRawTransaction',
    params: [signed],
  });
  return unwrapHexResult(hashRaw, 'transaction hash');
}

function unwrapHexResult(value: unknown, label: string): string {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return value;
  }
  if (
    typeof value === 'object' &&
    value &&
    'data' in value &&
    typeof (value as { data: unknown }).data === 'string' &&
    (value as { data: string }).data.startsWith('0x')
  ) {
    return (value as { data: string }).data;
  }
  throw new Error(`Privy did not return a ${label}`);
}
