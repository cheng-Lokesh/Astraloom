import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createPrivacyDeleteRequest } from "@/lib/support/support-repository";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  subject: z.string().min(3).max(160).default("Privacy delete request"),
  message: z.string().min(3).max(4000),
  relatedReportId: z.string().max(120).nullable().optional(),
  relatedSimulationId: z.string().max(120).nullable().optional(),
  userId: z.string().max(120).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: "privacy_delete_invalid_request",
        error_code: "invalid_delete_request_input",
      },
      { status: 400 },
    );
  }

  const result = createPrivacyDeleteRequest(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: result.traceId,
        error_code: result.errorCode,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    trace_id: result.traceId,
    ticket: {
      ...result.data.ticket,
      message: undefined,
      sensitiveInputHidden: true,
    },
    consent_event: result.data.consentEvent,
    deletion_started: false,
  });
}
