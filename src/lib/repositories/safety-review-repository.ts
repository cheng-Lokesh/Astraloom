import {
  clearSafetyReviewDraft,
  loadSafetyReviewDraft,
  saveSafetyReviewDraft,
} from "@/lib/safety/storage";
import type { SafetyReviewDraft } from "@/types/safety-review";

import type { DraftRepository, RepositoryAdapter } from "./types";
import {
  guardRepository,
  missingKey,
  ok,
  supabaseAdapterNotEnabled,
} from "./types";

export type SafetyReviewRepository = DraftRepository<SafetyReviewDraft>;

function createLocalSafetyReviewRepository(): SafetyReviewRepository {
  return {
    load: (seedContextId) =>
      seedContextId
        ? guardRepository(
            () => loadSafetyReviewDraft(seedContextId),
            "safety:load",
          )
        : missingKey("safety:load"),
    save: (draft) =>
      guardRepository(() => {
        saveSafetyReviewDraft(draft);
        return draft;
      }, "safety:save"),
    list: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            const draft = loadSafetyReviewDraft(seedContextId);
            return draft ? [draft] : [];
          }, "safety:list")
        : ok([]),
    clearDraft: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearSafetyReviewDraft(seedContextId);
            return null;
          }, "safety:clear")
        : missingKey("safety:clear"),
    markDeleted: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearSafetyReviewDraft(seedContextId);
            return null;
          }, "safety:delete")
        : missingKey("safety:delete"),
  };
}

function createSupabaseSafetyReviewRepository(): SafetyReviewRepository {
  return {
    load: () => supabaseAdapterNotEnabled("safety:load"),
    save: () => supabaseAdapterNotEnabled("safety:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("safety:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("safety:delete"),
  };
}

export function createSafetyReviewRepository(
  adapter: RepositoryAdapter = "localStorage",
) {
  return adapter === "supabase"
    ? createSupabaseSafetyReviewRepository()
    : createLocalSafetyReviewRepository();
}
