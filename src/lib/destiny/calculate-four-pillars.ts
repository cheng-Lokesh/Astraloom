import type {
  EarthlyBranch,
  FourPillarsDraft,
  HeavenlyStem,
  Pillar,
} from "@/types/destiny";

import {
  BRANCH_ELEMENT,
  BRANCH_HIDDEN_STEMS,
  BRANCH_LABEL,
  BRANCH_YIN_YANG,
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  MONTH_BRANCH_ORDER,
  STEM_ELEMENT,
  STEM_LABEL,
  STEM_YIN_YANG,
} from "./constants";

type DateParts = {
  year: number;
  month: number;
  day: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LOCAL_APPROXIMATION_WARNING =
  "V1 uses local deterministic calculation and may require solar-term refinement.";
const UNKNOWN_TIME_WARNING = "Unknown birth time reduces hour-pillar confidence.";

function positiveMod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function parseDate(value?: string): DateParts | null {
  const match = value?.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function parseHour(value?: string) {
  const match = value?.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return hour;
}

function createPillar(stemIndex: number, branchIndex: number): Pillar {
  const stem = HEAVENLY_STEMS[positiveMod(stemIndex, HEAVENLY_STEMS.length)];
  const branch = EARTHLY_BRANCHES[positiveMod(branchIndex, EARTHLY_BRANCHES.length)];

  return {
    stem,
    branch,
    stemElement: STEM_ELEMENT[stem],
    branchElement: BRANCH_ELEMENT[branch],
    stemYinYang: STEM_YIN_YANG[stem],
    branchYinYang: BRANCH_YIN_YANG[branch],
    hiddenStems: BRANCH_HIDDEN_STEMS[branch],
    label: `${STEM_LABEL[stem]} / ${BRANCH_LABEL[branch]}`,
  };
}

function isBeforeApproximateLiChun(parts: DateParts) {
  return parts.month < 2 || (parts.month === 2 && parts.day < 4);
}

function yearPillarYear(parts: DateParts) {
  return isBeforeApproximateLiChun(parts) ? parts.year - 1 : parts.year;
}

function calculateYearPillar(parts: DateParts) {
  const pillarYear = yearPillarYear(parts);
  return createPillar(pillarYear - 4, pillarYear - 4);
}

function solarMonthIndex(parts: DateParts) {
  const mmdd = parts.month * 100 + parts.day;

  if (mmdd >= 1207 || mmdd < 106) return 10;
  if (mmdd >= 1107) return 9;
  if (mmdd >= 1008) return 8;
  if (mmdd >= 907) return 7;
  if (mmdd >= 807) return 6;
  if (mmdd >= 707) return 5;
  if (mmdd >= 606) return 4;
  if (mmdd >= 506) return 3;
  if (mmdd >= 405) return 2;
  if (mmdd >= 306) return 1;
  if (mmdd >= 204) return 0;
  return 11;
}

function calculateMonthPillar(parts: DateParts, year: Pillar) {
  const monthIndex = solarMonthIndex(parts);
  const branch = MONTH_BRANCH_ORDER[monthIndex];
  const yearStemIndex = HEAVENLY_STEMS.indexOf(year.stem);
  const stemIndex = yearStemIndex * 2 + monthIndex + 2;

  return createPillar(stemIndex, EARTHLY_BRANCHES.indexOf(branch));
}

function dateForDayPillar(parts: DateParts, birthTime?: string) {
  const hour = parseHour(birthTime);
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (hour === 23) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function calculateDayPillar(parts: DateParts, birthTime?: string) {
  const target = dateForDayPillar(parts, birthTime);
  const reference = new Date(Date.UTC(1900, 0, 1));
  const days = Math.floor((target.getTime() - reference.getTime()) / MS_PER_DAY);

  return createPillar(days, 10 + days);
}

function hourBranch(hour: number): EarthlyBranch {
  if (hour === 23 || hour === 0) return "zi";
  if (hour < 3) return "chou";
  if (hour < 5) return "yin";
  if (hour < 7) return "mao";
  if (hour < 9) return "chen";
  if (hour < 11) return "si";
  if (hour < 13) return "wu";
  if (hour < 15) return "wei";
  if (hour < 17) return "shen";
  if (hour < 19) return "you";
  if (hour < 21) return "xu";
  return "hai";
}

function calculateHourPillar(day: Pillar, birthTime?: string) {
  const hour = parseHour(birthTime);
  if (hour === null) return null;

  const branch = hourBranch(hour);
  const dayStemIndex = HEAVENLY_STEMS.indexOf(day.stem);
  const branchIndex = EARTHLY_BRANCHES.indexOf(branch);

  return createPillar(dayStemIndex * 2 + branchIndex, branchIndex);
}

export function calculateFourPillars({
  birthDate,
  birthTime,
}: {
  birthDate?: string;
  birthTime?: string;
}): FourPillarsDraft | null {
  const parts = parseDate(birthDate);
  if (!parts) return null;

  const year = calculateYearPillar(parts);
  const month = calculateMonthPillar(parts, year);
  const day = calculateDayPillar(parts, birthTime);
  const hour = calculateHourPillar(day, birthTime);
  const localWarnings = [LOCAL_APPROXIMATION_WARNING];

  if (!hour) localWarnings.push(UNKNOWN_TIME_WARNING);

  return {
    year,
    month,
    day,
    hour,
    dayMaster: day.stem as HeavenlyStem,
    pillarsAvailable: hour ? 4 : 3,
    calculationMethod: "local-deterministic-v1",
    localWarnings,
  };
}
