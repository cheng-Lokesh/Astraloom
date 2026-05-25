import "server-only";

export const generatedArtifactTables = [
  "agent_profiles",
  "relation_edges",
  "simulations",
  "simulation_ticks",
  "event_logs",
  "claims",
  "reports",
  "model_call_logs",
  "generation_jobs",
] as const;

export type GeneratedArtifactTable = (typeof generatedArtifactTables)[number];

export type ServerWriterErrorCode =
  | "service_role_not_configured"
  | "invalid_writer_payload"
  | "ownership_check_failed"
  | "idempotency_conflict"
  | "idempotency_lookup_failed"
  | "artifact_write_failed"
  | "audit_write_failed";

export type ServerWriterResult =
  | {
      ok: true;
      table: GeneratedArtifactTable;
      id: string;
      traceId: string;
      idempotencyKey: string;
      replayed: boolean;
    }
  | {
      ok: false;
      errorCode: ServerWriterErrorCode;
      traceId: string;
      idempotencyKey?: string;
    };

export type GeneratedArtifactPayload = Record<string, unknown> & {
  user_id: string;
  trace_id: string;
  version: string;
  writer_version: string;
  idempotency_key: string;
};

export type WriteGeneratedArtifactInput = {
  table: GeneratedArtifactTable;
  userId: string;
  traceId: string;
  version: string;
  writerVersion: string;
  idempotencyKey: string;
  artifact: Record<string, unknown>;
  action?: string;
};
