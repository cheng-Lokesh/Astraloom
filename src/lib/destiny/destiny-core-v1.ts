import type {
  BirthInfo,
  DestinyCalculationConfidence,
  DestinyMode,
  DestinyThemeLabel,
  DestinyThemeSignal,
  ElementBalanceDraft,
  TenGodName,
} from "@/types/destiny";

import { calculateElementBalance } from "./calculate-element-balance";
import { calculateFourPillars } from "./calculate-four-pillars";
import { calculateTenGods, summarizeTenGods } from "./calculate-ten-gods";
import { destinyThemeLanguage, destinyThemeLabels } from "./destiny-language";

const LOCAL_APPROXIMATION_WARNING =
  "V1 uses local deterministic calculation and may require solar-term refinement.";
const UNKNOWN_TIME_WARNING = "Unknown birth time reduces hour-pillar confidence.";

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function score(value: number) {
  return Math.max(18, Math.min(92, Math.round(value)));
}

function count(counts: Record<TenGodName, number>, ...gods: TenGodName[]) {
  return gods.reduce((sum, god) => sum + counts[god], 0);
}

function buildThemeSignal(
  seedHash: string,
  label: DestinyThemeLabel,
  scoreValue: number,
  evidenceRefs: string[],
): DestinyThemeSignal {
  const language = destinyThemeLanguage[label];

  return {
    id: `destiny_theme_${hashText(`${seedHash}:${label}:${scoreValue}`)}`,
    label,
    score: score(scoreValue),
    polarity: language.polarity,
    userFacingSummary: language.summary,
    evidenceRefs,
  };
}

function themeScores(
  elementBalance: ElementBalanceDraft,
  tenGodCounts: Record<TenGodName, number>,
) {
  const wealth = count(tenGodCounts, "direct_wealth", "indirect_wealth");
  const authority = count(tenGodCounts, "direct_officer", "seven_killings");
  const resource = count(tenGodCounts, "direct_resource", "indirect_resource");
  const expression = count(tenGodCounts, "eating_god", "hurting_officer");
  const peer = count(tenGodCounts, "friend", "rob_wealth");
  const dayWeakBonus = elementBalance.dayMasterStrength === "weak" ? 14 : 0;
  const dayStrongBonus = elementBalance.dayMasterStrength === "strong" ? 10 : 0;

  return {
    "resource pressure": 38 + wealth * 9 + dayWeakBonus,
    "boundary pressure": 36 + authority * 10,
    "information uncertainty": 34 + resource * 8 + elementBalance.percentages.water / 2,
    "emotional pull": 34 + elementBalance.percentages.fire / 2 + expression * 4,
    "opportunity shift": 32 + wealth * 5 + expression * 6,
    "expression friction":
      32 + tenGodCounts.hurting_officer * 12 + authority * 3,
    "self-rhythm": 36 + peer * 8 + dayStrongBonus,
    "relationship tension":
      34 + tenGodCounts.rob_wealth * 8 + authority * 5 + dayWeakBonus / 2,
  } satisfies Record<DestinyThemeLabel, number>;
}

function skippedThemes(seedHash: string) {
  return [
    buildThemeSignal(seedHash, "information uncertainty", 34, [
      `destiny:${seedHash}:skipped`,
    ]),
    buildThemeSignal(seedHash, "self-rhythm", 30, [`destiny:${seedHash}:skipped`]),
  ];
}

export function buildDestinyCoreV1({
  birthInfo,
  mode,
  seedHash,
}: {
  birthInfo: BirthInfo;
  mode: DestinyMode;
  seedHash: string;
}) {
  const hasBirthDate = hasText(birthInfo.birthDate);
  const hasBirthTime = hasText(birthInfo.birthTime);
  const hasBirthPlace = hasText(birthInfo.birthPlace);
  const localWarnings = [LOCAL_APPROXIMATION_WARNING];

  if (!hasBirthTime) localWarnings.push(UNKNOWN_TIME_WARNING);

  const calculationConfidence: DestinyCalculationConfidence = {
    score:
      mode === "skipped"
        ? 24
        : Math.max(
            20,
            Math.min(
              88,
              86 -
                (hasBirthTime ? 0 : 18) -
                (hasBirthPlace ? 0 : 8) -
                6,
            ),
          ),
    calculationVersion: "destiny-core-local-v1",
    precisionLevel:
      mode === "skipped"
        ? "skipped"
        : hasBirthTime
          ? "date-time-local"
          : "date-only",
    hasBirthDate,
    hasBirthTime,
    hasBirthPlace,
    usesSolarTermApproximation: true,
    usesTrueSolarTime: false,
    localWarnings,
  };

  const fourPillars = calculateFourPillars({
    birthDate: birthInfo.birthDate,
    birthTime: birthInfo.birthTime,
  });

  if (!fourPillars) {
    return {
      fourPillars: null,
      elementBalance: null,
      tenGodsSummary: [],
      baseThemes: skippedThemes(seedHash),
      calculationConfidence,
      localWarnings,
    };
  }

  const elementBalance = calculateElementBalance(fourPillars);
  const tenGodsSummary = calculateTenGods(fourPillars);
  const tenGodCounts = summarizeTenGods(tenGodsSummary);
  const scores = themeScores(elementBalance, tenGodCounts);
  const baseThemes = destinyThemeLabels
    .map((label) =>
      buildThemeSignal(seedHash, label, scores[label], [
        `destiny:${seedHash}:core_v1:${label.replace(/\s+/g, "_")}`,
        `destiny:${seedHash}:four_pillars`,
      ]),
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  return {
    fourPillars,
    elementBalance,
    tenGodsSummary,
    baseThemes,
    calculationConfidence,
    localWarnings: Array.from(
      new Set([...localWarnings, ...fourPillars.localWarnings]),
    ),
  };
}
