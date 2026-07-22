import type { SeedContextDraft } from "@/types/seed-context";
import { z } from "zod";

const seedContextDraftKey = "mirofish.seed-context.draft";
const defaultTimeWindow = "90_days";

type LegacySeedContextDraft = Partial<SeedContextDraft> & {
  recentEventsText?: string;
  decisionOptionsText?: string;
  forbiddenActionsText?: string;
  desiredOutputText?: string;
};

const seedText = z.string().max(10_000);
const seedTimestamp = seedText.refine((value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]! && hour <= 23 && minute <= 59 && second <= 59 && !Number.isNaN(Date.parse(value));
});

/** Strict runtime contract shared by V1 normalization consumers, including V2 migration. */
export const normalizedSeedContextDraftSchema = z.object({
  id: z.string().trim().min(1).max(2_000),
  questionText: seedText,
  trackType: z.enum(["crossroad", "life_climate"]),
  timeWindow: z.enum(["30_days", "90_days", "1_year", "3_years", "5_years"]),
  destinyBirthInfo: seedText.optional(),
  currentQuestionDescription: seedText.optional(),
  situationSummary: seedText,
  recentEvents: seedText.optional(),
  recentEventsText: seedText.optional(),
  keyPeopleText: seedText,
  decisionOptions: seedText.optional(),
  decisionOptionsText: seedText.optional(),
  worries: seedText.optional(),
  forbiddenActions: seedText.optional(),
  forbiddenActionsText: seedText.optional(),
  safetyBoundaries: seedText.optional(),
  desiredOutput: seedText.optional(),
  desiredOutputText: seedText.optional(),
  contextQualityScore: z.number().finite().min(0).max(100).optional(),
  missingContextHints: z.array(seedText).optional(),
  privacyAck: z.boolean(),
  privacySafetyAck: z.boolean().optional(),
  locale: z.enum(["en", "zh"]),
  status: z.enum(["draft", "submitted"]),
  createdAt: seedTimestamp,
  updatedAt: seedTimestamp,
}).strict();

export function parseNormalizedSeedContextDraft(input: unknown) {
  try {
    const parsed = normalizedSeedContextDraftSchema.safeParse(input);
    return parsed.success
      ? { ok: true as const, draft: structuredClone(parsed.data) as SeedContextDraft }
      : { ok: false as const, errorCode: "invalid_seed_context_draft" as const };
  } catch {
    return { ok: false as const, errorCode: "invalid_seed_context_draft" as const };
  }
}

