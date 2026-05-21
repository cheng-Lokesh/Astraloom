import "server-only";

import { getServerWriterConfig } from "@/lib/server-writers/config";
import { buildSystemWriterContracts } from "@/lib/server-writers/contracts";
import type {
  WriterAuthContext,
  WriterExecutionGuardrailPayload,
  WriterGuardrailPolicy,
} from "@/types/system-writer-guardrail";
import type { SystemWriterContractId } from "@/types/system-writer-contract";

const authContextByContract: Record<SystemWriterContractId, WriterAuthContext> = {
  agent_profile_generation: "authenticated_user_request",
  relation_edge_generation: "server_executor",
  simulation_run_create: "authenticated_user_request",
  event_tick_append: "server_executor",
  claim_generation: "server_executor",
  report_generation: "server_executor",
  payment_entitlement_record: "stripe_webhook",
  consent_event_record: "authenticated_user_request",
};

const entrypointByContract: Record<SystemWriterContractId, string> = {
  agent_profile_generation:
    "POST /api/system-writers/agent-profiles after user session verification",
  relation_edge_generation:
    "POST /api/system-writers/relation-edges from the server executor only",
  simulation_run_create:
    "POST /api/system-writers/simulation-runs after SafetyVerifier and cost checks",
  event_tick_append:
    "POST /api/system-writers/events from a run-owned server executor loop",
  claim_generation:
    "POST /api/system-writers/claims from report assembly only",
  report_generation:
    "POST /api/system-writers/reports after claim, safety, and entitlement checks",
  payment_entitlement_record:
    "POST /api/stripe/webhook after Stripe signature verification",
  consent_event_record:
    "POST /api/system-writers/consent-events after explicit user consent action",
};

const auditEventByContract: Record<SystemWriterContractId, string> = {
  agent_profile_generation: "writer.agent_profile_generation.completed",
  relation_edge_generation: "writer.relation_edge_generation.completed",
  simulation_run_create: "writer.simulation_run_create.completed",
  event_tick_append: "writer.event_tick_append.completed",
  claim_generation: "writer.claim_generation.completed",
  report_generation: "writer.report_generation.completed",
  payment_entitlement_record: "writer.payment_entitlement_record.completed",
  consent_event_record: "writer.consent_event_record.appended",
};

const rollbackByContract: Record<SystemWriterContractId, string> = {
  agent_profile_generation:
    "Soft-delete or supersede generated profiles; never let the browser mutate profile rows directly.",
  relation_edge_generation:
    "Supersede generated edge set by seedContextId/version; do not patch individual weights manually.",
  simulation_run_create:
    "Cancel queued run before event ticks exist; after ticks exist, create a new run version instead of mutating history.",
  event_tick_append:
    "Append compensating event or mark the run invalid; do not reorder historical ticks.",
  claim_generation:
    "Supersede claims by schema version and report assembly version; keep evidence references traceable.",
  report_generation:
    "Create a replacement report version; do not unlock or rewrite a paid report from the browser.",
  payment_entitlement_record:
    "Use Stripe refund/dispute events and append a compensating entitlement state; never delete payment history.",
  consent_event_record:
    "Append a revocation or update event; never delete previous consent audit records.",
};

function buildPreWriteChecks(contractId: SystemWriterContractId) {
  const shared = [
    "Dry-run validation passes for the same request shape.",
    "The target user id is derived from trusted server context, not browser-provided authority.",
    "The idempotency key is present and checked before any write attempt.",
    "No secret, token, API key, or service-role value is accepted in the request body.",
  ];

  if (contractId === "payment_entitlement_record") {
    return [
      "Stripe webhook signature is verified before parsing the event as trusted.",
      "Stripe event id has not already been processed.",
      "Entitlement scope matches a known product SKU.",
      ...shared,
    ];
  }

  if (contractId === "consent_event_record") {
    return [
      "Consent type and policy version are explicit.",
      "Consent action is append-only.",
      "Revocation creates a new event instead of deleting history.",
      ...shared,
    ];
  }

  if (
    contractId === "event_tick_append" ||
    contractId === "claim_generation" ||
    contractId === "report_generation"
  ) {
    return [
      "Run ownership is verified server-side.",
      "SafetyVerifier state allows the operation.",
      "Cost budget and tier limits are still inside bounds.",
      ...shared,
    ];
  }

  return [
    "Authenticated user owns the seed context.",
    "Seed context and confirmed people have already passed browser sync boundaries.",
    "Safety and cost gates are checked before generated artifacts are persisted.",
    ...shared,
  ];
}

function buildRolloutNotes(contractId: SystemWriterContractId) {
  if (contractId === "payment_entitlement_record") {
    return [
      "Enable only after webhook signature verification has isolated tests.",
      "Start with one test SKU and one entitlement scope.",
      "Verify refund and deletion support paths before production payment collection.",
    ];
  }

  if (contractId === "event_tick_append") {
    return [
      "Enable only after per-run tick caps and cost caps are enforced.",
      "Never use this writer for free daily weather background NPC scans.",
      "Log executor version and tick index for every append.",
    ];
  }

  if (contractId === "report_generation") {
    return [
      "Enable only after claim evidence refs and SafetyVerifier report-ready state are enforced.",
      "Keep locked and unlocked state server-owned.",
      "Verify report copy avoids deterministic fate language before paid unlock.",
    ];
  }

  return [
    "Enable for internal test users before any public user path.",
    "Keep AI generation disabled until prompt, safety, and cost review pass.",
    "Compare dry-run and real-write payloads before allowing writes.",
  ];
}

