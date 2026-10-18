import { NextResponse } from "next/server";
import { z } from "zod";

import { sandboxFailure, sandboxTrace } from "@/lib/formal-sandbox/http.server";
import { projectFormalSandboxResult } from "@/lib/formal-sandbox/result-projection.server";
import { usedCorrectionSourceRunId } from "@/lib/formal-sandbox/outcomes/used-corrections.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const trace = sandboxTrace("result");
  try {
    const runId = (await params).runId;
    if (!z.string().uuid().safeParse(runId).success) return sandboxFailure(422, "invalid_request", trace);
    const client = await createSupabaseServerClient();
    if (!client) return sandboxFailure(500, "persistence_failed", trace);
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError || !auth.user?.id || auth.user.is_anonymous === true) return sandboxFailure(401, "unauthenticated", trace);
    const { data, error } = await client.from("simulations").select("id,status,result_bundle,completed_at").eq("id", runId).eq("user_id", auth.user.id).eq("execution_version", "formal-account-sandbox-m1-v1").maybeSingle();
    if (error) return sandboxFailure(500, "persistence_failed", trace);
    if (!data) return sandboxFailure(404, "run_not_found", trace);
    if (data.status !== "completed" || !data.result_bundle) return sandboxFailure(409, "run_not_completed", trace);
    const correctionSources = new Map<string, unknown>();
    let sourceRunId: string | undefined;
    try { sourceRunId = usedCorrectionSourceRunId(data.result_bundle); } catch { return sandboxFailure(500, "result_projection_unavailable", trace); }
    if (sourceRunId) {
      // Reuse the authenticated caller and owner RLS. This optional historical read
      // cannot authorize a privileged writer or consult today's mutable sources.
      const source = await client.from("simulations").select("id,result_bundle").eq("id", sourceRunId).eq("user_id", auth.user.id)
        .eq("execution_version", "formal-account-sandbox-m1-v1").eq("status", "completed").maybeSingle();
      if (!source.error && source.data) {
        if (source.data.id !== sourceRunId || !source.data.result_bundle) return sandboxFailure(500, "result_projection_unavailable", trace);
        correctionSources.set(sourceRunId, source.data.result_bundle);
      }
    }
    const projection = projectFormalSandboxResult(data.result_bundle, { correctionSources });
    if (!projection) return sandboxFailure(500, "result_projection_unavailable", trace);
    return NextResponse.json({ ok: true, error_code: null, trace_id: trace, completed_at: data.completed_at, projection }, { headers: { "cache-control": "no-store" } });
  } catch {
    return sandboxFailure(500, "persistence_failed", trace);
  }
}
