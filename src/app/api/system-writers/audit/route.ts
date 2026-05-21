import { NextResponse } from "next/server";

import { buildWriterAuditModel } from "@/lib/server-writers/audit";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildWriterAuditModel());
}
