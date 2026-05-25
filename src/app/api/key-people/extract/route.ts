import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateJsonWithLlm } from "@/lib/llm/client";
import {
  isAiGenerationEnabled,
  keyPeopleExtractionModelConfig,
} from "@/lib/llm/model-config";
import { buildExtractPeoplePrompt } from "@/lib/llm/prompts/extract-people";
import { checkLlmRateLimit } from "@/lib/llm/rate-limit";
import { logModelCall } from "@/lib/model-call-log/log-model-call";
import { extractPeopleCandidates } from "@/lib/people/extract";
import { verifySafety } from "@/lib/safety/safety-verifier";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  keyPeopleExtractionSchema,
  type KeyPeopleExtractionOutput,
} from "@/lib/validators/key-people-extraction-schema";
import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";

export const dynamic = "force-dynamic";

const seedContextPayloadSchema = z.object({
  id: z.string().min(1),
  questionText: z.string().default(""),
  trackType: z.enum(["crossroad", "life_climate"]).default("crossroad"),
  timeWindow: z
    .enum(["30_days", "90_days", "1_year", "3_years", "5_years"])
    .default("90_days"),
  situationSummary: z.string().default(""),
  keyPeopleText: z.string().default(""),
  privacyAck: z.boolean().default(true),
  locale: z.enum(["en", "zh"]).default("zh"),
  status: z.enum(["draft", "submitted"]).default("submitted"),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

const requestSchema = z
  .object({
    seedContextId: z.string().min(1),
    seedContext: seedContextPayloadSchema.optional(),
    payload: seedContextPayloadSchema.optional(),
  })
  .transform((value) => ({
    seedContextId: value.seedContextId,
    seedContext: value.seedContext ?? value.payload,
  }))
  .refine((value) => value.seedContext?.id === value.seedContextId, {
    message: "seedContextId must match SeedContext payload id",
  });

function createTraceId() {
  return `key_people_extract_${crypto.randomUUID()}`;
}

function fallbackOutput(
  seedContext: SeedContextDraft,
  traceId: string,
  fallbackReason: string,
) {
  const candidates = extractPeopleCandidates(seedContext);

  return NextResponse.json({
    ok: true,
    trace_id: traceId,
    source: "local_fallback",
    fallback_reason: fallbackReason,
    model_version: "not_called",
    prompt_version: keyPeopleExtractionModelConfig.promptVersion,
    cost_estimate: 0,
    latency_ms: 0,
    error_code: fallbackReason,
    people: candidates.map(candidateToApiPerson),
    candidates,
    uncertainty_flags: [fallbackReason],
  });
}

export async function POST(request: NextRequest) {
  const traceId = createTraceId();
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        error_code: "invalid_request",
      },
      { status: 400 },
    );
  }

  if (!parsed.data.seedContext) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        error_code: "missing_seed_context",
      },
      { status: 400 },
    );
  }

  const seedContext = parsed.data.seedContext satisfies SeedContextDraft;
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return fallbackOutput(seedContext, traceId, "auth_required");
  }

  const safety = verifySafety({ seedContext });

  if (safety.safetyLevel === "downgraded" || safety.safetyLevel === "blocked") {
    await logModelCall({
      traceId,
      userId,
      jobType: "key_people_extract",
      promptVersion: keyPeopleExtractionModelConfig.promptVersion,
      modelVersion: "not_called",
      latencyMs: 0,
      costEstimate: 0,
      errorCode: `safety_${safety.safetyLevel}`,
      metadata: { flags: safety.flags },
    });

    return fallbackOutput(seedContext, traceId, `safety_${safety.safetyLevel}`);
  }

  if (!isAiGenerationEnabled()) {
    await logModelCall({
      traceId,
      userId,
      jobType: "key_people_extract",
      promptVersion: keyPeopleExtractionModelConfig.promptVersion,
      modelVersion: "not_called",
      latencyMs: 0,
      costEstimate: 0,
      errorCode: "ai_generation_disabled",
    });

    return fallbackOutput(seedContext, traceId, "ai_generation_disabled");
  }

  const rateLimit = await checkLlmRateLimit({
    userId,
    jobType: "key_people_extract",
  });

  if (!rateLimit.allowed) {
    await logModelCall({
      traceId,
      userId,
      jobType: "key_people_extract",
      promptVersion: keyPeopleExtractionModelConfig.promptVersion,
      modelVersion: "not_called",
      latencyMs: 0,
      costEstimate: 0,
      errorCode: "rate_limited",
      metadata: {
        limit: rateLimit.limit,
        reset_at: rateLimit.resetAt,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        error_code: "rate_limited",
        retry_after: rateLimit.resetAt,
      },
      { status: 429 },
    );
  }

  const prompt = buildExtractPeoplePrompt(seedContext);
  const llmResult = await generateJsonWithLlm({
    traceId,
    systemPrompt: prompt.system,
    userPrompt: prompt.user,
  });

  if (!llmResult.ok) {
    await logModelCall({
      traceId,
      userId,
      jobType: "key_people_extract",
      promptVersion: prompt.promptVersion,
      modelVersion: llmResult.modelVersion,
      latencyMs: llmResult.latencyMs,
      inputTokenEstimate: llmResult.inputTokenEstimate,
      outputTokenEstimate: llmResult.outputTokenEstimate,
      costEstimate: llmResult.costEstimate,
      errorCode: llmResult.errorCode,
    });

    return fallbackOutput(seedContext, traceId, llmResult.errorCode);
  }

  const parsedJson = parseLlmJson(llmResult.rawText);

  if (!parsedJson.ok) {
    await logModelCall({
      traceId,
      userId,
      jobType: "key_people_extract",
      promptVersion: prompt.promptVersion,
      modelVersion: llmResult.modelVersion,
      latencyMs: llmResult.latencyMs,
      inputTokenEstimate: llmResult.inputTokenEstimate,
      outputTokenEstimate: llmResult.outputTokenEstimate,
      costEstimate: llmResult.costEstimate,
      errorCode: parsedJson.errorCode,
    });

    return fallbackOutput(seedContext, traceId, parsedJson.errorCode);
  }

  const validated = keyPeopleExtractionSchema.safeParse(parsedJson.data);

  if (!validated.success) {
    const errorCode = "invalid_llm_output_schema";

    await logModelCall({
      traceId,
      userId,
      jobType: "key_people_extract",
      promptVersion: prompt.promptVersion,
      modelVersion: llmResult.modelVersion,
      latencyMs: llmResult.latencyMs,
      inputTokenEstimate: llmResult.inputTokenEstimate,
      outputTokenEstimate: llmResult.outputTokenEstimate,
      costEstimate: llmResult.costEstimate,
      errorCode,
    });

    return fallbackOutput(seedContext, traceId, errorCode);
  }

  const output = validated.data;

  if (containsForbiddenMindReading(output)) {
    await logModelCall({
      traceId,
      userId,
      jobType: "key_people_extract",
      promptVersion: prompt.promptVersion,
      modelVersion: llmResult.modelVersion,
      latencyMs: llmResult.latencyMs,
      inputTokenEstimate: llmResult.inputTokenEstimate,
      outputTokenEstimate: llmResult.outputTokenEstimate,
      costEstimate: llmResult.costEstimate,
      errorCode: "llm_output_forbidden_inference",
    });

    return fallbackOutput(
      seedContext,
      traceId,
      "llm_output_forbidden_inference",
    );
  }

  const candidates = output.people.map((person) =>
    apiPersonToCandidate(seedContext.id, person),
  );

  await logModelCall({
    traceId,
    userId,
    jobType: "key_people_extract",
    promptVersion: prompt.promptVersion,
    modelVersion: llmResult.modelVersion,
    latencyMs: llmResult.latencyMs,
    inputTokenEstimate: llmResult.inputTokenEstimate,
    outputTokenEstimate: llmResult.outputTokenEstimate,
    costEstimate: llmResult.costEstimate,
    errorCode: null,
    metadata: { candidate_count: candidates.length },
  });

  return NextResponse.json({
    ok: true,
    trace_id: traceId,
    source: "llm",
    model_version: llmResult.modelVersion,
    prompt_version: prompt.promptVersion,
    cost_estimate: llmResult.costEstimate,
    latency_ms: llmResult.latencyMs,
    error_code: null,
    people: output.people,
    candidates,
    uncertainty_flags: output.uncertainty_flags,
  });
}

