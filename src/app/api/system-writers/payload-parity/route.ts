import { NextResponse } from "next/server";

import {
  buildWriterPayloadParity,
  probeWriterPayloadParity,
} from "@/lib/server-writers/payload-parity";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildWriterPayloadParity());
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(probeWriterPayloadParity(body));
}
