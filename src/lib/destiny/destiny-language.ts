import type { DestinyMode, DestinyThemeLabel } from "@/types/destiny";

export const destinyThemeLabels = [
  "resource pressure",
  "boundary pressure",
  "information uncertainty",
  "emotional pull",
  "opportunity shift",
  "expression friction",
  "self-rhythm",
  "relationship tension",
] as const satisfies readonly DestinyThemeLabel[];

export const destinyThemeLanguage: Record<
  DestinyThemeLabel,
  {
    polarity: "pressure" | "opportunity" | "mixed";
    summary: string;
  }
> = {
  "resource pressure": {
    polarity: "pressure",
    summary:
      "Energy and attention may feel more claimed by practical commitments.",
  },
  "boundary pressure": {
    polarity: "pressure",
    summary:
      "External expectations and personal limits may need clearer separation.",
  },
  "information uncertainty": {
    polarity: "mixed",
    summary:
      "Some important facts may still be incomplete, so early conclusions should stay flexible.",
  },
  "emotional pull": {
    polarity: "mixed",
    summary:
      "The situation may carry a stronger emotional current than the surface facts show.",
  },
  "opportunity shift": {
    polarity: "opportunity",
    summary:
      "A changing condition may open a new route, especially if evidence is gathered before acting.",
  },
  "expression friction": {
    polarity: "mixed",
    summary:
      "What wants to be said and what is useful to say may need careful timing.",
  },
  "self-rhythm": {
    polarity: "mixed",
    summary:
      "The user's internal pace may need protection from outside urgency.",
  },
  "relationship tension": {
    polarity: "pressure",
    summary:
      "Unspoken expectations between people may become more visible in the sandbox.",
  },
};

export function confidenceSummary(mode: DestinyMode, score: number) {
  if (mode === "full") {
    return `Birth context is complete enough for a full local placeholder profile. Confidence is ${score}%, but this is still not a professional-grade chart.`;
  }

  if (mode === "rough") {
    return `Only partial birth context is available, so this profile stays directional. Confidence is ${score}%.`;
  }

  return `Birth context was skipped or unusable. The destiny layer stays low-confidence at ${score}% and the sandbox should rely more on current-situation evidence.`;
}

export function modeBoundarySummary(mode: DestinyMode) {
  if (mode === "full") {
    return "This local profile uses complete birth fields as symbolic context, not as deterministic fate.";
  }

  if (mode === "rough") {
    return "This rough profile uses available birth fields as a broad context signal only.";
  }

  return "Destiny context is skipped; the run can continue from the current situation without fate claims.";
}

export function topicThemeHints(topic: string): DestinyThemeLabel[] {
  const normalized = topic.toLowerCase();
  const labels = new Set<DestinyThemeLabel>();

  if (/boundary|boundaries|limit|limits|protect|exhausted|last-minute/.test(normalized)) {
    labels.add("boundary pressure");
    labels.add("self-rhythm");
  }

  if (/job|career|work|promotion|manager|offer|team|business|client/.test(normalized)) {
    labels.add("resource pressure");
    labels.add("boundary pressure");
    labels.add("opportunity shift");
  }

  if (/relationship|partner|family|friend|love|marriage|parent|colleague/.test(normalized)) {
    labels.add("relationship tension");
    labels.add("emotional pull");
    labels.add("information uncertainty");
  }

  if (/decide|choice|should|whether|option|timing|deadline|wait/.test(normalized)) {
    labels.add("information uncertainty");
    labels.add("self-rhythm");
  }

  if (/message|talk|communicate|explain|express|negotiate|ask/.test(normalized)) {
    labels.add("expression friction");
    labels.add("boundary pressure");
  }

  const priority: DestinyThemeLabel[] = [
    "resource pressure",
    "boundary pressure",
    "information uncertainty",
    "emotional pull",
    "opportunity shift",
    "expression friction",
    "self-rhythm",
    "relationship tension",
  ];

  return priority.filter((label) => labels.has(label)).slice(0, 5);
}
