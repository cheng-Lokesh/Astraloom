import "server-only";

import { buildWriterExecutionGuardrail } from "@/lib/server-writers/guardrail";
import type {
  WriterAuditEventContract,
  WriterAuditEventSample,
  WriterAuditField,
  WriterAuditLifecycle,
  WriterAuditModelPayload,
} from "@/types/system-writer-audit";
import type { WriterGuardrailPolicy } from "@/types/system-writer-guardrail";

const futureTableName = "writer_audit_events" as const;
const forbiddenFields = [
  "access_token",
  "refresh_token",
  "password",
  "api_key",
  "service_role",
  "service_role_key",
  "service_role_env_value",
  "ai_provider_secret",
  "stripe_secret",
  "webhook_secret",
  "raw_prompt",
  "raw_model_response",
  "raw_stripe_payload",
];

const baseFields: WriterAuditField[] = [
  {
    name: "auditEventId",
    required: true,
    sensitivity: "safe_metadata",
    detail: "Unique id for the audit event. Future implementation should generate it server-side.",
  },
  {
    name: "contractId",
    required: true,
    sensitivity: "safe_metadata",
    detail: "System writer contract id, such as agent_profile_generation.",
  },
  {
    name: "lifecycle",
    required: true,
    sensitivity: "safe_metadata",
    detail: "Audit lifecycle stage: attempt, gate block, adapter probe, success, failure, or rollback.",
  },
  {
    name: "actorContext",
    required: true,
    sensitivity: "safe_metadata",
    detail: "Trusted actor context resolved server-side, never raw browser authority.",
  },
  {
    name: "userIdHash",
    required: true,
    sensitivity: "hash_only",
    detail: "Hash of the user id for audit correlation without exposing raw identifiers in logs.",
  },
  {
    name: "idempotencyKey",
    required: true,
    sensitivity: "pseudonymous_identifier",
    detail: "Logical operation key used to prevent duplicate writer actions.",
  },
  {
    name: "requestHash",
    required: true,
    sensitivity: "hash_only",
    detail: "Hash of canonical request payload. The raw payload must not be stored in the audit event.",
  },
  {
    name: "targetTables",
    required: true,
    sensitivity: "safe_metadata",
    detail: "Tables the writer intended to touch.",
  },
  {
    name: "gateDecision",
    required: true,
    sensitivity: "safe_metadata",
    detail: "Final gate result, such as blocked, allowed, failed, or rolled back.",
  },
  {
    name: "blockedCodes",
    required: false,
    sensitivity: "internal_state",
    detail: "Structured blocked reasons from dry-run, guardrail, or adapter checks.",
  },
  {
    name: "writerVersion",
    required: true,
    sensitivity: "safe_metadata",
    detail: "Version of the writer contract/adapter that produced the audit event.",
  },
  {
    name: "createdAt",
    required: true,
    sensitivity: "safe_metadata",
    detail: "Server timestamp for ordering append-only audit events.",
  },
];

function eventTypesFor(policy: WriterGuardrailPolicy) {
  return [
    `writer.${policy.contractId}.attempt_received`,
    `writer.${policy.contractId}.gate_blocked`,
    `writer.${policy.contractId}.adapter_probe`,
    `writer.${policy.contractId}.write_succeeded`,
    `writer.${policy.contractId}.write_failed`,
    `writer.${policy.contractId}.rollback_recorded`,
  ];
}

function lifecycleFromBlockedCodes(blockedCodes: string[]): WriterAuditLifecycle {
  return blockedCodes.length > 0 ? "gate_blocked" : "adapter_probe";
}

function buildSampleBlockedEvent(
  policy: WriterGuardrailPolicy,
): WriterAuditEventSample {
  const blockedCodes = [
    "service_role_missing",
    "system_writers_disabled",
    "real_writes_forbidden",
  ];

  return {
    eventType: `writer.${policy.contractId}.gate_blocked`,
    lifecycle: lifecycleFromBlockedCodes(blockedCodes),
    contractId: policy.contractId,
    actorContext: policy.authContext,
    targetTables: policy.targetTables,
    idempotencyKey: `${policy.contractId}:dry-run:idempotency-key`,
    requestHash: "sha256:example_request_hash_only",
    gateDecision: "blocked",
    blockedCodes,
    writerVersion: "writer-audit-contract-v1",
    createdAt: "2026-05-19T00:00:00.000Z",
    wouldPersist: false,
  };
}

function retentionRuleFor(policy: WriterGuardrailPolicy) {
  if (policy.contractId === "payment_entitlement_record") {
    return "Keep payment entitlement audit events for financial dispute and refund support according to the production retention policy.";
  }

  if (policy.contractId === "consent_event_record") {
    return "Keep consent audit events append-only while privacy policy versions remain active or legally relevant.";
  }

  return "Keep writer audit events long enough to debug generated artifacts, rollback decisions, and user support requests; define exact retention before production writes.";
}

function buildContract(policy: WriterGuardrailPolicy): WriterAuditEventContract {
  return {
    contractId: policy.contractId,
    category: policy.category,
    actorContext: policy.authContext,
    targetTables: policy.targetTables,
    futureTableName,
    eventTypes: eventTypesFor(policy),
    requiredFields: baseFields,
    forbiddenFields,
    correlationKeys: [
      "auditEventId",
      "contractId",
      "userIdHash",
      "idempotencyKey",
      "requestHash",
      "writerVersion",
    ],
    retentionRule: retentionRuleFor(policy),
    sampleBlockedEvent: buildSampleBlockedEvent(policy),
  };
}

export function buildWriterAuditModel(): WriterAuditModelPayload {
  const guardrail = buildWriterExecutionGuardrail();

  return {
    safeMode: true,
    readOnly: true,
    wouldWriteAuditRows: false,
    migrationIncluded: false,
    futureTableName,
    globalRules: [
      "Audit events are append-only and must never be edited from the browser.",
      "Current implementation defines contracts only; it does not create a migration or write audit rows.",
      "Store requestHash, not raw request payload.",
      "Store userIdHash or trusted pseudonymous ids, not unnecessary personal text.",
      "Do not store raw prompts, raw model responses, Stripe raw payloads, access tokens, refresh tokens, API keys, service-role values, or webhook secrets.",
      "Every future real writer must emit a gate-blocked, success, failure, or rollback audit event.",
      "Audit event output must be useful for support and rollback without becoming a sensitive data dump.",
    ],
    redactionRules: [
      "Canonicalize request payload, remove forbidden fields, then hash it as requestHash.",
      "Replace raw user id with userIdHash in audit logs unless a future legal review requires a different approach.",
      "Keep evidence references as ids or hashes; do not copy full private narrative text into audit rows.",
      "For Stripe, store event id and product SKU only; never store raw webhook body or card/customer secret material.",
      "For AI, store model/prompt version ids only; never store full prompt text or raw model response in the audit event.",
    ],
    baseFields,
    contracts: guardrail.policies.map(buildContract),
  };
}
