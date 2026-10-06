import { NextResponse } from "next/server";
import { z } from "zod";
import { sandboxFailure, sandboxTrace } from "@/lib/formal-sandbox/http.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const overallBody = z.object({
  rating: z.enum(["useful", "mixed", "off"]),
  comment: z.string().trim().max(2000).default(""),
  idempotency_key: z.string().uuid(),
}).strict();

const targetedBody = z.object({
  target_type: z.enum(["claim", "agent", "relation_edge"]),
  target_key: z.string().regex(/^(claim|person|relation)-[1-9]\d*$/),
  rating: z.enum(["accurate", "partly_right", "off", "unclear", "not_happened_yet"]),
  comment: z.string().trim().max(2000).default(""),
  idempotency_key: z.string().uuid(),
}).strict().superRefine((value, context) => {
  const requiredPrefix = value.target_type === "claim" ? "claim" : value.target_type === "agent" ? "person" : "relation";
  if (!value.target_key.startsWith(`${requiredPrefix}-`)) context.addIssue({ code: "custom", path: ["target_key"], message: "Target key does not match target type." });
  if (value.target_type !== "claim" && value.rating === "not_happened_yet") context.addIssue({ code: "custom", path: ["rating"], message: "This rating is only valid for Claims." });
});

const body = z.union([overallBody, targetedBody]);

export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const trace = sandboxTrace("feedback");
  try {
    const id = (await params).runId;
    if (!z.string().uuid().safeParse(id).success) return sandboxFailure(422, "invalid_request", trace);
    const client = await createSupabaseServerClient();
    if (!client) return sandboxFailure(500, "persistence_failed", trace);
    const { data: auth } = await client.auth.getUser();
    if (!auth.user?.id) return sandboxFailure(401, "unauthenticated", trace);
    if (request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") return sandboxFailure(422, "invalid_request", trace);
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return sandboxFailure(422, "invalid_request", trace);

    const result = "target_type" in parsed.data
      ? await client.rpc("append_account_sandbox_feedback_m2", {
        p_run_id: id,
        p_target_type: parsed.data.target_type,
        p_target_key: parsed.data.target_key,
        p_rating: parsed.data.rating,
        p_comment: parsed.data.comment,
        p_idempotency_key: parsed.data.idempotency_key,
      })
      : await client.rpc("append_account_sandbox_feedback_m1", {
        p_run_id: id,
        p_rating: parsed.data.rating,
        p_comment: parsed.data.comment,
        p_idempotency_key: parsed.data.idempotency_key,
      });

    const { data, error } = result;
    if (error) {
      const code = ["run_not_found", "invalid_feedback", "idempotency_key_content_conflict"].includes(error.message) ? error.message : "persistence_failed";
      const status = code === "run_not_found" ? 404 : code === "persistence_failed" ? 500 : 409;
      return sandboxFailure(status, code, trace);
    }
    if (!Array.isArray(data) || data.length !== 1 || typeof data[0]?.idempotent !== "boolean" || !data[0]?.feedback) return sandboxFailure(500, "persistence_failed", trace);

    const safeFeedback = "target_type" in parsed.data
      ? { target_type: parsed.data.target_type, target_key: parsed.data.target_key, rating: parsed.data.rating }
      : { target_type: "overall", rating: parsed.data.rating };
    return NextResponse.json({ ok: true, error_code: null, trace_id: trace, idempotent: data[0].idempotent, feedback: safeFeedback }, { status: data[0].idempotent ? 200 : 201, headers: { "cache-control": "no-store" } });
  } catch {
    return sandboxFailure(500, "persistence_failed", trace);
  }
}
