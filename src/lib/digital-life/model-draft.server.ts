import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelDraftResult } from "./model-draft";

// Fail-closed shells keep the new boundary executable for its RED checkpoint.
export async function readFormalModelDraft(_caller: SupabaseClient, _ownerId: string): Promise<ModelDraftResult> {
  return { ok: false, errorCode: "persistence_failed" };
}
export async function saveFormalModelDraft(_caller: SupabaseClient, _ownerId: string, _request: unknown): Promise<ModelDraftResult> {
  return { ok: false, errorCode: "persistence_failed" };
}
