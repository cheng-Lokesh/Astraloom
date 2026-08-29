import { z } from "zod";

const persistenceInput = z.object({
  userId: z.string().uuid(),
  graphSnapshotId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  horizonDays: z.union([z.literal(30), z.literal(90)]),
  bundle: z.record(z.string(), z.unknown()),
}).strict();

const persistedRow = z.object({
  idempotent: z.boolean(),
  run: z.object({
    id: z.string().uuid(),
    status: z.literal("completed"),
    seed_context_id: z.string().uuid().optional(),
    graph_snapshot_id: z.string().uuid(),
    time_horizon: z.enum(["30_days", "90_days"]),
    completed_at: z.string().nullable().optional(),
  }).passthrough(),
}).strict();

const stableErrors = new Set([
  "unauthenticated",
  "invalid_run_input",
  "invalid_run_bundle",
  "graph_not_found",
  "seed_not_found",
  "safety_blocked",
  "idempotency_key_content_conflict",
  "claim_evidence_invalid",
  "report_claim_invalid",
]);

type RpcClient = {
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
};

export async function persistFormalSandboxRun(client: RpcClient, rawInput: unknown) {
  const parsed = persistenceInput.safeParse(rawInput);
  if (!parsed.success) return { ok: false as const, errorCode: "invalid_run_input" as const };
  const input = parsed.data;
  try {
    const { data, error } = await client.rpc("persist_account_sandbox_run_m1", {
      p_user_id: input.userId,
      p_graph_snapshot_id: input.graphSnapshotId,
      p_idempotency_key: input.idempotencyKey,
      p_horizon_days: input.horizonDays,
      p_bundle: input.bundle,
    });
    if (error) {
      const message = error.message ?? "";
      return { ok: false as const, errorCode: stableErrors.has(message) ? message : "persistence_failed" };
    }
    const row = z.array(persistedRow).length(1).safeParse(data);
    if (!row.success) return { ok: false as const, errorCode: "persistence_failed" as const };
    return { ok: true as const, idempotent: row.data[0].idempotent, run: row.data[0].run };
  } catch {
    return { ok: false as const, errorCode: "persistence_failed" as const };
  }
}
