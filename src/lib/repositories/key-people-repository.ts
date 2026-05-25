import {
  clearKeyPeopleDraft,
  loadKeyPeopleDraft,
  saveKeyPeopleDraft,
} from "@/lib/people/storage";
import type { KeyPeopleDraft } from "@/types/key-person";

import type { DraftRepository, RepositoryAdapter } from "./types";
import {
  guardRepository,
  missingKey,
  ok,
  supabaseAdapterNotEnabled,
} from "./types";

export type KeyPeopleRepository = DraftRepository<KeyPeopleDraft>;

function createLocalKeyPeopleRepository(): KeyPeopleRepository {
  return {
    load: (seedContextId) =>
      seedContextId
        ? guardRepository(
            () => loadKeyPeopleDraft(seedContextId),
            "people:load",
          )
        : missingKey("people:load"),
    save: (draft) =>
      guardRepository(() => {
        saveKeyPeopleDraft(draft);
        return draft;
      }, "people:save"),
    list: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            const draft = loadKeyPeopleDraft(seedContextId);
            return draft ? [draft] : [];
          }, "people:list")
        : ok([]),
    clearDraft: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearKeyPeopleDraft(seedContextId);
            return null;
          }, "people:clear")
        : missingKey("people:clear"),
    markDeleted: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearKeyPeopleDraft(seedContextId);
            return null;
          }, "people:delete")
        : missingKey("people:delete"),
  };
}

function createSupabaseKeyPeopleRepository(): KeyPeopleRepository {
  return {
    load: () => supabaseAdapterNotEnabled("people:load"),
    save: () => supabaseAdapterNotEnabled("people:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("people:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("people:delete"),
  };
}

export function createKeyPeopleRepository(
  adapter: RepositoryAdapter = "localStorage",
) {
  return adapter === "supabase"
    ? createSupabaseKeyPeopleRepository()
    : createLocalKeyPeopleRepository();
}
