import { encodeErc20Transfer } from '@/lib/send/encodeErc20Transfer';
import {
  estimateEvmFeeFields,
  fetchNativeBalanceWei,
} from '@/lib/send/prepareEvmSend';
import { getAlchemyRpcUrl, toHexQuantity } from '@/lib/send/rpc';
import { isNativeTokenAddress } from '@/lib/alchemy/tokenLogos';

export type SimulateEvmTransferParams = {
  network: string;
  from: string;
  recipient: string;
  tokenAddress: string | null;
  amountRaw: bigint;
  /**
   * When simulating multiple legs on the same network, pass the remaining
   * native balance after prior legs' fees / native sends.
   */
  nativeBalanceWei?: bigint;
};

export type SimulateEvmTransferResult = {
  amountRaw: bigint;
  /** Native wei expected to leave the wallet for gas (and value if native). */
  nativeDebitWei: bigint;
};

type JsonRpcResponse = {
  result?: string;
  error?: { message?: string; data?: unknown };
};

/** True when eth_call returned ABI-encoded `false` (non-reverting ERC-20 failure). */
function isErc20BoolFalse(result: string): boolean {
  const hex = result.startsWith('0x') ? result.slice(2) : result;
  // Empty / missing return data (e.g. USDT) is treated as success if no revert.
  if (hex.length === 0) {
    return false;
  }
  return /^0+$/i.test(hex);
}

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
  if (json.error) {
    const detail =
      typeof json.error.data === 'string'
        ? json.error.data
        : json.error.message;
    throw new Error(detail ?? `RPC ${method} failed`);
  }
  if (typeof json.result !== 'string') {
    throw new Error(`RPC ${method} returned invalid result`);
  }
  return json.result;
}

/**
 * Simulates an EVM native or ERC-20 transfer via `eth_call` and fee checks.
 * Does not broadcast. Returns the clamped amount and native wei debit so
 * multi-leg payments can account for cumulative gas.
 */
export async function simulateEvmTransfer(
  params: SimulateEvmTransferParams,
): Promise<SimulateEvmTransferResult> {
  const recipient = params.recipient.trim();
  if (!recipient) {
    throw new Error('Missing Ethereum recipient');
  }

  const isNative = isNativeTokenAddress(params.tokenAddress);
  const balance =
    params.nativeBalanceWei ??
    (await fetchNativeBalanceWei(params.network, params.from));

  if (isNative) {
    const fees = await estimateEvmFeeFields(params.network, false);
    let amountRaw = params.amountRaw;
    if (amountRaw + fees.maxFeeWei > balance) {
      if (balance <= fees.maxFeeWei) {
        throw new Error(
          'Not enough ETH left on this network to cover fees. Try sending a token that isn’t the gas token, or add a little more ETH.',
        );
      }
      amountRaw = balance - fees.maxFeeWei;
    }
    if (amountRaw <= 0n) {
      throw new Error(
        'Not enough ETH left on this network to cover fees. Try sending a token that isn’t the gas token, or add a little more ETH.',
      );
    }

    await rpcCall(params.network, 'eth_call', [
      {
        from: params.from,
        to: recipient,
        value: toHexQuantity(amountRaw),
      },
      'latest',
    ]);

    return {
      amountRaw,
      nativeDebitWei: amountRaw + fees.maxFeeWei,
    };
  }

  if (!params.tokenAddress) {
    throw new Error('Missing ERC-20 token address');
  }

  const fees = await estimateEvmFeeFields(params.network, true);
  if (balance < fees.maxFeeWei) {
    throw new Error(
      'Not enough ETH on this network to pay for the token transfer fee.',
    );
  }

  const data = encodeErc20Transfer(recipient, params.amountRaw);
  const call = {
    from: params.from,
    to: params.tokenAddress,
    data,
    value: toHexQuantity(0n),
  };

  const callResult = await rpcCall(params.network, 'eth_call', [
    call,
    'latest',
  ]);
  // Some older ERC-20s return `false` instead of reverting on failure.
  if (isErc20BoolFalse(callResult)) {
    throw new Error('Token transfer would fail (insufficient balance or blocked).');
  }

  // eth_estimateGas catches additional revert paths eth_call can miss.
  await rpcCall(params.network, 'eth_estimateGas', [call]);

  return {
    amountRaw: params.amountRaw,
    nativeDebitWei: fees.maxFeeWei,
  };
}
