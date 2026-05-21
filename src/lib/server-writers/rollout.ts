import "server-only";

import { getServerWriterConfig } from "@/lib/server-writers/config";
import { buildSystemWriterContracts } from "@/lib/server-writers/contracts";
import { buildServerWriterStubCatalog } from "@/lib/server-writers/server-writer-stubs";
import type {
  SystemWriterContract,
  SystemWriterContractId,
} from "@/types/system-writer-contract";
import type {
  WriterRolloutChecklistPayload,
  WriterRolloutContractPlan,
  WriterRolloutGate,
  WriterRolloutLaunchMode,
  WriterRolloutReadiness,
} from "@/types/system-writer-rollout";

function gate(
  input: Omit<WriterRolloutGate, "status"> & {
    passed: boolean;
    manualReview?: boolean;
  },
): WriterRolloutGate {
  return {
    id: input.id,
    category: input.category,
    title: input.title,
    required: input.required,
    blocking: input.blocking,
    status: input.manualReview
      ? "manual_review"
      : input.passed
        ? "passed"
        : "blocked",
    evidence: input.evidence,
    missingWork: input.missingWork,
  };
}

function firstCandidateOrder(contractId: SystemWriterContractId) {
  const order: Record<SystemWriterContractId, number> = {
    consent_event_record: 1,
    payment_entitlement_record: 2,
    agent_profile_generation: 3,
    relation_edge_generation: 4,
    simulation_run_create: 5,
    event_tick_append: 6,
    claim_generation: 7,
    report_generation: 8,
  };

  return order[contractId];
}

function launchModeFor(contractId: SystemWriterContractId): WriterRolloutLaunchMode {
  if (contractId === "consent_event_record") {
    return "internal_canary_after_gates";
  }

  if (contractId === "payment_entitlement_record") {
    return "manual_operator_only_after_gates";
  }

  return "production_after_review";
}

function readinessFor(contractId: SystemWriterContractId): WriterRolloutReadiness {
  if (contractId === "consent_event_record") {
    return "candidate_after_gates";
  }

  if (contractId === "payment_entitlement_record") {
    return "not_first_candidate";
  }

  return "blocked";
}

function baseBlockedBy(contract: SystemWriterContract) {
  return [
    "real_writer_payload_parity_missing",
    "real_service_role_client_not_implemented",
    "audit_writer_not_implemented",
    "idempotency_registry_not_implemented",
    "rollout_approval_missing",
    ...contract.requiredFlags
      .filter((flag) => flag !== "ENABLE_SYSTEM_WRITERS")
      .map((flag) => `${flag.toLowerCase()}_disabled`),
  ];
}

function blockedByFor(contract: SystemWriterContract) {
  const blockedBy = baseBlockedBy(contract);

  if (
    contract.id === "agent_profile_generation" ||
    contract.id === "relation_edge_generation" ||
    contract.id === "simulation_run_create" ||
    contract.id === "event_tick_append" ||
    contract.id === "claim_generation" ||
    contract.id === "report_generation"
  ) {
    blockedBy.push("ai_cost_safety_review_missing");
  }

  if (contract.id === "event_tick_append") {
    blockedBy.push("executor_tick_cap_missing");
  }

  if (contract.id === "report_generation") {
    blockedBy.push("report_unlock_review_missing");
  }

  if (contract.id === "payment_entitlement_record") {
    blockedBy.push("stripe_signature_tests_missing");
    blockedBy.push("refund_support_runbook_missing");
  }

  return Array.from(new Set(blockedBy));
}

