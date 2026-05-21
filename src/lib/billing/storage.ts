import type { BillingSupportDraft } from "@/types/billing-support";

const billingSupportDraftKey = "mirofish.billing-support";

export function loadBillingSupportDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(billingSupportDraftKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as BillingSupportDraft;
  } catch {
    window.localStorage.removeItem(billingSupportDraftKey);
    return null;
  }
}

export function saveBillingSupportDraft(draft: BillingSupportDraft) {
  window.localStorage.setItem(billingSupportDraftKey, JSON.stringify(draft));
}

export function clearBillingSupportDraft() {
  window.localStorage.removeItem(billingSupportDraftKey);
}
