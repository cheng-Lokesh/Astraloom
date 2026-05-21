import { NextResponse } from "next/server";

import {
  buildWriterPersistenceBranchPreflight,
  probeWriterPersistenceBranchPreflight,
} from "@/lib/server-writers/persistence-branch-preflight";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistenceBranchPreflight());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeWriterPersistenceBranchPreflight(body));
}
