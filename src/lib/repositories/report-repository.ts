import {
  clearClaimLedgerDraft,
  loadClaimLedgerDraft,
  saveClaimLedgerDraft,
} from "@/lib/claims/storage";
import type { ClaimLedgerDraft } from "@/types/claim";

import type { DraftRepository, RepositoryAdapter } from "./types";
import {
  guardRepository,
  missingKey,
  ok,
  supabaseAdapterNotEnabled,
} from "./types";

export type ReportRepository = DraftRepository<ClaimLedgerDraft>;

function createLocalReportRepository(): ReportRepository {
  return {
    load: (seedContextId) =>
      seedContextId
        ? guardRepository(
            () => loadClaimLedgerDraft(seedContextId),
            "reports:load",
          )
        : missingKey("reports:load"),
    save: (draft) =>
      guardRepository(() => {
        saveClaimLedgerDraft(draft);
        return draft;
      }, "reports:save"),
    list: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            const draft = loadClaimLedgerDraft(seedContextId);
            return draft ? [draft] : [];
          }, "reports:list")
        : ok([]),
    clearDraft: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearClaimLedgerDraft(seedContextId);
            return null;
          }, "reports:clear")
        : missingKey("reports:clear"),
    markDeleted: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearClaimLedgerDraft(seedContextId);
            return null;
          }, "reports:delete")
        : missingKey("reports:delete"),
  };
}

function createSupabaseReportRepository(): ReportRepository {
  return {
    load: () => supabaseAdapterNotEnabled("reports:load"),
    save: () => supabaseAdapterNotEnabled("reports:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("reports:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("reports:delete"),
  };
}

export function createReportRepository(adapter: RepositoryAdapter = "localStorage") {
  return adapter === "supabase"
    ? createSupabaseReportRepository()
    : createLocalReportRepository();
}
