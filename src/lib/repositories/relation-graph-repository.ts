import {
  clearRelationGraphDraft,
  loadRelationGraphDraft,
  saveRelationGraphDraft,
} from "@/lib/relations/storage";
import type { RelationGraphDraft } from "@/types/relation-edge";

import type { DraftRepository, RepositoryAdapter } from "./types";
import {
  guardRepository,
  missingKey,
  ok,
  supabaseAdapterNotEnabled,
} from "./types";

export type RelationGraphRepository = DraftRepository<RelationGraphDraft>;

function createLocalRelationGraphRepository(): RelationGraphRepository {
  return {
    load: (seedContextId) =>
      seedContextId
        ? guardRepository(
            () => loadRelationGraphDraft(seedContextId),
            "relations:load",
          )
        : missingKey("relations:load"),
    save: (draft) =>
      guardRepository(() => {
        saveRelationGraphDraft(draft);
        return draft;
      }, "relations:save"),
    list: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            const draft = loadRelationGraphDraft(seedContextId);
            return draft ? [draft] : [];
          }, "relations:list")
        : ok([]),
    clearDraft: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearRelationGraphDraft(seedContextId);
            return null;
          }, "relations:clear")
        : missingKey("relations:clear"),
    markDeleted: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearRelationGraphDraft(seedContextId);
            return null;
          }, "relations:delete")
        : missingKey("relations:delete"),
  };
}

function createSupabaseRelationGraphRepository(): RelationGraphRepository {
  return {
    load: () => supabaseAdapterNotEnabled("relations:load"),
    save: () => supabaseAdapterNotEnabled("relations:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("relations:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("relations:delete"),
  };
}

export function createRelationGraphRepository(
  adapter: RepositoryAdapter = "localStorage",
) {
  return adapter === "supabase"
    ? createSupabaseRelationGraphRepository()
    : createLocalRelationGraphRepository();
}
