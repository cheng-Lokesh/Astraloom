import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { defaultPlanningContextSchema } from "@/lib/formal-planning/contracts";
import { sandboxFailure, sandboxTrace } from "./http.server";

const knownErrors: Record<string, number> = {
  unauthenticated: 401,
  graph_not_found: 404,
  current_graph_required: 409,
};

/** Read with the verified caller's session; never substitute a privileged service client. */
export async function planningContextHttp(request: Request) {
  const trace = sandboxTrace("planning_context");
  try {
    const client = await createSupabaseServerClient();
    if (!client) return sandboxFailure(401, "unauthenticated", trace);
    const { data, error } = await client.auth.getUser();
    if (error || !data.user?.id || data.user.is_anonymous) return sandboxFailure(401, "unauthenticated", trace);

    const params = new URL(request.url).searchParams;
    if ([...params.keys()].some(key => key !== "graph_id") || params.getAll("graph_id").length > 1) return sandboxFailure(422, "invalid_request", trace);
    const graphId = params.get("graph_id");
    if (graphId !== null && !z.string().uuid().safeParse(graphId).success) return sandboxFailure(422, "invalid_request", trace);

    // The database resolves its own owner/current source within one read snapshot.
    const result = await client.rpc("read_formal_default_planning_context_v1", { p_graph_snapshot_id: graphId });
    if (result.error) {
      const code = Object.hasOwn(knownErrors, result.error.message) ? result.error.message : "persistence_failed";
      return sandboxFailure(knownErrors[code] ?? 500, code, trace);
    }
    const parsed = defaultPlanningContextSchema.safeParse(result.data);
    if (!parsed.success) return sandboxFailure(500, "persistence_failed", trace);
    return NextResponse.json({ ok: true, error_code: null, trace_id: trace, context: parsed.data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return sandboxFailure(500, "persistence_failed", trace);
  }
}
