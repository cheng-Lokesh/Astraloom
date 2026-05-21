import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAuthorizationNoGo,
  probeWriterPersistenceAuthorizationNoGo,
} from "@/lib/server-writers/persistence-authorization-no-go";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistenceAuthorizationNoGo());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeWriterPersistenceAuthorizationNoGo(body));
}
