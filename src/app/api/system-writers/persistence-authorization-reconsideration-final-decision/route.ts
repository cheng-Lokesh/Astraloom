import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAuthorizationReconsiderationFinalDecision,
  probeWriterPersistenceAuthorizationReconsiderationFinalDecision,
} from "@/lib/server-writers/persistence-authorization-reconsideration-final-decision";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await buildWriterPersistenceAuthorizationReconsiderationFinalDecision(),
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
    await probeWriterPersistenceAuthorizationReconsiderationFinalDecision(body),
  );
}
