import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { verifyAdminRequest } from "@/lib/admin/admin-auth";
import {
  listAdminSupportTickets,
  updateSupportTicketStatus,
} from "@/lib/support/support-repository";

export const dynamic = "force-dynamic";

const statusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(["open", "triaged", "in_review", "resolved", "closed"]),
});

function adminErrorResponse(auth: ReturnType<typeof verifyAdminRequest>) {
  return NextResponse.json(
    {
      ok: false,
      trace_id: "admin_auth_failed",
      error_code: auth.errorCode,
    },
    { status: auth.status },
  );
}

export async function GET(request: NextRequest) {
  const auth = verifyAdminRequest(request);
  if (!auth.ok) return adminErrorResponse(auth);

  const result = listAdminSupportTickets();

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: result.traceId,
        error_code: result.errorCode,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    trace_id: result.traceId,
    tickets: result.data,
    claims_mutable: false,
    event_logs_mutable: false,
    sensitive_input_hidden: true,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = verifyAdminRequest(request);
  if (!auth.ok) return adminErrorResponse(auth);

  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: "admin_support_invalid_request",
        error_code: "invalid_admin_support_status_input",
      },
      { status: 400 },
    );
  }

  const result = updateSupportTicketStatus(
    parsed.data.ticketId,
    parsed.data.status,
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: result.traceId,
        error_code: result.errorCode,
      },
      { status: result.errorCode === "support_ticket_not_found" ? 404 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    trace_id: result.traceId,
    ticket: result.data,
    claims_mutable: false,
    event_logs_mutable: false,
  });
}
