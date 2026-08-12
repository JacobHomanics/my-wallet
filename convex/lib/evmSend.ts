import type { AuthorizationContext, PrivyClient } from "@privy-io/node";

import { encodeErc20Transfer } from "./encodeErc20Transfer";
import {
  getEvmCaip2,
  getEvmChainId,
  isNativeTokenAddress,
  toHexQuantity,
} from "./networks";

export type SendEvmLegParams = {
  privy: PrivyClient;
  authorizationContext: AuthorizationContext;
  walletId: string;
  network: string;
  tokenAddress: string | null;
  recipient: string;
  amountRaw: bigint;
  sponsor?: boolean;
};

/**
 * Broadcast an EVM native or ERC-20 transfer via Privy Wallet API.
 */
export async function sendEvmLeg(params: SendEvmLegParams): Promise<string> {
  const {
    privy,
    authorizationContext,
    walletId,
    network,
    tokenAddress,
    recipient,
    amountRaw,
    sponsor = false,
  } = params;

  const chainId = getEvmChainId(network);
  const caip2 = getEvmCaip2(network);
  const to = recipient.trim();
  const isNative = isNativeTokenAddress(tokenAddress);

  const transaction = isNative
    ? {
        to,
        value: toHexQuantity(amountRaw),
        chain_id: chainId,
      }
    : {
        to: tokenAddress!,
        value: toHexQuantity(0n),
        data: encodeErc20Transfer(to, amountRaw),
        chain_id: chainId,
      };

  const result = await privy.wallets().ethereum().sendTransaction(walletId, {
    caip2,
    params: { transaction },
    authorization_context: authorizationContext,
    ...(sponsor ? { sponsor: true } : {}),
  });

  if (!result.hash) {
    throw new Error(`EVM send on ${network} returned no hash`);
  }
  return result.hash;
}
