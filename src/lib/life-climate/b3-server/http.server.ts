import "server-only";

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";

import {
  buildLifeClimateB3Run,
  createLifeClimateB3SourceContext,
  createLifeClimateB3SymbolicSource,
  lifeClimateB3FrozenSourceSchema,
  lifeClimateB3RequestSchema,
  projectLifeClimateB3Run,
  validateLifeClimateB3Run,
  sha256LifeClimateB3Text,
  hashLifeClimateB3Value,
  type LifeClimateB3FrozenSource,
  type LifeClimateB3Request,
} from "@/lib/life-climate/b3";
import { verifySafety } from "@/lib/safety/safety-verifier";
import { safetyRules } from "@/lib/safety/safety-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";

const wrapperSchema = z.object({ idempotency_key: z.string().uuid(), request: lifeClimateB3RequestSchema }).strict();
const symbolicInputSchema = z.object({
  birthDate: z.string(), birthTime: z.string().nullable(), sourceVersion: z.number().int().positive(),
  consentRevision: z.number().int().positive(), referenceDate: z.string(),
}).strict();
const intentSchema = z.object({
  id: z.string().uuid(), idempotency_key: z.string().uuid(), created_at: z.iso.datetime({ offset: true }),
  normalized_request: lifeClimateB3RequestSchema, source_snapshot: lifeClimateB3FrozenSourceSchema,
}).strict();
const privateIntentSchema = intentSchema.extend({
  seed_safety: z.record(z.string(), z.unknown()), symbolic_input: symbolicInputSchema.nullable(),
});
const receiptBase = z.object({
  id: z.string().uuid(), intent_id: z.string().uuid(), created_at: z.iso.datetime({ offset: true }),
}).strict();
const receiptSchema = z.discriminatedUnion("status", [
  receiptBase.extend({ status: z.literal("completed"), error_code: z.null(), result_bundle: z.record(z.string(), z.unknown()) }),
  receiptBase.extend({ status: z.literal("rejected"), error_code: z.string().min(1), result_bundle: z.null() }),
]);
const reserveSchema = z.object({ intent: privateIntentSchema, receipt: receiptSchema.nullable(), idempotent: z.boolean() }).strict();
const finalSchema = z.object({ receipt: receiptSchema, idempotent: z.boolean() }).strict();
const sourceSchema = z.object({
  source_snapshot: lifeClimateB3FrozenSourceSchema, symbolic_input: symbolicInputSchema.nullable(),
}).strict();
type Intent = z.infer<typeof intentSchema>;
type Receipt = z.infer<typeof receiptSchema>;

function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });
}
function failure(code: string, trace: string, status = errorStatus(code)) {
  return json({ ok: false, error_code: code, trace_id: trace }, status);
}
function errorStatus(code: string) {
  if (code === "unauthenticated") return 401;
  if (code === "safety_downgrade") return 403;
  if (["life_climate_intent_not_found", "life_climate_run_not_found"].includes(code)) return 404;
  if (["b3_source_stale", "b3_unsupported_precision", "idempotency_conflict", "current_seed_required", "reality_profile_required", "b3_symbolic_source_unavailable"].includes(code)) return 409;
  if (["invalid_request", "invalid_b3_request", "b3_confirmation_mismatch", "b3_arithmetic_limit", "invalid_b3_source"].includes(code)) return 422;
  if (code === "persistence_unavailable") return 503;
  return 500;
}
const knownErrors = new Set([
  "unauthenticated", "b3_source_stale", "b3_unsupported_precision", "idempotency_conflict", "current_seed_required", "reality_profile_required",
  "b3_symbolic_source_unavailable", "invalid_request", "invalid_b3_request", "b3_confirmation_mismatch", "b3_arithmetic_limit", "invalid_b3_source",
  "safety_downgrade",
]);
const terminalErrors = new Set(["safety_downgrade", "invalid_b3_request", "invalid_b3_source", "b3_confirmation_mismatch", "b3_arithmetic_limit", "b3_unsupported_precision", "b3_symbolic_source_unavailable"]);
function safeCode(error: unknown) {
  if (error && typeof error === "object") {
    // PostgREST's code is usually SQLSTATE, while message carries our stable
    // application code. Never reflect arbitrary message/details/hint content.
    for (const code of ["code" in error ? error.code : null, "message" in error ? error.message : null]) {
      if (typeof code === "string" && knownErrors.has(code)) return code;
    }
  }
  return "persistence_failed";
}
function sameJson(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) return left.length === right.length && left.every((item, index) => sameJson(item, right[index]));
  if (!left || !right || typeof left !== "object" || typeof right !== "object" || Array.isArray(left) || Array.isArray(right)) return false;
  const a = left as Record<string, unknown>, b = right as Record<string, unknown>;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && sameJson(a[key], b[key]));
}

