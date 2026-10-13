import type { SupabaseClient } from "@supabase/supabase-js";
import type { CorrectionContextResult } from "./correction-context";

/** Fail-closed admission stub for the runtime RED checkpoint. */
export async function readFormalCorrectionContext(_caller: SupabaseClient, _ownerId: string, _runId: string): Promise<CorrectionContextResult> {
  return { ok: false, errorCode: "correction_rules_not_recorded" };
}
