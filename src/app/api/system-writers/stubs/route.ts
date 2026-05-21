import { NextResponse } from "next/server";

import {
  buildServerWriterStubStatus,
  probeServerWriterStub,
} from "@/lib/server-writers/server-writer-stubs";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildServerWriterStubStatus());
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(probeServerWriterStub(body));
}
