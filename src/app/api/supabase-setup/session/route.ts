import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error_code: "supabase_not_configured",
      },
      { status: 503 },
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      {
        ok: false,
        error_code: "auth_session_missing",
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    user_id: user.id,
  });
}
