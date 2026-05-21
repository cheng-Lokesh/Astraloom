import { NextResponse } from "next/server";

import {
  buildWriterPersistenceOwnerSignoff,
  probeWriterPersistenceOwnerSignoff,
} from "@/lib/server-writers/persistence-owner-signoff";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistenceOwnerSignoff());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeWriterPersistenceOwnerSignoff(body));
}
