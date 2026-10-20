import { NextResponse } from "next/server";
import { z } from "zod";
import { REALITY_PROFILE_CONTINUATION_VERSION, listExpiredRealityContinuationConstraintKeys, prepareRealityProfileContinuation, preparedRealityProfileContinuationSchema, realityProfileContinuationReceiptSchema, realityProfileContinuationSchema } from "@/lib/reality-profile/continuation";
import { toRealityProfileDatabaseFields } from "@/lib/reality-profile/database-fields";
import { realityProfileDatabaseColumns, realityProfileDraftFromDatabaseRow } from "@/lib/reality-profile/profile";
import { parseSubmittedSeedContext } from "@/lib/seed-context/submitted";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const requestSchema = z.object({ draft: z.unknown(), submissionKey: z.string().uuid(), realityContinuation: z.unknown().optional() }).strict();
const submissionSchema = z.object({
  seed_context_id: z.string().uuid(),
  version: z.literal("phase2-submitted-v1"),
  submitted_at: z.iso.datetime({ offset: true }),
  frozen_at: z.iso.datetime({ offset: true }),
  idempotent: z.boolean(),
}).strict();
const continuationSubmissionSchema = submissionSchema.extend({
  continuation_version: z.literal(REALITY_PROFILE_CONTINUATION_VERSION),
  profile_revision: z.literal(1),
});

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function failure(errorCode: string, status: number) { return json({ errorCode }, status); }

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
  try {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return failure("supabase_not_configured", 503);
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user?.id || auth.user.is_anonymous === true) return failure("authentication_required", 401);
  const input = requestSchema.safeParse(await request.json().catch(() => null));
  const draft = input.success ? parseSubmittedSeedContext(input.data.draft) : { ok: false as const };
  if (!input.success || !draft.ok) return failure("invalid_submitted_seed_context", 400);
  const hasContinuation = input.data.realityContinuation !== undefined;
  const continuation = hasContinuation ? realityProfileContinuationSchema.safeParse(input.data.realityContinuation) : null;
  if (hasContinuation && !continuation?.success) return failure("invalid_reality_continuation", 400);
  // No mutable source or current-time checks here: the database must recover an
  // existing receipt before consulting a source that is no longer current.
  const { data, error } = await supabase.rpc("submit_seed_context_phase2", {
    p_submission_key: input.data.submissionKey,
    p_payload: toSubmissionPayload(draft),
    ...(continuation?.success ? { p_reality_continuation: { ...continuation.data, reviewedProfile: { ...toRealityProfileDatabaseFields(continuation.data.reviewedProfile), revision: 0 } } } : {}),
  });
  if (error) {
    if (error.message === "authentication_required") return failure("authentication_required", 401);
    if (["idempotency_key_content_conflict", "reality_continuation_source_stale", "reality_continuation_revision_conflict", "reality_continuation_deadline_expired", "reality_profile_required"].includes(error.message)) return failure(error.message, 409);
    if (["invalid_submitted_seed_context", "invalid_reality_continuation"].includes(error.message)) return failure(error.message, 400);
    return failure("seed_context_write_failed", 500);
  }

  const parsed = (hasContinuation ? continuationSubmissionSchema : submissionSchema).safeParse(Array.isArray(data) && data.length === 1 ? data[0] : data);
  if (!parsed.success) return failure("seed_context_write_failed", 500);
  const submission = parsed.data;

  const seedContext = {
    id: submission.seed_context_id,
    version: submission.version,
    submittedAt: submission.submitted_at,
    frozenAt: submission.frozen_at,
  };
  return json(
    { seedContext, idempotent: submission.idempotent, ...(hasContinuation ? { realityContinuation: realityProfileContinuationReceiptSchema.parse({ version: REALITY_PROFILE_CONTINUATION_VERSION, profileRevision: 1 }) } : {}) },
    submission.idempotent ? 200 : 201,
  );
  } catch { return failure("seed_context_write_failed", 500); }
}

export async function GET(request: Request) {
  try {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return failure("supabase_not_configured", 503);
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user?.id || auth.user.is_anonymous === true) return failure("authentication_required", 401);
  const params = new URL(request.url).searchParams;
  const preparing = params.get("prepare_continuation") === "1";
  if (params.size && (!preparing || params.size !== 1)) return failure("invalid_reality_continuation", 400);
  if (preparing) {
    const { data: source, error: seedError } = await supabase.from("seed_contexts").select("id").eq("user_id", auth.user.id).eq("status", "submitted").not("submitted_at", "is", null).not("frozen_at", "is", null).order("submitted_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle();
    if (seedError) return failure("seed_context_recovery_failed", 500);
    if (!source) return failure("current_seed_required", 409);
    const { data: row, error: profileError } = await supabase.from("reality_profiles").select(realityProfileDatabaseColumns).eq("user_id", auth.user.id).eq("seed_context_id", source.id).maybeSingle();
    if (profileError) return failure("seed_context_recovery_failed", 500);
    if (!row) return failure("reality_profile_required", 409);
    const sourceProfile = realityProfileDraftFromDatabaseRow(row);
    const preparedAt = new Date().toISOString();
    const profile = prepareRealityProfileContinuation(sourceProfile);
    const continuation = preparedRealityProfileContinuationSchema.parse({ version: REALITY_PROFILE_CONTINUATION_VERSION, sourceSeedContextId: source.id, sourceRevision: sourceProfile.revision, preparedAt, profile, expiredConstraintKeys: listExpiredRealityContinuationConstraintKeys(profile, preparedAt) });
    return json({ continuation });
  }
  const { data, error } = await supabase
    .from("seed_contexts")
    .select("id, version, submitted_at, frozen_at")
    .eq("status", "submitted")
    .not("frozen_at", "is", null)
    .not("consent_event_id", "is", null)
    .order("submitted_at", { ascending: false });
  if (error) return failure("seed_context_recovery_failed", 500);
  return json({
    seedContexts: (data ?? []).map((seedContext) => ({
      id: seedContext.id,
      version: seedContext.version,
      submittedAt: seedContext.submitted_at,
      frozenAt: seedContext.frozen_at,
    })),
  });
  } catch { return failure("seed_context_recovery_failed", 500); }
}
