import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAuthorizationReconsiderationPreflight,
  probeWriterPersistenceAuthorizationReconsiderationPreflight,
} from "@/lib/server-writers/persistence-authorization-reconsideration-preflight";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await buildWriterPersistenceAuthorizationReconsiderationPreflight(),
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
    await probeWriterPersistenceAuthorizationReconsiderationPreflight(body),
  );
}
