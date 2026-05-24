import { NextRequest, NextResponse } from "next/server";

import { createStripeCheckoutSession } from "@/lib/payments/stripe.server";
import { checkRuntimeGate, gateErrorResponse } from "@/lib/server-writers/runtime-gates";
import { isUuid, jsonError } from "@/lib/server-writers/validation";
import { getAuthenticatedServerContext } from "@/lib/supabase/service-role.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const gate = checkRuntimeGate("stripe");

  if (!gate.allowed) {
    return NextResponse.json(gateErrorResponse(gate), { status: 503 });
  }

  const auth = await getAuthenticatedServerContext(request);

  if (!auth.ok) {
    return jsonError(auth.errorCode, gate.traceId, auth.status);
  }

  const body = (await request.json().catch(() => null)) as {
    seedContextId?: unknown;
    simulationRunId?: unknown;
  } | null;

  if (!body || !isUuid(body.seedContextId)) {
    return jsonError("invalid_seed_context_id", gate.traceId, 400);
  }

  const simulationRunId = isUuid(body.simulationRunId) ? body.simulationRunId : null;
  const checkout = await createStripeCheckoutSession({
    userId: auth.user.id,
    seedContextId: body.seedContextId,
    simulationRunId,
    traceId: gate.traceId,
  });

  if (!checkout.ok) {
    return jsonError(checkout.errorCode, gate.traceId, 502);
  }

  await auth.supabase.from("payments").insert({
    user_id: auth.user.id,
    simulation_run_id: simulationRunId,
    provider: "stripe",
    provider_payment_id: checkout.sessionId,
    amount_cents: 990,
    currency: "usd",
    status: "pending",
    entitlement_type: "none",
    unlock_scope: "single_simulation_report",
    refund_status: "none",
    error_code: null,
  });

  return NextResponse.json({
    ok: true,
    trace_id: gate.traceId,
    checkout_url: checkout.checkoutUrl,
    checkout_session_id: checkout.sessionId,
  });
}
