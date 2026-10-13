import { NextResponse } from "next/server";
import { digitalLifeModelDraftSchema, saveDigitalLifeModelDraftSchema } from "@/lib/digital-life/model-draft";
import { readFormalModelDraft, saveFormalModelDraft } from "@/lib/digital-life/model-draft.server";
import { sandboxFailure, sandboxTrace } from "@/lib/formal-sandbox/http.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function handle(request: Request, write: boolean) {
  const trace = sandboxTrace("model_draft");
  try {
    const caller = await createSupabaseServerClient();
    if (!caller) return sandboxFailure(500, "persistence_failed", trace);
    const { data, error } = await caller.auth.getUser();
    if (error || !data.user?.id || data.user.is_anonymous) return sandboxFailure(401, "unauthenticated", trace);
    if ([...new URL(request.url).searchParams.keys()].length) return sandboxFailure(422, "invalid_request", trace);
    let body: unknown;
    if (write) {
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return sandboxFailure(422, "invalid_request", trace);
      try { body = await request.json(); } catch { return sandboxFailure(422, "invalid_request", trace); }
      const parsed = saveDigitalLifeModelDraftSchema.safeParse(body);
      if (!parsed.success) return sandboxFailure(422, "invalid_request", trace);
      body = parsed.data;
    }
    const result = write ? await saveFormalModelDraft(caller, data.user.id, body) : await readFormalModelDraft(caller, data.user.id);
    if (!result.ok) return sandboxFailure(result.errorCode === "invalid_request" ? 422 : result.errorCode === "persistence_failed" ? 500 : result.errorCode === "unauthenticated" ? 401 : 409, result.errorCode, trace);
    const draft = digitalLifeModelDraftSchema.safeParse(result.draft);
    if (!draft.success) return sandboxFailure(500, "persistence_failed", trace);
    return NextResponse.json({ ok: true, error_code: null, trace_id: trace, draft: draft.data, ...(write ? { idempotent: result.idempotent === true } : {}) }, { status: write && !result.idempotent ? 201 : 200, headers: { "cache-control": "no-store" } });
  } catch { return sandboxFailure(500, "persistence_failed", trace); }
}
export const GET = (request: Request) => handle(request, false);
export const POST = (request: Request) => handle(request, true);
