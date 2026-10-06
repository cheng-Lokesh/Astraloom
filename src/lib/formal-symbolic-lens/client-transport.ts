import { z } from "zod";
import { symbolicFrameSchema } from "./frame";
import type { SymbolicLensProjection } from "./projection";
export type SymbolicAccountState = { ready: boolean; lens: SymbolicLensProjection | null };
type Transport = (url: string, init?: RequestInit) => Promise<Response>;
const lensSchema = z.object({ revision: z.number().int().nonnegative(), status: z.enum(["not_configured", "active", "stale", "withdrawn"]), sourceVersion: z.number().int().positive().nullable(), snapshot: symbolicFrameSchema.nullable(), consent: z.object({ storage: z.boolean(), calculation: z.boolean(), futureAttachment: z.literal(false) }).strict(), futureAttachmentStatus: z.literal("not_connected") }).strict().superRefine((lens, ctx) => {
  const active = lens.status === "active" || lens.status === "stale";
  if (active && (!lens.snapshot || !lens.consent.storage || !lens.consent.calculation || lens.snapshot.sourceVersion !== lens.sourceVersion) || !active && lens.snapshot !== null) ctx.addIssue({ code: "custom", message: "invalid_lens_state" });
});
const safeErrors = new Set(["unauthenticated", "symbolic_revision_conflict", "symbolic_idempotency_conflict", "symbolic_consent_required", "invalid_request", "persistence_unavailable", "persistence_failed"]);
const unavailable: SymbolicAccountState = { ready: false, lens: null };
export function canWriteSymbolicLens(account: SymbolicAccountState, pending: boolean) { return account.ready && account.lens !== null && !pending; }
async function exchange(url: string, init: RequestInit, transport: Transport) {
  try {
    const response = await transport(url, init);
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.ok !== true) return { account: unavailable, error: safeErrors.has(body?.error_code) ? body.error_code as string : "unconfirmed" };
    const parsed = lensSchema.safeParse(body.lens);
    if (!parsed.success) return { account: unavailable, error: "unconfirmed" };
    return { account: { ready: true, lens: parsed.data } as SymbolicAccountState, error: null };
  } catch { return { account: unavailable, error: "unconfirmed" }; }
}
export function readSymbolicLensAccount(transport: Transport = fetch) { return exchange("/api/symbolic-lens", { cache: "no-store" }, transport); }
/** Exactly one attempt. A failure has unknown persistence outcome; only a GET may restore write readiness. */
export function writeSymbolicLensAccount(operation: "replace_source" | "refresh_period" | "withdraw", body: unknown, transport: Transport = fetch) {
  return exchange(operation === "withdraw" ? "/api/symbolic-lens/withdraw" : "/api/symbolic-lens", { method: operation === "withdraw" ? "POST" : "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }, transport);
}
