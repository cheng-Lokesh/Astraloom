import { NextResponse } from "next/server";

import {
  buildWriterPersistenceHumanGoNoGo,
  probeWriterPersistenceHumanGoNoGo,
} from "@/lib/server-writers/persistence-human-go-no-go";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistenceHumanGoNoGo());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeWriterPersistenceHumanGoNoGo(body));
}
