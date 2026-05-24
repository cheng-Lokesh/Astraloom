import { NextRequest, NextResponse } from "next/server";

import { generateDeepSeekJson } from "@/lib/llm/deepseek.server";
import { recordGenerationJob } from "@/lib/server-writers/generation-jobs.server";
import { checkRuntimeGate, gateErrorResponse } from "@/lib/server-writers/runtime-gates";
import { hasHighRiskSignal, isUuid, jsonError } from "@/lib/server-writers/validation";
import { getAuthenticatedServerContext } from "@/lib/supabase/service-role.server";

export const dynamic = "force-dynamic";

type ExtractPeopleOutput = {
  candidates: Array<{
    display_name: string;
    relationship_to_user: string;
    role_type: string;
    confidence: number;
    known_evidence: string[];
    missing_fields: string[];
    evidence_refs: string[];
  }>;
  safety_level: "normal" | "downgraded";
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
    questionText?: unknown;
    rawContext?: unknown;
  } | null;

  if (!body || !isUuid(body.seedContextId)) {
    return jsonError("invalid_seed_context_id", gate.traceId, 400);
  }

  const sourceText = `${body.questionText ?? ""}\n${body.rawContext ?? ""}`.trim();

  if (sourceText.length < 20) {
    return jsonError("seed_context_too_short", gate.traceId, 400);
  }

  if (hasHighRiskSignal(sourceText)) {
    await recordGenerationJob({
      supabase: auth.supabase,
      userId: auth.user.id,
      seedContextId: body.seedContextId,
      traceId: gate.traceId,
      jobType: "key_people_extract",
      status: "blocked",
      inputRefs: { source_length: sourceText.length },
      outputRefs: { safety: "downgraded_before_llm" },
      modelVersion: "not_called",
      promptVersion: "extract-people-v1",
      costEstimate: 0,
      errorCode: "high_risk_seed_downgraded",
      safetyLevel: "downgraded",
    });

    return jsonError("high_risk_seed_downgraded", gate.traceId, 422);
  }

  const result = await generateDeepSeekJson<ExtractPeopleOutput>({
    traceId: gate.traceId,
    modelTier: "fast",
    promptVersion: "extract-people-v1",
    systemPrompt:
      "You extract key people for an AI life-simulation sandbox. Return JSON only. Do not infer fate, therapy diagnosis, or hidden thoughts as fact.",
    userPrompt: JSON.stringify({
      task: "Extract candidate people from the user's scenario.",
      required_shape: {
        candidates:
          "array of display_name, relationship_to_user, role_type, confidence 0..1, known_evidence, missing_fields, evidence_refs",
        safety_level: "normal",
      },
      source_text: sourceText,
    }),
  });

  await recordGenerationJob({
    supabase: auth.supabase,
    userId: auth.user.id,
    seedContextId: body.seedContextId,
    traceId: gate.traceId,
    jobType: "key_people_extract",
    status: result.ok ? "completed" : "failed",
    inputRefs: { source_length: sourceText.length },
    outputRefs: result.ok
      ? { candidate_count: result.output.candidates.length }
      : { failed: true },
    modelVersion: result.modelVersion,
    promptVersion: result.promptVersion,
    costEstimate: result.costEstimate,
    errorCode: result.errorCode,
    safetyLevel: result.ok ? result.output.safety_level : "normal",
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
