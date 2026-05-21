import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAuthorizationRemediationReview,
  probeWriterPersistenceAuthorizationRemediationReview,
} from "@/lib/server-writers/persistence-authorization-remediation-review";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await buildWriterPersistenceAuthorizationRemediationReview(),
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
    await probeWriterPersistenceAuthorizationRemediationReview(body),
  );
}