async function getAuthenticatedUserId() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;

  return data.user?.id ?? null;
}

function parseLlmJson(rawText: string):
  | { ok: true; data: unknown }
  | { ok: false; errorCode: string } {
  try {
    return { ok: true, data: JSON.parse(rawText) };
  } catch {
    return { ok: false, errorCode: "invalid_llm_json" };
  }
}

function apiPersonToCandidate(
  seedContextId: string,
  person: KeyPeopleExtractionOutput["people"][number],
) {
  const now = new Date().toISOString();
  const normalizedName = person.display_name.trim();

  return {
    id: `kp_llm_${hashText(`${seedContextId}:${normalizedName}`)}`,
    seedContextId,
    label: normalizedName,
    role: person.role_type,
    relationshipToUser: person.relationship_to_user,
    roleType: person.role_type,
    confidence: Math.round(person.confidence * 100),
    knownEvidence: person.known_evidence.join("\n"),
    missingFields: person.missing_fields,
    evidenceRefs: person.source_refs.map(
      (ref) => `seed:${seedContextId}:llm:${hashText(`${normalizedName}:${ref}`)}`,
    ),
    userNote: "",
    confirmed: false,
    status: person.confidence >= 0.7 ? "candidate" : "needs_confirmation",
    source: "seed_context_text",
    evidenceText: person.known_evidence.join("\n"),
    createdAt: now,
    updatedAt: now,
  } satisfies KeyPersonDraft;
}

