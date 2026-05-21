import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAuthorizationReconsiderationRemediation,
  probeWriterPersistenceAuthorizationReconsiderationRemediation,
} from "@/lib/server-writers/persistence-authorization-reconsideration-remediation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await buildWriterPersistenceAuthorizationReconsiderationRemediation(),
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
    await probeWriterPersistenceAuthorizationReconsiderationRemediation(body),
  );
}
