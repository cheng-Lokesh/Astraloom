type GenerateSandboxEventsPromptInput = {
  situationExtraction: unknown;
  destinyClimate: unknown;
  fusionResult: unknown;
  simulationFocus?: string;
  locale?: string;
};

const promptVersion = "generate-sandbox-events-v1";

export function buildGenerateSandboxEventsPrompt(
  input: GenerateSandboxEventsPromptInput,
) {
  return {
    promptVersion,
    system:
      [
        "You do one narrow job for Astraloom: generate structured sandbox events from existing extraction and fusion evidence.",
        "Return valid JSON only. Do not wrap the JSON in markdown, comments, or explanation.",
        "Generate sandbox process events, not fiction. Do not write dialogue, named scenes, cinematic description, or concrete events that were not evidenced.",
        "Events are hypothetical interaction dynamics for reflection, not predictions, fate, advice, or guaranteed outcomes.",
        "Each event must reference at least one mapped theme and at least one extraction or fusion evidence id.",
        "Do not create integrated findings, final reports, recommendations, or path decisions in this step.",
        "Do not bypass safety boundaries or transform harmful content into instructions.",
      ].join(" "),
    user: JSON.stringify({
      task: "Generate 3 to 5 non-deterministic sandbox events that preserve the evidence chain.",
      json_only: true,
      hard_rules: [
        "Generate exactly 3 to 5 events.",
        "No dialogue, quoted speech, detailed scene staging, or novel-like prose.",
        "No deterministic prediction such as will happen, must happen, certain approval, guaranteed failure, or destined relationship.",
        "Each event must use references from situationExtraction and fusionResult.",
        "Each event must describe a dynamic tension, turning point, information shift, resource shift, boundary test, or option divergence.",
        "Do not recommend which option to choose.",
      ],
      forbidden_outputs: [
        "direct quotes or invented conversations",
        "specific meeting scenes or unobserved public confrontation details",
        "deterministic fate or outcome claims",
        "medical, legal, investment, or therapy advice",
        "integrated findings, reports, claims without event evidence, payment or entitlement language",
      ],
      output_contract: {
        sandboxEvents: {
          events: [
            {
              id: "stable string, for example sandbox_event_1",
              eventType:
                "pressure_shift | information_gap | role_reversal | resource_constraint | boundary_test | option_divergence | timing_window | support_signal | uncertainty_hold",
              title: "short neutral title",
              summary:
                "one concise process description; no dialogue, no concrete invented scene",
              activeThemeIds: ["mappedThemes id from fusionResult"],
              involvedAnchorIds: [
                "person, event, option, worry, or topic id from situationExtraction",
              ],
              evidenceRefs: [
                "source ids from situationExtraction, fusionResult, or destinyClimate",
              ],
              uncertainty:
                "what remains uncertain; must not be converted into prediction",
              confidence: "number from 0.0 to 1.0",
              safetyNotes: ["short safety note if needed"],
            },
          ],
          eventGraph: {
            sequence: ["sandbox_event ids in suggested reasoning order"],
            dependencies: [
              {
                from: "sandbox_event id",
                to: "sandbox_event id",
                relation:
                  "enables | constrains | reframes | competes_with | clarifies",
              },
            ],
          },
          meta: {
            generationConfidence: "number from 0.0 to 1.0",
            evidenceCoverage: "low | medium | high",
            safetyDowngraded: "boolean",
          },
        },
      },
      validator_notes: [
        "Root object must contain sandboxEvents only.",
        "events length must be between 3 and 5.",
        "Each event must include activeThemeIds and evidenceRefs.",
        "Regex validators may reject quotation marks, dialogue markers, and scene prose.",
        "No event may be treated as a prediction or final finding.",
      ],
      input: {
        situationExtraction: input.situationExtraction,
        destinyClimate: input.destinyClimate,
        fusionResult: input.fusionResult,
        simulationFocus: input.simulationFocus ?? null,
        locale: input.locale ?? "zh-CN",
      },
    }),
  };
}
