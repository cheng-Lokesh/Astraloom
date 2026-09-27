import { NextResponse } from "next/server";
import { z } from "zod";

import { realityProfileDraftSchema } from "@/lib/reality-profile/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const rowSchema = z.object({
  life_climate_value: z.string().nullable(), life_climate_classification: z.enum(["fact", "assumption", "unknown"]), life_climate_evidence_summary: z.string().nullable(),
  resources_value: z.string().nullable(), resources_classification: z.enum(["fact", "assumption", "unknown"]), resources_evidence_summary: z.string().nullable(),
  constraints_value: z.string().nullable(), constraints_classification: z.enum(["fact", "assumption", "unknown"]), constraints_evidence_summary: z.string().nullable(), revision: z.number().int().nonnegative(),
}).strict();

function failure(status: number, errorCode: string) {
  return NextResponse.json({ ok: false, error_code: errorCode }, { status, headers: { "Cache-Control": "no-store" } });
}

async function ownerAndSeed() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return null;
  const { data: seed, error } = await supabase.from("seed_contexts").select("id").eq("user_id", auth.user.id).eq("status", "submitted").not("submitted_at", "is", null).not("frozen_at", "is", null).order("submitted_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error("profile_seed_read_failed");
  return seed ? { supabase, ownerId: auth.user.id, seedId: seed.id } : { supabase, ownerId: auth.user.id, seedId: null };
}

function profileFromRow(row: unknown) {
  const record = rowSchema.parse(row);
  return realityProfileDraftSchema.parse({
    lifeClimate: { value: record.life_climate_value ?? "", classification: record.life_climate_classification, evidenceSummary: record.life_climate_evidence_summary ?? "明确未知" },
    resources: { value: record.resources_value ?? "", classification: record.resources_classification, evidenceSummary: record.resources_evidence_summary ?? "明确未知" },
    constraints: { value: record.constraints_value ?? "", classification: record.constraints_classification, evidenceSummary: record.constraints_evidence_summary ?? "明确未知" },
    revision: record.revision,
  });
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
  };
}

export async function GET() {
  try {
    const context = await ownerAndSeed();
    if (!context) return failure(401, "unauthenticated");
    if (!context.seedId) return failure(409, "current_seed_required");
    const { data, error } = await context.supabase.from("reality_profiles").select("life_climate_value,life_climate_classification,life_climate_evidence_summary,resources_value,resources_classification,resources_evidence_summary,constraints_value,constraints_classification,constraints_evidence_summary,revision").eq("user_id", context.ownerId).eq("seed_context_id", context.seedId).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ ok: true, profile: data ? profileFromRow(data) : null }, { headers: { "Cache-Control": "no-store" } });
  } catch { return failure(500, "persistence_failed"); }
}

export async function PUT(request: Request) {
  try {
    const context = await ownerAndSeed();
    if (!context) return failure(401, "unauthenticated");
    if (!context.seedId) return failure(409, "current_seed_required");
    const body = realityProfileDraftSchema.safeParse(await request.json());
    if (!body.success) return failure(400, "invalid_reality_profile");
    const fields = databaseFields(body.data);
    const { data: updated, error } = await context.supabase.from("reality_profiles").update({ ...fields, revision: body.data.revision + 1 }).eq("user_id", context.ownerId).eq("seed_context_id", context.seedId).eq("revision", body.data.revision).select("life_climate_value,life_climate_classification,life_climate_evidence_summary,resources_value,resources_classification,resources_evidence_summary,constraints_value,constraints_classification,constraints_evidence_summary,revision").maybeSingle();
    if (error) throw error;
    if (updated) return NextResponse.json({ ok: true, profile: profileFromRow(updated) }, { headers: { "Cache-Control": "no-store" } });
    const { data: existing, error: readError } = await context.supabase.from("reality_profiles").select("revision").eq("user_id", context.ownerId).eq("seed_context_id", context.seedId).maybeSingle();
    if (readError) throw readError;
    if (existing) return failure(409, "reality_profile_conflict");
    const { data: inserted, error: insertError } = await context.supabase.from("reality_profiles").insert({ ...fields, user_id: context.ownerId, seed_context_id: context.seedId, revision: 1 }).select("life_climate_value,life_climate_classification,life_climate_evidence_summary,resources_value,resources_classification,resources_evidence_summary,constraints_value,constraints_classification,constraints_evidence_summary,revision").single();
    if (insertError) throw insertError;
    return NextResponse.json({ ok: true, profile: profileFromRow(inserted) }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return failure(500, "persistence_failed"); }
}
