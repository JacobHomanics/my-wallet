import type { PrivyClientConfig } from '@privy-io/react-auth';

/**
 * Embedded wallets are created manually after whitelabel OTP
 * (`useCreateEmbeddedWallets`). Keep createOnLogin off so it cannot race
 * and mint a second pair of wallets.
 * @see https://docs.privy.io/basics/react/advanced/automatic-wallet-creation
 */
export const privyConfig: PrivyClientConfig = {
  appearance: {
    walletChainType: 'ethereum-and-solana',
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'off',
    },
    solana: {
      createOnLogin: 'off',
    },
  },
};