function candidateToApiPerson(candidate: KeyPersonDraft) {
  return {
    display_name: candidate.label,
    relationship_to_user: normalizeRelationship(candidate.relationshipToUser),
    role_type: normalizeRoleType(candidate.roleType),
    confidence: Number((candidate.confidence / 100).toFixed(2)),
    known_evidence: [candidate.knownEvidence || candidate.evidenceText].filter(
      Boolean,
    ),
    missing_fields: candidate.missingFields,
    source_refs: candidate.evidenceRefs,
  };
}

function normalizeRelationship(value: string) {
  if (value === "family_or_partner") return "family";
  if (
    [
      "boss",
      "partner",
      "competitor",
      "coworker",
      "family",
      "friend",
      "opportunity_source",
      "advisor",
    ].includes(value)
  ) {
    return value;
  }
  if (value === "colleague") return "coworker";
  return "other";
}

function normalizeRoleType(value: string) {
  const lowered = value.toLowerCase();

  if (matchesAny(lowered, ["authority", "boss", "manager", "老板", "领导", "上级"])) {
    return "authority";
  }

  if (matchesAny(lowered, ["resource", "资源", "利益"])) return "resource";

  if (matchesAny(lowered, ["conflict", "competitor", "竞争", "冲突"])) {
    return "conflict";
  }

  if (matchesAny(lowered, ["support", "支持"])) return "support";

  if (matchesAny(lowered, ["opportunity", "offer", "机会"])) {
    return "opportunity";
  }

  if (matchesAny(lowered, ["emotion", "emotional", "情感", "伴侣", "家人"])) {
    return "emotional";
  }

  return "unknown";
}

function containsForbiddenMindReading(output: KeyPeopleExtractionOutput) {
  const text = JSON.stringify(output).toLowerCase();

  return matchesAny(text, [
    "loves you",
    "betray",
    "deceiv",
    "secretly wants",
    "true intention",
    "真实想法",
    "背叛",
    "欺骗",
    "爱你",
    "不爱你",
    "真正意图",
    "看穿",
  ]);
}

function matchesAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

