import { NextResponse } from "next/server";

import { checkSupabaseRemoteSchema } from "@/lib/supabase/remote-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await checkSupabaseRemoteSchema());
}
