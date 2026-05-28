type GenerateIntegratedFindingsPromptInput = {
  userQuestion: string;
  situationExtraction: unknown;
  destinyClimate: unknown;
  fusionResult: unknown;
  sandboxEvents: unknown;
  locale?: string;
};

const promptVersion = "generate-integrated-findings-v1";

export function buildGenerateIntegratedFindingsPrompt(
  input: GenerateIntegratedFindingsPromptInput,
) {
  return {
    promptVersion,
    system:
      [
        "You do one narrow job for Astraloom: generate integrated findings from the evidence chain already built.",
        "Return valid JSON only. Do not wrap the JSON in markdown, comments, or explanation.",
        "Generate exactly three findings. Do not output more or fewer.",
        "Every finding must be supported by sandbox event ids and evidence refs. If there is no event evidence, do not create the finding.",
        "Findings are reflective synthesis, not deterministic fate, advice, diagnosis, therapy, legal, medical, or investment guidance.",
        "Do not recommend a path, command an action, or claim paid/full-depth mode is more accurate.",
        "Keep titles concise, neutral, and user-facing. Title length must be at most 16 Chinese characters or comparable length.",
      ].join(" "),
    user: JSON.stringify({
      task: "Generate exactly 3 integrated findings grounded in situation extraction, fusion mapping, and sandbox events.",
      json_only: true,
      hard_rules: [
        "Output exactly 3 findings.",
        "Each finding must cite at least one sandbox event id and at least one evidence ref.",
        "Do not create a finding if its support is only destiny data without reality extraction and sandbox event evidence.",
        "Do not recommend which option to choose or rank options as correct/incorrect.",
        "Do not use fear-based or deterministic language.",
        "strategyVariables must include at least one item each for canInfluence, cannotInfluence, and underObservation.",
      ],
      forbidden_outputs: [
        "deterministic fate claims",
        "fear-based fortune-telling",
        "medical, legal, investment, or therapy advice",
        "direct path recommendations such as you should choose A",
        "claims not backed by sandbox event ids and evidence refs",
        "paid mode accuracy claims",
      ],
      output_contract: {
        integratedFindings: {
          findings: [
            {
              id: "stable string, for example finding_1",
              title: "Chinese title, max 16 Chinese characters",
              summary:
                "neutral synthesis grounded in evidence; no recommendation",
              evidenceEventIds: ["sandbox event ids; at least one"],
              evidenceRefs: [
                "situation extraction, fusion result, or destiny climate refs",
              ],
              sourceChain: [
                {
                  step:
                    "input | extraction | destiny_climate | fusion | sandbox_event",
                  refId: "referenced id",
                },
              ],
              confidence: "number from 0.0 to 1.0",
              limits: ["what this finding cannot conclude"],
            },
          ],
          strategyVariables: {
            canInfluence: [
              {
                label: "variable the user can influence",
                evidenceEventIds: ["sandbox event ids"],
              },
            ],
            cannotInfluence: [
              {
                label: "variable outside direct control",
                evidenceEventIds: ["sandbox event ids"],
              },
            ],
            underObservation: [
              {
                label: "variable that needs observation",
                evidenceEventIds: ["sandbox event ids"],
              },
            ],
          },
          evidenceSummary: {
            inputRefs: ["user input refs"],
            extractionRefs: ["situation extraction ids"],
            fusionRefs: ["fusion mapped theme ids"],
            sandboxEventRefs: ["sandbox event ids"],
          },
          meta: {
            overallConfidence: "number from 0.0 to 1.0",
            safetyDowngraded: "boolean",
            noDeterministicClaims: "boolean true",
          },
        },
      },
      validator_notes: [
        "Root object must contain integratedFindings only.",
        "findings length must be exactly 3.",
        "Each finding title must be short and non-technical.",
        "Each finding must include evidenceEventIds and evidenceRefs.",
        "strategyVariables.canInfluence, cannotInfluence, and underObservation must each contain at least one item.",
        "No finding may recommend a path or claim deterministic fate.",
      ],
      input: {
        userQuestion: input.userQuestion,
        situationExtraction: input.situationExtraction,
        destinyClimate: input.destinyClimate,
        fusionResult: input.fusionResult,
        sandboxEvents: input.sandboxEvents,
        locale: input.locale ?? "zh-CN",
      },
    }),
  };
}
