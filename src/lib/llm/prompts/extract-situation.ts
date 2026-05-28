type ExtractSituationPromptInput = {
  questionText: string;
  birthInfo?: unknown;
  locale?: string;
  now?: string;
};

const promptVersion = "extract-situation-v1";

export function buildExtractSituationPrompt(input: ExtractSituationPromptInput) {
  return {
    promptVersion,
    system:
      [
        "You do one narrow job for Astraloom: extract the observable current situation from the user's free-form question.",
        "Return valid JSON only. Do not wrap the JSON in markdown, comments, or explanation.",
        "Extract only; do not analyze, advise, simulate, rank options, infer hidden motives, or create destiny conclusions.",
        "Use the user's words as evidence anchors. If information is missing, leave arrays empty or add missingInfo instead of inventing details.",
        "For very short or vague input, especially under 10 Chinese characters or similarly sparse text, do not force people, events, or options.",
        "Do not make deterministic fate claims, fear-based claims, medical/legal/investment/therapy advice, or claims about private thoughts.",
        "The output must preserve the evidence chain: every extracted item that asserts a real-world fact needs sourceText or sourceRefs.",
      ].join(" "),
    user: JSON.stringify({
      task: "Extract the user's real-world situation into a structured situationExtraction object. Do not interpret destiny data.",
      json_only: true,
      hard_rules: [
        "Only extract what the user stated or clearly anchored in the text.",
        "Do not infer what another person secretly thinks, wants, fears, loves, or intends.",
        "Do not upgrade broad topics into crisis labels unless the user explicitly describes a crisis.",
        "Do not invent relatives, coworkers, partners, competitors, or decision options.",
        "Do not output recommendations, predictions, findings, sandbox events, or destiny-person mappings.",
        "If a field is uncertain, lower confidence and add missingInfo or uncertainty flags.",
      ],
      forbidden_outputs: [
        "deterministic fate or fixed-outcome claims",
        "fear-based fortune telling",
        "medical, legal, investment, or therapy advice",
        "relationship verdicts such as loves, betrays, curses, blocks, or is destined to",
        "analysis of birth chart, destiny climate, agents, graph edges, sandbox events, or findings",
      ],
      output_contract: {
        situationExtraction: {
          topic:
            "career | relationship | family | money | health_context | study | relocation | collaboration | personal_direction | other | unknown",
          topicConfidence: "number from 0.0 to 1.0",
          userQuestion: {
            rawText: "the original question text",
            normalizedQuestion:
              "short neutral restatement; no advice or conclusion",
            sourceText: "short quote or phrase from the input",
          },
          keyPeople: [
            {
              id: "stable string, for example person_1",
              displayName: "generic role or provided name",
              relationshipToUser:
                "boss | partner | coworker | family | friend | client | competitor | institution | other | unknown",
              observedRole:
                "authority | resource | emotional | conflict | support | opportunity | information | unknown",
              confidence: "number from 0.0 to 1.0",
              sourceText: "observable phrase from the user's text",
              missingInfo: ["short missing detail"],
            },
          ],
          recentEvents: [
            {
              id: "stable string, for example event_1",
              summary: "short factual event summary",
              timeHint: "explicit or relative time phrase, or unknown",
              involvedPeople: ["person id if extracted"],
              sourceText: "observable phrase from the user's text",
              confidence: "number from 0.0 to 1.0",
            },
          ],
          decisionOptions: [
            {
              id: "stable string, for example option_a",
              label: "option label from user text",
              sourceText: "observable phrase from the user's text",
              confidence: "number from 0.0 to 1.0",
            },
          ],
          worries: [
            {
              id: "stable string, for example worry_1",
              summary: "user-stated concern only",
              sourceText: "observable phrase from the user's text",
              confidence: "number from 0.0 to 1.0",
            },
          ],
          missingInfo: [
            {
              field: "short field name",
              reason: "why the missing information matters for extraction",
              severity: "low | medium | high",
            },
          ],
          safetyFlags: [
            {
              code: "self_harm | violence | coercion | medical | legal | investment | therapy | privacy | minors | other",
              severity: "low | medium | high",
              sourceText: "observable phrase from the user's text",
            },
          ],
          meta: {
            extractionConfidence: "number from 0.0 to 1.0",
            language: "zh | en | mixed | unknown",
            insufficientInput: "boolean",
          },
        },
      },
      validator_notes: [
        "The root object must contain situationExtraction only.",
        "All confidence values must be between 0 and 1.",
        "Each keyPeople, recentEvents, decisionOptions, worries, and safetyFlags item must include sourceText.",
        "If input is too sparse, arrays may be empty and insufficientInput should be true.",
        "The model must not output analysis, findings, or recommendations.",
      ],
      input: {
        questionText: input.questionText,
        birthInfo: input.birthInfo ?? null,
        locale: input.locale ?? "zh-CN",
        now: input.now ?? null,
      },
    }),
  };
}
