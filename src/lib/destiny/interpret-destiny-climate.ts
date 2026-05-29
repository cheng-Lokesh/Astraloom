import type {
  DestinyClimatePanel,
  DestinyInterpretationItem,
  DestinyProfileDraft,
  DestinyTechnicalDetail,
  DestinyThemeSignal,
} from "@/types/destiny";
import type { TimeWindow } from "@/types/seed-context";

type ClimateInterpretationInput = {
  profile: DestinyProfileDraft;
  referenceDate: string;
  timeWindow: TimeWindow;
  topic: string;
  activeThemes: DestinyThemeSignal[];
  panels: DestinyClimatePanel[];
};

function itemFromPanel(
  panel: DestinyClimatePanel,
  prefix: string,
  summary: string,
): DestinyInterpretationItem {
  return {
    id: `${prefix}_${panel.id}`,
    label: panel.label,
    intensity: panel.intensity,
    userFacingSummary: summary,
    evidenceRefs: panel.evidenceRefs,
  };
}

function pressureSummary(panel: DestinyClimatePanel) {
  return `${panel.label} can amplify pressure in this window. ${panel.userFacingSummary} Worth observing where this repeats in people, timing, or sandbox events.`;
}

function opportunitySummary(panel: DestinyClimatePanel) {
  return `${panel.label} may indicate an opening to inspect. ${panel.userFacingSummary} Watch for concrete timing signals before treating it as useful.`;
}

function relationshipSummary(panel: DestinyClimatePanel) {
  return `${panel.label} may indicate relationship expectations becoming more visible. This does not describe private intent; it points to observable signals worth comparing.`;
}

function rhythmSummary(panels: DestinyClimatePanel[], timeWindow: TimeWindow) {
  const risingPressure = panels.some(
    (panel) => panel.intensity === "strong" && panel.direction === "rising",
  );
  const easingOpportunity = panels.some(
    (panel) => panel.label === "opportunity shift" && panel.direction !== "rising",
  );

  if (risingPressure) {
    return {
      overall: "observe" as const,
      early:
        "This climate can amplify pressure early, so the useful rhythm is to observe repeated signals before narrowing the path.",
      later:
        "Later in the window, compare which signals persisted in sandbox events rather than treating the first signal as decisive.",
    };
  }

  if (easingOpportunity) {
    return {
      overall: "mixed" as const,
      early:
        "The early window may be useful for preparing facts and checking timing.",
      later:
        "The later window can support action only if the opportunity signal is also visible in real evidence.",
    };
  }

  if (timeWindow === "30_days") {
    return {
      overall: "prepare" as const,
      early:
        "The short window tends to favor preparation and evidence gathering.",
      later:
        "Later signals should be compared against actual people, constraints, and event logs.",
    };
  }

  return {
    overall: "mixed" as const,
    early:
      "The early window may hold mixed signals, so it is worth observing before choosing a strong reading.",
    later:
      "The later window is best read through path divergence and repeated sandbox events.",
  };
}

export function interpretDestinyClimate({
  profile,
  referenceDate,
  timeWindow,
  topic,
  activeThemes,
  panels,
}: ClimateInterpretationInput) {
  const pressureThemes = panels
    .filter((panel) =>
      ["resource pressure", "boundary pressure", "relationship tension"].includes(
        panel.label,
      ),
    )
    .slice(0, 3)
    .map((panel) => itemFromPanel(panel, "climate_pressure", pressureSummary(panel)));
  const opportunityThemes = panels
    .filter((panel) => panel.label === "opportunity shift")
    .slice(0, 2)
    .map((panel) =>
      itemFromPanel(panel, "climate_opportunity", opportunitySummary(panel)),
    );
  const relationshipThemes = panels
    .filter((panel) =>
      ["relationship tension", "emotional pull", "boundary pressure"].includes(
        panel.label,
      ),
    )
    .slice(0, 2)
    .map((panel) =>
      itemFromPanel(panel, "climate_relationship", relationshipSummary(panel)),
    );
  const observationSignals = panels.slice(0, 4).map((panel) =>
    itemFromPanel(
      panel,
      "climate_observe",
      `${panel.label} is ${panel.intensity} and ${panel.direction}. Worth observing whether this appears in the current question, relation map, and event log.`,
    ),
  );
  const rhythm = rhythmSummary(panels, timeWindow);
  const coreTendencies: DestinyInterpretationItem[] = [
    {
      id: `climate_core_${profile.id}_${referenceDate}`,
      label: "Current climate rhythm",
      intensity: panels.some((panel) => panel.intensity === "strong")
        ? "strong"
        : "moderate",
      userFacingSummary: `${rhythm.early} ${rhythm.later}`,
      evidenceRefs: [
        `destiny:${profile.technicalSummary.seedHash}:climate:${referenceDate}`,
      ],
    },
    ...activeThemes.slice(0, 2).map((theme) => ({
      id: `climate_core_${theme.id}`,
      label: theme.label,
      intensity:
        theme.score >= 74 ? "strong" as const : theme.score >= 56 ? "moderate" as const : "mild" as const,
      userFacingSummary: `${theme.label} tends to shape this climate. ${theme.userFacingSummary}`,
      evidenceRefs: theme.evidenceRefs,
    })),
  ];
  const cautionNotes: DestinyInterpretationItem[] = [
    ...(profile.localWarnings ?? []).map((warning, index) => ({
      id: `climate_caution_${profile.id}_${index}`,
      label: "Calculation boundary",
      intensity: "moderate" as const,
      userFacingSummary: warning,
      evidenceRefs: [`destiny:${profile.technicalSummary.seedHash}:warning:${index}`],
    })),
    {
      id: `climate_caution_${profile.id}_evidence`,
      label: "Evidence boundary",
      intensity: "mild" as const,
      userFacingSummary:
        "Climate interpretation should stay secondary to real-situation evidence and sandbox events.",
      evidenceRefs: [`destiny:${profile.technicalSummary.seedHash}:climate_boundary`],
    },
  ];
  const technicalDetails: DestinyTechnicalDetail[] = [
    {
      id: `climate_technical_${profile.id}_date`,
      label: "Reference date",
      value: referenceDate,
      plainLanguage:
        "The local climate layer uses this date as the deterministic calculation anchor.",
      evidenceRefs: [`destiny:${profile.technicalSummary.seedHash}:climate:${referenceDate}`],
    },
    {
      id: `climate_technical_${profile.id}_topic`,
      label: "Topic hints",
      value: topic,
      plainLanguage:
        "Topic words can lift matching themes, but they do not create findings by themselves.",
      evidenceRefs: [`destiny:${profile.technicalSummary.seedHash}:topic`],
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
    rhythm,
  };
}
