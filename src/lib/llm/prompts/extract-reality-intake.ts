import type { RealityIntakeTaskInput } from "@/lib/llm/llm-task-types";

export const extractRealityIntakePromptVersion = "extract-reality-intake-v1";

export function buildExtractRealityIntakeMessages(input: RealityIntakeTaskInput) {
  const seed = input.seedContext;
  const manualSources = input.manualRealitySources ?? [];

  return [
    {
      role: "system",
      content: [
        "You are the Reality Intake extractor for Astraloom.",
        "Your only job is to transform user-provided reality material into conservative structured JSON.",
        "Do not produce final findings, destiny judgments, risk levels, reports, advice, or predictions.",
        "Do not invent facts, hidden people, motives, events, institutions, opportunities, or constraints.",
        "Do not raise confidence. Use low confidence for inference.",
        "If external reality is needed, set externalInfoNeeded=true and write searchQuestions.",
        "Return JSON only. No markdown.",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          locale: input.locale,
          timeWindow: seed.timeWindow,
          birthInfoSummary:
            seed.destinyBirthInfo ||
            "No birth info summary provided. Do not derive reality facts from destiny material.",
          currentQuestion:
            seed.currentQuestionDescription ||
            seed.questionText ||
            seed.situationSummary ||
            "",
          seedContext: {
            questionText: seed.questionText,
            situationSummary: seed.situationSummary,
            recentEvents: seed.recentEvents || seed.recentEventsText,
            keyPeopleText: seed.keyPeopleText,
            decisionOptions: seed.decisionOptions || seed.decisionOptionsText,
            worries: seed.worries,
            forbiddenActions: seed.forbiddenActions || seed.forbiddenActionsText,
            desiredOutput: seed.desiredOutput || seed.desiredOutputText,
          },
          manualRealityMaterials: manualSources.map((source) => ({
            id: source.id,
            title: source.title,
            sourceType: source.sourceType,
            content: source.content,
            relevanceToQuestion: source.relevanceToQuestion,
          })),
          requiredOutputShape: {
            primaryDomain:
              "career | relationship | collaboration | family | migration | study | finance | self_direction | other",
            groundedRealityNodes: [
              {
                label: "string",
                nodeType: "person | organization | institution | market | policy | opportunity_source | resource_holder | information_source | constraint | environment | user",
                sourceText: "exact or near-exact text from user input/manual material; empty only when linked to external search need",
                roleInSituation: "string",
                resourcesControlled: ["string"],
                informationHeld: ["string"],
                opportunitiesProvided: ["string"],
                constraintsCreated: ["string"],
                confidence: "number 0-100, never above 65 for inference",
              },
            ],
            groundedRealityPressures: [
              {
                sourceLabel: "string",
                targetLabel: "string",
                pressureType:
                  "resource_control | information_gap | timing_pressure | market_pressure | institutional_constraint | emotional_pressure | opportunity_pull | competition | support",
                explanation: "string grounded in source text",
                confidence: "number 0-100, never above supporting node confidence",
              },
            ],
            externalInfoNeeded: "boolean",
            searchQuestions: [
              {
                id: "stable snake_case id",
                question: "string",
                reason: "string",
                expectedSourceType:
                  "job_market | policy | company | news | city | industry | education | migration | finance | relationship_context | other",
                priority: "number 0-100",
                confidence: "number 0-65",
              },
            ],
            clarificationQuestions: [
              {
                question: "string",
                reason: "string",
                required: "boolean",
              },
            ],
            missingInfo: [
              {
                missingField: "string",
                whyItMatters: "string",
              },
            ],
            safetyNotes: {
              deterministic_fate_risk: "boolean",
              medical_legal_financial_risk: "boolean",
              self_harm_or_crisis_risk: "boolean",
              privacy_risk: "boolean",
            },
          },
        },
        null,
        2,
      ),
    },
  ] as const;
}
