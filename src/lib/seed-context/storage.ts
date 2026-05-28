import type { SeedContextDraft } from "@/types/seed-context";

const seedContextDraftKey = "mirofish.seed-context.draft";
const defaultTimeWindow = "90_days";

type LegacySeedContextDraft = Partial<SeedContextDraft> & {
  recentEventsText?: string;
  decisionOptionsText?: string;
  forbiddenActionsText?: string;
  desiredOutputText?: string;
};

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
