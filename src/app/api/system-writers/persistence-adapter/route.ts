import { NextResponse } from "next/server";

import {
  buildWriterPersistenceAdapterDesign,
  probeWriterPersistenceAdapterDesign,
} from "@/lib/server-writers/persistence-adapter-design";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await buildWriterPersistenceAdapterDesign());
}

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(await probeWriterPersistenceAdapterDesign(body));
}
