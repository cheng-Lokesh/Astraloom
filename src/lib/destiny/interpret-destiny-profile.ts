import type {
  DestinyInterpretationItem,
  DestinyMode,
  DestinyTechnicalDetail,
  DestinyThemeSignal,
  ElementBalanceDraft,
  FourPillarsDraft,
  TenGodName,
  TenGodSignal,
} from "@/types/destiny";

import { BRANCH_LABEL, STEM_LABEL, TEN_GOD_LANGUAGE } from "./constants";
import { summarizeTenGods } from "./calculate-ten-gods";

type ProfileInterpretationInput = {
  mode: DestinyMode;
  confidenceScore: number;
  seedHash: string;
  fourPillars?: FourPillarsDraft | null;
  elementBalance?: ElementBalanceDraft | null;
  tenGodsSummary?: TenGodSignal[];
  baseThemes: DestinyThemeSignal[];
  localWarnings?: string[];
};

function intensity(score: number): DestinyInterpretationItem["intensity"] {
  if (score >= 74) return "strong";
  if (score >= 56) return "moderate";
  return "mild";
}

function themeItem(
  theme: DestinyThemeSignal,
  prefix: string,
  summary: string,
): DestinyInterpretationItem {
  return {
    id: `${prefix}_${theme.id}`,
    label: theme.label,
    intensity: intensity(theme.score),
    userFacingSummary: summary,
    evidenceRefs: theme.evidenceRefs,
  };
}

function dominantTenGods(signals: TenGodSignal[]) {
  const counts = summarizeTenGods(signals);

  return (Object.entries(counts) as Array<[TenGodName, number]>)
    .filter(([, value]) => value > 0)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 3);
}

function skippedInterpretation(seedHash: string) {
  const evidenceRefs = [`destiny:${seedHash}:skipped`];

  return {
    coreTendencies: [
      {
        id: `core_${seedHash}_skipped`,
        label: "Reality-first sandbox",
        intensity: "mild" as const,
        userFacingSummary:
          "Destiny context was skipped, so the sandbox tends to lean on the current question, people, and observable evidence.",
        evidenceRefs,
      },
    ],
    pressureThemes: [],
    opportunityThemes: [],
    relationshipThemes: [],
    cautionNotes: [
      {
        id: `caution_${seedHash}_skipped`,
        label: "Low destiny detail",
        intensity: "mild" as const,
        userFacingSummary:
          "This may indicate that destiny-layer wording should stay minimal and the result should be read through real-situation evidence.",
        evidenceRefs,
      },
    ],
    observationSignals: [
      {
        id: `observe_${seedHash}_skipped`,
        label: "Current facts",
        intensity: "moderate" as const,
        userFacingSummary:
          "Worth observing which people, timing constraints, and evidence-backed events repeat across the sandbox.",
        evidenceRefs,
      },
    ],
    technicalDetails: [],
  };
}

