import {
  clearFeedbackLedgerDraft,
  loadFeedbackLedgerDraft,
  saveFeedbackLedgerDraft,
} from "@/lib/feedback/storage";
import type { FeedbackLedgerDraft } from "@/types/feedback";

import type { DraftRepository, RepositoryAdapter } from "./types";
import {
  guardRepository,
  missingKey,
  ok,
  supabaseAdapterNotEnabled,
} from "./types";

export type FeedbackRepository = DraftRepository<FeedbackLedgerDraft>;

function createLocalFeedbackRepository(): FeedbackRepository {
  return {
    load: (seedContextId) =>
      seedContextId
        ? guardRepository(
            () => loadFeedbackLedgerDraft(seedContextId),
            "feedback:load",
          )
        : missingKey("feedback:load"),
    save: (draft) =>
      guardRepository(() => {
        saveFeedbackLedgerDraft(draft);
        return draft;
      }, "feedback:save"),
    list: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            const draft = loadFeedbackLedgerDraft(seedContextId);
            return draft ? [draft] : [];
          }, "feedback:list")
        : ok([]),
    clearDraft: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearFeedbackLedgerDraft(seedContextId);
            return null;
          }, "feedback:clear")
        : missingKey("feedback:clear"),
    markDeleted: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearFeedbackLedgerDraft(seedContextId);
            return null;
          }, "feedback:delete")
        : missingKey("feedback:delete"),
  };
}

function createSupabaseFeedbackRepository(): FeedbackRepository {
  return {
    load: () => supabaseAdapterNotEnabled("feedback:load"),
    save: () => supabaseAdapterNotEnabled("feedback:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("feedback:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("feedback:delete"),
  };
}

export function createFeedbackRepository(
  adapter: RepositoryAdapter = "localStorage",
) {
  return adapter === "supabase"
    ? createSupabaseFeedbackRepository()
    : createLocalFeedbackRepository();
}
