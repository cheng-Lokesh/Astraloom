import { NextResponse } from "next/server";

import {
  buildWriterPersistenceDiffContract,
  probeWriterPersistenceDiffContract,
} from "@/lib/server-writers/persistence-diff-contract";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistenceDiffContract());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeWriterPersistenceDiffContract(body));
}
