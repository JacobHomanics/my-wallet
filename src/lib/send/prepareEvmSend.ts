import {
  EVM_ERC20_TRANSFER_GAS,
  EVM_NATIVE_TRANSFER_GAS,
  fallbackFeePerTxRaw,
} from '@/lib/send/gasReserves';
import { getAlchemyRpcUrl, toHexQuantity } from '@/lib/send/rpc';

type JsonRpcResponse = {
  result?: string;
  error?: { message?: string };
};

const OP_STACK_NETWORKS = new Set([
  'base-mainnet',
  'opt-mainnet',
  'arb-mainnet',
]);

/** Cap L2 maxFeePerGas so Privy/viem don't inflate the balance check. */
const L2_MAX_FEE_PER_GAS_WEI = 2_000_000_000n; // 2 gwei

/** Extra wei reserved on OP-stack / Arb for L1 data / posting. */
const L2_L1_FEE_PAD_WEI: Record<string, bigint> = {
  'base-mainnet': 10_000_000_000_000n, // 0.00001 ETH
  'opt-mainnet': 10_000_000_000_000n,
  'arb-mainnet': 10_000_000_000_000n,
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
    throw new Error(
      json.error?.message ?? `RPC ${method} returned invalid result`,
    );
  }
  return json.result;
}

export type EvmFeeFields = {
  gas: `0x${string}`;
  maxFeePerGas: `0x${string}`;
  maxPriorityFeePerGas: `0x${string}`;
};

export type PreparedNativeEvmSend = EvmFeeFields & {
  value: `0x${string}`;
  amountRaw: bigint;
  maxFeeWei: bigint;
};

function isL2Network(network: string): boolean {
  return OP_STACK_NETWORKS.has(network) || network === 'polygon-mainnet';
}

/**
 * Builds tight EIP-1559 fee fields so simulation's `value + gas*maxFee` check
 * matches what we leave behind (Privy's auto fees can over-reserve).
 */
export async function estimateEvmFeeFields(
  network: string,
  forTokenTransfer: boolean,
): Promise<{ gas: bigint; maxFeePerGas: bigint; maxPriorityFeePerGas: bigint; maxFeeWei: bigint }> {
  const gas = forTokenTransfer
    ? EVM_ERC20_TRANSFER_GAS
    : EVM_NATIVE_TRANSFER_GAS;

  let gasPrice = 1_000_000n; // 0.001 gwei fallback
  try {
    gasPrice = BigInt(await rpcCall(network, 'eth_gasPrice', []));
  } catch {
    // keep fallback
  }

  let maxPriorityFeePerGas = gasPrice / 10n;
  try {
    maxPriorityFeePerGas = BigInt(
      await rpcCall(network, 'eth_maxPriorityFeePerGas', []),
    );
  } catch {
    // keep derived tip
  }
  if (maxPriorityFeePerGas <= 0n) {
    maxPriorityFeePerGas = 1n;
  }

  let maxFeePerGas = gasPrice * 2n;
  if (maxFeePerGas < maxPriorityFeePerGas) {
    maxFeePerGas = maxPriorityFeePerGas * 2n;
  }

  if (isL2Network(network) && maxFeePerGas > L2_MAX_FEE_PER_GAS_WEI) {
    maxFeePerGas = L2_MAX_FEE_PER_GAS_WEI;
  }
  if (maxPriorityFeePerGas > maxFeePerGas) {
    maxPriorityFeePerGas = maxFeePerGas;
  }

  const execution = gas * maxFeePerGas;
  const l1Pad = L2_L1_FEE_PAD_WEI[network] ?? 0n;
  const floor = fallbackFeePerTxRaw(network);
  const maxFeeWei =
    execution + l1Pad > floor ? execution + l1Pad : floor;

  return { gas, maxFeePerGas, maxPriorityFeePerGas, maxFeeWei };
}

export async function fetchNativeBalanceWei(
  network: string,
  address: string,
): Promise<bigint> {
  const hex = await rpcCall(network, 'eth_getBalance', [address, 'latest']);
  return BigInt(hex);
}

/**
 * Clamps a native send and returns explicit fee fields to pass through to Privy
 * so the balance check uses the same budget we reserved.
 */
export async function prepareNativeEvmSend(options: {
  network: string;
  from: string;
  amountRaw: bigint;
}): Promise<PreparedNativeEvmSend> {
  const [balance, fees] = await Promise.all([
    fetchNativeBalanceWei(options.network, options.from),
    estimateEvmFeeFields(options.network, false),
  ]);

  let amountRaw = options.amountRaw;
  if (amountRaw + fees.maxFeeWei > balance) {
    if (balance <= fees.maxFeeWei) {
      throw new Error(
        'Not enough ETH left on this network to cover fees. Try sending a token that isn’t the gas token, or add a little more ETH.',
      );
    }
    amountRaw = balance - fees.maxFeeWei;
  }

  return {
    amountRaw,
    value: toHexQuantity(amountRaw),
    gas: toHexQuantity(fees.gas),
    maxFeePerGas: toHexQuantity(fees.maxFeePerGas),
    maxPriorityFeePerGas: toHexQuantity(fees.maxPriorityFeePerGas),
    maxFeeWei: fees.maxFeeWei,
  };
}

/**
 * Ensures the wallet can pay gas for an ERC-20 transfer; returns fee fields.
 */
export async function prepareErc20EvmSend(options: {
  network: string;
  from: string;
}): Promise<EvmFeeFields> {
  const [balance, fees] = await Promise.all([
    fetchNativeBalanceWei(options.network, options.from),
    estimateEvmFeeFields(options.network, true),
  ]);

  if (balance < fees.maxFeeWei) {
    throw new Error(
      'Not enough ETH on this network to pay for the token transfer fee.',
    );
  }

  return {
    gas: toHexQuantity(fees.gas),
    maxFeePerGas: toHexQuantity(fees.maxFeePerGas),
    maxPriorityFeePerGas: toHexQuantity(fees.maxPriorityFeePerGas),
  };
}
