import { NextResponse } from "next/server";

import {
  buildWriterPersistenceFixtureHarness,
  probeWriterPersistenceFixtureHarness,
} from "@/lib/server-writers/persistence-fixtures";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistenceFixtureHarness());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeWriterPersistenceFixtureHarness(body));
}
