import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildAgentProfiles } from "@/lib/agents/build";
import { generateJsonWithLlm } from "@/lib/llm/client";
import {
  agentProfileDraftingModelConfig,
  isAiGenerationEnabled,
} from "@/lib/llm/model-config";
import { buildGenerateAgentsPrompt } from "@/lib/llm/prompts/generate-agents";
import { checkLlmRateLimit } from "@/lib/llm/rate-limit";
import { logModelCall } from "@/lib/model-call-log/log-model-call";
import { verifySafety } from "@/lib/safety/safety-verifier";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  agentProfileDraftsSchema,
  llmAgentProfilesSchema,
  type LlmAgentProfilesOutput,
} from "@/lib/validators/agent-profile-schema";
import type {
  AgentFieldSourceType,
  AgentProfileDraft,
  AgentStance,
  AgentType,
} from "@/types/agent-profile";
import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";

export const dynamic = "force-dynamic";

const seedContextSchema = z.object({
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

const keyPersonSchema = z.object({
  id: z.string().min(1),
  seedContextId: z.string().min(1),
  label: z.string().min(1),
  role: z.string().default("unknown"),
  relationshipToUser: z.string().default("other"),
  roleType: z.string().default("unknown"),
  confidence: z.number().min(0).max(100).default(55),
  knownEvidence: z.string().default(""),
  missingFields: z.array(z.string()).default([]),
  evidenceRefs: z.array(z.string()).default([]),
  userNote: z.string().default(""),
  mergedIntoId: z.string().optional(),
  confirmed: z.boolean().default(false),
  status: z
    .enum([
      "candidate",
      "confirmed",
      "deleted",
      "merged",
      "needs_confirmation",
      "rejected",
    ])
    .default("candidate"),
  source: z
    .enum(["key_people_text", "seed_context_text", "manual"])
    .default("seed_context_text"),
  evidenceText: z.string().default(""),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

const safetyResultSchema = z
  .object({
    safetyLevel: z
      .enum(["safe", "caution", "downgraded", "blocked"])
      .default("safe"),
    flags: z.array(z.string()).default([]),
  })
  .optional();

const requestSchema = z.object({
  seedContext: seedContextSchema,
  confirmedPeople: z.array(keyPersonSchema).max(12),
  safetyResult: safetyResultSchema,
  includeParallelSelves: z.boolean().default(true),
});

function createTraceId() {
  return `agent_profiles_generate_${crypto.randomUUID()}`;
}

export async function POST(request: NextRequest) {
  const traceId = createTraceId();
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, trace_id: traceId, error_code: "invalid_request" },
      { status: 400 },
    );
  }

  const seedContext = parsed.data.seedContext satisfies SeedContextDraft;
  const confirmedPeople = parsed.data.confirmedPeople.filter(
    (person) => person.confirmed && person.status === "confirmed",
  ) satisfies KeyPersonDraft[];
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return fallbackResponse({
      seedContext,
      confirmedPeople,
      traceId,
      fallbackReason: "auth_required",
      includeParallelSelves: parsed.data.includeParallelSelves,
    });
  }

  const safety =
    parsed.data.safetyResult?.safetyLevel === "blocked" ||
    parsed.data.safetyResult?.safetyLevel === "downgraded"
      ? parsed.data.safetyResult
      : verifySafety({ seedContext });

  if (safety.safetyLevel === "blocked") {
    await logModelCall({
      traceId,
      userId,
      jobType: "agent_profiles_generate",
      promptVersion: agentProfileDraftingModelConfig.promptVersion,
      modelVersion: "not_called",
      latencyMs: 0,
      costEstimate: 0,
      errorCode: "safety_blocked",
      metadata: { flags: safety.flags },
    });

    return fallbackResponse({
      seedContext,
      confirmedPeople,
      traceId,
      fallbackReason: "safety_blocked",
      includeParallelSelves: false,
    });
  }

  if (safety.safetyLevel === "downgraded") {
    await logModelCall({
      traceId,
      userId,
      jobType: "agent_profiles_generate",
      promptVersion: agentProfileDraftingModelConfig.promptVersion,
      modelVersion: "not_called",
      latencyMs: 0,
      costEstimate: 0,
      errorCode: "safety_downgraded",
      metadata: { flags: safety.flags },
    });

    return fallbackResponse({
      seedContext,
      confirmedPeople,
      traceId,
      fallbackReason: "safety_downgraded",
      includeParallelSelves: false,
    });
  }

  if (!isAiGenerationEnabled()) {
    await logModelCall({
      traceId,
      userId,
      jobType: "agent_profiles_generate",
      promptVersion: agentProfileDraftingModelConfig.promptVersion,
      modelVersion: "not_called",
      latencyMs: 0,
      costEstimate: 0,
      errorCode: "ai_generation_disabled",
    });

    return fallbackResponse({
      seedContext,
      confirmedPeople,
      traceId,
      fallbackReason: "ai_generation_disabled",
      includeParallelSelves: parsed.data.includeParallelSelves,
    });
  }

  const rateLimit = await checkLlmRateLimit({
    userId,
    jobType: "agents_generate",
  });

  if (!rateLimit.allowed) {
    await logModelCall({
      traceId,
      userId,
      jobType: "agent_profiles_generate",
      promptVersion: agentProfileDraftingModelConfig.promptVersion,
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

  const prompt = buildGenerateAgentsPrompt({
    seedContext,
    confirmedPeople,
    safetyLevel: safety.safetyLevel,
  });
  const llmResult = await generateJsonWithLlm({
    traceId,
    systemPrompt: prompt.system,
    userPrompt: prompt.user,
    config: agentProfileDraftingModelConfig,
  });

  if (!llmResult.ok) {
    await logModelCall({
      traceId,
      userId,
      jobType: "agent_profiles_generate",
      promptVersion: prompt.promptVersion,
      modelVersion: llmResult.modelVersion,
      latencyMs: llmResult.latencyMs,
      inputTokenEstimate: llmResult.inputTokenEstimate,
      outputTokenEstimate: llmResult.outputTokenEstimate,
      costEstimate: llmResult.costEstimate,
      errorCode: llmResult.errorCode,
    });

    return fallbackResponse({
      seedContext,
      confirmedPeople,
      traceId,
      fallbackReason: llmResult.errorCode,
      includeParallelSelves: parsed.data.includeParallelSelves,
    });
  }

  const parsedJson = parseLlmJson(llmResult.rawText);

  if (!parsedJson.ok) {
    await logModelCall({
      traceId,
      userId,
      jobType: "agent_profiles_generate",
      promptVersion: prompt.promptVersion,
      modelVersion: llmResult.modelVersion,
      latencyMs: llmResult.latencyMs,
      inputTokenEstimate: llmResult.inputTokenEstimate,
      outputTokenEstimate: llmResult.outputTokenEstimate,
      costEstimate: llmResult.costEstimate,
      errorCode: parsedJson.errorCode,
    });

    return fallbackResponse({
      seedContext,
      confirmedPeople,
      traceId,
      fallbackReason: parsedJson.errorCode,
      includeParallelSelves: parsed.data.includeParallelSelves,
    });
  }

  const validated = llmAgentProfilesSchema.safeParse(parsedJson.data);

  if (!validated.success || containsForbiddenInference(validated.data)) {
    const errorCode = validated.success
      ? "llm_output_forbidden_inference"
      : "invalid_llm_output_schema";

    await logModelCall({
      traceId,
      userId,
      jobType: "agent_profiles_generate",
      promptVersion: prompt.promptVersion,
      modelVersion: llmResult.modelVersion,
      latencyMs: llmResult.latencyMs,
      inputTokenEstimate: llmResult.inputTokenEstimate,
      outputTokenEstimate: llmResult.outputTokenEstimate,
      costEstimate: llmResult.costEstimate,
      errorCode,
    });

    return fallbackResponse({
      seedContext,
      confirmedPeople,
      traceId,
      fallbackReason: errorCode,
      includeParallelSelves: parsed.data.includeParallelSelves,
    });
  }

  const agents = normalizeLlmAgents({
    seedContext,
    confirmedPeople,
    output: validated.data,
    traceId,
    promptVersion: prompt.promptVersion,
    modelVersion: llmResult.modelVersion,
  });
  const draftValidation = agentProfileDraftsSchema.safeParse(agents);

  if (!draftValidation.success || !hasRequiredAgents(agents, confirmedPeople)) {
    await logModelCall({
      traceId,
      userId,
      jobType: "agent_profiles_generate",
      promptVersion: prompt.promptVersion,
      modelVersion: llmResult.modelVersion,
      latencyMs: llmResult.latencyMs,
      inputTokenEstimate: llmResult.inputTokenEstimate,
      outputTokenEstimate: llmResult.outputTokenEstimate,
      costEstimate: llmResult.costEstimate,
      errorCode: "invalid_agent_profile_draft",
    });

    return fallbackResponse({
      seedContext,
      confirmedPeople,
      traceId,
      fallbackReason: "invalid_agent_profile_draft",
      includeParallelSelves: parsed.data.includeParallelSelves,
    });
  }

  await logModelCall({
    traceId,
    userId,
    jobType: "agent_profiles_generate",
    promptVersion: prompt.promptVersion,
    modelVersion: llmResult.modelVersion,
    latencyMs: llmResult.latencyMs,
    inputTokenEstimate: llmResult.inputTokenEstimate,
    outputTokenEstimate: llmResult.outputTokenEstimate,
    costEstimate: llmResult.costEstimate,
    errorCode: null,
    metadata: { agent_count: agents.length },
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
    agents,
  });
}

async function getAuthenticatedUserId() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;

  return data.user?.id ?? null;
}

function fallbackResponse({
  seedContext,
  confirmedPeople,
  traceId,
  fallbackReason,
  includeParallelSelves,
}: {
  seedContext: SeedContextDraft;
  confirmedPeople: KeyPersonDraft[];
  traceId: string;
  fallbackReason: string;
  includeParallelSelves: boolean;
}) {
  const agents = buildAgentProfiles(
    seedContext,
    confirmedPeople,
    includeParallelSelves,
  ).map((agent) => ({
    ...agent,
    traceId,
    promptVersion: agentProfileDraftingModelConfig.promptVersion,
    modelVersion: "local_fallback",
  }));

  return NextResponse.json({
    ok: true,
    trace_id: traceId,
    source: "local_fallback",
    fallback_reason: fallbackReason,
    model_version: "local_fallback",
    prompt_version: agentProfileDraftingModelConfig.promptVersion,
    cost_estimate: 0,
    latency_ms: 0,
    error_code: fallbackReason,
    agents,
  });
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

function normalizeLlmAgents({
  seedContext,
  confirmedPeople,
  output,
  traceId,
  promptVersion,
  modelVersion,
}: {
  seedContext: SeedContextDraft;
  confirmedPeople: KeyPersonDraft[];
  output: LlmAgentProfilesOutput;
  traceId: string;
  promptVersion: string;
  modelVersion: string;
}) {
  const now = new Date().toISOString();
  const peopleById = new Map(confirmedPeople.map((person) => [person.id, person]));
  const normalized: AgentProfileDraft[] = [];
  const userCore =
    output.agents.find((agent) => agent.agent_type === "user_core") ??
    output.agents[0];

  if (userCore) {
    normalized.push(
      toAgentDraft({
        seedContext,
        llmAgent: { ...userCore, agent_type: "user_core", source_key_person_id: null },
        now,
        traceId,
        promptVersion,
        modelVersion,
        confirmedPerson: null,
      }),
    );
  }

  output.agents
    .filter((agent) => agent.agent_type === "parallel_self")
    .slice(0, 2)
    .forEach((agent) => {
      normalized.push(
        toAgentDraft({
          seedContext,
          llmAgent: agent,
          now,
          traceId,
          promptVersion,
          modelVersion,
          confirmedPerson: null,
        }),
      );
    });

  confirmedPeople.forEach((person) => {
    const llmAgent =
      output.agents.find(
        (agent) =>
          agent.agent_type === "npc" && agent.source_key_person_id === person.id,
      ) ??
      output.agents.find(
        (agent) =>
          agent.agent_type === "npc" &&
          agent.label.trim().toLowerCase() === person.label.trim().toLowerCase(),
      );

    if (!llmAgent) return;

    normalized.push(
      toAgentDraft({
        seedContext,
        llmAgent: {
          ...llmAgent,
          source_key_person_id: person.id,
          label: person.label,
          relationship_to_user: {
            value: person.relationshipToUser,
            source_type: "user_confirmed",
          },
          role: {
            value: person.role || llmAgent.role.value,
            source_type: "user_confirmed",
          },
          evidence_refs: person.evidenceRefs.length
            ? person.evidenceRefs
            : llmAgent.evidence_refs,
          missing_fields: {
            value: person.missingFields,
            source_type: "user_confirmed",
          },
        },
        now,
        traceId,
        promptVersion,
        modelVersion,
        confirmedPerson: peopleById.get(person.id) ?? person,
      }),
    );
  });

  return normalized;
}

function toAgentDraft({
  seedContext,
  llmAgent,
  now,
  traceId,
  promptVersion,
  modelVersion,
  confirmedPerson,
}: {
  seedContext: SeedContextDraft;
  llmAgent: LlmAgentProfilesOutput["agents"][number];
  now: string;
  traceId: string;
  promptVersion: string;
  modelVersion: string;
  confirmedPerson: KeyPersonDraft | null;
}) {
  const agentType = mapAgentType(llmAgent.agent_type);
  const confidence = confidenceFromSources(llmAgent.confidence, llmAgent);
  const stance = stanceFor(agentType, llmAgent.label);
  const sourceType =
    confirmedPerson || llmAgent.role.source_type === "user_confirmed"
      ? "user_confirmed"
      : llmAgent.role.source_type;
  const evidenceRefs = unique([
    ...llmAgent.evidence_refs,
    ...(confirmedPerson?.evidenceRefs ?? []),
    `seed:${seedContext.id}:agent:${hashText(llmAgent.label)}`,
  ]);

  return {
    id: `agent_${hashText(
      `${seedContext.id}:${llmAgent.source_key_person_id ?? agentType}:${llmAgent.label}`,
    )}`,
    seedContextId: seedContext.id,
    sourceKeyPersonId: llmAgent.source_key_person_id,
    agentType,
    label: llmAgent.label,
    role: llmAgent.role.value,
    relationshipToUser: llmAgent.relationship_to_user.value,
    confidence,
    evidenceRefs,
    version: "local-deterministic-v0",
    traceId,
    profileJson: {
      stance,
      role: llmAgent.role.value,
      origin: modelVersion,
      relationshipToUser: llmAgent.relationship_to_user.value,
      source: {
        confidence,
        sourceType,
        evidenceRefs,
      },
      fieldSources: {
        role: llmAgent.role.source_type,
        relationshipToUser: llmAgent.relationship_to_user.source_type,
        motivation: mergedSource([
          llmAgent.motivation.primary_goal.source_type,
          llmAgent.motivation.fear.source_type,
          llmAgent.motivation.avoidance_pattern.source_type,
        ]),
        resources: mergedSource([
          llmAgent.resources.authority.source_type,
          llmAgent.resources.information.source_type,
          llmAgent.resources.social_capital.source_type,
          llmAgent.resources.emotional_leverage.source_type,
        ]),
        behaviorPolicy: mergedSource([
          llmAgent.behavior_policy.action_speed.source_type,
          llmAgent.behavior_policy.initiative.source_type,
          llmAgent.behavior_policy.cooperation_bias.source_type,
          llmAgent.behavior_policy.communication_style.source_type,
        ]),
        state: mergedSource([
          llmAgent.state.stress.source_type,
          llmAgent.state.trust_in_user.source_type,
          llmAgent.state.hostility_to_user.source_type,
          llmAgent.state.current_intention.source_type,
        ]),
        traits: llmAgent.traits.source_type,
        constraints: llmAgent.constraints.source_type,
        missingFields: llmAgent.missing_fields.source_type,
      },
      motivation: {
        primaryGoal: llmAgent.motivation.primary_goal.value,
        fear: llmAgent.motivation.fear.value,
        avoidancePattern: llmAgent.motivation.avoidance_pattern.value,
      },
      resources: {
        authority: llmAgent.resources.authority.value,
        information: llmAgent.resources.information.value,
        socialCapital: llmAgent.resources.social_capital.value,
        emotionalLeverage: llmAgent.resources.emotional_leverage.value,
      },
      behaviorPolicy: {
        actionSpeed: llmAgent.behavior_policy.action_speed.value,
        initiative: llmAgent.behavior_policy.initiative.value,
        cooperationBias: llmAgent.behavior_policy.cooperation_bias.value,
        communicationStyle: llmAgent.behavior_policy.communication_style.value,
      },
      state: {
        stress: llmAgent.state.stress.value,
        trustInUser: llmAgent.state.trust_in_user.value,
        hostilityToUser: llmAgent.state.hostility_to_user.value,
        currentIntention: llmAgent.state.current_intention.value,
      },
      traits: llmAgent.traits.value,
      constraints: unique([
        ...llmAgent.constraints.value,
        "Draft only: not a claim, report, simulation, or third-party mind reading.",
      ]),
      missingFields: llmAgent.missing_fields.value,
    },
    promptVersion,
    modelVersion,
    createdAt: now,
    updatedAt: now,
  } satisfies AgentProfileDraft;
}

function hasRequiredAgents(
  agents: AgentProfileDraft[],
  confirmedPeople: KeyPersonDraft[],
) {
  const hasCore = agents.some((agent) => agent.agentType === "self");
  const npcIds = new Set(
    agents
      .filter((agent) => agent.agentType === "npc")
      .map((agent) => agent.sourceKeyPersonId),
  );

  return hasCore && confirmedPeople.every((person) => npcIds.has(person.id));
}

function mapAgentType(value: string): AgentType {
  if (value === "parallel_self") return "parallel_self";
  if (value === "npc") return "npc";
  return "self";
}

function stanceFor(agentType: AgentType, label: string): AgentStance {
  if (agentType === "npc") return "confirmed_npc";
  if (agentType === "parallel_self") {
    const normalized = label.toLowerCase();
    return ["decisive", "action"].some((pattern) =>
      normalized.includes(pattern),
    )
      ? "decisive_parallel"
      : "cautious_parallel";
  }
  return "baseline";
}

function confidenceFromSources(
  confidence: number,
  agent: LlmAgentProfilesOutput["agents"][number],
) {
  const hasModelInferred = JSON.stringify(agent).includes("model_inferred");
  const base = Math.round(confidence * 100);
  return Math.max(35, Math.min(hasModelInferred ? 78 : 92, base));
}

function mergedSource(sources: AgentFieldSourceType[]): AgentFieldSourceType {
  if (sources.includes("model_inferred")) return "model_inferred";
  if (sources.includes("chat_inferred")) return "chat_inferred";
  if (sources.includes("user_confirmed")) return "user_confirmed";
  return "default";
}

function containsForbiddenInference(output: LlmAgentProfilesOutput) {
  const text = JSON.stringify(output).toLowerCase();
  return [
    "loves you",
    "betray",
    "deceiv",
    "secretly wants",
    "true intention",
    "will definitely",
    "guaranteed",
    "真实想法",
    "背叛",
    "欺骗",
    "爱你",
    "不爱你",
    "真正意图",
    "看穿",
  ].some((pattern) => text.includes(pattern));
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

