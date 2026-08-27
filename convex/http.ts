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

const http = httpRouter();

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: stripeWebhook,
});

export default http;
