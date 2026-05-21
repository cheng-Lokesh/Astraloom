import { NextResponse } from "next/server";

import {
  buildDisabledServiceRoleAdapterStatus,
  probeDisabledServiceRoleAdapter,
} from "@/lib/server-writers/service-role-adapter";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildDisabledServiceRoleAdapterStatus());
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  return NextResponse.json(probeDisabledServiceRoleAdapter(body));
}
