import { NextResponse } from "next/server";

import {
  buildWriterMigrationReviewChecklist,
  probeWriterMigrationReviewChecklist,
} from "@/lib/server-writers/migration-review";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildWriterMigrationReviewChecklist());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(probeWriterMigrationReviewChecklist(body));
}
