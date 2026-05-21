import { NextResponse } from "next/server";

import {
  buildWriterPersistenceNoGoPacket,
  probeWriterPersistenceNoGoPacket,
} from "@/lib/server-writers/persistence-no-go";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistenceNoGoPacket());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeWriterPersistenceNoGoPacket(body));
}
