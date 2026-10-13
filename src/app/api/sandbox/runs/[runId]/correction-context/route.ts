import { NextResponse } from "next/server";
import { z } from "zod";
import { safeDigitalLifeCorrectionContextSchema } from "@/lib/formal-sandbox/correction-context";
import { readFormalCorrectionContext } from "@/lib/formal-sandbox/correction-context.server";
import { sandboxFailure, sandboxTrace } from "@/lib/formal-sandbox/http.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const trace = sandboxTrace("correction_context");
  try {
    const caller = await createSupabaseServerClient();
    if (!caller) return sandboxFailure(500, "persistence_failed", trace);
    const { data: auth, error } = await caller.auth.getUser();
    if (error || !auth.user?.id || auth.user.is_anonymous) return sandboxFailure(401, "unauthenticated", trace);
    const runId = (await params).runId;
    if (!z.string().uuid().safeParse(runId).success || [...new URL(request.url).searchParams.keys()].length) return sandboxFailure(422, "invalid_request", trace);
    const result = await readFormalCorrectionContext(caller, auth.user.id, runId);
    if (!result.ok) {
      const status = result.errorCode === "run_not_found" ? 404 : result.errorCode === "invalid_request" ? 422 : result.errorCode === "persistence_failed" ? 500 : 409;
      return sandboxFailure(status, result.errorCode, trace);
    }
    const context = safeDigitalLifeCorrectionContextSchema.safeParse(result.context);
    if (!context.success) return sandboxFailure(500, "persistence_failed", trace);
    return NextResponse.json({ ok: true, error_code: null, trace_id: trace, context: context.data }, { headers: { "cache-control": "no-store" } });
  } catch { return sandboxFailure(500, "persistence_failed", trace); }
}
