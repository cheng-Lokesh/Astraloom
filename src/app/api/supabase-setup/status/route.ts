import { NextResponse } from "next/server";

import { buildSupabaseSetupStatus } from "@/lib/supabase/setup-status";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildSupabaseSetupStatus());
}
