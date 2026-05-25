import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { buildDisabledServiceRoleAdapterStatus } from "@/lib/server-writers/service-role-adapter";
import type { GeneratedArtifactTable } from "@/lib/server-writers/writer-types";
import type { ServiceRoleAdapterPlan } from "@/types/service-role-adapter";
import type {
  WriterIdempotencyContract,
  WriterIdempotencyField,
  WriterIdempotencyModelPayload,
  WriterIdempotencyScope,
} from "@/types/system-writer-idempotency";
import type { SystemWriterContractId } from "@/types/system-writer-contract";

const futureTableName = "writer_idempotency_keys" as const;

export type WriterIdempotencyCheckInput = {
  supabase: SupabaseClient;
  userId: string;
  targetTable: GeneratedArtifactTable;
  idempotencyKey: string;
  requestHash: string;
};

export type WriterIdempotencyCheckResult =
  | { ok: true; replay: false }
  | { ok: true; replay: true; targetId: string }
  | {
      ok: false;
      errorCode: "idempotency_conflict" | "idempotency_lookup_failed";
    };

export function createWriterRequestHash(payload: unknown) {
  return `sha256:${createHash("sha256")
    .update(stableStringify(payload))
    .digest("hex")}`;
}

export async function checkWriterIdempotency({
  supabase,
  userId,
  targetTable,
  idempotencyKey,
  requestHash,
}: WriterIdempotencyCheckInput): Promise<WriterIdempotencyCheckResult> {
  const { data, error } = await supabase
    .from("audit_events")
    .select("target_id, request_hash, gate_decision")
    .eq("user_id", userId)
    .eq("target_table", targetTable)
    .eq("idempotency_key", idempotencyKey)
    .eq("action", "writer.write_generated_artifact")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return { ok: false, errorCode: "idempotency_lookup_failed" };
  }

  const existing = data?.[0];

  if (!existing) {
    return { ok: true, replay: false };
  }

  if (existing.request_hash !== requestHash) {
    return { ok: false, errorCode: "idempotency_conflict" };
  }

  if (
    existing.gate_decision === "write_succeeded" &&
    typeof existing.target_id === "string" &&
    existing.target_id
  ) {
    return { ok: true, replay: true, targetId: existing.target_id };
  }

  return { ok: false, errorCode: "idempotency_conflict" };
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

const scopeByContract: Record<SystemWriterContractId, WriterIdempotencyScope> = {
  agent_profile_generation: "user_seed_context",
  relation_edge_generation: "user_seed_context",
  simulation_run_create: "user_seed_context",
  event_tick_append: "run_tick",
  claim_generation: "run_report",
  report_generation: "run_report",
  payment_entitlement_record: "stripe_event",
  consent_event_record: "consent_policy",
};

const keyTemplateByContract: Record<SystemWriterContractId, string> = {
  agent_profile_generation:
    "agent_profile_generation:{userIdHash}:{seedContextId}:{writerVersion}",
  relation_edge_generation:
    "relation_edge_generation:{userIdHash}:{seedContextId}:{edgeSetVersion}",
  simulation_run_create:
    "simulation_run_create:{userIdHash}:{seedContextId}:{track}:{timeWindow}",
  event_tick_append: "event_tick_append:{runId}:{tickIndex}:{executorVersion}",
  claim_generation: "claim_generation:{runId}:{claimSchemaVersion}",
  report_generation: "report_generation:{runId}:{reportTemplateVersion}",
  payment_entitlement_record: "payment_entitlement_record:{stripeEventId}",
  consent_event_record:
    "consent_event_record:{userIdHash}:{consentType}:{policyVersion}:{decision}",
};

const baseFields: WriterIdempotencyField[] = [
  {
    name: "idempotencyKey",
    required: true,
    detail:
      "Canonical logical operation key. Future implementation must compute it server-side from trusted inputs.",
  },
  {
    name: "contractId",
    required: true,
    detail: "System writer contract that owns the idempotency key.",
  },
  {
    name: "scope",
    required: true,
    detail:
      "Collision domain for the operation, such as seed context, run tick, Stripe event, or consent policy.",
  },
  {
    name: "requestHash",
    required: true,
    detail:
      "Hash of the canonical, redacted request. Conflicting hashes under the same key must be rejected.",
  },
  {
    name: "status",
    required: true,
    detail: "Future registry state: reserved, completed, failed, expired, or conflict_detected.",
  },
  {
    name: "lockedUntil",
    required: false,
    detail:
      "Short reservation lock for in-flight writes. Expired locks can be retried by a future server executor.",
  },
  {
    name: "resultRef",
    required: false,
    detail:
      "Reference to the existing successful writer result. Replays should return this instead of writing again.",
  },
  {
    name: "auditEventId",
    required: true,
    detail:
      "Audit event that records the reservation, conflict, success, failure, or rollback decision.",
  },
  {
    name: "createdAt",
    required: true,
    detail: "Server timestamp for reservation creation.",
  },
  {
    name: "updatedAt",
    required: true,
    detail: "Server timestamp for the latest registry state change.",
  },
  {
    name: "expiresAt",
    required: false,
    detail:
      "Optional expiry for non-financial/non-consent keys. Payment and consent keys require stricter retention.",
  },
];

