import { createSolanaRpc, address } from '@solana/kit';

import { getSolanaRpcUrl } from '@/lib/send/rpc';

/** Conservative lamports to leave for a simple SOL transfer fee. */
const SOL_TRANSFER_FEE_LAMPORTS = 10_000n;

/**
 * Ensures a native SOL send leaves enough lamports for the network fee.
 * Sending the full balance fails preflight with "Transaction simulation failed".
 */
export async function clampNativeSolSendValue(options: {
  fromAddress: string;
  amountRaw: bigint;
}): Promise<bigint> {
  const rpc = createSolanaRpc(getSolanaRpcUrl());
  const { value } = await rpc.getBalance(address(options.fromAddress)).send();
  const balance = BigInt(value);

  if (options.amountRaw + SOL_TRANSFER_FEE_LAMPORTS <= balance) {
    return options.amountRaw;
  }
  if (balance <= SOL_TRANSFER_FEE_LAMPORTS) {
    throw new Error('Not enough SOL left to cover the network fee');
  }
  return balance - SOL_TRANSFER_FEE_LAMPORTS;
}
