import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAuthorizationRemediation,
  probeWriterPersistenceAuthorizationRemediation,
} from "@/lib/server-writers/persistence-authorization-remediation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await buildWriterPersistenceAuthorizationRemediation(),
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
    await probeWriterPersistenceAuthorizationRemediation(body),
  );
}
