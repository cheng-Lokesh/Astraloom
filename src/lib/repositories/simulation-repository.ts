import {
  clearSimulationRunDraft,
  loadSimulationRunDraft,
  saveSimulationRunDraft,
} from "@/lib/runs/storage";
import type { SimulationRunDraft } from "@/types/simulation-run";

import type { DraftRepository, RepositoryAdapter } from "./types";
import {
  guardRepository,
  missingKey,
  ok,
  supabaseAdapterNotEnabled,
} from "./types";

export type SimulationRepository = DraftRepository<SimulationRunDraft>;

function createLocalSimulationRepository(): SimulationRepository {
  return {
    load: (seedContextId) =>
      seedContextId
        ? guardRepository(
            () => loadSimulationRunDraft(seedContextId),
            "simulation:load",
          )
        : missingKey("simulation:load"),
    save: (draft) =>
      guardRepository(() => {
        saveSimulationRunDraft(draft);
        return draft;
      }, "simulation:save"),
    list: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            const draft = loadSimulationRunDraft(seedContextId);
            return draft ? [draft] : [];
          }, "simulation:list")
        : ok([]),
    clearDraft: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearSimulationRunDraft(seedContextId);
            return null;
          }, "simulation:clear")
        : missingKey("simulation:clear"),
    markDeleted: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearSimulationRunDraft(seedContextId);
            return null;
          }, "simulation:delete")
        : missingKey("simulation:delete"),
  };
}

function createSupabaseSimulationRepository(): SimulationRepository {
  return {
    load: () => supabaseAdapterNotEnabled("simulation:load"),
    save: () => supabaseAdapterNotEnabled("simulation:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("simulation:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("simulation:delete"),
  };
}

export function createSimulationRepository(
  adapter: RepositoryAdapter = "localStorage",
) {
  return adapter === "supabase"
    ? createSupabaseSimulationRepository()
    : createLocalSimulationRepository();
}
