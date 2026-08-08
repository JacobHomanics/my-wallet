# Treasury keystore for Convex Node actions (reward token sends)
#
# File (commit the encrypted keystore; keep the password in Convex env only):
# - treasury.json   Encrypted Ethereum V3 keystore
#
# Create:
#   TREASURY_KEYSTORE_PASSWORD='...' pnpm keystore:treasury -- --private-key 0x...
#   # or
#   TREASURY_KEYSTORE_PASSWORD='...' pnpm keystore:treasury -- --mnemonic "..."
#
# Convex env (password only — not the private key):
#   npx convex env set TREASURY_KEYSTORE_PASSWORD '...'
#
# Privy authorization private key stays in Convex env:
#   npx convex env set PRIVY_AUTHORIZATION_PRIVATE_KEY 'wallet-auth:...'
