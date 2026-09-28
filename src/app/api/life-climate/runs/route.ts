import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  realityProfileDatabaseColumns,
  realityProfileDraftFromDatabaseRow,
} from "@/lib/reality-profile/profile";
import {
  buildLifeClimatePathRun,
  buildLifeClimateRun,
  LIFE_CLIMATE_B1_VERSION,
  LIFE_CLIMATE_B2_VERSION,
  lifeClimateHorizonKeys,
  lifeClimatePathChangeSchema,
  lifeClimatePathRunRequestSchema,
  lifeClimateRunRequestSchema,
} from "@/lib/life-climate/engine";
import { verifySafety } from "@/lib/safety/safety-verifier";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const singlePostSchema = z.object({
  idempotency_key: z.string().uuid(),
  profile_revision: z.number().int().nonnegative(),
  change: lifeClimateRunRequestSchema.shape.change,
}).strict();

const pathPostSchema = z.object({
  idempotency_key: z.string().uuid(),
  profile_revision: z.number().int().nonnegative(),
  horizon: z.enum(lifeClimateHorizonKeys),
  changes: z.array(lifeClimatePathChangeSchema).min(1).max(12),
}).strict();

const postSchema = z.union([singlePostSchema, pathPostSchema]);

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  run_id: z.string().uuid().optional(),
}).strict();

function traceId() {
  return `life_climate_${randomUUID()}`;
}

function privateSafetyText(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value ?? "");
}

