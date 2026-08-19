import { query } from "./_generated/server";

import { appConfig } from "./config/app.config";

/** Public app config for client UI (rewards curve, cashback rates). */
export const getPublic = query({
  args: {},
  handler: async () => ({
    rewards: appConfig.rewards,
    cashback: appConfig.cashback,
  }),
});
