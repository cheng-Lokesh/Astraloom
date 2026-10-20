import { z } from "zod";
import { lifeClimateB3PublicRunSchema, lifeClimateB3RequestSchema, lifeClimateB3SourceViewSchema, lifeClimateB3SymbolicSourceSchema } from "@/lib/life-climate/b3/contracts";
import { canonicalLifeClimateB3Json } from "@/lib/life-climate/b3/context";

export const sourceSchema = z.object({ view: lifeClimateB3SourceViewSchema, sourceContext: z.string().regex(/^[a-f0-9]{64}$/), symbolic: lifeClimateB3SymbolicSourceSchema.nullable() }).strict();
export const bodySchema = z.object({ idempotency_key: z.string().uuid(), request: lifeClimateB3RequestSchema }).strict();
export const runSchema = z.object({ id: z.string().uuid(), created_at: z.string().datetime({ offset: true }), profile_revision: z.number().int().nonnegative(), result: lifeClimateB3PublicRunSchema }).strict();
export const intentSchema = z.object({ id: z.string().uuid(), created_at: z.string().datetime({ offset: true }), status: z.enum(["pending", "completed", "rejected"]), originalBody: bodySchema, receipt: z.discriminatedUnion("status", [z.object({ status: z.literal("completed"), run: runSchema }).strict(), z.object({ status: z.literal("rejected"), error_code: z.string().min(1) }).strict()]).nullable() }).strict().superRefine((value, context) => {
  if (value.status === "pending" ? value.receipt !== null : value.receipt?.status !== value.status) context.addIssue({ code: "custom", message: "invalid_intent_receipt" });
  if (value.receipt?.status === "completed" && canonicalLifeClimateB3Json(value.receipt.run.result.requestSnapshot) !== canonicalLifeClimateB3Json(value.originalBody.request)) context.addIssue({ code: "custom", message: "receipt_request_mismatch" });
});
export type B3Source = z.infer<typeof sourceSchema>;
export type B3Body = z.infer<typeof bodySchema>;
export type B3Record = z.infer<typeof runSchema>;
export type B3Intent = z.infer<typeof intentSchema>;
export const completedEnvelopeSchema = z.object({ ok: z.literal(true), error_code: z.null(), trace_id: z.string().min(1), idempotent: z.boolean(), run: runSchema }).strict();
export async function readB3(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.ok !== true) throw new Error(response.status === 401 ? "请登录后重新读取；原请求仍保留。" : "暂时无法读取账户记录，请重试。不要重复建立处境。");
  return body;
}
export function matchesReceipt(record: B3Record, body: B3Body) {
  return record.profile_revision === body.request.profileRevision && canonicalLifeClimateB3Json(record.result.requestSnapshot) === canonicalLifeClimateB3Json(body.request);
}
