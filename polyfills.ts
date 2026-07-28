/**
 * Privy + Solana React Native polyfills.
 * Must load before any wallet / Solana Kit imports.
 * @see https://docs.privy.io/basics/react-native/installation
 */
import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { Buffer } from 'buffer';
import * as ExpoCrypto from 'expo-crypto';
import { CryptoDigestAlgorithm } from 'expo-crypto';

// Required when using `@solana/web3.js` / Solana Kit on React Native.
globalThis.Buffer = Buffer;

/**
 * `@solana/kit` (SPL ATA PDAs) needs `crypto.subtle.digest`.
 * React Native has no SubtleCrypto; bridge Expo Crypto's WebCrypto-compatible digest.
 */
function ensureSubtleDigest(): void {
  const cryptoObj =
    globalThis.crypto ??
    ((globalThis as { crypto?: Crypto }).crypto = {} as Crypto);

  const subtle =
    cryptoObj.subtle ??
    ((cryptoObj as { subtle?: SubtleCrypto }).subtle = {} as SubtleCrypto);

  if (typeof subtle.digest === 'function') {
    return;
  }

  const supported = new Set<string>(Object.values(CryptoDigestAlgorithm));

  subtle.digest = async (
    algorithm: AlgorithmIdentifier,
    data: BufferSource,
  ): Promise<ArrayBuffer> => {
    const name =
      typeof algorithm === 'string'
        ? algorithm
        : (algorithm as Algorithm).name;

    if (!supported.has(name)) {
      throw new Error(`Unsupported digest algorithm: ${name}`);
    }

    return ExpoCrypto.digest(name as CryptoDigestAlgorithm, data);
  };
}

ensureSubtleDigest();
