import type { FeedbackLedgerDraft } from "@/types/feedback";

function feedbackLedgerDraftKey(seedContextId: string) {
  return `mirofish.feedback-ledger.${seedContextId}`;
}

export function loadFeedbackLedgerDraft(seedContextId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(feedbackLedgerDraftKey(seedContextId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FeedbackLedgerDraft;
  } catch {
    window.localStorage.removeItem(feedbackLedgerDraftKey(seedContextId));
    return null;
  }
}

export function saveFeedbackLedgerDraft(draft: FeedbackLedgerDraft) {
  window.localStorage.setItem(
    feedbackLedgerDraftKey(draft.seedContextId),
    JSON.stringify(draft),
  );
}

export function clearFeedbackLedgerDraft(seedContextId: string) {
  window.localStorage.removeItem(feedbackLedgerDraftKey(seedContextId));
}
