import { NextResponse } from "next/server";

import { buildWriterRolloutChecklist } from "@/lib/server-writers/rollout";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildWriterRolloutChecklist());
}