function textOrDefault(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function arrayOrDefault(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function createSeedContextId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `seed_${Date.now()}`;
}

export function buildMissingContextHints(draft: SeedContextDraft) {
  const hints: string[] = [];

  if (draft.situationSummary.trim().length < 80) {
    hints.push("Add a little more scene context and why the decision matters.");
  }

  if (!draft.recentEvents?.trim()) {
    hints.push("Add recent events, deadlines, changed behavior, or concrete evidence.");
  }

  if (!draft.keyPeopleText.trim()) {
    hints.push("Name the people or roles that shape this sandbox.");
  }

  if (!draft.decisionOptions?.trim()) {
    hints.push("List the realistic options the simulation should compare.");
  }

  if (!draft.worries?.trim()) {
    hints.push("Add worries or uncertain assumptions the sandbox should treat carefully.");
  }

  if (!draft.forbiddenActions?.trim() && !draft.safetyBoundaries?.trim()) {
    hints.push("Add boundaries, off-limits moves, or constraints the sandbox should respect.");
  }

  if (!draft.desiredOutput?.trim()) {
    hints.push("Say what kind of output would be useful after the run.");
  }

  return hints;
}

export function calculateContextQualityScore(draft: SeedContextDraft) {
  const checks = [
    draft.situationSummary.trim().length >= 80,
    draft.questionText.trim().length >= 12,
    Boolean(draft.recentEvents?.trim()),
    Boolean(draft.keyPeopleText.trim()),
    Boolean(draft.decisionOptions?.trim()),
    Boolean(draft.worries?.trim()),
    Boolean(draft.forbiddenActions?.trim() || draft.safetyBoundaries?.trim()),
    Boolean(draft.desiredOutput?.trim()),
  ];
  const passed = checks.filter(Boolean).length;

  return Math.round((passed / checks.length) * 100);
}

export function normalizeSeedContextDraft(
  draft: LegacySeedContextDraft,
): SeedContextDraft {
  const now = new Date().toISOString();
  const recentEvents = textOrDefault(
    draft.recentEvents,
    textOrDefault(draft.recentEventsText),
  );
  const decisionOptions = textOrDefault(
    draft.decisionOptions,
    textOrDefault(draft.decisionOptionsText),
  );
  const forbiddenActions = textOrDefault(
    draft.forbiddenActions,
    textOrDefault(draft.forbiddenActionsText),
  );
  const desiredOutput = textOrDefault(
    draft.desiredOutput,
    textOrDefault(draft.desiredOutputText),
  );
  const safetyBoundaries = textOrDefault(
    draft.safetyBoundaries,
    forbiddenActions,
  );
  const normalized: SeedContextDraft = {
    id: textOrDefault(draft.id, createSeedContextId()),
    questionText: textOrDefault(draft.questionText),
    trackType: draft.trackType === "life_climate" ? "life_climate" : "crossroad",
    timeWindow: draft.timeWindow ?? defaultTimeWindow,
    destinyBirthInfo: textOrDefault(draft.destinyBirthInfo),
    currentQuestionDescription: textOrDefault(draft.currentQuestionDescription),
    situationSummary: textOrDefault(draft.situationSummary),
    recentEvents,
    recentEventsText: textOrDefault(draft.recentEventsText, recentEvents),
    keyPeopleText: textOrDefault(draft.keyPeopleText),
    decisionOptions,
    decisionOptionsText: textOrDefault(draft.decisionOptionsText, decisionOptions),
    worries: textOrDefault(draft.worries),
    forbiddenActions,
    forbiddenActionsText: textOrDefault(
      draft.forbiddenActionsText,
      forbiddenActions,
    ),
    safetyBoundaries,
    desiredOutput,
    desiredOutputText: textOrDefault(draft.desiredOutputText, desiredOutput),
    privacyAck: Boolean(draft.privacyAck),
    privacySafetyAck: Boolean(draft.privacySafetyAck ?? draft.privacyAck),
    locale: draft.locale === "zh" ? "zh" : "en",
    status: draft.status === "submitted" ? "submitted" : "draft",
    createdAt: textOrDefault(draft.createdAt, now),
    updatedAt: textOrDefault(draft.updatedAt, now),
  };

  normalized.missingContextHints =
    arrayOrDefault(draft.missingContextHints).length > 0
      ? arrayOrDefault(draft.missingContextHints)
      : buildMissingContextHints(normalized);
  normalized.contextQualityScore =
    typeof draft.contextQualityScore === "number"
      ? Math.max(0, Math.min(100, Math.round(draft.contextQualityScore)))
      : calculateContextQualityScore(normalized);

  return normalized;
}

export function loadSeedContextDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(seedContextDraftKey);
  if (!raw) {
    return null;
  }

  try {
    return normalizeSeedContextDraft(JSON.parse(raw) as LegacySeedContextDraft);
  } catch {
    window.localStorage.removeItem(seedContextDraftKey);
    return null;
  }
}

export function saveSeedContextDraft(draft: SeedContextDraft) {
  window.localStorage.setItem(
    seedContextDraftKey,
    JSON.stringify(normalizeSeedContextDraft(draft)),
  );
}

export function clearSeedContextDraft() {
  window.localStorage.removeItem(seedContextDraftKey);
}
