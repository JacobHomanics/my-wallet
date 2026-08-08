import type { Hex } from "viem";

import { decryptKeystorePrivateKey } from "./decryptKeystore";

/**
 * Load + decrypt the treasury Ethereum V3 keystore from
 * `convex/keystores/treasury.json`.
 *
 * Password: Convex env `TREASURY_KEYSTORE_PASSWORD`.
 */
export async function loadTreasuryPrivateKey(): Promise<Hex> {
  const password = process.env.TREASURY_KEYSTORE_PASSWORD;
  if (!password) {
    throw new Error("Missing TREASURY_KEYSTORE_PASSWORD");
  }

  let keystore: object;
  try {
    // Bundled into the Convex Node action — file must exist at deploy time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    keystore = require("../keystores/treasury.json") as object;
  } catch {
    throw new Error(
      'Missing convex/keystores/treasury.json — run `pnpm keystore:treasury` to create it',
    );
  }

  return decryptKeystorePrivateKey(keystore, password);
}
