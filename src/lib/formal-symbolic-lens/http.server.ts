import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";
import { birthSourceSchema, buildSymbolicFrame } from "./frame";
import { projectSymbolicLens } from "./projection";

const base = { revision: z.number().int().nonnegative(), idempotency_key: z.string().uuid() };
const requestSchema = z.discriminatedUnion("operation", [
  z.object({ ...base, operation: z.literal("replace_source"), source: birthSourceSchema, consent: z.object({ storage: z.literal(true), calculation: z.literal(true), futureAttachment: z.literal(false) }).strict() }).strict(),
  z.object({ ...base, operation: z.literal("refresh_period") }).strict(),
]);
const withdrawalSchema = z.object(base).strict();
const preferenceColumns = "revision,storage_consent,calculation_consent,future_attachment_consent,source_version,current_snapshot:symbolic_lens_snapshots!symbolic_lens_preferences_snapshot_owner_fkey(frame),updated_at";
function failure(status: number, code: string, trace: string) { return NextResponse.json({ ok: false, error_code: code, trace_id: trace }, { status, headers: { "Cache-Control": "no-store" } }); }
async function caller() {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.id || data.user.is_anonymous) return null;
  return { client, ownerId: data.user.id };
}
function success(row: unknown, trace: string, status = 200) { return NextResponse.json({ ok: true, error_code: null, trace_id: trace, lens: projectSymbolicLens(row, new Date().toISOString()) }, { status, headers: { "Cache-Control": "no-store" } }); }
function rpcError(message: string, trace: string) {
  if (["symbolic_revision_conflict", "symbolic_idempotency_conflict", "symbolic_consent_required"].includes(message)) return failure(409, message, trace);
  return failure(500, "persistence_failed", trace);
}
export async function readSymbolicLens() {
  const trace = `symbolic_lens_${crypto.randomUUID()}`;
  try {
    const context = await caller(); if (!context) return failure(401, "unauthenticated", trace);
    const { data, error } = await context.client.from("symbolic_lens_preferences").select(preferenceColumns).eq("user_id", context.ownerId).maybeSingle();
    if (error) return failure(500, "persistence_failed", trace);
    return success(data, trace);
  } catch { return failure(500, "persistence_failed", trace); }
}
export async function writeSymbolicLens(request: Request, withdraw = false) {
  const trace = `symbolic_lens_${crypto.randomUUID()}`;
  try {
    const context = await caller(); if (!context) return failure(401, "unauthenticated", trace);
    if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") return failure(422, "invalid_request", trace);
    const input: unknown = await request.json().catch(() => null);
    const withdrawal = withdraw ? withdrawalSchema.safeParse(input) : null;
    const update = !withdraw ? requestSchema.safeParse(input) : null;
    if (withdrawal && !withdrawal.success || update && !update.success) return failure(422, "invalid_request", trace);
    const service = getServiceRoleSupabaseClient(); if (!service) return failure(503, "persistence_unavailable", trace);
    const now = new Date().toISOString();
    let rpc: string; let args: Record<string, unknown>;
    if (withdrawal?.success) {
      rpc = "withdraw_symbolic_lens_v1";
      args = { p_user_id: context.ownerId, p_expected_revision: withdrawal.data.revision, p_idempotency_key: withdrawal.data.idempotency_key, p_trace_id: trace };
    } else if (update?.success) {
      const recovery = await service.rpc("recover_symbolic_lens_v1", { p_user_id: context.ownerId, p_expected_revision: update.data.revision, p_idempotency_key: update.data.idempotency_key, p_operation: update.data.operation, p_source: update.data.operation === "replace_source" ? update.data.source : null });
      if (recovery.error) return rpcError(recovery.error.message, trace);
      if (!Array.isArray(recovery.data)) return failure(500, "persistence_failed", trace);
      if (recovery.data.length) {
        const { idempotent, ...recovered } = recovery.data[0];
        if (idempotent !== true || recovery.data.length !== 1) return failure(500, "persistence_failed", trace);
        return success(recovered, trace);
      }
      let source; let sourceVersion;
      if (update.data.operation === "replace_source") { source = update.data.source; sourceVersion = update.data.revision + 1; }
      else {
        const { data: pref, error: prefError } = await context.client.from("symbolic_lens_preferences").select("source_id,source_version,revision,storage_consent,calculation_consent").eq("user_id", context.ownerId).maybeSingle();
        if (prefError) return failure(500, "persistence_failed", trace);
        if (!pref?.storage_consent || !pref?.calculation_consent) return failure(409, "symbolic_consent_required", trace);
        if (pref.revision !== update.data.revision) return failure(409, "symbolic_revision_conflict", trace);
        const { data: sourceRow, error: sourceError } = await context.client.from("symbolic_birth_sources").select("birth_date,birth_time,source_version").eq("user_id", context.ownerId).eq("id", pref.source_id).maybeSingle();
        if (sourceError || !sourceRow || sourceRow.source_version !== pref.source_version) return failure(500, "persistence_failed", trace);
        source = { birthDate: sourceRow.birth_date, birthTime: sourceRow.birth_time }; sourceVersion = sourceRow.source_version;
      }
      let frame; try { frame = buildSymbolicFrame(source, sourceVersion, now); } catch { return failure(422, "invalid_request", trace); }
      rpc = "persist_symbolic_lens_v1";
      args = { p_user_id: context.ownerId, p_expected_revision: update.data.revision, p_idempotency_key: update.data.idempotency_key, p_operation: update.data.operation, p_source: update.data.operation === "replace_source" ? source : null, p_frame: frame, p_trace_id: trace };
    } else return failure(422, "invalid_request", trace);
    const { data, error } = await service.rpc(rpc, args);
    if (error) return rpcError(error.message, trace);
    const result = Array.isArray(data) ? data[0] : null;
    if (!result || typeof result !== "object") return failure(500, "persistence_failed", trace);
    const { idempotent, ...row } = result;
    return success(row, trace, withdraw || idempotent ? 200 : 201);
  } catch { return failure(500, "persistence_failed", trace); }
}
