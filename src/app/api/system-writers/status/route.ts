import { NextResponse } from "next/server";

import { buildServerWriterStatus } from "@/lib/server-writers/status";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildServerWriterStatus());
}
