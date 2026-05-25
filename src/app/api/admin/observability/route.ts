import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyAdminRequest } from "@/lib/admin/admin-auth";
import { getObservabilitySnapshot } from "@/lib/observability/audit-event";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = verifyAdminRequest(request);

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        error_code: auth.errorCode,
      },
      { status: auth.status },
    );
  }

  const snapshot = getObservabilitySnapshot();

  return NextResponse.json({
    ok: true,
    snapshot,
    service_key_exposed: false,
    admin_mutation_allowed: false,
  });
}
