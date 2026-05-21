import { NextResponse } from "next/server";

import {
  buildWriterPersistenceReleaseNoGo,
  probeWriterPersistenceReleaseNoGo,
} from "@/lib/server-writers/persistence-release-no-go";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistenceReleaseNoGo());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeWriterPersistenceReleaseNoGo(body));
}
