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
    keystore = require("../keystores/treasury.json") as object;
  } catch {
    throw new Error(
      'Missing convex/keystores/treasury.json — run `pnpm keystore:treasury` to create it',
    );
  }

  return decryptKeystorePrivateKey(keystore, password);
}

/**
 * Load + decrypt the cashback Ethereum V3 keystore from
 * `convex/keystores/cashback.json`.
 *
 * Password: Convex env `CASHBACK_KEYSTORE_PASSWORD`.
 */
export async function loadCashbackPrivateKey(): Promise<Hex> {
  const password = process.env.CASHBACK_KEYSTORE_PASSWORD;
  if (!password) {
    throw new Error("Missing CASHBACK_KEYSTORE_PASSWORD");
  }

  let keystore: object;
  try {
    keystore = require("../keystores/cashback.json") as object;
  } catch {
    throw new Error(
      'Missing convex/keystores/cashback.json — run `pnpm keystore:cashback` to create it',
    );
  }

  return decryptKeystorePrivateKey(keystore, password);
}
