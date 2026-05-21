import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAcceptanceTestMatrix,
  probeWriterPersistenceAcceptanceTestMatrix,
} from "@/lib/server-writers/persistence-acceptance-tests";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistenceAcceptanceTestMatrix());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(
    await probeWriterPersistenceAcceptanceTestMatrix(body),
  );
}
