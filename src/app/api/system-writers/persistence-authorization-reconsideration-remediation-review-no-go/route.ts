import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAuthorizationReconsiderationRemediationReviewNoGo,
  probeWriterPersistenceAuthorizationReconsiderationRemediationReviewNoGo,
} from "@/lib/server-writers/persistence-authorization-reconsideration-remediation-review-no-go";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await buildWriterPersistenceAuthorizationReconsiderationRemediationReviewNoGo(),
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
    await probeWriterPersistenceAuthorizationReconsiderationRemediationReviewNoGo(
      body,
    ),
  );
}
