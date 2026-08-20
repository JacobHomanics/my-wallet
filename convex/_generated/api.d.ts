/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appConfig from "../appConfig.js";
import type * as basenames from "../basenames.js";
import type * as cashback from "../cashback.js";
import type * as contacts from "../contacts.js";
import type * as earn from "../earn.js";
import type * as ens from "../ens.js";
import type * as farcaster from "../farcaster.js";
import type * as lens from "../lens.js";
import type * as lib_autoDepositOnrampUsdc from "../lib/autoDepositOnrampUsdc.js";
import type * as lib_autoDepositReceivedUsdc from "../lib/autoDepositReceivedUsdc.js";
import type * as lib_basenames from "../lib/basenames.js";
import type * as lib_cashbackConfig from "../lib/cashbackConfig.js";
import type * as lib_cashbackUsdc from "../lib/cashbackUsdc.js";
import type * as lib_contactIdentity from "../lib/contactIdentity.js";
import type * as lib_decryptKeystore from "../lib/decryptKeystore.js";
import type * as lib_earn from "../lib/earn.js";
import type * as lib_encodeErc20Transfer from "../lib/encodeErc20Transfer.js";
import type * as lib_ens from "../lib/ens.js";
import type * as lib_evmNames from "../lib/evmNames.js";
import type * as lib_evmSend from "../lib/evmSend.js";
import type * as lib_evmSendErrors from "../lib/evmSendErrors.js";
import type * as lib_fetchErc20Balance from "../lib/fetchErc20Balance.js";
import type * as lib_gasSponsorship from "../lib/gasSponsorship.js";
import type * as lib_gasTokens from "../lib/gasTokens.js";
import type * as lib_keystoreAddresses from "../lib/keystoreAddresses.js";
import type * as lib_lens from "../lib/lens.js";
import type * as lib_loadKeystores from "../lib/loadKeystores.js";
import type * as lib_networks from "../lib/networks.js";
import type * as lib_neynar from "../lib/neynar.js";
import type * as lib_nostr from "../lib/nostr.js";
import type * as lib_privy from "../lib/privy.js";
import type * as lib_privyTransfer from "../lib/privyTransfer.js";
import type * as lib_redeemPoints from "../lib/redeemPoints.js";
import type * as lib_retrySendOperation from "../lib/retrySendOperation.js";
import type * as lib_rewardPoints from "../lib/rewardPoints.js";
import type * as lib_sns from "../lib/sns.js";
import type * as lib_solanaSend from "../lib/solanaSend.js";
import type * as lib_stripe from "../lib/stripe.js";
import type * as lib_treasuryReward from "../lib/treasuryReward.js";
import type * as lib_vaultUsdcLeg from "../lib/vaultUsdcLeg.js";
import type * as lib_waitForErc20Balance from "../lib/waitForErc20Balance.js";
import type * as lib_waitForEvmReceipt from "../lib/waitForEvmReceipt.js";
import type * as lib_waitForEvmSendSlot from "../lib/waitForEvmSendSlot.js";
import type * as lib_waitForPrivyTransaction from "../lib/waitForPrivyTransaction.js";
import type * as lib_walletIdentity from "../lib/walletIdentity.js";
import type * as lib_withdrawVaultUsdcForSend from "../lib/withdrawVaultUsdcForSend.js";
import type * as nostr from "../nostr.js";
import type * as onramp from "../onramp.js";
import type * as send from "../send.js";
import type * as sns from "../sns.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appConfig: typeof appConfig;
  basenames: typeof basenames;
  cashback: typeof cashback;
  contacts: typeof contacts;
  earn: typeof earn;
  ens: typeof ens;
  farcaster: typeof farcaster;
  lens: typeof lens;
  "lib/autoDepositOnrampUsdc": typeof lib_autoDepositOnrampUsdc;
  "lib/autoDepositReceivedUsdc": typeof lib_autoDepositReceivedUsdc;
  "lib/basenames": typeof lib_basenames;
  "lib/cashbackConfig": typeof lib_cashbackConfig;
  "lib/cashbackUsdc": typeof lib_cashbackUsdc;
  "lib/contactIdentity": typeof lib_contactIdentity;
  "lib/decryptKeystore": typeof lib_decryptKeystore;
  "lib/earn": typeof lib_earn;
  "lib/encodeErc20Transfer": typeof lib_encodeErc20Transfer;
  "lib/ens": typeof lib_ens;
  "lib/evmNames": typeof lib_evmNames;
  "lib/evmSend": typeof lib_evmSend;
  "lib/evmSendErrors": typeof lib_evmSendErrors;
  "lib/fetchErc20Balance": typeof lib_fetchErc20Balance;
  "lib/gasSponsorship": typeof lib_gasSponsorship;
  "lib/gasTokens": typeof lib_gasTokens;
  "lib/keystoreAddresses": typeof lib_keystoreAddresses;
  "lib/lens": typeof lib_lens;
  "lib/loadKeystores": typeof lib_loadKeystores;
  "lib/networks": typeof lib_networks;
  "lib/neynar": typeof lib_neynar;
  "lib/nostr": typeof lib_nostr;
  "lib/privy": typeof lib_privy;
  "lib/privyTransfer": typeof lib_privyTransfer;
  "lib/redeemPoints": typeof lib_redeemPoints;
  "lib/retrySendOperation": typeof lib_retrySendOperation;
  "lib/rewardPoints": typeof lib_rewardPoints;
  "lib/sns": typeof lib_sns;
  "lib/solanaSend": typeof lib_solanaSend;
  "lib/stripe": typeof lib_stripe;
  "lib/treasuryReward": typeof lib_treasuryReward;
  "lib/vaultUsdcLeg": typeof lib_vaultUsdcLeg;
  "lib/waitForErc20Balance": typeof lib_waitForErc20Balance;
  "lib/waitForEvmReceipt": typeof lib_waitForEvmReceipt;
  "lib/waitForEvmSendSlot": typeof lib_waitForEvmSendSlot;
  "lib/waitForPrivyTransaction": typeof lib_waitForPrivyTransaction;
  "lib/walletIdentity": typeof lib_walletIdentity;
  "lib/withdrawVaultUsdcForSend": typeof lib_withdrawVaultUsdcForSend;
  nostr: typeof nostr;
  onramp: typeof onramp;
  send: typeof send;
  sns: typeof sns;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
