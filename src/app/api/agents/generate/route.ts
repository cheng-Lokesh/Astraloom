import { NextRequest, NextResponse } from "next/server";

import { generateDeepSeekJson } from "@/lib/llm/deepseek.server";
import { recordGenerationJob } from "@/lib/server-writers/generation-jobs.server";
import { checkRuntimeGate, gateErrorResponse } from "@/lib/server-writers/runtime-gates";
import { isUuid, jsonError } from "@/lib/server-writers/validation";
import { getAuthenticatedServerContext } from "@/lib/supabase/service-role.server";

export const dynamic = "force-dynamic";

type GenerateAgentsOutput = {
  agent_profiles: Array<{
    key_person_id: string;
    agent_type: "user_core" | "user_variant" | "npc" | "group";
    display_name: string;
    relationship_to_user: string;
    psychology: Record<string, unknown>;
    motivation: Record<string, unknown>;
    resources: Record<string, unknown>;
    behavior_policy: Record<string, unknown>;
    confidence: number;
    evidence_refs: string[];
  }>;
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
    confirmedPeople?: unknown;
  } | null;

  if (!body || !isUuid(body.seedContextId) || !Array.isArray(body.confirmedPeople)) {
    return jsonError("invalid_agent_generation_input", gate.traceId, 400);
  }

  const confirmedPeople = body.confirmedPeople.slice(0, 12);

  if (confirmedPeople.length === 0) {
    return jsonError("confirmed_people_required", gate.traceId, 400);
  }

  const result = await generateDeepSeekJson<GenerateAgentsOutput>({
    traceId: gate.traceId,
    modelTier: "fast",
    promptVersion: "generate-agents-v1",
    systemPrompt:
      "You draft Agent Profiles for a relationship and decision sandbox. Return JSON only. Preserve uncertainty, cite evidence_refs, and never create final report claims.",
    userPrompt: JSON.stringify({
      task: "Generate Agent Profile drafts from confirmed people.",
      constraints: [
        "Do not modify relation edge weights.",
        "Do not state hidden motives as certainty.",
        "Each agent must carry evidence_refs and confidence.",
      ],
      confirmed_people: confirmedPeople,
    }),
  });

  await recordGenerationJob({
    supabase: auth.supabase,
    userId: auth.user.id,
    seedContextId: body.seedContextId,
    traceId: gate.traceId,
    jobType: "agent_profiles_generate",
    status: result.ok ? "completed" : "failed",
    inputRefs: { confirmed_people_count: confirmedPeople.length },
    outputRefs: result.ok
      ? { agent_profile_count: result.output.agent_profiles.length }
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
