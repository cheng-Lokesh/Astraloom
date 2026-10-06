import { NextResponse } from "next/server";
import { z } from "zod";
import { readFormalDigitalLifeContext } from "@/lib/formal-sandbox/model-context.server";
import { safeDigitalLifeContextSchema } from "@/lib/formal-sandbox/model-context";
import { sandboxErrorStatus, sandboxFailure, sandboxTrace } from "@/lib/formal-sandbox/http.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const selectors = z.object({ graph_id: z.string().uuid().optional() }).strict();
export async function GET(request: Request) {
  const trace = sandboxTrace("model_context");
  try {
    const caller = await createSupabaseServerClient();
    if (!caller) return sandboxFailure(500, "persistence_failed", trace);
    const { data: auth } = await caller.auth.getUser();
    if (!auth.user?.id) return sandboxFailure(401, "unauthenticated", trace);
    const params = new URL(request.url).searchParams;
    if ([...params.keys()].some(key => params.getAll(key).length !== 1)) return sandboxFailure(422, "invalid_request", trace);
    const parsed = selectors.safeParse(Object.fromEntries(params.entries()));
    if (!parsed.success) return sandboxFailure(422, "invalid_request", trace);
    const result = await readFormalDigitalLifeContext(caller, auth.user.id, parsed.data.graph_id);
    if (!result.ok) return sandboxFailure(result.errorCode === "current_graph_required" ? 409 : sandboxErrorStatus(result.errorCode), result.errorCode, trace);
    const context = safeDigitalLifeContextSchema.safeParse(result.context);
    if (!context.success) return sandboxFailure(500, "persistence_failed", trace);
    return NextResponse.json({ ok: true, error_code: null, trace_id: trace, context: context.data }, { headers: { "cache-control": "no-store" } });
  } catch { return sandboxFailure(500, "persistence_failed", trace); }
}
