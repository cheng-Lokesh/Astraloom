import { NextResponse } from "next/server";

import {
  buildWriterSchemaVerification,
  probeWriterSchemaVerification,
} from "@/lib/server-writers/schema-verification";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterSchemaVerification());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeWriterSchemaVerification(body));
}
