import {
  fetchSolBalanceLamports,
  SOLANA_TX_FEE_LAMPORTS,
  solanaSpendableFeeBudget,
} from '@/lib/send/solanaFees';

/**
 * Ensures a native SOL send leaves the rent-exempt floor + network fee.
 * Sending down to only the tx fee fails preflight (account must stay rent-exempt).
 */
export async function clampNativeSolSendValue(options: {
  fromAddress: string;
  amountRaw: bigint;
}): Promise<bigint> {
  const balance = await fetchSolBalanceLamports(options.fromAddress);
  const maxSend = solanaSpendableFeeBudget(balance) - SOLANA_TX_FEE_LAMPORTS;

  if (maxSend <= 0n) {
    throw new Error(
      'This transfer needs more SOL for network fees than is currently available to spend.',
    );
  }

  if (options.amountRaw <= maxSend) {
    return options.amountRaw;
  }

  return maxSend;
}
