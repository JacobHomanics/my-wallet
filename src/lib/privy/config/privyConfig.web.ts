import type { PrivyClientConfig } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

/**
 * Web Privy config: create embedded EVM + Solana wallets for users who lack them.
 * @see https://docs.privy.io/basics/react/advanced/automatic-wallet-creation
 * @see https://docs.privy.io/wallets/connectors/setup/configuring-external-connector-chains
 *
 * Note: createOnLogin does not run for whitelabel OTP (`loginWithCode`).
 * `useEnsureEmbeddedWallets` covers that path manually.
 *
 * Solana connectors are required for Solana wallet hooks to settle `ready` on web
 * (especially mobile browsers without extension wallets).
 */
export const privyConfig: PrivyClientConfig = {
  appearance: {
    walletChainType: 'ethereum-and-solana',
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
    solana: {
      createOnLogin: 'users-without-wallets',
    },
  },
  externalWallets: {
    solana: {
      connectors: toSolanaWalletConnectors({ shouldAutoConnect: false }),
    },
  },
};
