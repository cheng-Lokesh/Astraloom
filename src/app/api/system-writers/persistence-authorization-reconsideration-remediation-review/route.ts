import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAuthorizationReconsiderationRemediationReview,
  probeWriterPersistenceAuthorizationReconsiderationRemediationReview,
} from "@/lib/server-writers/persistence-authorization-reconsideration-remediation-review";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await buildWriterPersistenceAuthorizationReconsiderationRemediationReview(),
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
    await probeWriterPersistenceAuthorizationReconsiderationRemediationReview(
      body,
    ),
  );
}
