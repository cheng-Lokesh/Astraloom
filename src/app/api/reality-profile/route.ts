import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { realityProfileDatabaseColumns, realityProfileDraftFromDatabaseRow, realityProfileDraftSchema } from "@/lib/reality-profile/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const profileColumns = realityProfileDatabaseColumns;

function failure(status: number, errorCode: string, traceId: string) {
  return NextResponse.json({ ok: false, error_code: errorCode, trace_id: traceId }, { status, headers: { "Cache-Control": "no-store" } });
}

type OwnerSeedContext =
  | { ok: false; status: 401 | 500; errorCode: string }
  | { ok: true; supabase: SupabaseClient; ownerId: string; seedId: string | null };

async function ownerAndSeed(): Promise<OwnerSeedContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, status: 500, errorCode: "persistence_failed" };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return { ok: false, status: 401, errorCode: "unauthenticated" };
  const { data: seed, error } = await supabase.from("seed_contexts").select("id").eq("user_id", auth.user.id).eq("status", "submitted").not("submitted_at", "is", null).not("frozen_at", "is", null).order("submitted_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error("profile_seed_read_failed");
  return { ok: true, supabase, ownerId: auth.user.id, seedId: seed?.id ?? null };
}

function profileFromRow(row: unknown) {
  return realityProfileDraftFromDatabaseRow(row);
}

function databaseFields(profile: z.infer<typeof realityProfileDraftSchema>) {
  return {
    life_climate_value: profile.lifeClimate.classification === "unknown" ? null : profile.lifeClimate.value,
    life_climate_classification: profile.lifeClimate.classification,
    life_climate_evidence_summary: profile.lifeClimate.evidenceSummary,
    resources_value: profile.resources.classification === "unknown" ? null : profile.resources.value,
    resources_classification: profile.resources.classification,
    resources_evidence_summary: profile.resources.evidenceSummary,
    constraints_value: profile.constraints.classification === "unknown" ? null : profile.constraints.value,
    constraints_classification: profile.constraints.classification,
    constraints_evidence_summary: profile.constraints.evidenceSummary,
    life_goals: profile.goals,
    core_values: profile.values,
    life_themes: profile.lifeThemes,
    pressures: profile.pressures,
    external_variables: profile.externalVariables,
    life_model_domains: profile.lifeModelDomains,
    world_model_inputs: profile.worldInputs,
  };
}

export async function GET() {
  const traceId = `reality_profile_${crypto.randomUUID()}`;
  try {
    const context = await ownerAndSeed();
    if (!context.ok) return failure(context.status, context.errorCode, traceId);
    if (!context.seedId) return failure(409, "current_seed_required", traceId);
    const { data, error } = await context.supabase.from("reality_profiles").select(profileColumns).eq("user_id", context.ownerId).eq("seed_context_id", context.seedId).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ ok: true, error_code: null, trace_id: traceId, profile: data ? profileFromRow(data) : null }, { headers: { "Cache-Control": "no-store" } });
  } catch { return failure(500, "persistence_failed", traceId); }
}

export async function PUT(request: Request) {
  const traceId = `reality_profile_${crypto.randomUUID()}`;
  try {
    const context = await ownerAndSeed();
    if (!context.ok) return failure(context.status, context.errorCode, traceId);
    if (!context.seedId) return failure(409, "current_seed_required", traceId);
    let input: unknown;
    try { input = await request.json(); } catch { return failure(400, "invalid_reality_profile", traceId); }
    const body = realityProfileDraftSchema.safeParse(input);
    if (!body.success) return failure(400, "invalid_reality_profile", traceId);
    const fields = databaseFields(body.data);
    const { data: updated, error } = await context.supabase.from("reality_profiles").update({ ...fields, revision: body.data.revision + 1 }).eq("user_id", context.ownerId).eq("seed_context_id", context.seedId).eq("revision", body.data.revision).select(profileColumns).maybeSingle();
    if (error) throw error;
    if (updated) return NextResponse.json({ ok: true, error_code: null, trace_id: traceId, profile: profileFromRow(updated) }, { headers: { "Cache-Control": "no-store" } });
    const { data: existing, error: readError } = await context.supabase.from("reality_profiles").select("revision").eq("user_id", context.ownerId).eq("seed_context_id", context.seedId).maybeSingle();
    if (readError) throw readError;
    if (existing) return failure(409, "reality_profile_conflict", traceId);
    const { data: inserted, error: insertError } = await context.supabase.from("reality_profiles").insert({ ...fields, user_id: context.ownerId, seed_context_id: context.seedId, revision: 1 }).select(profileColumns).single();
    if (insertError?.code === "23505") return failure(409, "reality_profile_conflict", traceId);
    if (insertError) throw insertError;
    return NextResponse.json({ ok: true, error_code: null, trace_id: traceId, profile: profileFromRow(inserted) }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return failure(500, "persistence_failed", traceId); }
}
