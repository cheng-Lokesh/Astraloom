import {
  clearSeedContextDraft,
  createSeedContextId,
  loadSeedContextDraft,
  saveSeedContextDraft,
} from "@/lib/seed-context/storage";
import type { SeedContextDraft } from "@/types/seed-context";

import type { DraftRepository } from "./types";
import {
  guardRepository,
  ok,
  supabaseAdapterNotEnabled,
  type RepositoryAdapter,
} from "./types";

export type SeedContextRepository = DraftRepository<SeedContextDraft, void> & {
  createId: () => string;
};

function createLocalSeedContextRepository(): SeedContextRepository {
  return {
    createId: createSeedContextId,
    load: () => guardRepository(() => loadSeedContextDraft(), "seed:load"),
    save: (draft) =>
      guardRepository(() => {
        saveSeedContextDraft(draft);
        return draft;
      }, "seed:save"),
    list: () =>
      guardRepository(() => {
        const draft = loadSeedContextDraft();
        return draft ? [draft] : [];
      }, "seed:list"),
    clearDraft: () =>
      guardRepository(() => {
        clearSeedContextDraft();
        return null;
      }, "seed:clear"),
    markDeleted: () =>
      guardRepository(() => {
        clearSeedContextDraft();
        return null;
      }, "seed:delete"),
  };
}

function createSupabaseSeedContextRepository(): SeedContextRepository {
  return {
    createId: createSeedContextId,
    load: () => supabaseAdapterNotEnabled("seed:load"),
    save: () => supabaseAdapterNotEnabled("seed:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("seed:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("seed:delete"),
  };
}

export function createSeedContextRepository(
  adapter: RepositoryAdapter = "localStorage",
) {
  return adapter === "supabase"
    ? createSupabaseSeedContextRepository()
    : createLocalSeedContextRepository();
}
