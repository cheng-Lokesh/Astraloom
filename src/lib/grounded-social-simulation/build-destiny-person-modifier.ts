import type { DestinyClimateDraft, DestinyProfileDraft } from "@/types/destiny";
import type { DestinyPersonModifier } from "@/types/grounded-social-simulation";
import type { SeedContextDraft } from "@/types/seed-context";

import { clampConfidence } from "./grounded-social-language";

function joinSummaries(
  items: Array<{ userFacingSummary: string } | undefined> | undefined,
  fallback: string,
) {
  const summaries =
    items
      ?.map((item) => item?.userFacingSummary.trim())
      .filter((value): value is string => Boolean(value))
      .slice(0, 2) ?? [];

  return summaries.length ? summaries.join(" ") : fallback;
}

function themeLabels(destinyClimate?: DestinyClimateDraft | null) {
  return new Set(
    [
      ...(destinyClimate?.activeThemes ?? []).map((theme) => theme.label),
      ...(destinyClimate?.panels ?? []).map((panel) => panel.label),
    ].filter(Boolean),
  );
}

export function buildDestinyPersonModifier({
  seedContext,
  destinyProfile,
  destinyClimate,
}: {
  seedContext: SeedContextDraft;
  destinyProfile?: DestinyProfileDraft | null;
  destinyClimate?: DestinyClimateDraft | null;
}): DestinyPersonModifier {
  const labels = themeLabels(destinyClimate);
  const uncertaintyNotes: string[] = [];

  if (!destinyProfile) {
    uncertaintyNotes.push("DestinyProfile is unavailable; modifier stays low confidence.");
  }
  if (!destinyClimate) {
    uncertaintyNotes.push("DestinyClimate is unavailable; timing sensitivity stays low confidence.");
  }
  if (!seedContext.destinyBirthInfo?.trim()) {
    uncertaintyNotes.push("Birth information is missing or incomplete.");
  }

  const profileConfidence = destinyProfile?.confidence.score ?? 35;
  const climateConfidence = destinyClimate?.confidence.score ?? 35;
  const confidence = clampConfidence(
    Math.min(68, profileConfidence, climateConfidence) - uncertaintyNotes.length * 8,
  );

  return {
    id: `dpm_${seedContext.id}`,
    destinyProfileId: destinyProfile?.id ?? `missing_profile_${seedContext.id}`,
    destinyClimateId: destinyClimate?.id ?? `missing_climate_${seedContext.id}`,
    decisionStyle: joinSummaries(
      destinyProfile?.coreTendencies,
      labels.has("self-rhythm")
        ? "May benefit from pacing decisions instead of forcing immediate closure."
        : "Use the user's stated goals and grounded constraints as the primary decision basis.",
    ),
    stressResponse: joinSummaries(
      destinyClimate?.pressureThemes,
      labels.has("information uncertainty")
        ? "Information gaps may feel heavier in this window, so uncertainty should lower confidence rather than become a strong claim."
        : "Stress response is treated as a tendency, not a prediction.",
    ),
    opportunityResponse: joinSummaries(
      destinyClimate?.opportunityThemes,
      labels.has("opportunity shift")
        ? "Opportunities may need a small observable test before larger commitment."
        : "Opportunity response should be checked against real resources and timing.",
    ),
    resourcePressureResponse: labels.has("resource pressure")
      ? "Resource pressure may make access, money, approval, or capacity feel more central."
      : "Resource pressure is weighted only when the Grounded Reality Model contains a real resource node.",
    relationshipPressureResponse: labels.has("relationship tension")
      ? "Relationship pressure may increase sensitivity to unclear signals or delayed responses."
      : "Relationship pressure is weighted only when the current situation contains grounded people or roles.",
    boundaryStyle: labels.has("boundary pressure")
      ? "Boundary choices may need explicit limits and reversible commitments."
      : "Boundary style remains conservative and evidence-seeking.",
    timingSensitivity: destinyClimate?.decisionRhythm.overall
      ? `Current rhythm is ${destinyClimate.decisionRhythm.overall}; use it as timing color, not fate.`
      : "Timing sensitivity is low confidence without DestinyClimate.",
    confidence,
    uncertaintyNotes,
  };
}
