import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

import { auditWriterEvent } from "./audit-writer-event";
import {
  checkWriterIdempotency,
  createWriterRequestHash,
} from "./idempotency";
import {
  generatedArtifactTables,
  type GeneratedArtifactPayload,
  type GeneratedArtifactTable,
  type ServerWriterErrorCode,
  type ServerWriterResult,
  type WriteGeneratedArtifactInput,
} from "./writer-types";

const writerAction = "writer.write_generated_artifact";

const parentOwnershipTables: Record<
  string,
  { table: string; column: string }
> = {
  seed_context_id: { table: "seed_contexts", column: "id" },
  key_person_id: { table: "key_people", column: "id" },
  from_agent_id: { table: "agent_profiles", column: "id" },
  to_agent_id: { table: "agent_profiles", column: "id" },
  simulation_id: { table: "simulations", column: "id" },
  simulation_tick_id: { table: "simulation_ticks", column: "id" },
  model_call_log_id: { table: "model_call_logs", column: "id" },
};

export async function writeGeneratedArtifact(
  input: WriteGeneratedArtifactInput,
): Promise<ServerWriterResult> {
  const client = createSupabaseServiceRoleClient();

  if (!client.ok) {
    return {
      ok: false,
      errorCode: client.errorCode,
      traceId: input.traceId,
      idempotencyKey: input.idempotencyKey,
    };
  }

  const payload = buildPayload(input);
  const validationError = validatePayload(input.table, payload);

  if (validationError) {
    return blockWithAudit({
      supabase: client.supabase,
      input,
      requestHash: createWriterRequestHash(payload),
      errorCode: validationError,
    });
  }

  const requestHash = createWriterRequestHash(payload);
  const idempotency = await checkWriterIdempotency({
    supabase: client.supabase,
    userId: input.userId,
    targetTable: input.table,
    idempotencyKey: input.idempotencyKey,
    requestHash,
  });

  if (!idempotency.ok) {
    return blockWithAudit({
      supabase: client.supabase,
      input,
      requestHash,
      errorCode: idempotency.errorCode,
    });
  }

  if (idempotency.replay) {
    return {
      ok: true,
      table: input.table,
      id: idempotency.targetId,
      traceId: input.traceId,
      idempotencyKey: input.idempotencyKey,
      replayed: true,
    };
  }

  const ownership = await checkOwnership({
    supabase: client.supabase,
    userId: input.userId,
    payload,
  });

  if (!ownership.ok) {
    return blockWithAudit({
      supabase: client.supabase,
      input,
      requestHash,
      errorCode: ownership.errorCode,
    });
  }

  await auditWriterEvent({
    supabase: client.supabase,
    userId: input.userId,
    traceId: input.traceId,
    action: writerAction,
    targetTable: input.table,
    idempotencyKey: input.idempotencyKey,
    requestHash,
    gateDecision: "write_attempted",
    writerVersion: input.writerVersion,
    version: input.version,
  });

  const { data, error } = await client.supabase
    .from(input.table)
    .insert(payload)
    .select("id")
    .single();

  if (error || !data || typeof data.id !== "string") {
    return blockWithAudit({
      supabase: client.supabase,
      input,
      requestHash,
      errorCode: "artifact_write_failed",
    });
  }

  const audit = await auditWriterEvent({
    supabase: client.supabase,
    userId: input.userId,
    traceId: input.traceId,
    action: writerAction,
    targetTable: input.table,
    targetId: data.id,
    idempotencyKey: input.idempotencyKey,
    requestHash,
    gateDecision: "write_succeeded",
    writerVersion: input.writerVersion,
    version: input.version,
  });

  if (!audit.ok) {
    return {
      ok: false,
      errorCode: audit.errorCode,
      traceId: input.traceId,
      idempotencyKey: input.idempotencyKey,
    };
  }

  return {
    ok: true,
    table: input.table,
    id: data.id,
    traceId: input.traceId,
    idempotencyKey: input.idempotencyKey,
    replayed: false,
  };
}

function buildPayload(input: WriteGeneratedArtifactInput): GeneratedArtifactPayload {
  return {
    ...input.artifact,
    user_id: input.userId,
    trace_id: input.traceId,
    version: input.version,
    writer_version: input.writerVersion,
    idempotency_key: input.idempotencyKey,
  };
}

function validatePayload(
  table: GeneratedArtifactTable,
  payload: GeneratedArtifactPayload,
): ServerWriterErrorCode | null {
  if (!generatedArtifactTables.includes(table)) return "invalid_writer_payload";

  const required = [
    payload.user_id,
    payload.trace_id,
    payload.version,
    payload.writer_version,
    payload.idempotency_key,
  ];

  if (required.some((value) => typeof value !== "string" || !value.trim())) {
    return "invalid_writer_payload";
  }

  return null;
}

async function checkOwnership({
  supabase,
  userId,
  payload,
}: {
  supabase: SupabaseClient;
  userId: string;
  payload: GeneratedArtifactPayload;
}): Promise<{ ok: true } | { ok: false; errorCode: ServerWriterErrorCode }> {
  if (payload.user_id !== userId) {
    return { ok: false, errorCode: "ownership_check_failed" };
  }

  for (const [field, ref] of Object.entries(parentOwnershipTables)) {
    const value = payload[field];
    if (typeof value !== "string" || !value) continue;

    const { data, error } = await supabase
      .from(ref.table)
      .select("user_id")
      .eq(ref.column, value)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, errorCode: "ownership_check_failed" };
    }
  }

  return { ok: true };
}

async function blockWithAudit({
  supabase,
  input,
  requestHash,
  errorCode,
}: {
  supabase: SupabaseClient;
  input: WriteGeneratedArtifactInput;
  requestHash: string;
  errorCode: ServerWriterErrorCode;
}): Promise<ServerWriterResult> {
  await auditWriterEvent({
    supabase,
    userId: input.userId,
    traceId: input.traceId,
    action: writerAction,
    targetTable: input.table,
    idempotencyKey: input.idempotencyKey,
    requestHash,
    gateDecision: "blocked",
    blockedCodes: [errorCode],
    writerVersion: input.writerVersion,
    version: input.version,
    errorCode,
  });

  return {
    ok: false,
    errorCode,
    traceId: input.traceId,
    idempotencyKey: input.idempotencyKey,
  };
}