async function completeSource(source: LifeClimateB3FrozenSource, input: z.infer<typeof symbolicInputSchema> | null, request: Pick<LifeClimateB3Request, "horizon" | "periodUnit" | "symbolic">) {
  await validateSourceBase(source);
  if (input && input.referenceDate !== new Date(Date.parse(source.binding.assessedAt) + 8 * 3600_000).toISOString().slice(0, 10)) throw new Error("Invalid symbolic clock");
  const symbolic = request.symbolic.enabled && input ? await createLifeClimateB3SymbolicSource(input, request.horizon, request.periodUnit) : null;
  if (request.symbolic.enabled && (!symbolic || symbolic.sourceContext !== request.symbolic.sourceContext)) {
    throw Object.assign(new Error("b3_symbolic_source_unavailable"), { code: "b3_symbolic_source_unavailable" });
  }
  return lifeClimateB3FrozenSourceSchema.parse({ ...source, symbolic: request.symbolic.enabled ? symbolic : null });
}

async function validateSourceBase(source: LifeClimateB3FrozenSource) {
  if (source.binding.profileRevision !== source.view.profile.revision || source.view.scopeKey !== await sha256LifeClimateB3Text(source.binding.seedContextId)
    || source.sourceContext !== await createLifeClimateB3SourceContext(source.view) || source.symbolic !== null) throw new Error("Invalid frozen source");
}

async function publicCompleted(intent: Intent, receipt: Receipt) {
  if (receipt.intent_id !== intent.id || receipt.status !== "completed" || receipt.error_code !== null || !receipt.result_bundle) throw new Error("Invalid receipt");
  const run = receipt.result_bundle as { sourceSnapshot?: unknown; requestSnapshot?: unknown };
  const source = lifeClimateB3FrozenSourceSchema.parse(run.sourceSnapshot);
  if (!sameJson({ ...source, symbolic: null }, intent.source_snapshot) || !sameJson(run.requestSnapshot, intent.normalized_request)) throw new Error("Invalid receipt source");
  const validated = await validateLifeClimateB3Run(source, intent.normalized_request, receipt.result_bundle);
  return {
    id: receipt.id, created_at: receipt.created_at, profile_revision: source.binding.profileRevision,
    result: projectLifeClimateB3Run(validated),
  };
}

function safetyAllows(seed: Record<string, unknown>, source: LifeClimateB3FrozenSource, request: LifeClimateB3Request) {
  // All source material is from the frozen intent. No current Profile/Seed read
  // occurs here, including after an unknown response or another device's retry.
  const positiveFlags = new Set(safetyRules.filter((rule) => rule.level === "blocked" || rule.level === "downgraded").map((rule) => rule.flag as string));
  const hasPriorRefusal = (value: unknown): boolean => {
    if (typeof value === "string") return positiveFlags.has(value) || value === "blocked" || value === "downgraded";
    if (Array.isArray(value)) return value.some(hasPriorRefusal);
    return value !== null && typeof value === "object" && Object.values(value).some(hasPriorRefusal);
  };
  // Phase 2 currently stores boundary/worry text in this JSON array; older
  // records may also contain named flags or a structured positive decision.
  if (hasPriorRefusal(seed.safety_flags)) return false;
  const safety = verifySafety({ seedContext: {
    id: "life-climate-b3-input", questionText: String(seed.user_question ?? ""), trackType: "crossroad", timeWindow: request.horizon,
    currentQuestionDescription: "", situationSummary: String(seed.raw_context ?? ""), recentEvents: "", keyPeopleText: "",
    decisionOptions: JSON.stringify({ seed, profile: source.view.profile, model: request.model }), worries: "",
    privacyAck: true, locale: "zh", status: "submitted", createdAt: "", updatedAt: "",
  } });
  return safety.safetyLevel !== "blocked" && safety.safetyLevel !== "downgraded";
}

