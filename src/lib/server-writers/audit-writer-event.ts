import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  GeneratedArtifactTable,
  ServerWriterErrorCode,
} from "@/lib/server-writers/writer-types";

export type AuditWriterEventInput = {
  supabase: SupabaseClient;
  userId: string;
  traceId: string;
  action: string;
  targetTable: GeneratedArtifactTable;
  targetId?: string | null;
  idempotencyKey: string;
  requestHash: string;
  gateDecision: "write_attempted" | "write_succeeded" | "write_failed" | "blocked";
  blockedCodes?: ServerWriterErrorCode[];
  writerVersion: string;
  version: string;
  errorCode?: ServerWriterErrorCode | null;
  metadata?: Record<string, unknown>;
};

export async function auditWriterEvent({
  supabase,
  userId,
  traceId,
  action,
  targetTable,
  targetId = null,
  idempotencyKey,
  requestHash,
  gateDecision,
  blockedCodes = [],
  writerVersion,
  version,
  errorCode = null,
  metadata = {},
}: AuditWriterEventInput) {
  const { error } = await supabase.from("audit_events").insert({
    user_id: userId,
    trace_id: traceId,
    version: "audit-event-v1",
    actor_type: "system_writer",
    action,
    target_table: targetTable,
    target_id: targetId,
    idempotency_key: idempotencyKey,
    request_hash: requestHash,
    gate_decision: gateDecision,
    blocked_codes: blockedCodes,
    error_code: errorCode,
    metadata: {
      ...metadata,
      artifact_version: version,
      writer_version: writerVersion,
    },
  });

  if (error) {
    return { ok: false as const, errorCode: "audit_write_failed" as const };
  }

  return { ok: true as const };
}