function failure(status: number, errorCode: string, trace: string) {
  return NextResponse.json(
    { ok: false, error_code: errorCode, trace_id: trace },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function sameChanges(left: Array<{ domain: string; entryIndex: number; startPeriod: number; newState: string; evidenceSummary: string }>, right: Array<{ domain: string; entryIndex: number; startPeriod: number; newState: string; evidenceSummary: string }>) {
  return left.length === right.length && left.every((change, index) => {
    const candidate = right[index];
    return candidate !== undefined
      && change.domain === candidate.domain
      && change.entryIndex === candidate.entryIndex
      && change.startPeriod === candidate.startPeriod
      && change.newState === candidate.newState
      && change.evidenceSummary === candidate.evidenceSummary;
  });
}

function safeHistoryRow(value: unknown) {
  const parsed = z.object({
    id: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    profile_revision: z.number().int().nonnegative(),
    input_snapshot: z.record(z.string(), z.unknown()),
    result_bundle: z.record(z.string(), z.unknown()),
  }).passthrough().safeParse(value);
  if (!parsed.success) return null;

  const { input_snapshot: input, result_bundle: result } = parsed.data;
  if (result.version === LIFE_CLIMATE_B1_VERSION) {
    const b1Input = z.object({
      version: z.literal(LIFE_CLIMATE_B1_VERSION),
      horizon: z.literal("1_year"),
      profileRevision: z.number().int().nonnegative(),
      change: lifeClimateRunRequestSchema.shape.change,
    }).passthrough().safeParse(input);
    const b1Result = z.object({
      version: z.literal(LIFE_CLIMATE_B1_VERSION),
      horizon: z.literal("1_year"),
      profileRevision: z.number().int().nonnegative(),
      selectedChange: lifeClimateRunRequestSchema.shape.change,
      paths: z.array(z.unknown()).length(2),
      events: z.array(z.unknown()).length(1),
      claims: z.array(z.unknown()).length(1),
      report: z.unknown(),
    }).passthrough().safeParse(result);
    if (!b1Input.success || !b1Result.success
      || b1Input.data.profileRevision !== parsed.data.profile_revision
      || b1Result.data.profileRevision !== parsed.data.profile_revision
      || !sameChanges([b1Input.data.change], [b1Result.data.selectedChange])) return null;
    return {
      ...parsed.data,
      input_snapshot: { version: LIFE_CLIMATE_B1_VERSION, horizon: "1_year" as const, profileRevision: b1Input.data.profileRevision, changes: [b1Input.data.change] },
      result_bundle: b1Result.data,
    };
  }

  const b2Input = z.object({
    version: z.literal(LIFE_CLIMATE_B2_VERSION),
    horizon: z.enum(lifeClimateHorizonKeys),
    profileRevision: z.number().int().nonnegative(),
    changes: z.array(lifeClimatePathChangeSchema).min(1).max(12),
  }).passthrough().safeParse(input);
  const b2Result = z.object({
    version: z.literal(LIFE_CLIMATE_B2_VERSION),
    horizon: z.enum(lifeClimateHorizonKeys),
    profileRevision: z.number().int().nonnegative(),
    selectedChanges: z.array(lifeClimatePathChangeSchema).min(1).max(12),
    paths: z.array(z.object({ periods: z.array(z.unknown()).min(1).max(5) }).passthrough()).length(2),
    events: z.array(z.object({ id: z.string().uuid() }).passthrough()).min(1).max(12),
    claims: z.array(z.object({ id: z.string().uuid(), evidenceEventIds: z.array(z.string().uuid()).min(1) }).passthrough()).min(1).max(12),
    report: z.object({ claimIds: z.array(z.string().uuid()), includesExactDates: z.literal(false), claimsUseEventEvidence: z.literal(true) }).passthrough(),
  }).passthrough().safeParse(result);
  if (!b2Input.success || !b2Result.success) return null;
  const b2InputPath = lifeClimatePathRunRequestSchema.safeParse({
    horizon: b2Input.data.horizon,
    profileRevision: b2Input.data.profileRevision,
    changes: b2Input.data.changes,
  });
  const b2ResultPath = lifeClimatePathRunRequestSchema.safeParse({
    horizon: b2Result.data.horizon,
    profileRevision: b2Result.data.profileRevision,
    changes: b2Result.data.selectedChanges,
  });
  if (!b2InputPath.success || !b2ResultPath.success
    || b2Input.data.profileRevision !== parsed.data.profile_revision
    || b2Result.data.profileRevision !== parsed.data.profile_revision
    || b2Input.data.horizon !== b2Result.data.horizon
    || !sameChanges(b2Input.data.changes, b2Result.data.selectedChanges)
    || b2Result.data.events.length !== b2Result.data.claims.length
    || b2Result.data.report.claimIds.length !== b2Result.data.claims.length
    || b2Result.data.claims.some((claim, index) => claim.evidenceEventIds.length !== 1 || claim.evidenceEventIds[0] !== b2Result.data.events[index]?.id || b2Result.data.report.claimIds[index] !== claim.id)) return null;
  return {
    ...parsed.data,
    input_snapshot: { version: LIFE_CLIMATE_B2_VERSION, horizon: b2Input.data.horizon, profileRevision: b2Input.data.profileRevision, changes: b2Input.data.changes },
    result_bundle: b2Result.data,
  };
}

export async function POST(request: Request) {
  const trace = traceId();
  try {
    const userClient = await createSupabaseServerClient();
    if (!userClient) return failure(503, "persistence_unavailable", trace);
    const { data: auth } = await userClient.auth.getUser();
    if (!auth.user?.id) return failure(401, "unauthenticated", trace);
    if (request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") {
      return failure(422, "invalid_request", trace);
    }
    const parsedBody = postSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) return failure(422, "invalid_request", trace);
    const pathRequest = "changes" in parsedBody.data
      ? lifeClimatePathRunRequestSchema.safeParse({
        horizon: parsedBody.data.horizon,
        profileRevision: parsedBody.data.profile_revision,
        changes: parsedBody.data.changes,
      })
      : null;
    const singleRequest = "change" in parsedBody.data
      ? lifeClimateRunRequestSchema.safeParse({
        horizon: "1_year",
        profileRevision: parsedBody.data.profile_revision,
        change: parsedBody.data.change,
      })
      : null;
    if ((pathRequest && !pathRequest.success) || (singleRequest && !singleRequest.success)) {
      return failure(422, "invalid_request", trace);
    }
    const requestChanges = pathRequest?.success ? pathRequest.data.changes : singleRequest?.success ? [singleRequest.data.change] : [];
    const requestHorizon = pathRequest?.success ? pathRequest.data.horizon : "1_year";
    const profileRevision = parsedBody.data.profile_revision;
    if (requestChanges.length === 0) return failure(422, "invalid_request", trace);

    const { data: seed, error: seedError } = await userClient
      .from("seed_contexts")
      .select("id,user_question,raw_context,decision_options,forbidden_actions,desired_output,safety_flags")
      .eq("user_id", auth.user.id)
      .eq("status", "submitted")
      .not("submitted_at", "is", null)
      .not("frozen_at", "is", null)
      .order("submitted_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (seedError) return failure(500, "persistence_failed", trace);
    if (!seed?.id) return failure(409, "current_seed_required", trace);

    const { data: profileRow, error: profileError } = await userClient
      .from("reality_profiles")
      .select(realityProfileDatabaseColumns)
      .eq("user_id", auth.user.id)
      .eq("seed_context_id", seed.id)
      .maybeSingle();
    if (profileError) return failure(500, "persistence_failed", trace);
    if (!profileRow) return failure(409, "reality_profile_required", trace);
    const profile = realityProfileDraftFromDatabaseRow(profileRow);
    if (profile.revision !== profileRevision) return failure(409, "profile_revision_conflict", trace);
    if (requestChanges.some((change) => !profile.lifeModelDomains[change.domain][change.entryIndex])) {
      return failure(422, "invalid_request", trace);
    }

    const safetyResults = requestChanges.map((change) => {
      const selectedProfileField = profile.lifeModelDomains[change.domain][change.entryIndex];
      const safetyContext = [
        seed.decision_options,
        seed.forbidden_actions,
        seed.desired_output,
        seed.safety_flags,
        selectedProfileField?.value,
        selectedProfileField?.evidenceSummary,
        change.newState,
        change.evidenceSummary,
      ].map(privateSafetyText).join("\n");
      return verifySafety({
        seedContext: {
          id: "life-climate-input",
          questionText: seed.user_question ?? "",
          trackType: "crossroad",
          timeWindow: requestHorizon,
          currentQuestionDescription: change.newState,
          situationSummary: seed.raw_context ?? "",
          recentEvents: "",
          keyPeopleText: "",
          decisionOptions: safetyContext,
          worries: safetyContext,
          privacyAck: true,
          locale: "zh",
          status: "submitted",
          createdAt: "",
          updatedAt: "",
        },
      });
    });
    if (safetyResults.some((safety) => safety.safetyLevel === "blocked" || safety.safetyLevel === "downgraded")) {
      return failure(403, "safety_downgrade", trace);
    }

    const resultBundle = pathRequest?.success
      ? buildLifeClimatePathRun(profile, pathRequest.data)
      : singleRequest?.success
        ? buildLifeClimateRun(profile, singleRequest.data)
        : null;
    if (!resultBundle) return failure(422, "invalid_request", trace);
    const safetyFlags = [...new Set(safetyResults.flatMap((safety) => safety.flags))];
    const safetyLevel = safetyResults.some((safety) => safety.safetyLevel === "caution") ? "caution" : "safe";
    const inputSnapshot = "selectedChanges" in resultBundle
      ? {
        version: resultBundle.version,
        horizon: resultBundle.horizon,
        profileRevision: profile.revision,
        lifeModelDomains: resultBundle.profileSnapshot.lifeModelDomains,
        changes: resultBundle.selectedChanges,
        safetyLevel,
        safetyFlags,
      }
      : {
      version: resultBundle.version,
      horizon: resultBundle.horizon,
      profileRevision: profile.revision,
      lifeModelDomains: resultBundle.profileSnapshot.lifeModelDomains,
      change: resultBundle.selectedChange,
      safetyLevel,
      safetyFlags,
    };
    const service = getServiceRoleSupabaseClient();
    if (!service) return failure(503, "persistence_unavailable", trace);
    const writerName = "selectedChanges" in resultBundle ? "persist_life_climate_run_b2" : "persist_life_climate_run_b1";
    const { data, error } = await service.rpc(writerName, {
      p_user_id: auth.user.id,
      p_seed_context_id: seed.id,
      p_profile_revision: profile.revision,
      p_idempotency_key: parsedBody.data.idempotency_key,
      p_input_snapshot: inputSnapshot,
      p_result_bundle: resultBundle,
      p_trace_id: trace,
    });
    if (error) {
      if (error.message === "profile_revision_conflict") return failure(409, "profile_revision_conflict", trace);
      if (error.message === "idempotency_conflict") return failure(409, "idempotency_conflict", trace);
      if (error.message === "life_climate_seed_not_found") return failure(409, "current_seed_required", trace);
      return failure(500, "persistence_failed", trace);
    }
    const record = Array.isArray(data) ? data[0] : null;
    if (!record || typeof record !== "object") return failure(500, "persistence_failed", trace);
    const row = record as { id?: unknown; idempotent?: unknown; created_at?: unknown; result_bundle?: unknown };
    const safeRun = safeHistoryRow({
      id: row.id,
      created_at: row.created_at,
      profile_revision: profile.revision,
      input_snapshot: inputSnapshot,
      result_bundle: row.result_bundle,
    });
    if (!safeRun) return failure(500, "persistence_failed", trace);
    const idempotent = row.idempotent === true;
    return NextResponse.json({
      ok: true,
      error_code: null,
      trace_id: trace,
      idempotent,
      run: {
        id: safeRun.id,
        created_at: safeRun.created_at,
        profile_revision: safeRun.profile_revision,
        result: safeRun.result_bundle,
      },
    }, { status: idempotent ? 200 : 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return failure(500, "persistence_failed", trace);
  }
}

export async function GET(request: Request) {
  const trace = traceId();
  try {
    const client = await createSupabaseServerClient();
    if (!client) return failure(503, "persistence_unavailable", trace);
    const { data: auth } = await client.auth.getUser();
    if (!auth.user?.id) return failure(401, "unauthenticated", trace);
    const url = new URL(request.url);
    const keys = [...url.searchParams.keys()];
    if (keys.some((key) => !["limit", "run_id"].includes(key)) || keys.some((key) => url.searchParams.getAll(key).length !== 1)) {
      return failure(422, "invalid_request", trace);
    }
    const query = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!query.success) return failure(422, "invalid_request", trace);

    const columns = "id,created_at,profile_revision,input_snapshot,result_bundle";
    const requestQuery = client.from("life_climate_runs")
      .select(columns)
      .eq("user_id", auth.user.id)
      .in("version", [LIFE_CLIMATE_B1_VERSION, LIFE_CLIMATE_B2_VERSION]);
    if (query.data.run_id) {
      const { data, error } = await requestQuery.eq("id", query.data.run_id).maybeSingle();
      if (error) return failure(500, "persistence_failed", trace);
      if (!data) return failure(404, "life_climate_run_not_found", trace);
      const run = safeHistoryRow(data);
      if (!run) return failure(500, "history_unavailable", trace);
      return NextResponse.json({
        ok: true,
        error_code: null,
        trace_id: trace,
        run: { id: run.id, created_at: run.created_at, profile_revision: run.profile_revision, result: run.result_bundle },
      }, { headers: { "Cache-Control": "no-store" } });
    }

    const { data, error } = await requestQuery
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(query.data.limit);
    if (error) return failure(500, "persistence_failed", trace);
    const items = (data ?? []).flatMap((value: unknown) => {
      const run = safeHistoryRow(value);
      return run ? [{
        id: run.id,
        created_at: run.created_at,
        profile_revision: run.profile_revision,
        horizon: run.input_snapshot.horizon,
        changes: run.input_snapshot.changes,
      }] : [];
    });
    return NextResponse.json({ ok: true, error_code: null, trace_id: trace, items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return failure(500, "persistence_failed", trace);
  }
}
