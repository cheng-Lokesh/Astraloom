import type { ClaimLedgerDraft } from "@/types/claim";

function claimLedgerDraftKey(seedContextId: string) {
  return `mirofish.claim-ledger.${seedContextId}`;
}

export function loadClaimLedgerDraft(seedContextId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(claimLedgerDraftKey(seedContextId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ClaimLedgerDraft;
  } catch {
    window.localStorage.removeItem(claimLedgerDraftKey(seedContextId));
    return null;
  }
}

export function saveClaimLedgerDraft(draft: ClaimLedgerDraft) {
  window.localStorage.setItem(
    claimLedgerDraftKey(draft.seedContextId),
    JSON.stringify(draft),
  );
}

export function clearClaimLedgerDraft(seedContextId: string) {
  window.localStorage.removeItem(claimLedgerDraftKey(seedContextId));
}
