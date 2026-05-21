import { NextResponse } from "next/server";

import {
  buildWriterPersistenceDryRunGate,
  probeWriterPersistenceDryRunGate,
} from "@/lib/server-writers/persistence-dry-run";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistenceDryRunGate());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeWriterPersistenceDryRunGate(body));
}
