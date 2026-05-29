import type {
  ElementBalanceDraft,
  FiveElement,
  FourPillarsDraft,
  HeavenlyStem,
  Pillar,
} from "@/types/destiny";

import { FIVE_ELEMENTS, STEM_ELEMENT } from "./constants";

function emptyCounts() {
  return {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  } satisfies Record<FiveElement, number>;
}

function addStem(counts: Record<FiveElement, number>, stem: HeavenlyStem, weight: number) {
  counts[STEM_ELEMENT[stem]] += weight;
}

function rankElements(counts: Record<FiveElement, number>) {
  return [...FIVE_ELEMENTS].sort((left, right) => counts[right] - counts[left]);
}

export function calculateElementBalance(
  fourPillars: FourPillarsDraft,
): ElementBalanceDraft {
  const counts = emptyCounts();
  const pillars = [
    fourPillars.year,
    fourPillars.month,
    fourPillars.day,
    fourPillars.hour,
  ].filter((pillar): pillar is Pillar => Boolean(pillar));

  pillars.forEach((pillar) => {
    counts[pillar.stemElement] += 2;
    counts[pillar.branchElement] += 1;
    pillar.hiddenStems.forEach((stem) => addStem(counts, stem, 0.5));
  });

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const percentages = emptyCounts();
  FIVE_ELEMENTS.forEach((element) => {
    percentages[element] = total ? Math.round((counts[element] / total) * 100) : 0;
  });

  const ranked = rankElements(counts);
  const strongestElement = ranked[0];
  const weakestElement = ranked[ranked.length - 1];
  const dayMasterElement = STEM_ELEMENT[fourPillars.dayMaster];
  const dayMasterShare = total ? counts[dayMasterElement] / total : 0;
  const dayMasterStrengthScore = Math.round(dayMasterShare * 100);
  const dayMasterStrength =
    dayMasterShare >= 0.28 ? "strong" : dayMasterShare >= 0.18 ? "balanced" : "weak";

  return {
    counts,
    percentages,
    strongestElement,
    weakestElement,
    dayMasterElement,
    dayMasterStrength,
    dayMasterStrengthScore,
    userFacingSummary: `The local V1 balance is led by ${strongestElement}. The day-master element is ${dayMasterElement} and reads as ${dayMasterStrength} in this approximate structure.`,
  };
}
