/**
 * Create an encrypted Ethereum V3 keystore for the cashback USDC wallet.
 *
 * Usage:
 *   CASHBACK_KEYSTORE_PASSWORD='...' pnpm keystore:cashback -- --private-key 0x...
 *   CASHBACK_KEYSTORE_PASSWORD='...' pnpm keystore:cashback -- --mnemonic "word1 word2 ..."
 *
 * Writes: convex/keystores/cashback.json
 *
 * Top up this address with Base USDC (payouts) and a small amount of ETH (gas).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { HDNodeWallet, Wallet } from "ethers";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

async function main() {
  const password =
    process.env.CASHBACK_KEYSTORE_PASSWORD ?? getArg("--password");
  if (!password) {
    throw new Error(
      "Set CASHBACK_KEYSTORE_PASSWORD or pass --password <password>",
    );
  }

  const privateKeyArg = getArg("--private-key");
  const mnemonicArg = getArg("--mnemonic");

  let wallet: Wallet | HDNodeWallet;
  if (privateKeyArg) {
    const normalized = privateKeyArg.startsWith("0x")
      ? privateKeyArg
      : `0x${privateKeyArg}`;
    wallet = new Wallet(normalized);
  } else if (mnemonicArg) {
    wallet = HDNodeWallet.fromPhrase(mnemonicArg.trim());
  } else {
    throw new Error('Pass --private-key 0x... or --mnemonic "..."');
  }

  const encrypted = await wallet.encrypt(password);
  const outDir = join(process.cwd(), "convex", "keystores");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "cashback.json");
  writeFileSync(outPath, encrypted, "utf8");

  console.log(`Wrote ${outPath}`);
  console.log(`Cashback address: ${wallet.address}`);
  console.log(
    "Set Convex password with: npx convex env set CASHBACK_KEYSTORE_PASSWORD '<password>'",
  );
  console.log(
    "Fund this wallet on Base with USDC (redemptions) and ETH (gas for USDC transfers).",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
