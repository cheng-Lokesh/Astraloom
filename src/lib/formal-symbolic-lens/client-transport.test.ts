import { describe, expect, it, vi } from "vitest";
import { canWriteSymbolicLens, readSymbolicLensAccount, writeSymbolicLensAccount } from "./client-transport";
import { buildSymbolicFrame } from "./frame";
import type { SymbolicLensProjection } from "./projection";
const lens = (revision: number): SymbolicLensProjection => ({ revision, status: "active", sourceVersion: 1, snapshot: buildSymbolicFrame({ birthDate: "1991-06-15", birthTime: null }, 1, "2026-10-06T00:00:00Z"), consent: { storage: true, calculation: true, futureAttachment: false }, futureAttachmentStatus: "connected" });
describe("symbolic client ambiguous-write recovery", () => {
  it("retains read compatibility with the old not-connected DTO", async () => {
    const recovered = await readSymbolicLensAccount(vi.fn(async () => Response.json({ ok: true, lens: { ...lens(1), futureAttachmentStatus: "not_connected" } })));
    expect(recovered.account.ready).toBe(true);
  });
  it("blocks writes and clears old projection after lost response, then GET restores only real saved version", async () => {
    let stored = lens(1); let writes = 0;
    const transport = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "PUT") { writes++; stored = lens(2); throw new Error("lost_response"); }
      return Response.json({ ok: true, lens: stored });
    });
    const result = await writeSymbolicLensAccount("refresh_period", { operation: "refresh_period", revision: 1, idempotency_key: "test-key" }, transport);
    expect(result.account.lens).toBeNull(); expect(result.account.ready).toBe(false);
    expect(canWriteSymbolicLens(result.account, false)).toBe(false);
    expect(result.error).toBe("unconfirmed"); expect(writes).toBe(1);
    const recovered = await readSymbolicLensAccount(transport);
    expect(recovered.account.lens?.revision).toBe(2); expect(recovered.account.ready).toBe(true);
    expect(canWriteSymbolicLens(recovered.account, false)).toBe(true);
    expect(writes).toBe(1); expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[1][1]?.method).toBeUndefined();
  });
  it("never revives old authorization when readonly recovery finds withdrawal", async () => {
    const withdrawn = { ...lens(2), status: "withdrawn", snapshot: null, consent: { storage: false, calculation: false, futureAttachment: false } };
    const recovered = await readSymbolicLensAccount(vi.fn(async () => Response.json({ ok: true, lens: withdrawn })));
    expect(recovered.account.lens?.status).toBe("withdrawn");
    expect(recovered.account.lens?.snapshot).toBeNull();
    expect(recovered.account.lens?.consent.calculation).toBe(false);
  });
});
