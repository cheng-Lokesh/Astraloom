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
      [
        "You build bounded Agent Profile drafts for Astraloom, an AI life simulator and relationship sandbox.",
        "These agents are sandbox models, not real people, diagnoses, predictions, or truth claims.",
        "Return JSON only. Do not wrap the JSON in markdown, comments, or explanation.",
        "Do not generate Claims, Reports, RelationEdges, edge weights, simulation transitions, final conclusions, strategies, or professional advice.",
        "Do not state hidden motives, private thoughts, love/betrayal verdicts, diagnoses, or deterministic futures.",
        "Every field must be traceable through source_type. Use default or model_inferred honestly when the user did not confirm a fact.",
      ].join(" "),
    user: JSON.stringify({
      task: "Draft Agent Profile fields from confirmed people and user evidence.",
      hard_requirements: [
        "Always include one user_core agent.",
        "Include at most two parallel_self agents unless safety is downgraded or blocked.",
        "When including parallel_self agents, make one cautious and one decisive through label and behavior values; do not change core facts.",
        "Create one npc agent for each confirmed key person.",
        "Each field must include source_type: user_confirmed, chat_inferred, default, or model_inferred.",
        "User-confirmed fields override model-inferred fields.",
        "Model-inferred fields must keep lower confidence.",
        "Default fields cannot support high confidence or later Claims.",
        "If a field is not supported by user text or confirmed KeyPerson evidence, use source_type default and a neutral value.",
        "Keep missing_fields populated when confidence is low or important facts are absent.",
      ],
      forbidden: [
        "Do not claim what a third party truly thinks, loves, hides, betrays, or intends.",
        "Do not create RelationEdges or edge weights.",
        "Do not generate Claims or Reports.",
        "Do not run simulation.",
        "Do not output a certain future.",
        "Do not include diagnosis labels, legal instructions, investment instructions, surveillance steps, retaliation, or coercion.",
        "Do not make resource, trust, hostility, or emotional leverage scores sound like moral verdicts.",
      ],
      safety_rules: [
        "If safetyLevel is safe, still avoid mind reading and deterministic language.",
        "If safetyLevel is caution, use extra uncertainty and avoid promise-like wording.",
        "If safetyLevel is downgraded, use conservative defaults, no hidden motive inference, and avoid parallel selves unless low-risk comparison is necessary.",
        "If safetyLevel is blocked, do not produce actionable harmful content; the route should normally use local fallback before LLM generation.",
        "Monitoring or phone/location checking must never appear as an action, trait, intention, or constraint.",
        "Professional domains must be framed as uncertainty or missing context, never legal, medical, financial, or therapy advice.",
      ],
      source_type_guide: {
        user_confirmed:
          "Use only when the field comes directly from confirmedPeople or explicit SeedContext text.",
        chat_inferred:
          "Use only for a modest inference from the user's own phrasing, with lower confidence.",
        model_inferred:
          "Use for cautious sandbox estimates that are not directly confirmed; do not treat as fact.",
        default:
          "Use neutral fallback values when evidence is missing.",
      },
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
        uncertainty_flags: ["string"],
        generation_notes: {
          fields_with_default_source: 0,
          fields_with_inferred_source: 0,
          safety_notes: ["string"]
        }
      },
      seed_context: seedContext,
      confirmed_people: confirmedPeople,
    }),
  };
}
