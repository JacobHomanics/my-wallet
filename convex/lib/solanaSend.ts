import type { AuthorizationContext, PrivyClient } from "@privy-io/node";
import {
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createNoopSigner,
  createSolanaRpc,
  createTransactionMessage,
  getBase58Decoder,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Address,
  type Instruction,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";

import { getAlchemyRpcUrl, isNativeTokenAddress } from "./networks";

const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

export type SendSolanaLegParams = {
  privy: PrivyClient;
  authorizationContext: AuthorizationContext;
  walletId: string;
  fromAddress: string;
  tokenAddress: string | null;
  recipient: string;
  amountRaw: bigint;
  decimals: number;
  sponsor?: boolean;
};

function getSolanaRpc() {
  return createSolanaRpc(getAlchemyRpcUrl("solana-mainnet"));
}

async function solanaAccountExists(account: Address): Promise<boolean> {
  const rpc = getSolanaRpc();
  const { value } = await rpc
    .getAccountInfo(account, { encoding: "base64" })
    .send();
  return value != null;
}

async function buildSolanaTransferTransaction(params: {
  fromAddress: string;
  recipient: string;
  amountRaw: bigint;
  tokenAddress: string | null;
  decimals: number;
}): Promise<Uint8Array> {
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
      throw new Error("Missing SPL token mint address");
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

/**
 * Build + broadcast a Solana SOL/SPL transfer via Privy Wallet API.
 */
export async function sendSolanaLeg(
  params: SendSolanaLegParams,
): Promise<string> {
  const {
    privy,
    authorizationContext,
    walletId,
    fromAddress,
    tokenAddress,
    recipient,
    amountRaw,
    decimals,
    sponsor = false,
  } = params;

  const serialized = await buildSolanaTransferTransaction({
    fromAddress,
    recipient: recipient.trim(),
    amountRaw,
    tokenAddress,
    decimals,
  });

  const result = await privy
    .wallets()
    .solana()
    .signAndSendTransaction(walletId, {
      caip2: SOLANA_MAINNET_CAIP2,
      transaction: serialized,
      authorization_context: authorizationContext,
      optimistic_broadcast: true,
      ...(sponsor ? { sponsor: true } : {}),
    });

  if (!result.hash) {
    throw new Error("Solana send returned no hash");
  }

  // Privy may return base58 or base64; prefer as-is when already base58-like.
  if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(result.hash)) {
    return result.hash;
  }

  try {
    const bytes = Uint8Array.from(Buffer.from(result.hash, "base64"));
    return getBase58Decoder().decode(bytes);
  } catch {
    return result.hash;
  }
}
