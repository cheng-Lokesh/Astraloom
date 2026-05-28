import type { SeedContextDraft } from "@/types/seed-context";
import { getSeedContextSections } from "@/lib/seed-context/context-text";

import { keyPeopleExtractionModelConfig } from "../model-config";

export function buildExtractPeoplePrompt(seedContext: SeedContextDraft) {
  return {
    promptVersion: keyPeopleExtractionModelConfig.promptVersion,
    system:
      [
        "You do one narrow job for Astraloom: list the people or roles the user mentioned or clearly implied, using observable evidence only.",
        "Return JSON only. Do not wrap the JSON in markdown, comments, or explanation.",
        "Do not generate Agent Profiles, RelationEdges, edge weights, simulation transitions, Claims, Reports, recommendations, strategies, or verdicts.",
        "Core constraints: no mind reading, no relationship verdicts, no certainty about uncertain things, no invented named people, and no safety-boundary amplification.",
        "If a person or role is vague, keep the display_name generic, lower confidence, add missing_fields, and add uncertainty_flags.",
        "Extraction may run even when downstream safety is downgraded or blocked, but the output must stay descriptive and must not normalize harm.",
      ].join(" "),
    user: JSON.stringify({
      task: "Extract candidate people mentioned or implied by the seed context.",
      json_only: true,
      do_not_output: [
        "agent profile fields",
        "relationship edges or edge weights",
        "claims, reports, predictions, or strategy",
        "private thoughts, hidden motives, love/betrayal verdicts, or guaranteed outcomes",
        "monitoring, coercion, violence, medical, legal, investment, or therapy advice",
      ],
      output_contract: {
        people: [
          {
            display_name: "string",
            relationship_to_user:
              "boss | partner | competitor | coworker | family | friend | opportunity_source | advisor | other",
            role_type:
              "authority | emotional | resource | conflict | support | opportunity | information | unknown",
            confidence: "number from 0.0 to 1.0",
            known_evidence: [
              "short observable evidence phrase from the user's text; no inference; max 200 characters",
            ],
            missing_fields: ["short missing detail"],
            uncertainty_flags: [
              "role_unclear | identity_unclear | relationship_unclear | evidence_sparse | safety_sensitive | inferred_from_context",
            ],
            source_refs: [
              "questionText | situationSummary | recentEvents | keyPeopleText | decisionOptions | worries | forbiddenActions | safetyBoundaries | desiredOutput",
            ],
          },
        ],
        uncertainty_flags: [
          "role_unclear | identity_unclear | relationship_unclear | evidence_sparse | safety_sensitive | inferred_from_context",
        ],
      },
      role_type_guide: {
        authority: "Controls approval, permission, work, family authority, or hierarchy.",
        emotional: "Primary emotional tie, partner, ex, family attachment, or close friend.",
        resource: "Controls money, housing, access, tools, time, or concrete resources.",
        conflict: "Opposing interest, friction, competitor, antagonist, or disputed party.",
        support: "Advisor, helper, witness, ally, friend, or stabilizing person.",
        opportunity: "Recruiter, client, investor, new contact, or source of opportunity.",
        information: "Opaque committee, intermediary, messenger, or person with missing information.",
        unknown: "Mentioned person exists but role cannot be safely classified.",
      },
      safety_rules: [
        "Do not judge whether a third party loves, betrays, deceives, or secretly wants something.",
        "Do not infer private inner thoughts as fact.",
        "Do not de-anonymize, name, diagnose, or speculate about protected identity traits.",
        "Do not turn harmful user wording into instructions or normalized behavior.",
        "Do not provide monitoring, tracking, revenge, coercion, medical, legal, investment, or therapy advice.",
        "Do not create Agent Profiles, RelationEdges, Claims, Reports, or edge weights.",
        "If confidence is below 0.5 for a person, include at least one person-level uncertainty_flag.",
      ],
      seed_context: {
        id: seedContext.id,
        questionText: seedContext.questionText,
        situationSummary: seedContext.situationSummary,
        recentEvents:
          seedContext.recentEvents ?? seedContext.recentEventsText ?? "",
        recentEventsText: seedContext.recentEventsText ?? "",
        keyPeopleText: seedContext.keyPeopleText,
        decisionOptions:
          seedContext.decisionOptions ?? seedContext.decisionOptionsText ?? "",
        decisionOptionsText: seedContext.decisionOptionsText ?? "",
        worries: seedContext.worries ?? "",
        forbiddenActions:
          seedContext.forbiddenActions ?? seedContext.forbiddenActionsText ?? "",
        forbiddenActionsText: seedContext.forbiddenActionsText ?? "",
        safetyBoundaries: seedContext.safetyBoundaries ?? "",
        desiredOutput:
          seedContext.desiredOutput ?? seedContext.desiredOutputText ?? "",
        desiredOutputText: seedContext.desiredOutputText ?? "",
        structuredNarrative: getSeedContextSections(seedContext),
        trackType: seedContext.trackType,
        timeWindow: seedContext.timeWindow,
        locale: seedContext.locale,
      },
    }),
  };
}
