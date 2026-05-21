import { NextResponse } from "next/server";

import {
  buildWriterPersistenceExternalApprovalArchive,
  probeWriterPersistenceExternalApprovalArchive,
} from "@/lib/server-writers/persistence-external-approval-archive";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await buildWriterPersistenceExternalApprovalArchive(),
  );
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(
    await probeWriterPersistenceExternalApprovalArchive(body),
  );
}
