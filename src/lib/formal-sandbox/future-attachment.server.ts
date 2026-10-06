import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";
import { currentSymbolicPeriod, symbolicFrameSchema } from "@/lib/formal-symbolic-lens/frame";

const inputSchema = z.object({ revision: z.number().int().nonnegative(), enabled: z.boolean(), idempotency_key: z.string().uuid() }).strict();
const preferenceSchema = z.object({ revision: z.number().int().positive(), storage_consent: z.boolean(), calculation_consent: z.boolean(), future_attachment_consent: z.boolean(), current_snapshot: z.object({ frame: symbolicFrameSchema }).strict().nullable() }).strict();
const columns = "revision,storage_consent,calculation_consent,future_attachment_consent,current_snapshot:symbolic_lens_snapshots!symbolic_lens_preferences_snapshot_owner_fkey(frame)";
const conflicts = new Set(["symbolic_revision_conflict", "symbolic_idempotency_conflict", "symbolic_consent_required", "symbolic_period_stale"]);
export function projectFutureAttachment(raw: unknown, now: string) {
  if (raw === null) return { revision: 0, enabled: false, eligible: false, status: "not_configured" as const };
  const row = preferenceSchema.parse(raw);
  if (!row.storage_consent || !row.calculation_consent) return { revision: row.revision, enabled: false, eligible: false, status: "withdrawn" as const };
  if (!row.current_snapshot) throw new Error("invalid_symbolic_state");
  const period = currentSymbolicPeriod(now); const saved = row.current_snapshot.frame.referencePeriod;
  const eligible = period.key === saved.key && period.structureKey === saved.structureKey;
  return { revision: row.revision, enabled: row.future_attachment_consent, eligible, status: eligible ? "active" as const : "stale" as const };
}
function fail(status: number, code: string, trace: string) { return NextResponse.json({ ok: false, error_code: code, trace_id: trace }, { status, headers: { "Cache-Control": "no-store" } }); }
async function caller() {
  const client = await createSupabaseServerClient(); if (!client) return null;
  const { data, error } = await client.auth.getUser();
  return error || !data.user || data.user.is_anonymous ? null : { client, ownerId: data.user.id };
}
function success(row: unknown, trace: string, status = 200, idempotent?: boolean) {
  return NextResponse.json({ ok: true, error_code: null, trace_id: trace, attachment: projectFutureAttachment(row, new Date().toISOString()), ...(idempotent === undefined ? {} : { idempotent }) }, { status, headers: { "Cache-Control": "no-store" } });
}
export async function readFutureAttachment() {
  const trace = `symbolic_attachment_${crypto.randomUUID()}`;
  try {
    const context = await caller(); if (!context) return fail(401, "unauthenticated", trace);
    const { data, error } = await context.client.from("symbolic_lens_preferences").select(columns).eq("user_id", context.ownerId).maybeSingle();
    return error ? fail(500, "persistence_failed", trace) : success(data, trace);
  } catch { return fail(500, "persistence_failed", trace); }
}
export async function writeFutureAttachment(request: Request) {
  const trace = `symbolic_attachment_${crypto.randomUUID()}`;
  try {
    const context = await caller(); if (!context) return fail(401, "unauthenticated", trace);
    if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") return fail(422, "invalid_request", trace);
    const parsed = inputSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return fail(422, "invalid_request", trace);
    const service = getServiceRoleSupabaseClient(); if (!service) return fail(503, "persistence_unavailable", trace);
    const { data, error } = await service.rpc("set_symbolic_future_attachment_v1", { p_user_id: context.ownerId, p_expected_revision: parsed.data.revision, p_idempotency_key: parsed.data.idempotency_key, p_enabled: parsed.data.enabled, p_trace_id: trace });
    if (error) return fail(conflicts.has(error.message) ? 409 : 500, conflicts.has(error.message) ? error.message : "persistence_failed", trace);
    if (!Array.isArray(data) || data.length !== 1) return fail(500, "persistence_failed", trace);
    const { idempotent, ...row } = data[0]; if (typeof idempotent !== "boolean") return fail(500, "persistence_failed", trace);
    return success(row, trace, idempotent ? 200 : 201, idempotent);
  } catch { return fail(500, "persistence_failed", trace); }
}
