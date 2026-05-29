import type {
  FourPillarsDraft,
  HeavenlyStem,
  TenGodName,
  TenGodSignal,
} from "@/types/destiny";

import {
  CONTROLS,
  GENERATES,
  STEM_ELEMENT,
  STEM_YIN_YANG,
  TEN_GOD_LANGUAGE,
} from "./constants";

function tenGodForStem(dayMaster: HeavenlyStem, other: HeavenlyStem): TenGodName {
  const dayElement = STEM_ELEMENT[dayMaster];
  const otherElement = STEM_ELEMENT[other];
  const samePolarity = STEM_YIN_YANG[dayMaster] === STEM_YIN_YANG[other];

  if (dayElement === otherElement) return samePolarity ? "friend" : "rob_wealth";
  if (GENERATES[dayElement] === otherElement) {
    return samePolarity ? "eating_god" : "hurting_officer";
  }
  if (CONTROLS[dayElement] === otherElement) {
    return samePolarity ? "indirect_wealth" : "direct_wealth";
  }
  if (GENERATES[otherElement] === dayElement) {
    return samePolarity ? "indirect_resource" : "direct_resource";
  }
  return samePolarity ? "seven_killings" : "direct_officer";
}

function signal(
  dayMaster: HeavenlyStem,
  stem: HeavenlyStem,
  source: TenGodSignal["source"],
  countWeight: number,
): TenGodSignal {
  const god = tenGodForStem(dayMaster, stem);

  return {
    god,
    stem,
    source,
    countWeight,
    userFacingSummary: TEN_GOD_LANGUAGE[god],
  };
}

export function calculateTenGods(fourPillars: FourPillarsDraft): TenGodSignal[] {
  const dayMaster = fourPillars.dayMaster;
  const stems: Array<{
    stem: HeavenlyStem;
    source: TenGodSignal["source"];
    weight: number;
  }> = [
    { stem: fourPillars.year.stem, source: "year_stem", weight: 1 },
    { stem: fourPillars.month.stem, source: "month_stem", weight: 1 },
    { stem: fourPillars.day.stem, source: "day_stem", weight: 1 },
    ...(fourPillars.hour
      ? [{ stem: fourPillars.hour.stem, source: "hour_stem" as const, weight: 1 }]
      : []),
    ...fourPillars.year.hiddenStems.map((stem) => ({
      stem,
      source: "year_hidden" as const,
      weight: 0.5,
    })),
    ...fourPillars.month.hiddenStems.map((stem) => ({
      stem,
      source: "month_hidden" as const,
      weight: 0.5,
    })),
    ...fourPillars.day.hiddenStems.map((stem) => ({
      stem,
      source: "day_hidden" as const,
      weight: 0.5,
    })),
    ...(fourPillars.hour?.hiddenStems.map((stem) => ({
      stem,
      source: "hour_hidden" as const,
      weight: 0.5,
    })) ?? []),
  ];

  return stems.map(({ stem, source, weight }) =>
    signal(dayMaster, stem, source, weight),
  );
}

export function summarizeTenGods(signals: TenGodSignal[]) {
  return signals.reduce<Record<TenGodName, number>>(
    (counts, item) => ({
      ...counts,
      [item.god]: counts[item.god] + item.countWeight,
    }),
    {
      friend: 0,
      rob_wealth: 0,
      eating_god: 0,
      hurting_officer: 0,
      indirect_wealth: 0,
      direct_wealth: 0,
      seven_killings: 0,
      direct_officer: 0,
      indirect_resource: 0,
      direct_resource: 0,
    },
  );
}
