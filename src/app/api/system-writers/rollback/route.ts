import { NextResponse } from "next/server";

import { buildWriterRollbackModel } from "@/lib/server-writers/rollback";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildWriterRollbackModel());
}
