import { getBase64Decoder } from '@solana/kit';
import type { Base64EncodedWireTransaction } from '@solana/kit';

import { buildSolanaTransferTransaction } from '@/lib/send/buildSolanaTransfer';
import { isNativeTokenAddress } from '@/lib/alchemy/tokenLogos';
import {
  estimateSplFeePayerLamports,
  fetchSolBalanceLamports,
  getSolanaRpc,
  SOLANA_ACCOUNT_RENT_LAMPORTS,
  SOLANA_TX_FEE_LAMPORTS,
  solanaSpendableFeeBudget,
} from '@/lib/send/solanaFees';

export type SimulateSolanaTransferParams = {
  fromAddress: string;
  recipient: string;
  amountRaw: bigint;
  tokenAddress: string | null;
  decimals: number;
  /**
   * When simulating multiple Solana legs, pass the remaining lamports after
   * prior legs' fees / native sends.
   */
  balanceLamports?: bigint;
};

export type SimulateSolanaTransferResult = {
  amountRaw: bigint;
  /** Lamports expected to leave the fee payer (transfer + fees / ATA rent). */
  nativeDebitLamports: bigint;
};

function formatSimulationErr(err: unknown): string {
  if (err == null) {
    return 'Simulation failed';
  }
  if (typeof err === 'string') {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return 'Simulation failed';
  }
}

/**
 * Builds and simulates a SOL / SPL transfer without signing or broadcasting.
 * Uses `sigVerify: false` so the unsigned wire tx can be checked on-chain.
 */
export async function simulateSolanaTransfer(
  params: SimulateSolanaTransferParams,
): Promise<SimulateSolanaTransferResult> {
  const recipient = params.recipient.trim();
  if (!recipient) {
    throw new Error('Missing Solana recipient');
  }

  const isNative = isNativeTokenAddress(params.tokenAddress);
  const balance =
    params.balanceLamports ??
    (await fetchSolBalanceLamports(params.fromAddress));

  let amountRaw = params.amountRaw;
  let nativeDebitLamports: bigint;

  if (isNative) {
    const maxSend =
      solanaSpendableFeeBudget(balance) - SOLANA_TX_FEE_LAMPORTS;
    if (maxSend <= 0n) {
      throw new Error(
        'This transfer needs more SOL for network fees than is currently available to spend.',
      );
    }
    if (amountRaw > maxSend) {
      amountRaw = maxSend;
    }
    nativeDebitLamports = amountRaw + SOLANA_TX_FEE_LAMPORTS;
  } else {
    if (!params.tokenAddress) {
      throw new Error('Missing SPL token mint address');
    }
    const { needLamports, needsAtaCreation } =
      await estimateSplFeePayerLamports({
        recipient,
        mint: params.tokenAddress,
      });
    if (balance < needLamports) {
      throw new Error(
        'This transfer needs more SOL for network fees than is currently available to spend.',
      );
    }
    nativeDebitLamports = needsAtaCreation
      ? needLamports - SOLANA_ACCOUNT_RENT_LAMPORTS
      : SOLANA_TX_FEE_LAMPORTS;
  }

  const serialized = await buildSolanaTransferTransaction({
    fromAddress: params.fromAddress,
    recipient,
    amountRaw,
    tokenAddress: params.tokenAddress,
    decimals: params.decimals,
  });

  const wireTransaction = getBase64Decoder().decode(
    serialized,
  ) as Base64EncodedWireTransaction;

  const rpc = getSolanaRpc();
  const { value } = await rpc
    .simulateTransaction(wireTransaction, {
      encoding: 'base64',
      sigVerify: false,
      replaceRecentBlockhash: true,
    })
    .send();

  if (value.err != null) {
    const logs = value.logs?.filter((log) =>
      /error|insufficient|failed/i.test(log),
    );
    const detail = logs?.[0] ?? formatSimulationErr(value.err);
    throw new Error(`Transaction simulation failed: ${detail}`);
  }

  return { amountRaw, nativeDebitLamports };
}
