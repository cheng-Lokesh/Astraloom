import { describe, expect, it, vi } from "vitest";

import { persistFormalSandboxRun } from "./repository.server";

const input = {
  userId: "11111111-1111-4111-8111-111111111111",
  graphSnapshotId: "22222222-2222-4222-8222-222222222222",
  idempotencyKey: "33333333-3333-4333-8333-333333333333",
  horizonDays: 30 as const,
  bundle: { causalFingerprint: "0123456789abcdef01234567" },
};

describe("formal sandbox persistence repository", () => {
  it("uses the one controlled RPC and preserves explicit idempotency", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ idempotent: false, run: { id: "44444444-4444-4444-8444-444444444444", status: "completed", graph_snapshot_id: input.graphSnapshotId, time_horizon: "30_days" } }],
      error: null,
    });
    await expect(persistFormalSandboxRun({ rpc }, input)).resolves.toEqual({
      ok: true,
      idempotent: false,
      run: expect.objectContaining({ id: "44444444-4444-4444-8444-444444444444", status: "completed" }),
    });
    expect(rpc).toHaveBeenCalledWith("persist_account_sandbox_run_m1", {
      p_user_id: input.userId,
      p_graph_snapshot_id: input.graphSnapshotId,
      p_idempotency_key: input.idempotencyKey,
      p_horizon_days: 30,
      p_bundle: input.bundle,
    });
  });

  it("returns only stable error codes and rejects malformed database output", async () => {
    await expect(persistFormalSandboxRun({ rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "graph_not_found" } }) }, input)).resolves.toEqual({ ok: false, errorCode: "graph_not_found" });
    await expect(persistFormalSandboxRun({ rpc: vi.fn().mockResolvedValue({ data: [{ idempotent: "no", run: {} }], error: null }) }, input)).resolves.toEqual({ ok: false, errorCode: "persistence_failed" });
    await expect(persistFormalSandboxRun({ rpc: vi.fn().mockRejectedValue(new Error("secret database detail")) }, input)).resolves.toEqual({ ok: false, errorCode: "persistence_failed" });
  });
});
