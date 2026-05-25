import type { SeedContextDraft } from "@/types/seed-context";
import { getSeedContextSections } from "@/lib/seed-context/context-text";

import { keyPeopleExtractionModelConfig } from "../model-config";

export function buildExtractPeoplePrompt(seedContext: SeedContextDraft) {
  return {
    promptVersion: keyPeopleExtractionModelConfig.promptVersion,
    system:
      "You extract candidate people for MiroFish, an AI life simulator and relationship sandbox. Return JSON only. Extract people and roles from user-provided evidence. Do not generate agents, relation edges, claims, reports, advice, hidden motives, private thoughts, betrayal judgments, love judgments, or deterministic outcomes.",
    user: JSON.stringify({
      task: "Extract candidate people mentioned or implied by the seed context.",
      output_contract: {
        people: [
          {
            display_name: "string",
            relationship_to_user:
              "boss | partner | competitor | coworker | family | friend | opportunity_source | advisor | other",
            role_type:
              "authority | emotional | resource | conflict | support | opportunity | unknown",
            confidence: "number from 0.0 to 1.0",
            known_evidence: ["short evidence phrase from the user's text"],
            missing_fields: ["short missing detail"],
            source_refs: [
              "questionText | situationSummary | recentEventsText | keyPeopleText | decisionOptionsText | forbiddenActionsText | desiredOutputText",
            ],
          },
        ],
        uncertainty_flags: ["string"],
      },
      safety_rules: [
        "Do not judge whether a third party loves, betrays, deceives, or secretly wants something.",
        "Do not infer private inner thoughts as fact.",
        "Do not provide monitoring, tracking, revenge, coercion, medical, legal, investment, or therapy advice.",
        "Do not create Agent Profiles, RelationEdges, Claims, Reports, or edge weights.",
      ],
      seed_context: {
        id: seedContext.id,
        questionText: seedContext.questionText,
        situationSummary: seedContext.situationSummary,
        recentEventsText: seedContext.recentEventsText ?? "",
        keyPeopleText: seedContext.keyPeopleText,
        decisionOptionsText: seedContext.decisionOptionsText ?? "",
        forbiddenActionsText: seedContext.forbiddenActionsText ?? "",
        desiredOutputText: seedContext.desiredOutputText ?? "",
        structuredNarrative: getSeedContextSections(seedContext),
        trackType: seedContext.trackType,
        timeWindow: seedContext.timeWindow,
        locale: seedContext.locale,
      },
    }),
  };
}
