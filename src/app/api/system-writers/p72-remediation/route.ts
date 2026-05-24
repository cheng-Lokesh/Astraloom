import { NextResponse } from "next/server";

import {
  buildStage72Remediation,
  probeStage72Remediation,
} from "@/lib/server-writers/stage72-remediation";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildStage72Remediation());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeStage72Remediation(body));
}
