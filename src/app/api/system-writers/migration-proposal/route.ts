import { NextResponse } from "next/server";

import {
  buildWriterMigrationProposal,
  probeWriterMigrationProposal,
} from "@/lib/server-writers/migration-proposal";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildWriterMigrationProposal());
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(probeWriterMigrationProposal(body));
}
