# Ziti

Expo app for Ziti. Backend logic lives in Convex (`convex/`).

## Convex environment (send + rewards)

Set these on your Convex deployment (`npx convex env set KEY value`):

| Key | Required | Notes |
| --- | --- | --- |
| `PRIVY_APP_ID` | yes | Same Privy app as the client |
| `PRIVY_APP_SECRET` | yes | Privy app secret (server only) |
| `PRIVY_AUTHORIZATION_PRIVATE_KEY` | yes | From Privy Dashboard → Authorization keys (`wallet-auth:…`) |
| `PRIVY_EARN_VAULT_ID` | for Earn | Vault ID from Privy Dashboard → Wallet infrastructure → Earn |
| `ALCHEMY_API_KEY` | yes | Used for EVM/Solana RPC + receipt polling |
| `TREASURY_KEYSTORE_PASSWORD` | yes | Password for `convex/keystores/treasury.json` |
| `CASHBACK_KEYSTORE_PASSWORD` | for cashback | Password for `convex/keystores/cashback.json` (USDC redemptions) |
| `REWARD_TOKEN_ADDRESS` | no | Defaults to Base reward token (CashBox Points) `0x4ed932ac83f77a5d4f3d950ab9ba90882ed06e55` |
| `REWARD_CHAIN_ID` | no | Default `8453` (Base). Use `84532` for Base Sepolia |

The treasury private key is **not** an env var — it lives in encrypted [`convex/keystores/treasury.json`](convex/keystores/). The decrypt password is Convex env `TREASURY_KEYSTORE_PASSWORD`.

Cashback USDC redemptions use a separate encrypted [`convex/keystores/cashback.json`](convex/keystores/) wallet (`CASHBACK_KEYSTORE_PASSWORD`). Top up that address on Base with USDC (payouts) and ETH (gas).

Client env vars are listed in `.env.example`.

### Treasury keystore (reward token sends)

```bash
TREASURY_KEYSTORE_PASSWORD='your-password' pnpm keystore:treasury -- --private-key 0x...
# or
TREASURY_KEYSTORE_PASSWORD='your-password' pnpm keystore:treasury -- --mnemonic "word1 word2 ..."

npx convex env set TREASURY_KEYSTORE_PASSWORD 'your-password'
```

### Cashback keystore (USDC redemptions)

```bash
CASHBACK_KEYSTORE_PASSWORD='your-password' pnpm keystore:cashback -- --private-key 0x...
# Fund the printed address on Base with USDC and a small amount of ETH

npx convex env set CASHBACK_KEYSTORE_PASSWORD 'your-password'
```

Reward curve and cashback conversion rates live in [`convex/config/app.config.ts`](convex/config/app.config.ts) and are exposed to the client via the `appConfig.getPublic` Convex query.

### Privy authorization key (user payment sends)

1. Privy Dashboard → **Wallet infrastructure → Authorization keys** → **Create new key**
2. Save the **key quorum ID** → `EXPO_PUBLIC_PRIVY_SIGNER_ID` in `.env.local`
3. Save the **private key** on Convex:

```bash
npx convex env set PRIVY_AUTHORIZATION_PRIVATE_KEY 'wallet-auth:...'
```

4. Reload the app and log in once so wallets get the signer attached (`addSigners`)

See [`convex/keystores/README.md`](convex/keystores/README.md).

### Privy Earn (yield vaults)

1. Privy Dashboard → **Wallet infrastructure → Earn** → deploy a fee wrapper and pick a Morpho vault ([setup guide](https://docs.privy.io/wallets/actions/earn/setup))
2. Copy the **vault ID** from the dashboard
3. Set it on Convex:

```bash
npx convex env set PRIVY_EARN_VAULT_ID '<vault_id>'
```

4. Verify the vault is live (optional):

```bash
curl "https://api.privy.io/v1/earn/ethereum/vaults/<vault_id>" \
  -H "privy-app-id: <your-app-id>" \
  -u "<your-app-id>:<your-app-secret>"
```

Deposits and withdrawals run through Convex using the same authorization key as payment sends. Users manage yield from the **Earn** tab.

If deposits fail with "vault is not available for deposits or withdrawals", the fee wrapper may still be deploying. In Privy Dashboard → **Wallet infrastructure → Earn**, wait until the vault shows as live, then retry.
