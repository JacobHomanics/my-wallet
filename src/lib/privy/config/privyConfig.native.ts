import type { PrivyConfig } from '@privy-io/expo';

/**
 * Ethereum + Solana embedded wallet config.
 * createOnLogin is kept as a fallback; whitelabel OTP still uses
 * `useCreateEmbeddedWallets` for reliable creation.
 * @see https://docs.privy.io/basics/react-native/advanced/automatic-wallet-creation
 */
export const privyConfig = {
  embedded: {
    ethereum: {
      createOnLogin: 'users-without-wallets' as const,
    },
    solana: {
      createOnLogin: 'users-without-wallets' as const,
    },
  },
} as const satisfies PrivyConfig;