function requiredBeforeLaunchFor(contract: SystemWriterContract) {
  const required = [
    "Server-only writer module exists and is not imported by client components.",
    "Dry-run payload and real writer payload use the same schema.",
    "Idempotency reservation is implemented before the first write.",
    "Append-only audit evidence is written for attempted, blocked, successful, and failed executions.",
    "Rollback or compensation behavior is documented for this exact writer.",
    "Operator approval is recorded before enabling the writer flag.",
  ];

  if (contract.requiredFlags.includes("ENABLE_AI_GENERATION")) {
    required.push(
      "AI prompt version, model version, cost cap, and SafetyVerifier gates are reviewed.",
    );
  }

  if (contract.requiredFlags.includes("ENABLE_STRIPE_WRITES")) {
    required.push(
      "Stripe webhook signature verification, event idempotency, refund path, and support path have isolated tests.",
    );
  }

  if (contract.id === "report_generation") {
    required.push(
      "Report unlock remains server-owned and cannot be changed by browser sync.",
    );
  }

  return required;
}

function canaryPlanFor(contractId: SystemWriterContractId) {
  if (contractId === "consent_event_record") {
    return [
      "Start with one internal test user and one explicit consent type.",
      "Allow append-only accept/update/revoke events only.",
      "Review audit and idempotency records manually after every test event.",
    ];
  }

  if (contractId === "payment_entitlement_record") {
    return [
      "Start in Stripe test mode with one product SKU.",
      "Process one checkout completion, one duplicate webhook, and one refund event.",
      "Keep report unlock disabled until entitlement records are manually reviewed.",
    ];
  }

  if (contractId === "event_tick_append") {
    return [
      "Run one internal paid simulation with a hard tick cap.",
      "Stop execution when any cost, safety, or tick-order invariant fails.",
      "Compare generated event history against the read-only report shell before report assembly.",
    ];
  }

  if (contractId === "report_generation") {
    return [
      "Use one internal run with approved claims and evidence refs.",
      "Generate locked report state first.",
      "Manually review deterministic language before any paid unlock path exists.",
    ];
  }

  return [
    "Start with one internal seed context and one internal user.",
    "Compare dry-run output against the writer attempt payload before enabling writes.",
    "Review generated records manually before exposing them in the user workflow.",
  ];
}

function abortConditionsFor(contractId: SystemWriterContractId) {
  const shared = [
    "Any browser request can create or mutate server-owned rows.",
    "Any response exposes secret names, token values, provider keys, or raw service-role configuration.",
    "Any write occurs before idempotency and audit evidence are prepared.",
  ];

  if (contractId === "payment_entitlement_record") {
    return [
      "Webhook signature verification fails or is bypassed.",
      "A duplicate Stripe event creates a second entitlement.",
      "Refund or dispute evidence cannot be traced.",
      ...shared,
    ];
  }

  if (contractId === "consent_event_record") {
    return [
      "Consent revocation deletes previous consent history.",
      "Policy version is missing from an event.",
      ...shared,
    ];
  }

  if (contractId === "event_tick_append") {
    return [
      "Event ticks are reordered, overwritten, or silently patched.",
      "A free daily weather path triggers background NPC scanning.",
      ...shared,
    ];
  }

  return [
    "A generated artifact is rewritten in place without versioning or compensation.",
    "AI output bypasses SafetyVerifier or cost cap checks.",
    ...shared,
  ];
}

function audienceFor(contractId: SystemWriterContractId) {
  if (contractId === "consent_event_record") {
    return "Internal test user only";
  }

  if (contractId === "payment_entitlement_record") {
    return "Internal Stripe test-mode operator only";
  }

  return "Internal founder review only";
}

function buildPlan(contract: SystemWriterContract): WriterRolloutContractPlan {
  return {
    contractId: contract.id,
    category: contract.category,
    targetTables: contract.targetTables,
    requiredFlags: contract.requiredFlags,
    readiness: readinessFor(contract.id),
    launchMode: launchModeFor(contract.id),
    candidateOrder: firstCandidateOrder(contract.id),
    firstAllowedAudience: audienceFor(contract.id),
    requiredBeforeLaunch: requiredBeforeLaunchFor(contract),
    blockedBy: blockedByFor(contract),
    canaryPlan: canaryPlanFor(contract.id),
    abortConditions: abortConditionsFor(contract.id),
  };
}

