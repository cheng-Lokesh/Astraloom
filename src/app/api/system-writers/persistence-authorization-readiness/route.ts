import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAuthorizationReadiness,
  probeWriterPersistenceAuthorizationReadiness,
} from "@/lib/server-writers/persistence-authorization-readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await buildWriterPersistenceAuthorizationReadiness(),
  );
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(
    await probeWriterPersistenceAuthorizationReadiness(body),
  );
}
