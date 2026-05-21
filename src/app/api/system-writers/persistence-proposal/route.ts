import { NextResponse } from "next/server";

import {
  buildWriterPersistenceImplementationProposal,
  probeWriterPersistenceImplementationProposal,
} from "@/lib/server-writers/persistence-implementation-proposal";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistenceImplementationProposal());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(
    await probeWriterPersistenceImplementationProposal(body),
  );
}
