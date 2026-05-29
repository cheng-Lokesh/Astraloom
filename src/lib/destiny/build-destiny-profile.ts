import type {
  BirthInfo,
  DestinyConfidenceDraft,
  DestinyMode,
  DestinyProfileDraft,
} from "@/types/destiny";

import {
  confidenceSummary,
  modeBoundarySummary,
} from "./destiny-language";
import { buildDestinyCoreV1 } from "./destiny-core-v1";
import { interpretDestinyProfile } from "./interpret-destiny-profile";

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
  const destinyCore = buildDestinyCoreV1({
    birthInfo: normalizedBirthInfo,
    mode,
    seedHash,
  });
  const confidence = {
    ...confidenceForMode(normalizedBirthInfo, mode),
    score: destinyCore.calculationConfidence.score,
    userFacingSummary: confidenceSummary(
      mode,
      destinyCore.calculationConfidence.score,
    ),
  } satisfies DestinyConfidenceDraft;
  const interpretation = interpretDestinyProfile({
    mode,
    confidenceScore: confidence.score,
    seedHash,
    fourPillars: destinyCore.fourPillars,
    elementBalance: destinyCore.elementBalance,
    tenGodsSummary: destinyCore.tenGodsSummary,
    baseThemes: destinyCore.baseThemes,
    localWarnings: destinyCore.localWarnings,
  });

  return {
    id: `destiny_profile_${seedHash}`,
    seedContextId,
    version: "destiny-profile-local-v0",
    mode,
    birthInfo: normalizedBirthInfo,
    confidence,
    fourPillars: destinyCore.fourPillars,
    elementBalance: destinyCore.elementBalance,
    tenGodsSummary: destinyCore.tenGodsSummary,
    destinyCalculationConfidence: destinyCore.calculationConfidence,
    localWarnings: destinyCore.localWarnings,
    coreTendencies: interpretation.coreTendencies,
    pressureThemes: interpretation.pressureThemes,
    opportunityThemes: interpretation.opportunityThemes,
    relationshipThemes: interpretation.relationshipThemes,
    cautionNotes: interpretation.cautionNotes,
    observationSignals: interpretation.observationSignals,
    technicalDetails: interpretation.technicalDetails,
    baseThemes: destinyCore.baseThemes,
    userFacingSummary: modeBoundarySummary(mode),
    technicalSummary: {
      seedHash,
      monthBucket,
      dayBucket,
      hasProfessionalChart: false,
      calculationNote:
        "Destiny Core V1 uses local deterministic Four Pillars approximation. It is structured and explainable, but not professional-grade BaZi precision; solar-term and true-solar-time refinement are still future work.",
      destinyCoreVersion: "destiny-core-local-v1",
    },
    evidenceRefs: [
      `destiny:${seedHash}:birth_info`,
      `destiny:${seedHash}:core_v1`,
    ],
    createdAt,
    updatedAt: createdAt,
  };
}
