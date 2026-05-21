import { NextResponse } from "next/server";

import {
  buildSystemWriterDryRunCatalog,
  runSystemWriterDryRun,
} from "@/lib/server-writers/dry-run";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildSystemWriterDryRunCatalog());
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    const result = runSystemWriterDryRun(null);

    return NextResponse.json(result, { status: 400 });
  }

  const result = runSystemWriterDryRun(body);
  const status = result.status === "invalid_request" ? 400 : 200;

  return NextResponse.json(result, { status });
}
