import {
  clearGroundedSocialSimulationDraft,
  loadGroundedSocialSimulationDraft,
  saveGroundedSocialSimulationDraft,
} from "@/lib/grounded-social-simulation/storage";
import type { GroundedSocialSimulationDraft } from "@/types/grounded-social-simulation";

import type { DraftRepository, RepositoryAdapter } from "./types";
import {
  guardRepository,
  missingKey,
  ok,
  supabaseAdapterNotEnabled,
} from "./types";

export type GroundedSocialSimulationRepository =
  DraftRepository<GroundedSocialSimulationDraft>;

function createLocalGroundedSocialSimulationRepository(): GroundedSocialSimulationRepository {
  return {
    load: (seedContextId) =>
      seedContextId
        ? guardRepository(
            () => loadGroundedSocialSimulationDraft(seedContextId),
            "grounded-social:load",
          )
        : missingKey("grounded-social:load"),
    save: (draft) =>
      guardRepository(() => {
        saveGroundedSocialSimulationDraft(draft);
        return draft;
      }, "grounded-social:save"),
    list: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            const draft = loadGroundedSocialSimulationDraft(seedContextId);
            return draft ? [draft] : [];
          }, "grounded-social:list")
        : ok([]),
    clearDraft: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearGroundedSocialSimulationDraft(seedContextId);
            return null;
          }, "grounded-social:clear")
        : missingKey("grounded-social:clear"),
    markDeleted: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearGroundedSocialSimulationDraft(seedContextId);
            return null;
          }, "grounded-social:delete")
        : missingKey("grounded-social:delete"),
  };
}

function createSupabaseGroundedSocialSimulationRepository(): GroundedSocialSimulationRepository {
  return {
    load: () => supabaseAdapterNotEnabled("grounded-social:load"),
    save: () => supabaseAdapterNotEnabled("grounded-social:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("grounded-social:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("grounded-social:delete"),
  };
}

export function createGroundedSocialSimulationRepository(
  adapter: RepositoryAdapter = "localStorage",
) {
  return adapter === "supabase"
    ? createSupabaseGroundedSocialSimulationRepository()
    : createLocalGroundedSocialSimulationRepository();
}
