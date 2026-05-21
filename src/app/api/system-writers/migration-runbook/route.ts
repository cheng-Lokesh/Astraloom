import { NextResponse } from "next/server";

import {
  buildWriterMigrationRunbook,
  probeWriterMigrationRunbook,
} from "@/lib/server-writers/migration-runbook";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildWriterMigrationRunbook());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(probeWriterMigrationRunbook(body));
}
