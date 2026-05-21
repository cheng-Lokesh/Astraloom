import { NextResponse } from "next/server";

import { readSupabaseMigration } from "@/lib/supabase/migration-file";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(readSupabaseMigration());
}
