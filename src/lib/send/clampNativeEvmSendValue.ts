import { getAlchemyRpcUrl, toHexQuantity } from '@/lib/send/rpc';
import {
  EVM_ERC20_TRANSFER_GAS,
  EVM_NATIVE_TRANSFER_GAS,
  fallbackFeePerTxRaw,
} from '@/lib/send/gasReserves';

type JsonRpcResponse = {
  result?: string;
  error?: { message?: string };
};

async function rpcCall(
  network: string,
  method: string,
  params: unknown[],
): Promise<string> {
  const response = await fetch(getAlchemyRpcUrl(network), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
  if (!response.ok) {
    throw new Error(`RPC ${method} failed (HTTP ${response.status})`);
  }
  const json = (await response.json()) as JsonRpcResponse;
  if (json.error || typeof json.result !== 'string') {
    throw new Error(json.error?.message ?? `RPC ${method} returned invalid result`);
  }
  return json.result;
}

/**
 * Worst-case native fee the wallet must still hold for balance checks
 * (value + maxFee). L2 floors cover OP-stack L1 data / posting costs that
 * `gasPrice * gasLimit` alone misses.
 */
export async function estimateMaxFeeWei(
  network: string,
  forTokenTransfer: boolean,
): Promise<bigint> {
  const gasLimit = forTokenTransfer
    ? EVM_ERC20_TRANSFER_GAS
    : EVM_NATIVE_TRANSFER_GAS;
  try {
    const gasPriceHex = await rpcCall(network, 'eth_gasPrice', []);
    const gasPrice = BigInt(gasPriceHex);
    // 3× headroom for EIP-1559 maxFee vs tip; still usually tiny on L2.
    const fromPrice = gasLimit * gasPrice * 3n;
    const floor = fallbackFeePerTxRaw(network);
    return fromPrice > floor ? fromPrice : floor;
  } catch {
    return fallbackFeePerTxRaw(network);
  }
}

export async function fetchNativeBalanceWei(
  network: string,
  address: string,
): Promise<bigint> {
  const hex = await rpcCall(network, 'eth_getBalance', [address, 'latest']);
  return BigInt(hex);
}

/**
 * Ensures a native send leaves enough ETH/POL for fees. Simulation fails when
 * `value + maxFee > balance` even if the displayed Available Balance looked fine.
 */
export async function clampNativeEvmSendValue(options: {
  network: string;
  from: string;
  amountRaw: bigint;
}): Promise<bigint> {
  const [balance, maxFee] = await Promise.all([
    fetchNativeBalanceWei(options.network, options.from),
    estimateMaxFeeWei(options.network, false),
  ]);

  if (options.amountRaw + maxFee <= balance) {
    return options.amountRaw;
  }
  if (balance <= maxFee) {
    throw new Error(
      'Not enough native token left to cover network fees for this transfer',
    );
  }
  return balance - maxFee;
}

export function toHexValue(amountRaw: bigint): `0x${string}` {
  return toHexQuantity(amountRaw);
}
