# Treasury keystore for Convex Node actions (reward token sends)
#
# Files (commit the encrypted keystores; keep passwords in Convex env only):
# - treasury.json   Encrypted Ethereum V3 keystore — sends CashBox Points
# - cashback.json   Encrypted Ethereum V3 keystore — sends USDC redemptions
#
# Treasury (reward token sends):
#   TREASURY_KEYSTORE_PASSWORD='...' pnpm keystore:treasury -- --private-key 0x...
#   # or
#   TREASURY_KEYSTORE_PASSWORD='...' pnpm keystore:treasury -- --mnemonic "..."
#
# Cashback (USDC redemptions):
#   CASHBACK_KEYSTORE_PASSWORD='...' pnpm keystore:cashback -- --private-key 0x...
#   # Fund the printed address on Base with USDC + ETH for gas
#
# Convex env (passwords only — not private keys):
#   npx convex env set TREASURY_KEYSTORE_PASSWORD '...'
#   npx convex env set CASHBACK_KEYSTORE_PASSWORD '...'
#
# Optional conversion ratio (default 100 points = 1 USDC):
#   npx convex env set CASHBACK_POINTS_PER_USDC '100'
#
# Privy authorization private key stays in Convex env:
#   npx convex env set PRIVY_AUTHORIZATION_PRIVATE_KEY 'wallet-auth:...'
