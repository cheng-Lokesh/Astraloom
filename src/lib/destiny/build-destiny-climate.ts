import type {
  DestinyClimateDraft,
  DestinyClimatePanel,
  DestinyProfileDraft,
  DestinyThemeLabel,
  DestinyThemeSignal,
} from "@/types/destiny";
import type { TimeWindow } from "@/types/seed-context";

import { destinyThemeLanguage, topicThemeHints } from "./destiny-language";
import { interpretDestinyClimate } from "./interpret-destiny-climate";

type BuildDestinyClimateInput = {
  profile: DestinyProfileDraft;
  referenceDate?: string | Date;
  timeWindow: TimeWindow;
  topic?: string;
};

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function toDateOnly(value: string | Date | undefined) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);

  return date.toISOString().slice(0, 10);
}

function intensity(score: number): DestinyClimatePanel["intensity"] {
  if (score >= 74) return "strong";
  if (score >= 56) return "moderate";
  return "mild";
}

function direction(seed: string): DestinyClimatePanel["direction"] {
  const bucket = parseInt(hashText(seed).slice(0, 2), 36) % 3;
  if (bucket === 0) return "rising";
  if (bucket === 1) return "steady";
  return "easing";
}

function scoreForTheme(
  profile: DestinyProfileDraft,
  label: DestinyThemeLabel,
  referenceDate: string,
  topic: string,
) {
  const base =
    profile.baseThemes.find((theme) => theme.label === label)?.score ?? 44;
  const dateShift =
    parseInt(hashText(`${profile.id}:${referenceDate}:${topic}:${label}`).slice(0, 3), 36) %
    18;

  return Math.max(20, Math.min(88, base - 6 + dateShift));
}

function mergeThemes(
  profile: DestinyProfileDraft,
  referenceDate: string,
  topic: string,
) {
  const topicHints = topicThemeHints(topic);
  const labels = new Set<DestinyThemeLabel>([
    ...profile.baseThemes.map((theme) => theme.label),
    ...topicHints,
  ]);

  if (!labels.size) labels.add("information uncertainty");

  const rankedThemes = Array.from(labels)
    .map((label, index): DestinyThemeSignal => {
      const language = destinyThemeLanguage[label];
      const topicHintBonus = topicHints.includes(label) ? 36 : 0;
      const score = Math.min(
        92,
        scoreForTheme(profile, label, referenceDate, topic) + topicHintBonus,
      );

      return {
        id: `climate_theme_${hashText(`${profile.id}:${referenceDate}:${label}:${index}`)}`,
        label,
        score,
        polarity: language.polarity,
        userFacingSummary: language.summary,
        evidenceRefs: [
          `destiny:${profile.technicalSummary.seedHash}:climate:${label.replace(/\s+/g, "_")}`,
        ],
      };
    })
    .sort((left, right) => right.score - left.score);
  const selectedThemes = rankedThemes.slice(0, 5);

  topicHints.forEach((label) => {
    if (selectedThemes.some((theme) => theme.label === label)) return;

    const hintedTheme = rankedThemes.find((theme) => theme.label === label);
    if (!hintedTheme) return;

    const replaceIndex = selectedThemes.findLastIndex(
      (theme) => !topicHints.includes(theme.label),
    );
    if (replaceIndex === -1) return;

    selectedThemes[replaceIndex] = hintedTheme;
  });

  return selectedThemes.sort((left, right) => right.score - left.score);
}

function buildPanels(
  themes: DestinyThemeSignal[],
  profile: DestinyProfileDraft,
  referenceDate: string,
): DestinyClimatePanel[] {
  return themes.map((theme, index) => ({
    id: `climate_panel_${hashText(`${theme.id}:${index}`)}`,
    label: theme.label,
    intensity: intensity(theme.score),
    direction: direction(`${profile.id}:${referenceDate}:${theme.label}`),
    userFacingSummary: theme.userFacingSummary,
    evidenceRefs: theme.evidenceRefs,
  }));
}

function buildDecisionRhythm(
  referenceDate: string,
  timeWindow: TimeWindow,
  panels: DestinyClimatePanel[],
) {
  const hasStrongPressure = panels.some(
    (panel) => panel.intensity === "strong" && panel.direction === "rising",
  );
  const hasOpportunity = panels.some((panel) => panel.label === "opportunity shift");
  const overall = hasStrongPressure
    ? "observe"
    : hasOpportunity
      ? "mixed"
      : timeWindow === "30_days"
        ? "prepare"
        : "mixed";

  return {
    overall,
    phases: [
      {
        label: "early window",
        period: `${referenceDate} start`,
        actionLevel: hasStrongPressure ? "observe" : "prepare",
        userFacingSummary:
          "Use the early window to gather evidence and keep the question flexible.",
      },
      {
        label: "later window",
        period: `${timeWindow} horizon`,
        actionLevel: hasOpportunity ? "act" : "reflect",
        userFacingSummary:
          "Use the later window to compare paths after the situation map has more signal.",
      },
    ],
  } satisfies DestinyClimateDraft["decisionRhythm"];
}

export function buildDestinyClimateDraft({
  profile,
  referenceDate,
  timeWindow,
  topic = "",
}: BuildDestinyClimateInput): DestinyClimateDraft {
  const dateOnly = toDateOnly(referenceDate);
  const createdAt = `${dateOnly}T00:00:00.000Z`;
  const normalizedTopic = topic.trim() || "general current question";
  const activeThemes = mergeThemes(profile, dateOnly, normalizedTopic);
  const panels = buildPanels(activeThemes, profile, dateOnly);
  const interpretation = interpretDestinyClimate({
    profile,
    referenceDate: dateOnly,
    timeWindow,
    topic: normalizedTopic,
    activeThemes,
    panels,
  });
  const decisionRhythm = buildDecisionRhythm(dateOnly, timeWindow, panels);
  const strongestPanel = panels[0];

  return {
    id: `destiny_climate_${hashText(`${profile.id}:${dateOnly}:${timeWindow}:${normalizedTopic}`)}`,
    profileId: profile.id,
    seedContextId: profile.seedContextId,
    version: "destiny-climate-local-v0",
    mode: profile.mode,
    referenceDate: dateOnly,
    timeWindow,
    topic: normalizedTopic,
    activeThemes,
    panels,
    coreTendencies: interpretation.coreTendencies,
    pressureThemes: interpretation.pressureThemes,
    opportunityThemes: interpretation.opportunityThemes,
    relationshipThemes: interpretation.relationshipThemes,
    cautionNotes: interpretation.cautionNotes,
    observationSignals: interpretation.observationSignals,
    technicalDetails: interpretation.technicalDetails,
    decisionRhythm,
    userFacingOverview: strongestPanel
      ? `Current climate is led by ${strongestPanel.label}. ${strongestPanel.userFacingSummary} This climate can amplify observable signals, but it is not a deterministic prediction.`
      : "Current climate is low-detail because destiny context is limited. Use the real situation evidence as the main guide.",
    confidence: profile.confidence,
    evidenceRefs: [
      ...profile.evidenceRefs,
      `destiny:${profile.technicalSummary.seedHash}:climate:${dateOnly}`,
    ],
    createdAt,
    updatedAt: createdAt,
  };
}
