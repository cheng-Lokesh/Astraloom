import {
  clearDestinyClimateDraft,
  clearDestinyProfileDraft,
  loadDestinyClimateDraft,
  loadDestinyProfileDraft,
  saveDestinyClimateDraft,
  saveDestinyProfileDraft,
} from "@/lib/destiny/storage";
import type { DestinyClimateDraft, DestinyProfileDraft } from "@/types/destiny";

import type { DraftRepository, RepositoryAdapter } from "./types";
import {
  guardRepository,
  missingKey,
  ok,
  supabaseAdapterNotEnabled,
} from "./types";

export type DestinyProfileRepository = DraftRepository<DestinyProfileDraft>;
export type DestinyClimateRepository = DraftRepository<DestinyClimateDraft>;

function createLocalDestinyProfileRepository(): DestinyProfileRepository {
  return {
    load: (seedContextId) =>
      seedContextId
        ? guardRepository(
            () => loadDestinyProfileDraft(seedContextId),
            "destiny-profile:load",
          )
        : missingKey("destiny-profile:load"),
    save: (draft) =>
      guardRepository(() => {
        saveDestinyProfileDraft(draft);
        return draft;
      }, "destiny-profile:save"),
    list: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            const draft = loadDestinyProfileDraft(seedContextId);
            return draft ? [draft] : [];
          }, "destiny-profile:list")
        : ok([]),
    clearDraft: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearDestinyProfileDraft(seedContextId);
            return null;
          }, "destiny-profile:clear")
        : missingKey("destiny-profile:clear"),
    markDeleted: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearDestinyProfileDraft(seedContextId);
            return null;
          }, "destiny-profile:delete")
        : missingKey("destiny-profile:delete"),
  };
}

function createLocalDestinyClimateRepository(): DestinyClimateRepository {
  return {
    load: (seedContextId) =>
      seedContextId
        ? guardRepository(
            () => loadDestinyClimateDraft(seedContextId),
            "destiny-climate:load",
          )
        : missingKey("destiny-climate:load"),
    save: (draft) =>
      guardRepository(() => {
        saveDestinyClimateDraft(draft);
        return draft;
      }, "destiny-climate:save"),
    list: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            const draft = loadDestinyClimateDraft(seedContextId);
            return draft ? [draft] : [];
          }, "destiny-climate:list")
        : ok([]),
    clearDraft: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearDestinyClimateDraft(seedContextId);
            return null;
          }, "destiny-climate:clear")
        : missingKey("destiny-climate:clear"),
    markDeleted: (seedContextId) =>
      seedContextId
        ? guardRepository(() => {
            clearDestinyClimateDraft(seedContextId);
            return null;
          }, "destiny-climate:delete")
        : missingKey("destiny-climate:delete"),
  };
}

function createSupabaseDestinyProfileRepository(): DestinyProfileRepository {
  return {
    load: () => supabaseAdapterNotEnabled("destiny-profile:load"),
    save: () => supabaseAdapterNotEnabled("destiny-profile:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("destiny-profile:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("destiny-profile:delete"),
  };
}

function createSupabaseDestinyClimateRepository(): DestinyClimateRepository {
  return {
    load: () => supabaseAdapterNotEnabled("destiny-climate:load"),
    save: () => supabaseAdapterNotEnabled("destiny-climate:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("destiny-climate:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("destiny-climate:delete"),
  };
}

export function createDestinyProfileRepository(
  adapter: RepositoryAdapter = "localStorage",
) {
  return adapter === "supabase"
    ? createSupabaseDestinyProfileRepository()
    : createLocalDestinyProfileRepository();
}

export function createDestinyClimateRepository(
  adapter: RepositoryAdapter = "localStorage",
) {
  return adapter === "supabase"
    ? createSupabaseDestinyClimateRepository()
    : createLocalDestinyClimateRepository();
}
