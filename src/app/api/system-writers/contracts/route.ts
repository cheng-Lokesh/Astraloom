import { NextResponse } from "next/server";

import { buildSystemWriterContracts } from "@/lib/server-writers/contracts";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildSystemWriterContracts());
}
