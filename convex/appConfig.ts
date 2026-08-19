import { query } from "./_generated/server";

import { appConfig } from "./config/app.config";
import { CASHBACK_USDC_ADDRESS } from "./lib/cashbackConfig";
import {
  getCashbackKeystoreAddress,
  getTreasuryKeystoreAddress,
} from "./lib/keystoreAddresses";

const DEFAULT_REWARD_TOKEN =
  "0x4ed932ac83f77a5d4f3d950ab9ba90882ed06e55" as const;
const DEFAULT_REWARD_CHAIN_ID = 8453;
const DEFAULT_CASHBACK_CHAIN_ID = 8453;

function getRewardChainId(): number {
  const raw = process.env.REWARD_CHAIN_ID?.trim();
  if (!raw) {
    return DEFAULT_REWARD_CHAIN_ID;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : DEFAULT_REWARD_CHAIN_ID;
}

function getRewardTokenAddress(): string {
  return process.env.REWARD_TOKEN_ADDRESS?.trim() || DEFAULT_REWARD_TOKEN;
}

/** Public app config for client UI (rewards, cashback, tax, gas sponsorship). */
export const getPublic = query({
  args: {},
  handler: async () => ({
    gasSponsorship: appConfig.gasSponsorship,
    tax: appConfig.tax,
    rewards: appConfig.rewards,
    cashback: appConfig.cashback,
  }),
});

/** Full backend config for the hidden `/config` screen. */
export const getConfigScreen = query({
  args: {},
  handler: async () => ({
    wallets: {
      treasury: getTreasuryKeystoreAddress(),
      cashback: getCashbackKeystoreAddress(),
    },
    config: {
      brand: appConfig.brand,
      gasSponsorship: appConfig.gasSponsorship,
      tax: appConfig.tax,
      rewards: appConfig.rewards,
      cashback: appConfig.cashback,
    },
    tokens: {
      rewardTokenAddress: getRewardTokenAddress(),
      rewardChainId: getRewardChainId(),
      cashbackUsdcAddress: CASHBACK_USDC_ADDRESS,
      cashbackChainId: DEFAULT_CASHBACK_CHAIN_ID,
    },
  }),
});
