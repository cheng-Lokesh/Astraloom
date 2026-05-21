import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAuthorizationReconsiderationNoGo,
  probeWriterPersistenceAuthorizationReconsiderationNoGo,
} from "@/lib/server-writers/persistence-authorization-reconsideration-no-go";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await buildWriterPersistenceAuthorizationReconsiderationNoGo(),
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
    await probeWriterPersistenceAuthorizationReconsiderationNoGo(body),
  );
}
