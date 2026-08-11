/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as contacts from "../contacts.js";
import type * as farcaster from "../farcaster.js";
import type * as lib_decryptKeystore from "../lib/decryptKeystore.js";
import type * as lib_encodeErc20Transfer from "../lib/encodeErc20Transfer.js";
import type * as lib_evmSend from "../lib/evmSend.js";
import type * as lib_loadKeystores from "../lib/loadKeystores.js";
import type * as lib_networks from "../lib/networks.js";
import type * as lib_neynar from "../lib/neynar.js";
import type * as lib_privy from "../lib/privy.js";
import type * as lib_solanaSend from "../lib/solanaSend.js";
import type * as lib_stripe from "../lib/stripe.js";
import type * as lib_treasuryReward from "../lib/treasuryReward.js";
import type * as lib_waitForEvmReceipt from "../lib/waitForEvmReceipt.js";
import type * as onramp from "../onramp.js";
import type * as send from "../send.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  contacts: typeof contacts;
  farcaster: typeof farcaster;
  "lib/decryptKeystore": typeof lib_decryptKeystore;
  "lib/encodeErc20Transfer": typeof lib_encodeErc20Transfer;
  "lib/evmSend": typeof lib_evmSend;
  "lib/loadKeystores": typeof lib_loadKeystores;
  "lib/networks": typeof lib_networks;
  "lib/neynar": typeof lib_neynar;
  "lib/privy": typeof lib_privy;
  "lib/solanaSend": typeof lib_solanaSend;
  "lib/stripe": typeof lib_stripe;
  "lib/treasuryReward": typeof lib_treasuryReward;
  "lib/waitForEvmReceipt": typeof lib_waitForEvmReceipt;
  onramp: typeof onramp;
  send: typeof send;
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
