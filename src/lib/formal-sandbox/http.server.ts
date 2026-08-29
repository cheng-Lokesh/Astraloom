import { NextResponse } from "next/server";

export function sandboxTrace(operation: string) {
  return `sandbox_${operation}_${crypto.randomUUID()}`;
}

export function sandboxFailure(status: number, errorCode: string, traceId: string) {
  return NextResponse.json({ ok:false,error_code:errorCode,trace_id:traceId },{ status });
}

export function sandboxErrorStatus(errorCode: string) {
  if (errorCode === "unauthenticated") return 401;
  if (errorCode === "safety_blocked") return 403;
  if (["graph_not_found","run_not_found"].includes(errorCode)) return 404;
  if (["idempotency_key_content_conflict","incomplete_object_chain"].includes(errorCode)) return 409;
  if (["invalid_request","invalid_run_input","invalid_run_bundle","invalid_feedback","claim_evidence_invalid","report_claim_invalid"].includes(errorCode)) return 422;
  return 500;
}
