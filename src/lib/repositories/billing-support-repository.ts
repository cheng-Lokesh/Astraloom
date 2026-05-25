import {
  clearBillingSupportDraft,
  loadBillingSupportDraft,
  saveBillingSupportDraft,
} from "@/lib/billing/storage";
import type { BillingSupportDraft } from "@/types/billing-support";

import type { DraftRepository, RepositoryAdapter } from "./types";
import { guardRepository, ok, supabaseAdapterNotEnabled } from "./types";

export type BillingSupportRepository = DraftRepository<
  BillingSupportDraft,
  void
>;

function createLocalBillingSupportRepository(): BillingSupportRepository {
  return {
    load: () => guardRepository(() => loadBillingSupportDraft(), "billing:load"),
    save: (draft) =>
      guardRepository(() => {
        saveBillingSupportDraft(draft);
        return draft;
      }, "billing:save"),
    list: () =>
      guardRepository(() => {
        const draft = loadBillingSupportDraft();
        return draft ? [draft] : [];
      }, "billing:list"),
    clearDraft: () =>
      guardRepository(() => {
        clearBillingSupportDraft();
        return null;
      }, "billing:clear"),
    markDeleted: () =>
      guardRepository(() => {
        clearBillingSupportDraft();
        return null;
      }, "billing:delete"),
  };
}

function createSupabaseBillingSupportRepository(): BillingSupportRepository {
  return {
    load: () => supabaseAdapterNotEnabled("billing:load"),
    save: () => supabaseAdapterNotEnabled("billing:save"),
    list: () => ok([]),
    clearDraft: () => supabaseAdapterNotEnabled("billing:clear"),
    markDeleted: () => supabaseAdapterNotEnabled("billing:delete"),
  };
}

export function createBillingSupportRepository(
  adapter: RepositoryAdapter = "localStorage",
) {
  return adapter === "supabase"
    ? createSupabaseBillingSupportRepository()
    : createLocalBillingSupportRepository();
}
