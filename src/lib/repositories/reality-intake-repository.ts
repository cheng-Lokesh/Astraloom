import {
  clearRealityIntakeDraft,
  loadRealityIntakeDraft,
  saveRealityIntakeDraft,
} from "@/lib/reality-intake/storage";
import type { RealityIntakeDraft } from "@/types/reality-intake";

import type { DraftRepository, RepositoryAdapter } from "./types";
import {
  guardRepository,
  missingKey,
  ok,
  supabaseAdapterNotEnabled,
} from "./types";

export type RealityIntakeRepository = DraftRepository<RealityIntakeDraft>;

function createLocalRealityIntakeRepository(): RealityIntakeRepository {
  return {
    load: (seedContextId) =>
      seedContextId
        ? guardRepository(
            () => loadRealityIntakeDraft(seedContextId),
            "reality-intake:load",
          )
        : missingKey("reality-intake:load"),
    save: (draft) =>
      guardRepository(() => {
        saveRealityIntakeDraft(draft);
        return draft;
      }, "reality-intake:save"),
    list: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            const draft = loadRealityIntakeDraft(seedContextId);
            return draft ? [draft] : [];
          }, "reality-intake:list")
        : ok([]),
    clearDraft: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearRealityIntakeDraft(seedContextId);
            return null;
          }, "reality-intake:clear")
        : missingKey("reality-intake:clear"),
    markDeleted: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearRealityIntakeDraft(seedContextId);
            return null;
          }, "reality-intake:delete")
        : missingKey("reality-intake:delete"),
  };
}

function createSupabaseRealityIntakeRepository(): RealityIntakeRepository {
  return {
    load: () => supabaseAdapterNotEnabled("reality-intake:load"),
    save: () => supabaseAdapterNotEnabled("reality-intake:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("reality-intake:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("reality-intake:delete"),
  };
}

export function createRealityIntakeRepository(
  adapter: RepositoryAdapter = "localStorage",
) {
  return adapter === "supabase"
    ? createSupabaseRealityIntakeRepository()
    : createLocalRealityIntakeRepository();
}
