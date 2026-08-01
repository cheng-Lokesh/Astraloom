import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const personId = z.string().uuid();
const operationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("confirm"), person_id: personId }).strict(),
  z.object({ type: z.literal("rename"), person_id: personId, display_name: z.string().trim().min(1).max(120) }).strict(),
  z.object({ type: z.literal("delete"), person_id: personId }).strict(),
  z.object({ type: z.literal("merge"), source_person_id: personId, target_person_id: personId }).strict(),
  z.object({
    type: z.literal("supplement"),
    display_name: z.string().trim().min(1).max(120),
    relationship_to_user: z.string().trim().min(1).max(80),
    role_type: z.string().trim().min(1).max(80),
    note: z.string().trim().min(1).max(1000).optional(),
  }).strict(),
]);

const requestSchema = z.object({
  selector: z.object({ seed_id: z.string().uuid() }).strict(),
  idempotency_key: z.string().uuid(),
  operations: z.array(operationSchema).min(1).max(25),
}).strict();

function traceId() {
  return `key_people_confirm_${crypto.randomUUID()}`;
}

function failure(status: number, errorCode: string, traceIdValue: string) {
  return NextResponse.json(
    { ok: false, error_code: errorCode, trace_id: traceIdValue },
    { status },
  );
}

export async function POST(request: Request) {
  const traceIdValue = traceId();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return failure(500, "persistence_failed", traceIdValue);

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return failure(401, "unauthenticated", traceIdValue);

  const input = requestSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return failure(400, "invalid_request", traceIdValue);

  const { data, error } = await supabase.rpc("mutate_key_people_phase3", {
    p_seed_context_id: input.data.selector.seed_id,
    p_idempotency_key: input.data.idempotency_key,
    p_operations: input.data.operations,
  });

  if (error) {
    if (error.message === "seed_not_found") return failure(404, "seed_not_found", traceIdValue);
    if (error.message === "idempotency_key_content_conflict") {
      return failure(409, "idempotency_key_content_conflict", traceIdValue);
    }
    if (error.message === "invalid_people_transition") {
      return failure(409, "invalid_people_transition", traceIdValue);
    }
    if (error.message === "key_people_invalid") return failure(400, "key_people_invalid", traceIdValue);
    return failure(500, "persistence_failed", traceIdValue);
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) return failure(500, "persistence_failed", traceIdValue);

  return NextResponse.json({
    ok: true,
    error_code: null,
    trace_id: traceIdValue,
    idempotent: result.idempotent,
    people: result.people ?? [],
  });
}
