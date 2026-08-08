/**
 * Create an encrypted Ethereum V3 keystore for the treasury wallet.
 *
 * Usage:
 *   TREASURY_KEYSTORE_PASSWORD='...' pnpm keystore:treasury -- --private-key 0x...
 *   TREASURY_KEYSTORE_PASSWORD='...' pnpm keystore:treasury -- --mnemonic "word1 word2 ..."
 *
 * Writes: convex/keystores/treasury.json
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
    process.env.TREASURY_KEYSTORE_PASSWORD ?? getArg("--password");
  if (!password) {
    throw new Error(
      "Set TREASURY_KEYSTORE_PASSWORD or pass --password <password>",
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
    throw new Error("Pass --private-key 0x... or --mnemonic \"...\"");
  }

  const encrypted = await wallet.encrypt(password);
  const outDir = join(process.cwd(), "convex", "keystores");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "treasury.json");
  writeFileSync(outPath, encrypted, "utf8");

  console.log(`Wrote ${outPath}`);
  console.log(`Treasury address: ${wallet.address}`);
  console.log(
    "Set Convex password with: npx convex env set TREASURY_KEYSTORE_PASSWORD '<password>'",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
