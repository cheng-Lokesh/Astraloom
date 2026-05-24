import { NextRequest, NextResponse } from "next/server";

import { verifyStripeSignature } from "@/lib/payments/stripe.server";
import { sha256Hex, stableStringify } from "@/lib/server-writers/hash";
import { checkRuntimeGate, createTraceId, gateErrorResponse } from "@/lib/server-writers/runtime-gates";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StripeCheckoutSession = {
  id: string;
  amount_total?: number;
  currency?: string;
  metadata?: {
    user_id?: string;
    simulation_run_id?: string;
    trace_id?: string;
  };
};

type StripeEvent = {
  id: string;
  type: string;
  data: { object: StripeCheckoutSession };
};

export async function POST(request: NextRequest) {
  const gate = checkRuntimeGate("stripe");
  const rawBody = await request.text();
  const signature = verifyStripeSignature(
    rawBody,
    request.headers.get("stripe-signature"),
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  if (!signature.ok) {
    return NextResponse.json(
      { ok: false, trace_id: gate.traceId, error_code: signature.errorCode },
      { status: 400 },
    );
  }

  if (!gate.allowed) {
    return NextResponse.json(gateErrorResponse(gate), { status: 503 });
  }

  const supabase = getServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, trace_id: gate.traceId, error_code: "service_role_missing" },
      { status: 503 },
    );
  }
  const serviceClient = supabase;

  const event = JSON.parse(rawBody) as StripeEvent;
  const traceId = event.data.object.metadata?.trace_id || createTraceId("stripe");
  const idempotencyKey = `stripe_event:${event.id}`;
  const requestHash = await sha256Hex(stableStringify({ id: event.id, type: event.type }));

  const { data: existing } = await serviceClient
    .from("writer_idempotency_keys")
    .select("id,status")
    .eq("key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      trace_id: traceId,
      duplicate: true,
      status: existing.status,
    });
  }

  await serviceClient.from("writer_idempotency_keys").insert({
    key: idempotencyKey,
    trace_id: traceId,
    contract_id: "payment_entitlement_record",
    user_id: event.data.object.metadata?.user_id || null,
    request_hash: requestHash,
    status: "reserved",
  });

  const session = event.data.object;
  const validAmount = session.amount_total === 990;
  const validCurrency = (session.currency ?? "usd").toLowerCase() === "usd";

  if (event.type === "checkout.session.completed" && validAmount && validCurrency) {
    await serviceClient
      .from("payments")
      .update({
        status: "paid",
        entitlement_type: "single_simulation_report",
        unlock_scope: "single_simulation_report",
        refund_status: "none",
        error_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", "stripe")
      .eq("provider_payment_id", session.id);

    await markIdempotentComplete(event.id, traceId);

    return NextResponse.json({ ok: true, trace_id: traceId, unlocked: true });
  }

  if (
    event.type === "checkout.session.expired" ||
    event.type === "payment_intent.payment_failed"
  ) {
    await serviceClient
      .from("payments")
      .update({
        status: event.type === "checkout.session.expired" ? "expired" : "failed",
        entitlement_type: "none",
        error_code: event.type,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", "stripe")
      .eq("provider_payment_id", session.id);
  }

  await markIdempotentComplete(event.id, traceId);

  return NextResponse.json({
    ok: true,
    trace_id: traceId,
    unlocked: false,
    event_type: event.type,
  });

  async function markIdempotentComplete(eventId: string, currentTraceId: string) {
    await serviceClient
      .from("writer_idempotency_keys")
      .update({
        status: "completed",
        response_ref: { stripe_event_id: eventId },
        updated_at: new Date().toISOString(),
      })
      .eq("key", `stripe_event:${eventId}`);

    await serviceClient.from("writer_audit_events").insert({
      trace_id: currentTraceId,
      contract_id: "payment_entitlement_record",
      lifecycle: "write_succeeded",
      actor_type: "stripe_webhook",
      user_id: session.metadata?.user_id || null,
      target_tables: ["payments", "writer_idempotency_keys"],
      idempotency_key: `stripe_event:${eventId}`,
      request_hash: requestHash,
      gate_decision: "allowed",
      writer_version: "paid-beta-writer-v1",
      metadata: { stripe_event_type: event.type },
    });
  }
}
