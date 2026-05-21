import { NextResponse } from "next/server";

import {
  buildWriterPersistenceApprovalPacket,
  probeWriterPersistenceApprovalPacket,
} from "@/lib/server-writers/persistence-approval-packet";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistenceApprovalPacket());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeWriterPersistenceApprovalPacket(body));
}
