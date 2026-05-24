import { NextResponse } from "next/server";

import {
  buildStage73RemediationReview,
  probeStage73RemediationReview,
} from "@/lib/server-writers/stage73-remediation-review";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildStage73RemediationReview());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeStage73RemediationReview(body));
}
