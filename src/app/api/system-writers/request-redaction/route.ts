import { NextResponse } from "next/server";

import {
  buildRequestRedactionFixtures,
  probeRequestRedaction,
} from "@/lib/server-writers/request-redaction";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildRequestRedactionFixtures());
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(probeRequestRedaction(body));
}
