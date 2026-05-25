import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { saveSupportTicket } from "@/lib/support/support-repository";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  ticketType: z.enum([
    "generation_failure",
    "refund_request",
    "safety_appeal",
    "privacy_delete_request",
    "billing_question",
    "general_support",
  ]),
  subject: z.string().min(3).max(160),
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
        trace_id: "support_create_invalid_request",
        error_code: "invalid_support_ticket_input",
      },
      { status: 400 },
    );
  }

  const result = saveSupportTicket(parsed.data);

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
      ...result.data,
      message: undefined,
      sensitiveInputHidden: true,
    },
  });
}