export function buildWriterExecutionGuardrail(): WriterExecutionGuardrailPayload {
  const config = getServerWriterConfig();
  const contracts = buildSystemWriterContracts();
  const policies: WriterGuardrailPolicy[] = contracts.contracts.map(
    (contract) => ({
      contractId: contract.id,
      category: contract.category,
      targetTables: contract.targetTables,
      authContext: authContextByContract[contract.id],
      entrypoint: entrypointByContract[contract.id],
      requiredFlags: contract.requiredFlags,
      auditEventType: auditEventByContract[contract.id],
      preWriteChecks: buildPreWriteChecks(contract.id),
      idempotencyConflictBehavior:
        "Return the existing completed result for the same idempotency key; never perform a second write for the same logical operation.",
      rollbackStrategy: rollbackByContract[contract.id],
      rolloutNotes: buildRolloutNotes(contract.id),
    }),
  );

  return {
    safeMode: true,
    realWritesAllowed: false,
    serviceRoleClientAllowed: false,
    aiCallsAllowed: false,
    stripeCallsAllowed: false,
    serviceRoleConfigured: config.serviceRoleConfigured,
    systemWritersEnabled: config.systemWritersEnabled,
    aiGenerationEnabled: config.aiGenerationEnabled,
    stripeWritesEnabled: config.stripeWritesEnabled,
    globalRules: [
      "Browser code may write only user-authored drafts: seed_contexts, key_people, and support_tickets.",
      "Generated artifacts and payment-owned records remain server-owned.",
      "A service-role client must live in a server-only module and must never be imported by client components.",
      "A real writer must pass dry-run validation before it can be considered for rollout.",
      "Every writer must have an idempotency key before any insert/update operation.",
      "Every writer must produce append-only audit evidence before or after the attempted write.",
      "AI and Stripe integrations remain disabled until their own cost, safety, and webhook gates are reviewed.",
    ],
    executionPhases: [
      {
        id: "receive_request",
        title: "Receive request",
        required: true,
        allowedNow: true,
        detail:
          "Accept a structured request shape only. Current implementation supports dry-run validation, not real writes.",
      },
      {
        id: "authenticate_context",
        title: "Authenticate context",
        required: true,
        allowedNow: false,
        detail:
          "Resolve user, webhook, or executor authority from trusted server context before trusting ids.",
      },
      {
        id: "validate_contract",
        title: "Validate contract",
        required: true,
        allowedNow: true,
        detail:
          "Validate contract id, required input keys, unexpected keys, and sensitive key names.",
      },
      {
        id: "check_feature_gates",
        title: "Check feature gates",
        required: true,
        allowedNow: true,
        detail:
          "Block when service-role, system writer, AI generation, or Stripe flags are disabled.",
      },
      {
        id: "check_idempotency",
        title: "Check idempotency",
        required: true,
        allowedNow: false,
        detail:
          "Reserve or resolve the idempotency key before any write. Duplicate logical operations must not create duplicate rows.",
      },
      {
        id: "prepare_audit",
        title: "Prepare audit",
        required: true,
        allowedNow: false,
        detail:
          "Prepare an append-only audit event with writer id, actor type, target tables, request hash, and gate result.",
      },
      {
        id: "service_role_write",
        title: "Service-role write",
        required: true,
        allowedNow: false,
        detail:
          "Still forbidden. A future implementation may use a server-only Supabase service-role client after all gates pass.",
      },
      {
        id: "post_write_audit",
        title: "Post-write audit",
        required: true,
        allowedNow: false,
        detail:
          "Record written row ids, status, idempotency key, and writer version without exposing secret material.",
      },
      {
        id: "rollback_review",
        title: "Rollback review",
        required: true,
        allowedNow: false,
        detail:
          "Use compensating records, soft-delete, or version supersession. Avoid destructive mutation of generated history.",
      },
    ],
    policies,
    rolloutGates: [
      {
        id: "remote_schema_verified",
        title: "Remote schema verified",
        required: true,
        passed: true,
        detail:
          "The hosted Supabase project has the expected MVP tables according to the remote schema probe.",
      },
      {
        id: "rls_boundary_verified",
        title: "RLS boundary verified",
        required: true,
        passed: true,
        detail:
          "Browser sync verified client-writable drafts while generated/payment tables stayed read-only for the logged-in user.",
      },
      {
        id: "dry_run_validated",
        title: "Dry-run validation available",
        required: true,
        passed: true,
        detail:
          "The dry-run endpoint validates request shape and returns wouldWrite=false.",
      },
      {
        id: "service_role_isolated",
        title: "Service-role isolation implemented",
        required: true,
        passed: false,
        detail:
          "No service-role client exists yet. It must be server-only and hidden from browser bundles.",
      },
      {
        id: "audit_writer_ready",
        title: "Audit writer ready",
        required: true,
        passed: false,
        detail:
          "Future writer attempts need append-only audit evidence before any production write rollout.",
      },
      {
        id: "ai_cost_safety_ready",
        title: "AI cost and safety gates ready",
        required: true,
        passed: false,
        detail:
          "AI generation remains disabled until prompt, cost cap, SafetyVerifier, and report language gates are reviewed.",
      },
      {
        id: "stripe_webhook_ready",
        title: "Stripe webhook ready",
        required: true,
        passed: false,
        detail:
          "Stripe writes remain disabled until signature verification, event idempotency, refund path, and support workflows are tested.",
      },
    ],
  };
}
