import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";

import { agentProfileDraftingModelConfig } from "../model-config";

export function buildGenerateAgentsPrompt({
  seedContext,
  confirmedPeople,
  safetyLevel,
}: {
  seedContext: SeedContextDraft;
  confirmedPeople: KeyPersonDraft[];
  safetyLevel: string;
}) {
  return {
    promptVersion: agentProfileDraftingModelConfig.promptVersion,
    system:
      "You draft Agent Profile data for MiroFish, an AI life simulator and relationship sandbox. Return JSON only. You must not generate claims, reports, relation edges, edge weights, simulation steps, final conclusions, third-party hidden motives, deterministic futures, or professional advice.",
    user: JSON.stringify({
      task: "Draft Agent Profile fields from confirmed people and user evidence.",
      hard_requirements: [
        "Always include one user_core agent.",
        "Include at most two parallel_self agents unless safety is downgraded.",
        "Create one npc agent for each confirmed key person.",
        "Each field must include source_type: user_confirmed, chat_inferred, default, or model_inferred.",
        "User-confirmed fields override model-inferred fields.",
        "Model-inferred fields must keep lower confidence.",
        "Default fields cannot support high-confidence claims.",
      ],
      forbidden: [
        "Do not claim what a third party truly thinks, loves, hides, betrays, or intends.",
        "Do not create RelationEdges or edge weights.",
        "Do not generate Claims or Reports.",
        "Do not run simulation.",
        "Do not output a certain future.",
      ],
      safety: {
        safetyLevel,
        downgraded_mode:
          safetyLevel === "downgraded"
            ? "Use conservative defaults only. No parallel selves unless needed for low-risk comparison. No hidden motive inference."
            : "Normal drafting with uncertainty.",
      },
      output_shape: {
        agents: [
          {
            agent_type: "user_core | parallel_self | npc",
            source_key_person_id: "string | null",
            label: "string",
            role: { value: "string", source_type: "default" },
            relationship_to_user: { value: "string", source_type: "user_confirmed" },
            confidence: 0.6,
            evidence_refs: ["string"],
            motivation: {
              primary_goal: { value: "string", source_type: "model_inferred" },
              fear: { value: "string", source_type: "model_inferred" },
              avoidance_pattern: { value: "string", source_type: "model_inferred" }
            },
            resources: {
              authority: { value: 40, source_type: "model_inferred" },
              information: { value: 40, source_type: "model_inferred" },
              social_capital: { value: 40, source_type: "model_inferred" },
              emotional_leverage: { value: 40, source_type: "model_inferred" }
            },
            behavior_policy: {
              action_speed: { value: 40, source_type: "model_inferred" },
              initiative: { value: 40, source_type: "model_inferred" },
              cooperation_bias: { value: 40, source_type: "model_inferred" },
              communication_style: { value: "unknown", source_type: "default" }
            },
            state: {
              stress: { value: 40, source_type: "model_inferred" },
              trust_in_user: { value: 40, source_type: "model_inferred" },
              hostility_to_user: { value: 10, source_type: "model_inferred" },
              current_intention: { value: "string", source_type: "default" }
            },
            traits: { value: ["string"], source_type: "model_inferred" },
            constraints: { value: ["string"], source_type: "default" },
            missing_fields: { value: ["string"], source_type: "user_confirmed" }
          }
        ],
        uncertainty_flags: ["string"]
      },
      seed_context: seedContext,
      confirmed_people: confirmedPeople,
    }),
  };
}
