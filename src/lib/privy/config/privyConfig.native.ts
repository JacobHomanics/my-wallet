import type { PrivyConfig } from '@privy-io/expo';

/**
 * Native Privy config: create embedded EVM + Solana wallets for users who lack them.
 * @see https://docs.privy.io/basics/react-native/advanced/automatic-wallet-creation
 *
 * Expo uses `config.embedded` (not `embeddedWallets`).
 * Whitelabel OTP still needs `useEnsureEmbeddedWallets` for reliable creation.
 */
export const privyConfig = {
  embedded: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
    solana: {
      createOnLogin: 'users-without-wallets',
    },
  },
} as const satisfies PrivyConfig;
