import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAuthorizationRemediationReviewNoGo,
  probeWriterPersistenceAuthorizationRemediationReviewNoGo,
} from "@/lib/server-writers/persistence-authorization-remediation-review-no-go";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await buildWriterPersistenceAuthorizationRemediationReviewNoGo(),
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
    await probeWriterPersistenceAuthorizationRemediationReviewNoGo(body),
  );
}
