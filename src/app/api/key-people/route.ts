import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const querySchema = z.object({ seed_id: z.string().uuid() }).strict();

function traceId() {
  return `key_people_${crypto.randomUUID()}`;
}

function failure(status: number, errorCode: string, traceIdValue: string) {
  return NextResponse.json(
    { ok: false, error_code: errorCode, trace_id: traceIdValue },
    { status },
  );
}

function safePerson(person: Record<string, unknown>) {
  return {
    id: person.id,
    display_name: person.display_name,
    relationship_to_user: person.relationship_to_user,
    role_type: person.role_type,
    confidence: person.confidence,
    known_evidence: person.known_evidence,
    missing_fields: person.missing_fields,
    status: person.status,
    merged_into_id: person.merged_into_id,
    evidence_refs: person.evidence_refs,
    version: person.version,
  };
}

export async function GET(request: Request) {
  const traceIdValue = traceId();
  const supabase = await createSupabaseServerClient();

  if (!supabase) return failure(500, "persistence_failed", traceIdValue);

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return failure(401, "unauthenticated", traceIdValue);

  const query = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!query.success) return failure(400, "invalid_request", traceIdValue);

  const { data: seed, error: seedError } = await supabase
    .from("seed_contexts")
    .select("id")
    .eq("id", query.data.seed_id)
    .eq("status", "submitted")
    .maybeSingle();

  if (seedError) return failure(500, "persistence_failed", traceIdValue);
  if (!seed) return failure(404, "seed_not_found", traceIdValue);

  const { data, error } = await supabase
    .from("key_people")
    .select("id, display_name, relationship_to_user, role_type, confidence, known_evidence, missing_fields, status, merged_into_id, evidence_refs, version")
    .eq("seed_context_id", seed.id)
    .order("created_at", { ascending: true });

  if (error) return failure(500, "persistence_failed", traceIdValue);

  return NextResponse.json({
    ok: true,
    error_code: null,
    trace_id: traceIdValue,
    people: (data ?? []).map((person) => safePerson(person as Record<string, unknown>)),
  });
}
