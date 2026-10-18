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
    const params = new URL(request.url).searchParams;
    const prepareV2 = !write && params.size === 1 && params.getAll("prepare_version").length === 1 && params.get("prepare_version") === "v2";
    const prepareV3 = !write && params.size === 1 && params.getAll("prepare_version").length === 1 && params.get("prepare_version") === "v3";
    const revisionText = params.get("reconcile_revision");
    const reconcile = !write && params.size === 2 && params.getAll("prepare_version").length === 1 && params.get("prepare_version") === "v2" && params.getAll("reconcile_revision").length === 1 && /^[1-9]\d*$/.test(revisionText ?? "") && Number.isSafeInteger(Number(revisionText));
    if (params.size && !prepareV2 && !prepareV3 && !reconcile) return sandboxFailure(422, "invalid_request", trace);
    let body: unknown;
    if (write) {
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return sandboxFailure(422, "invalid_request", trace);
      try { body = await request.json(); } catch { return sandboxFailure(422, "invalid_request", trace); }
      const parsed = saveDigitalLifeModelDraftSchema.safeParse(body);
      if (!parsed.success) return sandboxFailure(422, "invalid_request", trace);
      body = parsed.data;
    }
    const result = write ? await saveFormalModelDraft(caller, data.user.id, body) : await readFormalModelDraft(caller, data.user.id, prepareV3 ? "v3" : prepareV2 || reconcile, reconcile ? Number(revisionText) : undefined);
    if (!result.ok) return sandboxFailure(result.errorCode === "invalid_request" ? 422 : result.errorCode === "persistence_failed" ? 500 : result.errorCode === "unauthenticated" ? 401 : 409, result.errorCode, trace);
    const draft = digitalLifeModelDraftSchema.safeParse(result.draft);
    if (!draft.success) return sandboxFailure(500, "persistence_failed", trace);
    return NextResponse.json({ ok: true, error_code: null, trace_id: trace, draft: draft.data, ...(write ? { idempotent: result.idempotent === true } : {}), ...((prepareV2 || prepareV3 || reconcile) && result.preparedSourceContext ? { preparedSourceContext: result.preparedSourceContext } : {}), ...(prepareV3 && result.preparedProtocol ? { preparedProtocol: result.preparedProtocol } : {}), ...(reconcile && result.reconciliation ? { reconciliation: result.reconciliation } : {}) }, { status: write && !result.idempotent ? 201 : 200, headers: { "cache-control": "no-store" } });
  } catch { return sandboxFailure(500, "persistence_failed", trace); }
}
export const GET = (request: Request) => handle(request, false);
export const POST = (request: Request) => handle(request, true);
