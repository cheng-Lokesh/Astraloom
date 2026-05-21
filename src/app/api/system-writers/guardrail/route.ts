import { NextResponse } from "next/server";

import { buildWriterExecutionGuardrail } from "@/lib/server-writers/guardrail";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildWriterExecutionGuardrail());
}