function conflictBehaviorFor(contractId: SystemWriterContractId) {
  if (contractId === "payment_entitlement_record") {
    return "return_existing_result" as const;
  }

  if (contractId === "consent_event_record") {
    return "append_compensating_record" as const;
  }

  if (contractId === "event_tick_append") {
    return "reject_conflicting_request" as const;
  }

  return "return_existing_result" as const;
}

function ttlRuleFor(contractId: SystemWriterContractId) {
  if (contractId === "payment_entitlement_record") {
    return "Keep for the payment dispute/refund retention window; never expire solely for convenience.";
  }

  if (contractId === "consent_event_record") {
    return "Keep while the consent policy version remains legally relevant; revocations create new keys.";
  }

  if (contractId === "event_tick_append") {
    return "Keep at least for the life of the run plus rollback/support window; tick keys prevent duplicated event history.";
  }

  return "Keep at least through report generation, rollback review, and support window; exact production TTL requires policy review.";
}

function replayRuleFor(contractId: SystemWriterContractId) {
  if (contractId === "event_tick_append") {
    return "Same key and same requestHash returns the existing event tick reference; same key with different requestHash is a conflict.";
  }

  if (contractId === "payment_entitlement_record") {
    return "Same Stripe event id returns the existing entitlement result and must not grant entitlement twice.";
  }

  if (contractId === "consent_event_record") {
    return "Same consent action and policy version returns the existing audit result; a revocation uses a new key.";
  }

  return "Same key and same requestHash returns the existing resultRef; same key with a different requestHash is rejected.";
}

function buildContract(plan: ServiceRoleAdapterPlan): WriterIdempotencyContract {
  return {
    contractId: plan.contractId,
    category:
      plan.contractId === "payment_entitlement_record"
        ? "payments"
        : plan.contractId === "consent_event_record"
          ? "compliance"
          : plan.contractId === "claim_generation" ||
              plan.contractId === "report_generation"
            ? "reporting"
            : plan.contractId === "simulation_run_create" ||
                plan.contractId === "event_tick_append"
              ? "simulation"
              : "agent_ecology",
    targetTables: plan.targetTables,
    operation: plan.intendedOperation,
    scope: scopeByContract[plan.contractId],
    keyTemplate: keyTemplateByContract[plan.contractId],
    uniquenessRule:
      "Unique on contractId + idempotencyKey. A matching requestHash may replay; a different requestHash is conflict_detected.",
    reservationRule:
      "Future implementation must reserve the key before a service-role write, inside a server-only transaction or equivalent atomic operation.",
    conflictBehavior: conflictBehaviorFor(plan.contractId),
    replayRule: replayRuleFor(plan.contractId),
    ttlRule: ttlRuleFor(plan.contractId),
    sampleRecord: {
      idempotencyKey: keyTemplateByContract[plan.contractId],
      contractId: plan.contractId,
      scope: scopeByContract[plan.contractId],
      operation: plan.intendedOperation,
      requestHash: "sha256:example_request_hash_only",
      status: "reserved",
      resultRef: null,
      auditEventId: `audit:${plan.contractId}:example`,
      wouldPersist: false,
    },
  };
}

export function buildWriterIdempotencyModel(): WriterIdempotencyModelPayload {
  const adapter = buildDisabledServiceRoleAdapterStatus();

  return {
    safeMode: true,
    readOnly: true,
    wouldReserveKeys: false,
    wouldWriteRegistryRows: false,
    migrationIncluded: false,
    futureTableName,
    globalRules: [
      "Current implementation defines contracts only; it does not create a migration or reserve keys.",
      "Idempotency keys must be generated or verified server-side from trusted context.",
      "A service-role write must never happen before the idempotency key is reserved.",
      "A replay with the same key and same requestHash returns the existing result reference.",
      "A replay with the same key and different requestHash is a conflict and must not write.",
      "Payment event keys and consent policy keys require stricter retention than ordinary generated artifact keys.",
      "Browser code must not reserve, mutate, or delete idempotency keys.",
    ],
    conflictRules: [
      "Same idempotencyKey + same requestHash: return existing resultRef or in-flight status.",
      "Same idempotencyKey + different requestHash: record conflict_detected and reject.",
      "Pending lock not expired: return retry_after_pending.",
      "Pending lock expired: future server executor may retry after audit review.",
      "Completed payment entitlement: return existing entitlement; never grant twice.",
      "Consent revocation or update: create a new key rather than mutating previous history.",
    ],
    baseFields,
    contracts: adapter.plans.map(buildContract),
  };
}