export function interpretDestinyProfile({
  mode,
  confidenceScore,
  seedHash,
  fourPillars,
  elementBalance,
  tenGodsSummary = [],
  baseThemes,
  localWarnings = [],
}: ProfileInterpretationInput) {
  if (mode === "skipped" || !fourPillars || !elementBalance) {
    return skippedInterpretation(seedHash);
  }

  const pressureThemes = baseThemes
    .filter((theme) => theme.polarity === "pressure" || theme.polarity === "mixed")
    .slice(0, 3)
    .map((theme) =>
      themeItem(
        theme,
        "pressure",
        `${theme.label} may indicate a pressure channel to observe. ${theme.userFacingSummary} Watch for repeated evidence before treating it as important.`,
      ),
    );
  const opportunityThemes = baseThemes
    .filter((theme) => theme.polarity === "opportunity" || theme.label === "opportunity shift")
    .slice(0, 2)
    .map((theme) =>
      themeItem(
        theme,
        "opportunity",
        `${theme.label} tends to describe where a cleaner opening may appear. ${theme.userFacingSummary} Worth observing through timing and concrete evidence.`,
      ),
    );
  const relationshipThemes = baseThemes
    .filter((theme) =>
      ["relationship tension", "emotional pull", "boundary pressure"].includes(
        theme.label,
      ),
    )
    .slice(0, 2)
    .map((theme) =>
      themeItem(
        theme,
        "relationship",
        `${theme.label} may indicate that expectations between people need closer observation. This does not describe hidden motives; it marks signals to compare with real events.`,
      ),
    );
  const topTenGods = dominantTenGods(tenGodsSummary);
  const dayMasterIntensity: DestinyInterpretationItem["intensity"] =
    elementBalance.dayMasterStrength === "balanced" ? "moderate" : "strong";
  const coreTendencies: DestinyInterpretationItem[] = [
    {
      id: `core_${seedHash}_element_balance`,
      label: `${elementBalance.dayMasterElement} day-master balance`,
      intensity: dayMasterIntensity,
      userFacingSummary: `The local V1 profile tends to read the day-master element as ${elementBalance.dayMasterStrength}. This can shape how strongly pressure or opportunity themes are amplified, but it does not decide an outcome.`,
      evidenceRefs: [`destiny:${seedHash}:element_balance`],
    },
    ...topTenGods.map(([god, value]) => ({
      id: `core_${seedHash}_${god}`,
      label: TEN_GOD_LANGUAGE[god],
      intensity: value >= 3 ? "strong" as const : value >= 1.5 ? "moderate" as const : "mild" as const,
      userFacingSummary: `${TEN_GOD_LANGUAGE[god]} appears in the local structure and may indicate a repeated symbolic pattern to compare against the current situation.`,
      evidenceRefs: [`destiny:${seedHash}:ten_gods:${god}`],
    })),
  ].slice(0, 4);
  const cautionNotes: DestinyInterpretationItem[] = [
    ...localWarnings.map((warning, index) => ({
      id: `caution_${seedHash}_${index}`,
      label: "Calculation boundary",
      intensity: "moderate" as const,
      userFacingSummary: warning,
      evidenceRefs: [`destiny:${seedHash}:local_warning:${index}`],
    })),
    {
      id: `caution_${seedHash}_confidence`,
      label: "Interpretation confidence",
      intensity: confidenceScore >= 70 ? "mild" : "moderate",
      userFacingSummary:
        "Technical BaZi details are available for inspection, but user-facing interpretation should stay directional and evidence-aware.",
      evidenceRefs: [`destiny:${seedHash}:confidence`],
    },
  ];
  const observationSignals: DestinyInterpretationItem[] = baseThemes
    .slice(0, 3)
    .map((theme) =>
      themeItem(
        theme,
        "observe",
        `${theme.label} is worth observing when it repeats in people, timing, and sandbox events. A single symbolic signal should not override current evidence.`,
      ),
    );
  const technicalDetails: DestinyTechnicalDetail[] = [
    {
      id: `technical_${seedHash}_pillars`,
      label: "Four Pillars local draft",
      value: [
        fourPillars.year.label,
        fourPillars.month.label,
        fourPillars.day.label,
        fourPillars.hour?.label ?? "hour unknown",
      ].join(" / "),
      plainLanguage:
        "A local deterministic pillar draft used as symbolic structure; solar-term precision is not yet professional-grade.",
      evidenceRefs: [`destiny:${seedHash}:four_pillars`],
    },
    {
      id: `technical_${seedHash}_day_master`,
      label: "Day master",
      value: `${STEM_LABEL[fourPillars.dayMaster]} / ${BRANCH_LABEL[fourPillars.day.branch]}`,
      plainLanguage:
        "A technical anchor used to compare stems and elements; it should be read as structure, not as fate.",
      evidenceRefs: [`destiny:${seedHash}:day_master`],
    },
    {
      id: `technical_${seedHash}_element_balance`,
      label: "Element balance",
      value: `${elementBalance.strongestElement} strongest, ${elementBalance.weakestElement} lightest`,
      plainLanguage:
        "A simple count-based balance from stems, branches, and hidden stems.",
      evidenceRefs: [`destiny:${seedHash}:element_balance`],
    },
  ];

  return {
    coreTendencies,
    pressureThemes,
    opportunityThemes,
    relationshipThemes,
    cautionNotes,
    observationSignals,
    technicalDetails,
  };
}