export async function submitLifeClimateB3(user: User | null, authError: unknown, rawBody: unknown, trace: string) {
  if (authError || !user?.id || user.is_anonymous === true) return failure("unauthenticated", trace);
  const body = wrapperSchema.safeParse(rawBody);
  if (!body.success) return failure("invalid_b3_request", trace);
  const args = { p_user_id: user.id, p_idempotency_key: body.data.idempotency_key, p_request: body.data.request };
  try {
    const service = getServiceRoleSupabaseClient();
    if (!service) return failure("persistence_unavailable", trace);
    const reserved = await service.rpc("reserve_life_climate_b3_intent", { ...args, p_trace_id: trace });
    if (reserved.error) {
      const code = safeCode(reserved.error);
      // This field is evidence about registration, never an inference from a
      // later GET 404. SQL raises these only after receipt-first lookup found no
      // intent, and the failed transaction did not insert a new one.
      const notRegistered = reserved.error.code === "P0001" && ["b3_source_stale", "current_seed_required", "reality_profile_required", "b3_unsupported_precision", "b3_symbolic_source_unavailable", "invalid_b3_request"].includes(code);
      return notRegistered ? json({ ok: false, error_code: code, trace_id: trace, outcome: "not_registered", idempotency_key: body.data.idempotency_key, request_digest: await hashLifeClimateB3Value(body.data.request) }, errorStatus(code)) : failure(code, trace);
    }
    const envelope = reserveSchema.safeParse(reserved.data);
    if (!envelope.success) return failure("persistence_failed", trace);
    const { intent, receipt } = envelope.data;
    if (intent.idempotency_key !== body.data.idempotency_key || !sameJson(intent.normalized_request, body.data.request)) return failure("persistence_failed", trace);
    if (receipt && receipt.intent_id !== intent.id) return failure("persistence_failed", trace);
    if (receipt) return receipt.status === "rejected"
      ? failure(receipt.error_code && terminalErrors.has(receipt.error_code) ? receipt.error_code : "persistence_failed", trace)
      : json({ ok: true, error_code: null, trace_id: trace, idempotent: true, run: await publicCompleted(intent, receipt) });

    let result: unknown = null, rejection: string | null = null;
    try {
      const source = await completeSource(intent.source_snapshot, intent.symbolic_input, intent.normalized_request);
      if (!safetyAllows(intent.seed_safety, source, intent.normalized_request)) rejection = "safety_downgrade";
      else {
        result = await buildLifeClimateB3Run(source, intent.normalized_request);
        await validateLifeClimateB3Run(source, intent.normalized_request, result);
      }
    } catch (error) {
      const code = safeCode(error);
      if (!terminalErrors.has(code)) return failure("persistence_failed", trace);
      rejection = code;
    }
    const written = await service.rpc("finalize_life_climate_b3_receipt", { ...args, p_result_bundle: result, p_error_code: rejection });
    if (written.error) return failure(safeCode(written.error), trace);
    const final = finalSchema.safeParse(written.data);
    if (!final.success || final.data.receipt.intent_id !== intent.id) return failure("persistence_failed", trace);
    if (final.data.receipt.status === "rejected") {
      const code = final.data.receipt.error_code;
      return failure(code && terminalErrors.has(code) ? code : "persistence_failed", trace);
    }
    return json({ ok: true, error_code: null, trace_id: trace, idempotent: final.data.idempotent, run: await publicCompleted(intent, final.data.receipt) }, final.data.idempotent ? 200 : 201);
  } catch {
    // Transport/runtime failures leave an accepted intent pending for exact retry.
    return failure("persistence_failed", trace);
  }
}

async function authenticated() {
  const client = await createSupabaseServerClient();
  if (!client) return { error: "persistence_unavailable" as const };
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.id || data.user.is_anonymous === true) return { error: "unauthenticated" as const };
  return { client, user: data.user };
}

function parseQuery(request: Request, allowed: string[]) {
  const params = new URL(request.url).searchParams;
  if ([...params.keys()].some((key) => !allowed.includes(key) || params.getAll(key).length !== 1)) return null;
  return Object.fromEntries(params);
}

export async function readLifeClimateB3Source(request: Request) {
  const trace = `life_climate_b3_${randomUUID()}`;
  try {
    const auth = await authenticated();
    if (auth.error) return failure(auth.error, trace);
    const query = z.object({ horizon: z.enum(["1_year", "3_years", "5_years"]).default("1_year") }).strict().safeParse(parseQuery(request, ["horizon"]));
    if (!query.success) return failure("invalid_request", trace);
    const service = getServiceRoleSupabaseClient();
    if (!service) return failure("persistence_unavailable", trace);
    const raw = await service.rpc("read_life_climate_b3_source", { p_user_id: auth.user.id });
    if (raw.error) return failure(safeCode(raw.error), trace);
    const parsed = sourceSchema.safeParse(raw.data);
    if (!parsed.success) return failure("persistence_failed", trace);
    await validateSourceBase(parsed.data.source_snapshot);
    if (parsed.data.symbolic_input && parsed.data.symbolic_input.referenceDate !== new Date(Date.parse(parsed.data.source_snapshot.binding.assessedAt) + 8 * 3600_000).toISOString().slice(0, 10)) return failure("persistence_failed", trace);
    const symbolic = parsed.data.symbolic_input
      ? await createLifeClimateB3SymbolicSource(parsed.data.symbolic_input, query.data.horizon, query.data.horizon === "1_year" ? "quarter" : "year") : null;
    return json({ ok: true, error_code: null, trace_id: trace, source: { view: parsed.data.source_snapshot.view, sourceContext: parsed.data.source_snapshot.sourceContext, symbolic } });
  } catch (error) { return failure(safeCode(error), trace); }
}

