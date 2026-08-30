import { NextResponse } from "next/server";

import { readSandboxOverview } from "@/lib/sandbox-overview/overview.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function failure(status: number, errorCode: string, traceId: string) {
  return NextResponse.json({ ok: false, error_code: errorCode, trace_id: traceId }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  const traceId = `sandbox_overview_${crypto.randomUUID()}`;
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return failure(500, "persistence_failed", traceId);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) return failure(401, "unauthenticated", traceId);
    const overview = await readSandboxOverview(supabase, auth.user.id);
    return NextResponse.json({ ok: true, error_code: null, trace_id: traceId, overview }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return failure(500, "persistence_failed", traceId);
  }
}
