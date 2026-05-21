import { NextResponse } from "next/server";

import { buildWriterIdempotencyModel } from "@/lib/server-writers/idempotency";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildWriterIdempotencyModel());
}
