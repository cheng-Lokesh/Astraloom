import { NextResponse } from "next/server";
import { z } from "zod";
import { parseSubmittedSeedContext } from "@/lib/seed-context/submitted";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({ draft: z.unknown(), submissionKey: z.string().uuid() }).strict();

function toSubmissionPayload(draft: ReturnType<typeof parseSubmittedSeedContext> & { ok: true }) {
  return {
    questionText: draft.data.questionText,
    trackType: draft.data.trackType,
    timeWindow: draft.data.timeWindow,
    situationSummary: draft.data.situationSummary,
    recentEvents: draft.data.recentEvents ?? "",
    keyPeopleText: draft.data.keyPeopleText,
    decisionOptions: draft.data.decisionOptions ?? "",
    worries: draft.data.worries ?? "",
    forbiddenActions: draft.data.forbiddenActions ?? "",
    safetyBoundaries: draft.data.safetyBoundaries ?? "",
    desiredOutput: draft.data.desiredOutput ?? "",
    privacyAck: draft.data.privacyAck,
    privacySafetyAck: draft.data.privacySafetyAck,
  };
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ errorCode: "supabase_not_configured" }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ errorCode: "authentication_required" }, { status: 401 });
  const input = requestSchema.safeParse(await request.json().catch(() => null));
  const draft = input.success ? parseSubmittedSeedContext(input.data.draft) : { ok: false as const };
  if (!input.success || !draft.ok) return NextResponse.json({ errorCode: "invalid_submitted_seed_context" }, { status: 400 });
  const { data, error } = await supabase.rpc("submit_seed_context_phase2", {
    p_submission_key: input.data.submissionKey,
    p_payload: toSubmissionPayload(draft),
  });
  if (error) {
    if (error.message === "idempotency_key_content_conflict") {
      return NextResponse.json({ errorCode: "idempotency_key_content_conflict" }, { status: 409 });
    }
    return NextResponse.json({ errorCode: "seed_context_write_failed" }, { status: 500 });
  }

  const submission = Array.isArray(data) ? data[0] : data;
  if (!submission) return NextResponse.json({ errorCode: "seed_context_write_failed" }, { status: 500 });

  const seedContext = {
    id: submission.seed_context_id,
    version: submission.version,
    submittedAt: submission.submitted_at,
    frozenAt: submission.frozen_at,
  };
  return NextResponse.json(
    { seedContext, idempotent: submission.idempotent },
    { status: submission.idempotent ? 200 : 201 },
  );
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ errorCode: "supabase_not_configured" }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ errorCode: "authentication_required" }, { status: 401 });
  const { data, error } = await supabase.from("seed_contexts").select("id, version, submitted_at, frozen_at").eq("status", "submitted").order("submitted_at", { ascending: false });
  if (error) return NextResponse.json({ errorCode: "seed_context_recovery_failed" }, { status: 500 });
  return NextResponse.json({
    seedContexts: (data ?? []).map((seedContext) => ({
      id: seedContext.id,
      version: seedContext.version,
      submittedAt: seedContext.submitted_at,
      frozenAt: seedContext.frozen_at,
    })),
  });
}
