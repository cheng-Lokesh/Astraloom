import type { ReportDraft } from "@/types/report";

function reportDraftKey(seedContextId: string) {
  return `mirofish.report.${seedContextId}`;
}

export function loadReportDraft(seedContextId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(reportDraftKey(seedContextId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ReportDraft;
  } catch {
    window.localStorage.removeItem(reportDraftKey(seedContextId));
    return null;
  }
}

export function saveReportDraft(draft: ReportDraft) {
  window.localStorage.setItem(
    reportDraftKey(draft.seedContextId),
    JSON.stringify(draft),
  );
}

export function clearReportDraft(seedContextId: string) {
  window.localStorage.removeItem(reportDraftKey(seedContextId));
}
