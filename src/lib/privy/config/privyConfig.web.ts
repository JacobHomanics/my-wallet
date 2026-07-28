import type { PrivyClientConfig } from '@privy-io/react-auth';
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
} from '@solana/kit';

import {
  getSolanaRpcSubscriptionsUrl,
  getSolanaRpcUrl,
} from '@/lib/send/rpc';

/**
 * Embedded wallets are created manually after whitelabel OTP
 * (`useCreateEmbeddedWallets`). Keep createOnLogin off so it cannot race
 * and mint a second pair of wallets.
 * @see https://docs.privy.io/basics/react/advanced/automatic-wallet-creation
 * @see https://docs.privy.io/basics/react/advanced/configuring-solana-networks
 */
export const privyConfig: PrivyClientConfig = {
  appearance: {
    walletChainType: 'ethereum-and-solana',
  },
  embeddedWallets: {
    // Privy confirmation modals are DOM/Headless UI and break on
    // react-native-web; this app uses its own Send confirmation UI.
    showWalletUIs: false,
    ethereum: {
      createOnLogin: 'off',
    },
    solana: {
      createOnLogin: 'off',
    },
  },
  // Required for Privy `signAndSendTransaction` / embedded Solana sends.
  solana: {
    rpcs: {
      'solana:mainnet': {
        rpc: createSolanaRpc(getSolanaRpcUrl()),
        rpcSubscriptions: createSolanaRpcSubscriptions(
          getSolanaRpcSubscriptionsUrl(),
        ),
      },
    },
  },
};
