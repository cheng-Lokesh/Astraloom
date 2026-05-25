import { NextRequest, NextResponse } from "next/server";

import { generateDeepSeekJson } from "@/lib/llm/deepseek.server";
import { logModelCall } from "@/lib/model-call-log/log-model-call";
import { recordReportGenerationEvent } from "@/lib/observability/audit-event";
import { recordGenerationJob } from "@/lib/server-writers/generation-jobs.server";
import { checkRuntimeGate, gateErrorResponse } from "@/lib/server-writers/runtime-gates";
import { isUuid, jsonError } from "@/lib/server-writers/validation";
import { getAuthenticatedServerContext } from "@/lib/supabase/service-role.server";

export const dynamic = "force-dynamic";

type ClaimInput = {
  id?: unknown;
  summary?: unknown;
  evidence_event_ids?: unknown;
  confidence?: unknown;
};

type GenerateReportOutput = {
  free_preview: Record<string, unknown>;
  paid_sections: {
    complete_event_log: unknown[];
    relation_before_after: unknown[];
    npc_path_summaries: unknown[];
    parallel_self_comparison: unknown[];
    key_variables: unknown[];
    strategy_guide: unknown[];
    evidence_chain_drilldown: unknown[];
  };
  disclaimer: string;
};

export async function POST(request: NextRequest) {
  const gate = checkRuntimeGate("ai");

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
    return jsonError("invalid_report_generation_input", gate.traceId, 400);
  }

  const claimsHaveEvidence = body.claims.every(
    (claim) =>
      Array.isArray(claim.evidence_event_ids) &&
      claim.evidence_event_ids.length > 0,
  );

  if (!claimsHaveEvidence) {
    return jsonError("claims_missing_evidence_event_ids", gate.traceId, 422);
  }

  const result = await generateDeepSeekJson<GenerateReportOutput>({
    traceId: gate.traceId,
    modelTier: "deep",
    promptVersion: "generate-report-text-v1",
    systemPrompt:
      "You write report copy from existing claims and evidence only. Return JSON only. Do not create new claims, increase certainty, or bypass safety downgrade.",
    userPrompt: JSON.stringify({
      task: "Generate free_preview and paid_sections from already built claims, events, agents, and relation edges.",
      constraints: [
        "Do not add claims not present in claims.",
        "Every paid section item must reference claim ids and evidence_event_ids.",
        "Paid unlock expands evidence and strategy depth only.",
      ],
      claims: body.claims,
      events: body.events,
      agents: body.agents,
      relation_edges: body.relationEdges,
    }),
    maxTokens: 1400,
  });
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
    traceId: gate.traceId,
    userId: auth.user.id,
    jobType: "report_text_generate",
    promptVersion: result.promptVersion,
    modelVersion: result.modelVersion,
    latencyMs: result.latencyMs,
    inputTokenEstimate: result.inputTokenEstimate,
    outputTokenEstimate: result.outputTokenEstimate,
    costEstimate: result.costEstimate,
    errorCode: result.errorCode,
    metadata: {
      claim_count: claimIds.length,
      evidence_event_count: evidenceEventCount,
      paid_state: "paid",
    },
  });

  recordReportGenerationEvent({
    traceId: gate.traceId,
    claimIds,
    evidenceEventCount,
    paidState: "paid",
    errorCode: result.errorCode,
  });

  await recordGenerationJob({
    supabase: auth.supabase,
    userId: auth.user.id,
    seedContextId: body.seedContextId,
    simulationRunId: body.simulationRunId,
    traceId: gate.traceId,
    jobType: "report_text_generate",
    status: result.ok ? "completed" : "failed",
    inputRefs: { claim_count: body.claims.length },
    outputRefs: result.ok
      ? {
          paid_section_keys: Object.keys(result.output.paid_sections),
          claim_ids: body.claims.map((claim) => claim.id).filter(Boolean),
        }
      : { failed: true },
    modelVersion: result.modelVersion,
    promptVersion: result.promptVersion,
    costEstimate: result.costEstimate,
    errorCode: result.errorCode,
  });

  if (!result.ok) {
    return jsonError(result.errorCode, gate.traceId, 502);
  }

  return NextResponse.json({
    ok: true,
    trace_id: gate.traceId,
    model_version: result.modelVersion,
    prompt_version: result.promptVersion,
    cost_estimate: result.costEstimate,
    ...result.output,
  });
}
