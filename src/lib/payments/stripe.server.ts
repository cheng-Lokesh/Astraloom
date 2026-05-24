import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { appConfig } from "@/lib/env";

export type StripeCheckoutInput = {
  userId: string;
  seedContextId: string;
  simulationRunId: string | null;
  traceId: string;
};

export type StripeCheckoutResult =
  | { ok: true; sessionId: string; checkoutUrl: string }
  | { ok: false; errorCode: string };

export async function createStripeCheckoutSession({
  userId,
  seedContextId,
  simulationRunId,
  traceId,
}: StripeCheckoutInput): Promise<StripeCheckoutResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return { ok: false, errorCode: "stripe_secret_missing" };
  }

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${appConfig.appUrl}/billing?checkout=success`);
  form.set("cancel_url", `${appConfig.appUrl}/billing?checkout=cancel`);
  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][unit_amount]", "990");
  form.set(
    "line_items[0][price_data][product_data][name]",
    "MiroFish Paid Evidence Unlock",
  );
  form.set("line_items[0][quantity]", "1");
  form.set("metadata[user_id]", userId);
  form.set("metadata[seed_context_id]", seedContextId);
  form.set("metadata[simulation_run_id]", simulationRunId ?? "");
  form.set("metadata[trace_id]", traceId);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secretKey}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!response.ok) {
    return { ok: false, errorCode: `stripe_http_${response.status}` };
  }

  const session = (await response.json()) as { id?: string; url?: string };

  if (!session.id || !session.url) {
    return { ok: false, errorCode: "stripe_checkout_session_invalid" };
  }

  return { ok: true, sessionId: session.id, checkoutUrl: session.url };
}

export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string | undefined,
) {
  if (!webhookSecret) {
    return { ok: false as const, errorCode: "stripe_webhook_secret_missing" };
  }

  if (!signatureHeader) {
    return { ok: false as const, errorCode: "stripe_signature_missing" };
  }

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
  const timestamp = parts.t;
  const expected = parts.v1;

  if (!timestamp || !expected) {
    return { ok: false as const, errorCode: "stripe_signature_malformed" };
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const actual = createHmac("sha256", webhookSecret)
    .update(signedPayload)
    .digest("hex");
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return { ok: false as const, errorCode: "stripe_signature_invalid" };
  }

  return { ok: true as const };
}
