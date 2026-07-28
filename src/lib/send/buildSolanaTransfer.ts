import {
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createNoopSigner,
  createTransactionMessage,
  getBase58Decoder,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Instruction,
} from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';

import { isNativeTokenAddress } from '@/lib/alchemy/tokenLogos';
import {
  getSolanaRpc,
  solanaAccountExists,
} from '@/lib/send/solanaFees';

export type BuildSolanaTransferParams = {
  fromAddress: string;
  recipient: string;
  amountRaw: bigint;
  /** Mint address, or null/native sentinel for SOL. */
  tokenAddress: string | null;
  decimals: number;
};

export async function buildSolanaTransferTransaction(
  params: BuildSolanaTransferParams,
): Promise<Uint8Array> {
  const rpc = getSolanaRpc();
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const source = address(params.fromAddress);
  const destination = address(params.recipient);
  const payer = createNoopSigner(source);

  let instructions: Instruction[];

  if (isNativeTokenAddress(params.tokenAddress)) {
    instructions = [
      getTransferSolInstruction({
        source: payer,
        destination,
        amount: params.amountRaw,
      }),
    ];
  } else {
    if (!params.tokenAddress) {
      throw new Error('Missing SPL token mint address');
    }

    const mint = address(params.tokenAddress);
    const [sourceAta] = await findAssociatedTokenPda({
      owner: source,
      mint,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    const [destinationAta] = await findAssociatedTokenPda({
      owner: destination,
      mint,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    instructions = [];

    // Only create when missing — idempotent create still reserves rent in
    // simulation paths if the payer can't cover it.
    const ataExists = await solanaAccountExists(destinationAta);
    if (!ataExists) {
      instructions.push(
        getCreateAssociatedTokenIdempotentInstruction({
          payer,
          ata: destinationAta,
          owner: destination,
          mint,
        }),
      );
    }

    instructions.push(
      getTransferCheckedInstruction({
        source: sourceAta,
        mint,
        destination: destinationAta,
        authority: payer,
        amount: params.amountRaw,
        decimals: params.decimals,
      }),
    );
  }

  const transaction = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(source, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => compileTransaction(tx),
  );

  return new Uint8Array(getTransactionEncoder().encode(transaction));
}

export function encodeSolanaSignature(signature: Uint8Array): string {
  return getBase58Decoder().decode(signature);
}
