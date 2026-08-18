import { getAlchemyRpcUrl } from '@/lib/send/rpc';

/** ERC-20 `balanceOf(address)` selector. */
const BALANCE_OF_SELECTOR = '70a08231';

type JsonRpcResponse = {
  result?: string;
  error?: { message?: string };
};

function padAddress(address: string): string {
  return address.trim().toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

function encodeBalanceOfCalldata(holder: string): string {
  return `0x${BALANCE_OF_SELECTOR}${padAddress(holder)}`;
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
  if (json.error || typeof json.result !== 'string') {
    throw new Error(
      json.error?.message ?? `RPC ${method} returned invalid result`,
    );
  }
  return json.result;
}

/** Reads an ERC-20 `balanceOf` for `holder` via `eth_call`. */
export async function fetchErc20Balance(params: {
  network: string;
  tokenAddress: string;
  holder: string;
}): Promise<bigint> {
  const data = encodeBalanceOfCalldata(params.holder);
  const result = await rpcCall(params.network, 'eth_call', [
    {
      to: params.tokenAddress,
      data,
    },
    'latest',
  ]);
  return BigInt(result);
}
