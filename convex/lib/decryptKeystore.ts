import { Wallet } from "ethers";
import type { Hex } from "viem";

/**
 * Decrypt an Ethereum V3 keystore JSON with a password.
 * Transfers still use viem; ethers is only for keystore decrypt.
 */
export async function decryptKeystorePrivateKey(
  keystore: string | object,
  password: string,
): Promise<Hex> {
  try {
    const json =
      typeof keystore === "string" ? keystore : JSON.stringify(keystore);
    const wallet = await Wallet.fromEncryptedJson(json, password);
    return wallet.privateKey as Hex;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/password|decrypt|keystore/i.test(message)) {
      throw new Error("Failed to decrypt treasury keystore (check TREASURY_KEYSTORE_PASSWORD)");
    }
    throw new Error(`Failed to decrypt treasury keystore: ${message}`);
  }
}
