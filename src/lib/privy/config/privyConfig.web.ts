import type { PrivyClientConfig } from '@privy-io/react-auth';

/**
 * Ethereum + Solana embedded wallet config.
 * createOnLogin is kept as a fallback, but whitelabel OTP (`loginWithCode`)
 * does not trigger it — see `useCreateEmbeddedWallets`.
 * @see https://docs.privy.io/basics/react/advanced/automatic-wallet-creation
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
};
