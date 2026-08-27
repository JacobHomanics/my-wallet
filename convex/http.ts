import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import {
  getStripeWebhookSecret,
  readOnrampSessionEvent,
  verifyStripeWebhook,
} from "./lib/stripeWebhook";

/**
 * Stripe crypto onramp webhook.
 *
 * This endpoint is the only writer of fulfillment state: the browser can lie,
 * close, or never come back, so a deposit counts as settled only once Stripe
 * says so over a signed request. Order matters — verify, then de-duplicate on
 * the event id, then apply — so a replayed delivery cannot re-trigger the vault
 * auto-deposit.
 */
const stripeWebhook = httpAction(async (ctx, request) => {
  const payload = await request.text();

  const verification = await verifyStripeWebhook({
    payload,
    signatureHeader: request.headers.get("Stripe-Signature"),
    secret: getStripeWebhookSecret(),
  });

  if (!verification.ok) {
    console.error("[stripe-webhook] rejected", { reason: verification.reason });
    return new Response(verification.reason, { status: 400 });
  }

  const { event } = verification;
  const sessionEvent = readOnrampSessionEvent(event);

  const { alreadyProcessed } = await ctx.runMutation(
    internal.onrampHeadless.recordWebhookEvent,
    {
      stripeEventId: event.id,
      type: event.type,
      payloadSessionId: sessionEvent?.sessionId,
    },
  );

  if (alreadyProcessed || !sessionEvent) {
    return new Response(null, { status: 200 });
  }

  const claim = await ctx.runMutation(
    internal.onrampHeadless.applySessionEvent,
    {
      stripeSessionId: sessionEvent.sessionId,
      status: sessionEvent.status ?? undefined,
      transactionId: sessionEvent.transactionId ?? undefined,
      destinationAmount: sessionEvent.destinationAmount ?? undefined,
      failureReason: sessionEvent.failureReason ?? undefined,
    },
  );

  // A claim is returned exactly once per session, by the delivery that flipped
  // the guard — scheduling here therefore runs the vault deposit once.
  if (claim) {
    await ctx.scheduler.runAfter(0, internal.onrampHeadless.runAutoDeposit, {
      stripeSessionId: sessionEvent.sessionId,
      ethereumWalletId: claim.ethereumWalletId,
      ethereumAddress: claim.ethereumAddress,
      priorBalanceRaw: claim.priorBalanceRaw,
    });
  }

  return new Response(null, { status: 200 });
});

/**
 * Report the caller's IP address.
 *
 * ACH debits need an online mandate carrying the payer's IP, and neither the
 * browser nor a Convex action can see it — only an HTTP action reading the
 * proxy headers can. Returns nothing sensitive beyond the caller's own address.
 */
const clientIp = httpAction(async (_ctx, request) => {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() ?? "";
  return Response.json(
    { ip: ip || null },
    {
      headers: {
        "Cache-Control": "no-store",
        // The browser calls this cross-origin (app origin -> convex.site) and
        // the response only ever describes the caller itself.
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
});

const clientIpPreflight = httpAction(async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  });
});

const http = httpRouter();

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: stripeWebhook,
});

http.route({
  path: "/stripe/client-ip",
  method: "GET",
  handler: clientIp,
});

http.route({
  path: "/stripe/client-ip",
  method: "OPTIONS",
  handler: clientIpPreflight,
});

export default http;
