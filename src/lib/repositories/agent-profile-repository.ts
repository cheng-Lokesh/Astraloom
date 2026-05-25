import {
  clearAgentEcologyDraft,
  loadAgentEcologyDraft,
  saveAgentEcologyDraft,
} from "@/lib/agents/storage";
import type { AgentEcologyDraft } from "@/types/agent-profile";

import type { DraftRepository, RepositoryAdapter } from "./types";
import {
  guardRepository,
  missingKey,
  ok,
  supabaseAdapterNotEnabled,
} from "./types";

export type AgentProfileRepository = DraftRepository<AgentEcologyDraft>;

function createLocalAgentProfileRepository(): AgentProfileRepository {
  return {
    load: (seedContextId) =>
      seedContextId
        ? guardRepository(
            () => loadAgentEcologyDraft(seedContextId),
            "agents:load",
          )
        : missingKey("agents:load"),
    save: (draft) =>
      guardRepository(() => {
        saveAgentEcologyDraft(draft);
        return draft;
      }, "agents:save"),
    list: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            const draft = loadAgentEcologyDraft(seedContextId);
            return draft ? [draft] : [];
          }, "agents:list")
        : ok([]),
    clearDraft: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearAgentEcologyDraft(seedContextId);
            return null;
          }, "agents:clear")
        : missingKey("agents:clear"),
    markDeleted: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearAgentEcologyDraft(seedContextId);
            return null;
          }, "agents:delete")
        : missingKey("agents:delete"),
  };
}

function createSupabaseAgentProfileRepository(): AgentProfileRepository {
  return {
    load: () => supabaseAdapterNotEnabled("agents:load"),
    save: () => supabaseAdapterNotEnabled("agents:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("agents:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("agents:delete"),
  };
}

export function createAgentProfileRepository(
  adapter: RepositoryAdapter = "localStorage",
) {
  return adapter === "supabase"
    ? createSupabaseAgentProfileRepository()
    : createLocalAgentProfileRepository();
}
