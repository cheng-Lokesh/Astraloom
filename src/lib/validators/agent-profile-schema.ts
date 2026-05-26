import { z } from "zod";

const sourceTypeSchema = z.enum([
  "user_confirmed",
  "chat_inferred",
  "default",
  "model_inferred",
]);

const sourcedStringSchema = z.object({
  value: z.string().trim().min(1).max(400),
  source_type: sourceTypeSchema,
});

const sourcedStringArraySchema = z.object({
  value: z.array(z.string().trim().min(1).max(180)).max(12),
  source_type: sourceTypeSchema,
});

const sourcedScoreSchema = z.object({
  value: z.number().min(0).max(100),
  source_type: sourceTypeSchema,
});

const communicationStyleSchema = z.enum([
  "silent",
  "warm",
  "sharp",
  "formal",
  "unknown",
]);

export const llmAgentProfileSchema = z.object({
  agent_type: z.enum(["user_core", "parallel_self", "npc"]),
  source_key_person_id: z.string().nullable(),
  label: z.string().trim().min(1).max(80),
  role: sourcedStringSchema,
  relationship_to_user: sourcedStringSchema,
  confidence: z.number().min(0).max(1),
  evidence_refs: z.array(z.string().trim().min(1).max(180)).min(1).max(12),
  motivation: z.object({
    primary_goal: sourcedStringSchema,
    fear: sourcedStringSchema,
    avoidance_pattern: sourcedStringSchema,
  }),
  resources: z.object({
    authority: sourcedScoreSchema,
    information: sourcedScoreSchema,
    social_capital: sourcedScoreSchema,
    emotional_leverage: sourcedScoreSchema,
  }),
  behavior_policy: z.object({
    action_speed: sourcedScoreSchema,
    initiative: sourcedScoreSchema,
    cooperation_bias: sourcedScoreSchema,
    communication_style: z.object({
      value: communicationStyleSchema,
      source_type: sourceTypeSchema,
    }),
  }),
  state: z.object({
    stress: sourcedScoreSchema,
    trust_in_user: sourcedScoreSchema,
    hostility_to_user: sourcedScoreSchema,
    current_intention: sourcedStringSchema,
  }),
  traits: sourcedStringArraySchema,
  constraints: sourcedStringArraySchema,
  missing_fields: sourcedStringArraySchema,
});

export const llmAgentProfilesSchema = z.object({
  agents: z.array(llmAgentProfileSchema).min(1).max(16),
  uncertainty_flags: z.array(z.string().trim().min(1).max(160)).max(12),
  generation_notes: z
    .object({
      fields_with_default_source: z.number().int().min(0).optional(),
      fields_with_inferred_source: z.number().int().min(0).optional(),
      safety_notes: z.array(z.string().trim().min(1).max(220)).max(8).optional(),
    })
    .optional(),
});

export const agentProfileDraftSchema = z.object({
  id: z.string().min(1),
  seedContextId: z.string().min(1),
  sourceKeyPersonId: z.string().nullable(),
  agentType: z.enum(["self", "parallel_self", "npc"]),
  label: z.string().min(1),
  role: z.string().min(1),
  relationshipToUser: z.string().min(1),
  confidence: z.number().min(0).max(100),
  evidenceRefs: z.array(z.string().min(1)).min(1),
  version: z.literal("local-deterministic-v0"),
  traceId: z.string().min(1),
  profileJson: z.object({
    stance: z.enum([
      "baseline",
      "cautious_parallel",
      "decisive_parallel",
      "confirmed_npc",
    ]),
    role: z.string().min(1),
    origin: z.string().min(1),
    relationshipToUser: z.string().min(1),
    source: z.object({
      confidence: z.number().min(0).max(100),
      sourceType: sourceTypeSchema,
      evidenceRefs: z.array(z.string().min(1)).min(1),
    }),
    fieldSources: z.record(z.string(), sourceTypeSchema),
    motivation: z.object({
      primaryGoal: z.string().min(1),
      fear: z.string().min(1),
      avoidancePattern: z.string().min(1),
    }),
    resources: z.object({
      authority: z.number().min(0).max(100),
      information: z.number().min(0).max(100),
      socialCapital: z.number().min(0).max(100),
      emotionalLeverage: z.number().min(0).max(100),
    }),
    behaviorPolicy: z.object({
      actionSpeed: z.number().min(0).max(100),
      initiative: z.number().min(0).max(100),
      cooperationBias: z.number().min(0).max(100),
      communicationStyle: communicationStyleSchema,
    }),
    state: z.object({
      stress: z.number().min(0).max(100),
      trustInUser: z.number().min(0).max(100),
      hostilityToUser: z.number().min(0).max(100),
      currentIntention: z.string().min(1),
    }),
    traits: z.array(z.string()).min(1),
    constraints: z.array(z.string()).min(1),
    missingFields: z.array(z.string()),
  }),
  promptVersion: z.string().min(1),
  modelVersion: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const agentProfileDraftsSchema = z.array(agentProfileDraftSchema).min(1);

export type LlmAgentProfilesOutput = z.infer<typeof llmAgentProfilesSchema>;
