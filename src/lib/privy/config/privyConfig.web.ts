import type { PrivyClientConfig } from '@privy-io/react-auth';

/**
 * Web Privy config: create embedded EVM + Solana wallets for users who lack them.
 * @see https://docs.privy.io/basics/react/advanced/automatic-wallet-creation
 *
 * Note: createOnLogin does not run for whitelabel OTP (`loginWithCode`).
 * `useEnsureEmbeddedWallets` covers that path manually.
 */
export const privyConfig = {
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
} as const satisfies PrivyClientConfig;