const intentColumns = "id,idempotency_key,created_at,normalized_request,source_snapshot";
const receiptColumns = "id,intent_id,created_at,status,error_code,result_bundle";
async function readReceipt(client: SupabaseClient, owner: string, intentId: string) {
  const { data, error } = await client.from("life_climate_b3_receipts").select(receiptColumns).eq("user_id", owner).eq("intent_id", intentId).maybeSingle();
  if (error) throw new Error("Receipt unavailable");
  return data === null ? null : receiptSchema.parse(data);
}

export async function readLifeClimateB3Intents(request: Request) {
  const trace = `life_climate_b3_${randomUUID()}`;
  try {
    const auth = await authenticated();
    if (auth.error) return failure(auth.error, trace);
    const parsed = z.object({ key: z.string().uuid().optional(), limit: z.coerce.number().int().min(1).max(20).default(10) }).strict().safeParse(parseQuery(request, ["key", "limit"]));
    if (!parsed.success) return failure("invalid_request", trace);
    const query = auth.client.from("life_climate_b3_intents").select(intentColumns).eq("user_id", auth.user.id);
    const key = parsed.data.key;
    const raw = key ? await query.eq("idempotency_key", key).maybeSingle() : await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(parsed.data.limit);
    if (raw.error) return failure("persistence_failed", trace);
    if (key && !raw.data) return failure("life_climate_intent_not_found", trace);
    const intents = z.array(intentSchema).parse(key ? [raw.data] : raw.data ?? []);
    const items = [];
    for (const intent of intents) {
      const receipt = await readReceipt(auth.client, auth.user.id, intent.id);
      items.push({
        id: intent.id, created_at: intent.created_at, status: receipt?.status ?? "pending",
        originalBody: { idempotency_key: intent.idempotency_key, request: intent.normalized_request },
        receipt: receipt ? receipt.status === "completed" ? { status: "completed", run: await publicCompleted(intent, receipt) }
          : { status: "rejected", error_code: receipt.error_code && terminalErrors.has(receipt.error_code) ? receipt.error_code : "persistence_failed" } : null,
      });
    }
    return json({ ok: true, error_code: null, trace_id: trace, ...(key ? { intent: items[0] } : { items }) });
  } catch { return failure("persistence_failed", trace); }
}

export async function readLifeClimateB3Runs(request: Request) {
  const trace = `life_climate_b3_${randomUUID()}`;
  try {
    const auth = await authenticated();
    if (auth.error) return failure(auth.error, trace);
    const parsed = z.object({ run_id: z.string().uuid().optional(), limit: z.coerce.number().int().min(1).max(20).default(10) }).strict().safeParse(parseQuery(request, ["run_id", "limit"]));
    if (!parsed.success) return failure("invalid_request", trace);
    const query = auth.client.from("life_climate_b3_receipts").select(receiptColumns).eq("user_id", auth.user.id).eq("status", "completed");
    const id = parsed.data.run_id;
    const raw = id ? await query.eq("id", id).maybeSingle() : await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(parsed.data.limit);
    if (raw.error) return failure("persistence_failed", trace);
    if (id && !raw.data) return failure("life_climate_run_not_found", trace);
    const receipts = z.array(receiptSchema).parse(id ? [raw.data] : raw.data ?? []);
    const runs = [];
    for (const receipt of receipts) {
      const row = await auth.client.from("life_climate_b3_intents").select(intentColumns).eq("user_id", auth.user.id).eq("id", receipt.intent_id).maybeSingle();
      if (row.error || !row.data) return failure("history_unavailable", trace);
      runs.push(await publicCompleted(intentSchema.parse(row.data), receipt));
    }
    return json({ ok: true, error_code: null, trace_id: trace, ...(id ? { run: runs[0] } : { items: runs }) });
  } catch { return failure("history_unavailable", trace); }
}
