import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo,
  probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo,
} from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision-archive-no-go";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo(),
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
    await probeWriterPersistenceAuthorizationReconsiderationFinalDecisionArchiveNoGo(
      body,
    ),
  );
}
