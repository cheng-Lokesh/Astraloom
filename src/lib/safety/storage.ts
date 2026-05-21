import type { SafetyReviewDraft } from "@/types/safety-review";

function safetyReviewDraftKey(seedContextId: string) {
  return `mirofish.safety-review.${seedContextId}`;
}

export function loadSafetyReviewDraft(seedContextId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(safetyReviewDraftKey(seedContextId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SafetyReviewDraft;
  } catch {
    window.localStorage.removeItem(safetyReviewDraftKey(seedContextId));
    return null;
  }
}

export function saveSafetyReviewDraft(draft: SafetyReviewDraft) {
  window.localStorage.setItem(
    safetyReviewDraftKey(draft.seedContextId),
    JSON.stringify(draft),
  );
}

export function clearSafetyReviewDraft(seedContextId: string) {
  window.localStorage.removeItem(safetyReviewDraftKey(seedContextId));
}
