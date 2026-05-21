import { NextResponse } from "next/server";

import {
  buildServiceRoleIsolationHarness,
  probeServiceRoleIsolation,
} from "@/lib/server-writers/service-role-isolation";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildServiceRoleIsolationHarness());
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(probeServiceRoleIsolation(body));
}
