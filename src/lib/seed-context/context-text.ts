import type { SeedContextDraft } from "@/types/seed-context";

function firstText(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim()) ?? "";
}

export function getSeedContextSections(seedContext: SeedContextDraft) {
  return [
    ["Main question", seedContext.questionText],
    ["Situation summary", seedContext.situationSummary],
    [
      "Recent key events",
      firstText(seedContext.recentEvents, seedContext.recentEventsText),
    ],
    ["Key people hints", seedContext.keyPeopleText],
    [
      "Decision options",
      firstText(seedContext.decisionOptions, seedContext.decisionOptionsText),
    ],
    ["Worries and uncertain assumptions", seedContext.worries],
    [
      "Forbidden actions",
      firstText(seedContext.forbiddenActions, seedContext.forbiddenActionsText),
    ],
    ["Safety boundaries", seedContext.safetyBoundaries],
    [
      "Desired output",
      firstText(seedContext.desiredOutput, seedContext.desiredOutputText),
    ],
    ["Missing context hints", seedContext.missingContextHints?.join("; ")],
  ]
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([label, value]) => `${label}:\n${value}`);
}

export function getSeedContextNarrative(seedContext: SeedContextDraft) {
  return getSeedContextSections(seedContext).join("\n\n");
}
