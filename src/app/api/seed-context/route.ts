import { NextResponse } from "next/server";
import { z } from "zod";
import { parseSubmittedSeedContext } from "@/lib/seed-context/submitted";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({ draft: z.unknown(), submissionKey: z.string().uuid() }).strict();

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ errorCode: "supabase_not_configured" }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ errorCode: "authentication_required" }, { status: 401 });
  const input = requestSchema.safeParse(await request.json().catch(() => null));
  const draft = input.success ? parseSubmittedSeedContext(input.data.draft) : { ok: false as const };
  if (!input.success || !draft.ok) return NextResponse.json({ errorCode: "invalid_submitted_seed_context" }, { status: 400 });
  const { data: existing } = await supabase.from("seed_contexts").select("id, trace_id, submitted_at, frozen_at").eq("submission_key", input.data.submissionKey).maybeSingle();
  if (existing) return NextResponse.json({ seedContext: existing, idempotent: true });
  const traceId = crypto.randomUUID();
  const { data: consent, error: consentError } = await supabase.from("consent_events").insert({ user_id: auth.user.id, consent_type: "seed_context_submission", status: "active", source: "track_a_confirm" }).select("id").single();
  if (consentError || !consent) return NextResponse.json({ errorCode: "consent_write_failed" }, { status: 500 });
  const { data, error } = await supabase.from("seed_contexts").insert({ user_id: auth.user.id, version: "phase2-submitted-v1", simulation_track: "crossroad", scenario_type: "career_decision", user_question: draft.data.questionText, time_horizon: draft.data.timeWindow, tick_granularity: "weekly", raw_context: draft.data.situationSummary, decision_options: [draft.data.decisionOptions ?? ""], forbidden_actions: [draft.data.forbiddenActions ?? ""], desired_output: { text: draft.data.desiredOutput ?? "" }, safety_flags: [], status: "submitted", trace_id: traceId, submission_key: input.data.submissionKey, submitted_at: new Date().toISOString(), frozen_at: new Date().toISOString(), consent_event_id: consent.id }).select("id, trace_id, submitted_at, frozen_at").single();
  if (error) return NextResponse.json({ errorCode: "seed_context_write_failed" }, { status: 500 });
  return NextResponse.json({ seedContext: data, idempotent: false }, { status: 201 });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ errorCode: "supabase_not_configured" }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ errorCode: "authentication_required" }, { status: 401 });
  const { data, error } = await supabase.from("seed_contexts").select("id, version, trace_id, submitted_at, frozen_at, user_question, time_horizon, raw_context").eq("status", "submitted").order("submitted_at", { ascending: false });
  if (error) return NextResponse.json({ errorCode: "seed_context_recovery_failed" }, { status: 500 });
  return NextResponse.json({ seedContexts: data });
}
