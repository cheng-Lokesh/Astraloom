import type { SeedContextDraft } from "@/types/seed-context";

export function getSeedContextSections(seedContext: SeedContextDraft) {
  return [
    ["Main question", seedContext.questionText],
    ["Situation summary", seedContext.situationSummary],
    ["Recent key events", seedContext.recentEventsText],
    ["Key people hints", seedContext.keyPeopleText],
    ["Decision options", seedContext.decisionOptionsText],
    ["Forbidden actions", seedContext.forbiddenActionsText],
    ["Desired output", seedContext.desiredOutputText],
  ]
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([label, value]) => `${label}:\n${value}`);
}

export function getSeedContextNarrative(seedContext: SeedContextDraft) {
  return getSeedContextSections(seedContext).join("\n\n");
}
