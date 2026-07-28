import {
  address,
  createSolanaRpc,
  type Address,
} from '@solana/kit';
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';

import { getSolanaRpcUrl } from '@/lib/send/rpc';

/** Simple transfer / priority-fee headroom. */
export const SOLANA_TX_FEE_LAMPORTS = 50_000n;

/**
 * Rent-exempt minimum for the fee payer’s system account (0 data bytes).
 * This SOL is locked forever for a normal wallet — it cannot be spent.
 */
export const SOLANA_ACCOUNT_RENT_LAMPORTS = 890_880n;

/**
 * Rent-exempt minimum for a new SPL associated token account (~0.00203928 SOL).
 * Paid by the fee payer when the recipient has no ATA yet.
 */
export const SOLANA_ATA_RENT_LAMPORTS = 2_039_280n;

/** SOL locked for one SPL transfer that may create the recipient ATA. */
export const SOLANA_SPL_RESERVE_LAMPORTS =
  SOLANA_ATA_RENT_LAMPORTS + SOLANA_TX_FEE_LAMPORTS;

/**
 * Lamports above the account rent floor that can pay fees / ATA rent / transfers.
 */
export function solanaSpendableFeeBudget(balanceLamports: bigint): bigint {
  return balanceLamports > SOLANA_ACCOUNT_RENT_LAMPORTS
    ? balanceLamports - SOLANA_ACCOUNT_RENT_LAMPORTS
    : 0n;
}

export function getSolanaRpc() {
  return createSolanaRpc(getSolanaRpcUrl());
}

export async function fetchSolBalanceLamports(
  fromAddress: string,
): Promise<bigint> {
  const rpc = getSolanaRpc();
  const { value } = await rpc.getBalance(address(fromAddress)).send();
  return BigInt(value);
}

export async function findRecipientAta(
  recipient: string,
  mint: string,
): Promise<Address> {
  const [ata] = await findAssociatedTokenPda({
    owner: address(recipient),
    mint: address(mint),
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  return ata;
}

/** True when the account exists and holds data (ATA already created). */
export async function solanaAccountExists(account: Address): Promise<boolean> {
  const rpc = getSolanaRpc();
  const { value } = await rpc
    .getAccountInfo(account, { encoding: 'base64' })
    .send();
  return value != null;
}

/**
 * Lamports the fee payer must hold for an SPL transfer (ATA rent if missing),
 * including the system-account rent floor that cannot be spent.
 */
export async function estimateSplFeePayerLamports(options: {
  recipient: string;
  mint: string;
}): Promise<{ needLamports: bigint; needsAtaCreation: boolean }> {
  const ata = await findRecipientAta(options.recipient, options.mint);
  const exists = await solanaAccountExists(ata);
  if (exists) {
    return {
      needLamports: SOLANA_ACCOUNT_RENT_LAMPORTS + SOLANA_TX_FEE_LAMPORTS,
      needsAtaCreation: false,
    };
  }
  return {
    needLamports:
      SOLANA_ACCOUNT_RENT_LAMPORTS + SOLANA_SPL_RESERVE_LAMPORTS,
    needsAtaCreation: true,
  };
}

/**
 * Throws a clear error when the wallet cannot pay Solana fees / ATA rent.
 */
export async function assertSolanaFeePayerFunds(options: {
  fromAddress: string;
  recipient: string;
  mint: string | null;
  isNative: boolean;
}): Promise<void> {
  const balance = await fetchSolBalanceLamports(options.fromAddress);

  if (options.isNative || options.mint == null) {
    const maxSend = solanaSpendableFeeBudget(balance) - SOLANA_TX_FEE_LAMPORTS;
    if (maxSend < 0n) {
      throw new Error(
        'This transfer needs more SOL for network fees than is currently available to spend.',
      );
    }
    return;
  }

  const { needLamports } = await estimateSplFeePayerLamports({
    recipient: options.recipient,
    mint: options.mint,
  });

  if (balance >= needLamports) {
    return;
  }

  throw new Error(
    'This transfer needs more SOL for network fees than is currently available to spend.',
  );
}
