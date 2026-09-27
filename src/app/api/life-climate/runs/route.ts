import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  realityProfileDatabaseColumns,
  realityProfileDraftFromDatabaseRow,
} from "@/lib/reality-profile/profile";
import { buildLifeClimateRun, lifeClimateRunRequestSchema } from "@/lib/life-climate/engine";
import { verifySafety } from "@/lib/safety/safety-verifier";
import { getServiceRoleSupabaseClient } from "@/lib/supabase/service-role.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const postSchema = z.object({
  idempotency_key: z.string().uuid(),
  profile_revision: z.number().int().nonnegative(),
  change: lifeClimateRunRequestSchema.shape.change,
}).strict();

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  run_id: z.string().uuid().optional(),
}).strict();

function traceId() {
  return `life_climate_${randomUUID()}`;
}

function failure(status: number, errorCode: string, trace: string) {
  return NextResponse.json(
    { ok: false, error_code: errorCode, trace_id: trace },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function safeHistoryRow(value: unknown) {
  const parsed = z.object({
    id: z.string().uuid(),
    created_at: z.string().datetime({ offset: true }),
    profile_revision: z.number().int().nonnegative(),
    input_snapshot: z.object({
      change: lifeClimateRunRequestSchema.shape.change,
    }).passthrough(),
    result_bundle: z.object({
      version: z.literal("life-climate-b1-v1"),
      horizon: z.literal("1_year"),
      paths: z.array(z.unknown()).length(2),
      events: z.array(z.unknown()).min(1),
      claims: z.array(z.unknown()).min(1),
      report: z.unknown(),
    }).passthrough(),
  }).passthrough().safeParse(value);
  return parsed.success ? parsed.data : null;
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
    const input = lifeClimateRunRequestSchema.safeParse({
      horizon: "1_year",
      profileRevision: parsedBody.data.profile_revision,
      change: parsedBody.data.change,
    });
    if (!input.success) return failure(422, "invalid_request", trace);

    const safety = verifySafety({
      seedContext: {
        id: "life-climate-input",
        questionText: "",
        trackType: "life_climate",
        timeWindow: "1_year",
        currentQuestionDescription: input.data.change.newState,
        situationSummary: "",
        keyPeopleText: "",
        privacyAck: true,
        locale: "zh",
        status: "submitted",
        createdAt: "",
        updatedAt: "",
      },
    });
    if (safety.safetyLevel === "blocked" || safety.safetyLevel === "downgraded") {
      return failure(403, "safety_downgrade", trace);
    }

    const { data: seed, error: seedError } = await userClient
      .from("seed_contexts")
      .select("id")
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
    if (profile.revision !== input.data.profileRevision) return failure(409, "profile_revision_conflict", trace);

    const resultBundle = buildLifeClimateRun(profile, input.data);
    const inputSnapshot = {
      version: resultBundle.version,
      horizon: resultBundle.horizon,
      profileRevision: profile.revision,
      lifeModelDomains: resultBundle.profileSnapshot.lifeModelDomains,
      change: input.data.change,
      safetyLevel: safety.safetyLevel,
      safetyFlags: safety.flags,
    };
    const requestHash = createHash("sha256")
      .update(JSON.stringify({ seedId: seed.id, inputSnapshot }))
      .digest("hex");
    const service = getServiceRoleSupabaseClient();
    if (!service) return failure(503, "persistence_unavailable", trace);
    const { data, error } = await service.rpc("persist_life_climate_run_b1", {
      p_user_id: auth.user.id,
      p_seed_context_id: seed.id,
      p_profile_revision: profile.revision,
      p_idempotency_key: parsedBody.data.idempotency_key,
      p_request_hash: requestHash,
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
      .eq("version", "life-climate-b1-v1");
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
        change: run.input_snapshot.change,
      }] : [];
    });
    return NextResponse.json({ ok: true, error_code: null, trace_id: trace, items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return failure(500, "persistence_failed", trace);
  }
}
