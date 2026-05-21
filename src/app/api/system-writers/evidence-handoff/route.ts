import { NextResponse } from "next/server";

import {
  buildWriterEvidenceHandoff,
  probeWriterEvidenceHandoff,
} from "@/lib/server-writers/evidence-handoff";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildWriterEvidenceHandoff());
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(probeWriterEvidenceHandoff(body));
}
