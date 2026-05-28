import {
  clearDestinySituationFusionDraft,
  loadDestinySituationFusionDraft,
  saveDestinySituationFusionDraft,
} from "@/lib/destiny-fusion/storage";
import type { DestinySituationFusionDraft } from "@/types/destiny-fusion";

import type { DraftRepository, RepositoryAdapter } from "./types";
import {
  guardRepository,
  missingKey,
  ok,
  supabaseAdapterNotEnabled,
} from "./types";

export type DestinyFusionRepository =
  DraftRepository<DestinySituationFusionDraft>;

function createLocalDestinyFusionRepository(): DestinyFusionRepository {
  return {
    load: (seedContextId) =>
      seedContextId
        ? guardRepository(
            () => loadDestinySituationFusionDraft(seedContextId),
            "destiny-fusion:load",
          )
        : missingKey("destiny-fusion:load"),
    save: (draft) =>
      guardRepository(() => {
        saveDestinySituationFusionDraft(draft);
        return draft;
      }, "destiny-fusion:save"),
    list: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            const draft = loadDestinySituationFusionDraft(seedContextId);
            return draft ? [draft] : [];
          }, "destiny-fusion:list")
        : ok([]),
    clearDraft: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearDestinySituationFusionDraft(seedContextId);
            return null;
          }, "destiny-fusion:clear")
        : missingKey("destiny-fusion:clear"),
    markDeleted: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearDestinySituationFusionDraft(seedContextId);
            return null;
          }, "destiny-fusion:delete")
        : missingKey("destiny-fusion:delete"),
  };
}

function createSupabaseDestinyFusionRepository(): DestinyFusionRepository {
  return {
    load: () => supabaseAdapterNotEnabled("destiny-fusion:load"),
    save: () => supabaseAdapterNotEnabled("destiny-fusion:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("destiny-fusion:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("destiny-fusion:delete"),
  };
}

export function createDestinyFusionRepository(
  adapter: RepositoryAdapter = "localStorage",
) {
  return adapter === "supabase"
    ? createSupabaseDestinyFusionRepository()
    : createLocalDestinyFusionRepository();
}
