import type {
  BirthInfo,
  DestinyConfidenceDraft,
  DestinyMode,
  DestinyProfileDraft,
  DestinyThemeLabel,
  DestinyThemeSignal,
} from "@/types/destiny";

import {
  confidenceSummary,
  destinyThemeLanguage,
  destinyThemeLabels,
  modeBoundarySummary,
} from "./destiny-language";

type BuildDestinyProfileInput = {
  birthInfo?: BirthInfo | null;
  seedContextId?: string;
  now?: string;
};

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeBirthInfo(birthInfo?: BirthInfo | null): BirthInfo {
  return {
    birthDate: birthInfo?.birthDate?.trim() || undefined,
    birthTime: birthInfo?.birthTime?.trim() || undefined,
    birthPlace: birthInfo?.birthPlace?.trim() || undefined,
    gender: birthInfo?.gender?.trim() || undefined,
    timezone: birthInfo?.timezone?.trim() || undefined,
  };
}

export function determineDestinyMode(birthInfo?: BirthInfo | null): DestinyMode {
  const normalized = normalizeBirthInfo(birthInfo);

  if (
    hasText(normalized.birthDate) &&
    hasText(normalized.birthTime) &&
    hasText(normalized.birthPlace)
  ) {
    return "full";
  }

  if (hasText(normalized.birthDate)) {
    return "rough";
  }

  return "skipped";
}

function confidenceForMode(
  birthInfo: BirthInfo,
  mode: DestinyMode,
): DestinyConfidenceDraft {
  const fields: Array<keyof BirthInfo> = [
    "birthDate",
    "birthTime",
    "birthPlace",
    "gender",
    "timezone",
  ];
  const availableFields = fields.filter((field) => hasText(birthInfo[field]));
  const missingFields = fields.filter((field) => !hasText(birthInfo[field]));
  const score = mode === "full" ? 82 : mode === "rough" ? 58 : 28;

  return {
    score,
    mode,
    availableFields,
    missingFields,
    userFacingSummary: confidenceSummary(mode, score),
  };
}

function parseDateParts(birthDate?: string) {
  if (!birthDate) return { monthBucket: null, dayBucket: null };

  const match = birthDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return { monthBucket: null, dayBucket: null };

  return {
    monthBucket: Math.max(1, Math.min(12, Number(match[2]))),
    dayBucket: Math.max(1, Math.min(31, Number(match[3]))),
  };
}

function themeScore(seedHash: string, label: DestinyThemeLabel, index: number) {
  const raw = parseInt(hashText(`${seedHash}:${label}:${index}`).slice(0, 4), 36);
  return 42 + (raw % 44);
}

function buildBaseThemes(seedHash: string, mode: DestinyMode) {
  if (mode === "skipped") {
    return [
      buildThemeSignal(seedHash, "information uncertainty", 34, 0),
      buildThemeSignal(seedHash, "self-rhythm", 30, 1),
    ];
  }

  return destinyThemeLabels
    .map((label, index) =>
      buildThemeSignal(seedHash, label, themeScore(seedHash, label, index), index),
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);
}

function buildThemeSignal(
  seedHash: string,
  label: DestinyThemeLabel,
  score: number,
  index: number,
): DestinyThemeSignal {
  const language = destinyThemeLanguage[label];

  return {
    id: `destiny_theme_${hashText(`${seedHash}:${label}:${index}`)}`,
    label,
    score,
    polarity: language.polarity,
    userFacingSummary: language.summary,
    evidenceRefs: [`destiny:${seedHash}:theme:${label.replace(/\s+/g, "_")}`],
  };
}

export function buildDestinyProfileDraft({
  birthInfo,
  seedContextId,
  now,
}: BuildDestinyProfileInput = {}): DestinyProfileDraft {
  const normalizedBirthInfo = normalizeBirthInfo(birthInfo);
  const mode = determineDestinyMode(normalizedBirthInfo);
  const createdAt = now ?? "1970-01-01T00:00:00.000Z";
  const seedHash = hashText(
    JSON.stringify({
      birthInfo: normalizedBirthInfo,
      seedContextId: seedContextId ?? "local",
    }),
  );
  const { monthBucket, dayBucket } = parseDateParts(normalizedBirthInfo.birthDate);
  const confidence = confidenceForMode(normalizedBirthInfo, mode);
  const baseThemes = buildBaseThemes(seedHash, mode);

  return {
    id: `destiny_profile_${seedHash}`,
    seedContextId,
    version: "destiny-profile-local-v0",
    mode,
    birthInfo: normalizedBirthInfo,
    confidence,
    baseThemes,
    userFacingSummary: modeBoundarySummary(mode),
    technicalSummary: {
      seedHash,
      monthBucket,
      dayBucket,
      hasProfessionalChart: false,
      calculationNote:
        "Local deterministic placeholder only. A professional-grade BaZi calculation core is not implemented in this module.",
    },
    evidenceRefs: [`destiny:${seedHash}:birth_info`],
    createdAt,
    updatedAt: createdAt,
  };
}