export function buildWriterRolloutChecklist(): WriterRolloutChecklistPayload {
  const config = getServerWriterConfig();
  const contracts = buildSystemWriterContracts();
  const stubs = buildServerWriterStubCatalog();
  const allStubModulesPresent = stubs.length === contracts.contracts.length;

  return {
    safeMode: true,
    readOnly: true,
    wouldEnableWriters: false,
    wouldCreateServiceRoleClient: false,
    wouldWriteRows: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    wouldUnlockReports: false,
    approvedForProduction: false,
    allRequiredGatesPassed: false,
    serviceRoleConfigured: config.serviceRoleConfigured,
    systemWritersEnabled: config.systemWritersEnabled,
    aiGenerationEnabled: config.aiGenerationEnabled,
    stripeWritesEnabled: config.stripeWritesEnabled,
    globalRules: [
      "Current implementation defines rollout gates only; it does not enable writers or create a service-role client.",
      "No writer can become production-ready until payload parity, audit persistence, idempotency persistence, rollback behavior, and operator approval are implemented together.",
      "Inert server-only writer stubs now exist, but they are not real writers and cannot create a privileged client or write rows.",
      "AI-backed writers require prompt versioning, model versioning, cost caps, SafetyVerifier gates, and deterministic-language review.",
      "Payment writers require verified Stripe signatures, event idempotency, refund support, and dispute traceability.",
      "The first writer candidate should be append-only and low-risk; generated simulations and reports come later.",
      "The browser must remain limited to user-authored drafts until a reviewed server writer is explicitly enabled.",
    ],
    releaseSequence: [
      "Keep every dangerous flag disabled while reviewing this checklist.",
      "Use the inert server-only writer stubs to define request-shape parity fixtures.",
      "Implement idempotency reservation before any write path.",
      "Implement append-only audit evidence before and after attempted writes.",
      "Implement compensation or rollback recording for failed or unsafe outcomes.",
      "Run one internal canary writer with production flags still off.",
      "Enable exactly one writer for exactly one internal audience after manual approval.",
      "Expand only after logs, support flow, rollback flow, and cost behavior are reviewed.",
    ],
    globalGates: [
      gate({
        id: "public_supabase_configured",
        category: "environment",
        title: "Public Supabase config present",
        required: true,
        blocking: false,
        passed: config.supabaseUrlConfigured,
        evidence:
          "The app can run authenticated draft sync with public Supabase URL and anon key.",
        missingWork: "Configure public Supabase env values before any rollout review.",
      }),
      gate({
        id: "remote_schema_verified",
        category: "database",
        title: "Remote schema verified",
        required: true,
        blocking: true,
        passed: true,
        evidence:
          "The hosted Supabase schema has the expected MVP tables from the previous auth-sync verification.",
        missingWork: "Re-run the remote schema probe before production writer rollout.",
      }),
      gate({
        id: "rls_boundary_verified",
        category: "database",
        title: "RLS boundary verified",
        required: true,
        blocking: true,
        passed: true,
        evidence:
          "Browser sync wrote only seed_contexts, key_people, and support_tickets; generated/payment tables stayed read-only.",
        missingWork:
          "Manually re-check RLS policies before adding any server-owned insert/update path.",
      }),
      gate({
        id: "dangerous_flags_still_off",
        category: "environment",
        title: "Dangerous flags still off",
        required: true,
        blocking: true,
        passed:
          !config.systemWritersEnabled &&
          !config.aiGenerationEnabled &&
          !config.stripeWritesEnabled,
        evidence:
          "System writers, AI generation, and Stripe writes remain disabled in the current environment.",
        missingWork:
          "Do not turn on dangerous flags until every blocking rollout gate is passed.",
      }),
      gate({
        id: "service_role_isolation",
        category: "service_role",
        title: "Service-role isolation implemented",
        required: true,
        blocking: true,
        passed: true,
        evidence:
          "The diagnostic isolation harness and inert .server writer stubs are present. No real service-role client is created.",
        missingWork:
          "Keep real client creation out of scope until payload parity, audit, idempotency, rollback, and rollout approval are complete.",
      }),
      gate({
        id: "server_only_stub_modules",
        category: "service_role",
        title: "Inert server-only writer stubs present",
        required: true,
        blocking: true,
        passed: allStubModulesPresent,
        evidence:
          "Each writer contract has a .server stub that starts with import \"server-only\" and returns blocked metadata only.",
        missingWork:
          "Do not replace stubs with real writer implementations until every downstream gate is reviewed.",
      }),
      gate({
        id: "dry_run_contract_match",
        category: "contract_validation",
        title: "Dry-run and writer payloads match",
        required: true,
        blocking: true,
        passed: false,
        evidence:
          "Dry-run validation exists, but no real writer payload exists to compare yet.",
        missingWork:
          "For each writer, prove the real writer accepts the same validated request shape as dry-run.",
      }),
      gate({
        id: "audit_persistence",
        category: "audit",
        title: "Audit persistence implemented",
        required: true,
        blocking: true,
        passed: false,
        evidence:
          "The audit model is read-only and does not write writer_audit_events.",
        missingWork:
          "Implement append-only audit writes before any generated, payment, or consent writer executes.",
      }),
      gate({
        id: "idempotency_persistence",
        category: "idempotency",
        title: "Idempotency persistence implemented",
        required: true,
        blocking: true,
        passed: false,
        evidence:
          "The idempotency model is read-only and does not reserve writer keys.",
        missingWork:
          "Implement key reservation, replay, conflict rejection, and expiry rules before writing rows.",
      }),
      gate({
        id: "rollback_compensation_ready",
        category: "rollback",
        title: "Rollback compensation implementation ready",
        required: true,
        blocking: true,
        passed: false,
        evidence:
          "The rollback model is read-only and does not write compensation rows.",
        missingWork:
          "Implement compensation event persistence and operator review for high-impact outcomes.",
      }),
      gate({
        id: "ai_cost_safety_review",
        category: "ai_safety_cost",
        title: "AI cost and safety review complete",
        required: true,
        blocking: true,
        passed: false,
        evidence:
          "AI generation is disabled and no prompt/model/cost cap implementation exists.",
        missingWork:
          "Define prompt versions, model versions, token budgets, tier caps, SafetyVerifier handoff, and report wording review.",
      }),
      gate({
        id: "stripe_webhook_review",
        category: "payments",
        title: "Stripe webhook review complete",
        required: true,
        blocking: true,
        passed: false,
        evidence:
          "Stripe writes are disabled and no real webhook writer exists.",
        missingWork:
          "Implement signature verification, event idempotency, test-mode checkout, refund traceability, and dispute support.",
      }),
      gate({
        id: "support_runbook_ready",
        category: "support",
        title: "Support and deletion runbook ready",
        required: true,
        blocking: true,
        passed: false,
        evidence:
          "Support-ticket shell exists, but operator runbooks are not implemented.",
        missingWork:
          "Define refund, deletion, unsafe output, rollback, and user complaint handling before paid launch.",
      }),
      gate({
        id: "observability_ready",
        category: "observability",
        title: "Observability ready",
        required: true,
        blocking: true,
        passed: false,
        evidence:
          "No production metrics, alerting, or writer failure dashboard exists yet.",
        missingWork:
          "Add logs, metrics, failure alerts, cost tracking, and manual review queues before public rollout.",
      }),
      gate({
        id: "operator_approval_recorded",
        category: "operator_review",
        title: "Operator approval recorded",
        required: true,
        blocking: true,
        passed: false,
        manualReview: true,
        evidence:
          "No explicit approval record exists for enabling a production writer.",
        missingWork:
          "Record the exact writer, audience, date, flags, rollback path, and abort conditions before enabling it.",
      }),
    ],
    contractPlans: contracts.contracts
      .map(buildPlan)
      .sort((left, right) => left.candidateOrder - right.candidateOrder),
  };
}
