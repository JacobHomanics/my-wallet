# Cashbox

Expo app for Cashbox. Backend logic lives in Convex (`convex/`).

## Convex environment (send + rewards)

Set these on your Convex deployment (`npx convex env set KEY value`):

| Key | Required | Notes |
| --- | --- | --- |
| `PRIVY_APP_ID` | yes | Same Privy app as the client |
| `PRIVY_APP_SECRET` | yes | Privy app secret (server only) |
| `PRIVY_AUTHORIZATION_PRIVATE_KEY` | yes | From Privy Dashboard → Authorization keys (`wallet-auth:…`) |
| `ALCHEMY_API_KEY` | yes | Used for EVM/Solana RPC + receipt polling |
| `TREASURY_KEYSTORE_PASSWORD` | yes | Password for `convex/keystores/treasury.json` |
| `REWARD_TOKEN_ADDRESS` | no | Defaults to Base reward token (CashBox Points) `0x4ed932ac83f77a5d4f3d950ab9ba90882ed06e55` |
| `REWARD_CHAIN_ID` | no | Default `8453` (Base). Use `84532` for Base Sepolia |

The treasury private key is **not** an env var — it lives in encrypted [`convex/keystores/treasury.json`](convex/keystores/). The decrypt password is Convex env `TREASURY_KEYSTORE_PASSWORD`.

Client env vars are listed in `.env.example`.

### Treasury keystore (reward token sends)

```bash
TREASURY_KEYSTORE_PASSWORD='your-password' pnpm keystore:treasury -- --private-key 0x...
# or
TREASURY_KEYSTORE_PASSWORD='your-password' pnpm keystore:treasury -- --mnemonic "word1 word2 ..."

npx convex env set TREASURY_KEYSTORE_PASSWORD 'your-password'
```

### Privy authorization key (user payment sends)

1. Privy Dashboard → **Wallet infrastructure → Authorization keys** → **Create new key**
2. Save the **key quorum ID** → `EXPO_PUBLIC_PRIVY_SIGNER_ID` in `.env.local`
3. Save the **private key** on Convex:

```bash
npx convex env set PRIVY_AUTHORIZATION_PRIVATE_KEY 'wallet-auth:...'
```

4. Reload the app and log in once so wallets get the signer attached (`addSigners`)

See [`convex/keystores/README.md`](convex/keystores/README.md).
