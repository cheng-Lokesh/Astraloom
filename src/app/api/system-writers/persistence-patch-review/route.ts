import { NextResponse } from "next/server";

import {
  buildWriterPersistencePatchReview,
  probeWriterPersistencePatchReview,
} from "@/lib/server-writers/persistence-patch-review";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistencePatchReview());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeWriterPersistencePatchReview(body));
}
