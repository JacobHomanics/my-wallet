import type { PrivyConfig } from '@privy-io/expo';

/**
 * Embedded wallets are created manually after whitelabel OTP
 * (`useCreateEmbeddedWallets`). Keep createOnLogin off so it cannot race
 * and mint a second pair of wallets.
 * @see https://docs.privy.io/basics/react-native/advanced/automatic-wallet-creation
 */
export const privyConfig = {
  embedded: {
    ethereum: {
      createOnLogin: 'off' as const,
    },
    solana: {
      createOnLogin: 'off' as const,
    },
  },
} as const satisfies PrivyConfig;
