import { query } from "./_generated/server";

import { appConfig } from "./config/app.config";

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
