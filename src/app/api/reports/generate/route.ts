import { NextRequest, NextResponse } from "next/server";

import { logModelCall } from "@/lib/model-call-log/log-model-call";
import { recordReportGenerationEvent } from "@/lib/observability/audit-event";
import { createTraceId } from "@/lib/server-writers/runtime-gates";
import { isUuid, jsonError } from "@/lib/server-writers/validation";
import { getAuthenticatedServerContext } from "@/lib/supabase/service-role.server";

export const dynamic = "force-dynamic";

type ClaimInput = {
  id?: unknown;
  summary?: unknown;
  evidence_event_ids?: unknown;
  confidence?: unknown;
};

export async function POST(request: NextRequest) {
  const traceId = createTraceId("report_text_generate");

  const auth = await getAuthenticatedServerContext(request);

  if (!auth.ok) {
    return jsonError(auth.errorCode, traceId, auth.status);
  }

  const body = (await request.json().catch(() => null)) as {
    seedContextId?: unknown;
    simulationRunId?: unknown;
    claims?: ClaimInput[];
    events?: unknown;
    agents?: unknown;
    relationEdges?: unknown;
  } | null;

  if (
    !body ||
    !isUuid(body.seedContextId) ||
    !isUuid(body.simulationRunId) ||
    !Array.isArray(body.claims)
  ) {
    return jsonError("invalid_report_generation_input", traceId, 400);
  }

  const claimsHaveEvidence = body.claims.every(
    (claim) =>
      Array.isArray(claim.evidence_event_ids) &&
      claim.evidence_event_ids.length > 0,
  );

  if (!claimsHaveEvidence) {
    return jsonError("claims_missing_evidence_event_ids", traceId, 422);
  }
  const claimIds = body.claims
    .map((claim) => (typeof claim.id === "string" ? claim.id : null))
    .filter((claimId): claimId is string => Boolean(claimId));
  const evidenceEventCount = body.claims.reduce((total, claim) => {
    return (
      total +
      (Array.isArray(claim.evidence_event_ids)
        ? claim.evidence_event_ids.length
        : 0)
    );
  }, 0);

  await logModelCall({
    traceId,
    userId: auth.user.id,
    jobType: "report_text_generate",
    source: "local_fallback",
    promptVersion: "report-engine-v1",
    modelVersion: "not_called",
    latencyMs: 0,
    inputTokenEstimate: 0,
    outputTokenEstimate: 0,
    costEstimate: 0,
    errorCode: "llm_report_generation_forbidden",
    metadata: {
      claim_count: claimIds.length,
      evidence_event_count: evidenceEventCount,
      paid_state: "unknown",
    },
  });

  recordReportGenerationEvent({
    traceId,
    claimIds,
    evidenceEventCount,
    paidState: "unknown",
    errorCode: "llm_report_generation_forbidden",
  });

  return NextResponse.json(
    {
      ok: false,
      trace_id: traceId,
      error_code: "llm_report_generation_forbidden",
      fallback_required: "report_engine_v1",
    },
    { status: 403 },
  );
}
