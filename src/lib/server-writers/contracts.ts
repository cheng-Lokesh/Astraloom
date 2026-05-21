import "server-only";

import { getServerWriterConfig } from "@/lib/server-writers/config";
import type {
  SystemWriterContract,
  SystemWriterContractPayload,
  SystemWriterContractStatus,
  SystemWriterFeatureFlag,
} from "@/types/system-writer-contract";

type ContractDefinition = Omit<
  SystemWriterContract,
  "status" | "enabled" | "detail"
> & {
  detailWhenBlocked: string;
  detailWhenReady: string;
};

const contractDefinitions: ContractDefinition[] = [
  {
    id: "agent_profile_generation",
    category: "agent_ecology",
    targetTables: ["agent_profiles"],
    trigger:
      "After a seed context and confirmed key people exist for the same user.",
    requiredInputs: [
      "userId",
      "seedContextId",
      "confirmed key_people ids",
      "promptVersion",
      "modelVersion",
    ],
    safetyGates: [
      "User privacy acknowledgement is present.",
      "Person confirmation is complete.",
      "No medical, legal, financial, or crisis deterministic claims are generated.",
      "Parallel selves stay bounded to MVP short/medium windows.",
    ],
    idempotencyKey: "agent_profile_generation:{userId}:{seedContextId}",
    requiredFlags: ["ENABLE_SYSTEM_WRITERS", "ENABLE_AI_GENERATION"],
    detailWhenBlocked:
      "Agent profiles are system-owned. The browser can preview local placeholders, but persistent profiles require the backend writer and AI gate.",
    detailWhenReady:
      "The contract may create digital self, optional parallel selves, and confirmed NPC profiles through a server-only path.",
  },
  {
    id: "relation_edge_generation",
    category: "agent_ecology",
    targetTables: ["relation_edges"],
    trigger: "After agent profiles are created for the active seed context.",
    requiredInputs: [
      "userId",
      "seedContextId",
      "agentProfileIds",
      "confirmed relationship evidence",
      "promptVersion",
      "modelVersion",
    ],
    safetyGates: [
      "Graph remains read-only in the browser.",
      "No manual edge-weight sliders in MVP.",
      "Every edge must reference source context or a confirmed person relation.",
      "Low-confidence edges stay hidden or marked provisional.",
    ],
    idempotencyKey: "relation_edge_generation:{userId}:{seedContextId}",
    requiredFlags: ["ENABLE_SYSTEM_WRITERS", "ENABLE_AI_GENERATION"],
    detailWhenBlocked:
      "Relationship edges are generated evidence, not user-editable CRM data. MVP keeps graph values as a black-box output.",
    detailWhenReady:
      "The contract may generate read-only trust/friction/dependency edges that support the simulation ecology.",
  },
  {
    id: "simulation_run_create",
    category: "simulation",
    targetTables: ["simulation_runs"],
    trigger:
      "When a user starts a paid or otherwise allowed simulation from an approved seed context.",
    requiredInputs: [
      "userId",
      "seedContextId",
      "track",
      "timeWindow",
      "scenarioQuestion",
      "costBudget",
      "safetyReviewId",
    ],
    safetyGates: [
      "Cost estimate is inside the product tier budget.",
      "SafetyVerifier permits the run.",
      "Track A stays decision-specific.",
      "Track B stays trend-level and avoids false precision.",
    ],
    idempotencyKey: "simulation_run_create:{userId}:{seedContextId}:{timeWindow}",
    requiredFlags: ["ENABLE_SYSTEM_WRITERS", "ENABLE_AI_GENERATION"],
    detailWhenBlocked:
      "Simulation runs remain queued shells until safety, cost, prompt, and backend writer gates are complete.",
    detailWhenReady:
      "The contract may create a run record, but real execution still depends on the guarded simulation executor.",
  },
  {
    id: "event_tick_append",
    category: "simulation",
    targetTables: ["events"],
    trigger: "During a server-owned simulation run tick loop.",
    requiredInputs: [
      "userId",
      "runId",
      "tickIndex",
      "agentStateSnapshot",
      "relationStateSnapshot",
      "executorVersion",
    ],
    safetyGates: [
      "Run ownership is verified server-side.",
      "Tick count is capped by tier and time window.",
      "No background daily scans for free users.",
      "Unsafe or overconfident outputs are stopped before report assembly.",
    ],
    idempotencyKey: "event_tick_append:{runId}:{tickIndex}",
    requiredFlags: ["ENABLE_SYSTEM_WRITERS", "ENABLE_AI_GENERATION"],
    detailWhenBlocked:
      "Event ticks are generated artifacts. Free daily weather must stay low-cost and cannot run NPC scans in the background.",
    detailWhenReady:
      "The contract may append ordered event ticks for a server-owned run within strict cost limits.",
  },
  {
    id: "claim_generation",
    category: "reporting",
    targetTables: ["claims"],
    trigger: "After a simulation run has passed SafetyVerifier and report assembly begins.",
    requiredInputs: [
      "userId",
      "runId",
      "eventIds",
      "evidenceRefs",
      "safetyReviewId",
      "claimSchemaVersion",
    ],
    safetyGates: [
      "Every claim has at least one evidence reference.",
      "Claims avoid deterministic fate language.",
      "High-risk domains are softened, blocked, or redirected.",
      "Confidence is expressed as bounded uncertainty.",
    ],
    idempotencyKey: "claim_generation:{runId}:{claimSchemaVersion}",
    requiredFlags: ["ENABLE_SYSTEM_WRITERS", "ENABLE_AI_GENERATION"],
    detailWhenBlocked:
      "Claims cannot be fabricated by the client. They require event evidence and safety-approved report assembly.",
    detailWhenReady:
      "The contract may write evidence-backed claims for report sections after safety approval.",
  },
  {
    id: "report_generation",
    category: "reporting",
    targetTables: ["reports"],
    trigger:
      "After claim generation and entitlement checks complete for the requested report.",
    requiredInputs: [
      "userId",
      "runId",
      "claimIds",
      "reportTemplateVersion",
      "entitlementId",
      "safetyReviewId",
    ],
    safetyGates: [
      "SafetyVerifier marks the report as ready.",
      "Payment or free-tier entitlement is verified server-side.",
      "Locked/unlocked state is not controlled by browser sync.",
      "Report wording keeps agency and uncertainty visible.",
    ],
    idempotencyKey: "report_generation:{runId}:{reportTemplateVersion}",
    requiredFlags: ["ENABLE_SYSTEM_WRITERS", "ENABLE_AI_GENERATION"],
    detailWhenBlocked:
      "Reports remain locked placeholders. Unlocking and final content require server-side safety and entitlement gates.",
    detailWhenReady:
      "The contract may assemble a locked or unlocked report record without letting the browser grant access.",
  },
  {
    id: "payment_entitlement_record",
    category: "payments",
    targetTables: ["payments"],
    trigger: "Only from a verified Stripe webhook or server-side payment callback.",
    requiredInputs: [
      "userId",
      "stripeCustomerId",
      "stripeCheckoutSessionId",
      "stripeEventId",
      "productSku",
      "entitlementScope",
    ],
    safetyGates: [
      "Webhook signature is verified.",
      "Stripe event id is idempotent.",
      "No browser-created entitlement records.",
      "Refund and deletion paths remain auditable.",
    ],
    idempotencyKey: "payment_entitlement_record:{stripeEventId}",
    requiredFlags: ["ENABLE_SYSTEM_WRITERS", "ENABLE_STRIPE_WRITES"],
    detailWhenBlocked:
      "Payment entitlements are never granted by the client. Stripe writes remain disabled until webhook handling is built.",
    detailWhenReady:
      "The contract may record payment entitlement after a verified Stripe event and idempotency check.",
  },
  {
    id: "consent_event_record",
    category: "compliance",
    targetTables: ["consent_events"],
    trigger:
      "When the user accepts, updates, exports, or revokes a privacy/safety consent state.",
    requiredInputs: [
      "userId",
      "consentType",
      "policyVersion",
      "decision",
      "sourceRoute",
      "createdAt",
    ],
    safetyGates: [
      "Consent event is append-only.",
      "Policy version is explicit.",
      "Revocation does not delete audit history.",
      "Deletion requests follow the support/deletion workflow.",
    ],
    idempotencyKey: "consent_event_record:{userId}:{consentType}:{policyVersion}",
    requiredFlags: ["ENABLE_SYSTEM_WRITERS"],
    detailWhenBlocked:
      "Consent auditing is server-owned and append-only. The MVP can show consent copy, but persistent audit events remain disabled.",
    detailWhenReady:
      "The contract may append consent events without exposing mutable audit state to the browser.",
  },
];

function hasRequiredFlag(
  flag: SystemWriterFeatureFlag,
  config: ReturnType<typeof getServerWriterConfig>,
) {
  if (flag === "ENABLE_SYSTEM_WRITERS") {
    return config.systemWritersEnabled;
  }

  if (flag === "ENABLE_AI_GENERATION") {
    return config.aiGenerationEnabled;
  }

  return config.stripeWritesEnabled;
}

function getContractStatus(
  contract: ContractDefinition,
  config: ReturnType<typeof getServerWriterConfig>,
): SystemWriterContractStatus {
  if (!config.serviceRoleConfigured) {
    return "missing_service_role";
  }

  const allFlagsEnabled = contract.requiredFlags.every((flag) =>
    hasRequiredFlag(flag, config),
  );

  if (!allFlagsEnabled) {
    return "disabled";
  }

  return "ready_placeholder";
}

export function buildSystemWriterContracts(): SystemWriterContractPayload {
  const config = getServerWriterConfig();

  return {
    serviceRoleConfigured: config.serviceRoleConfigured,
    systemWritersEnabled: config.systemWritersEnabled,
    aiGenerationEnabled: config.aiGenerationEnabled,
    stripeWritesEnabled: config.stripeWritesEnabled,
    contracts: contractDefinitions.map((contract) => {
      const status = getContractStatus(contract, config);
      const enabled = status === "ready_placeholder";

      return {
        id: contract.id,
        category: contract.category,
        targetTables: contract.targetTables,
        trigger: contract.trigger,
        requiredInputs: contract.requiredInputs,
        safetyGates: contract.safetyGates,
        idempotencyKey: contract.idempotencyKey,
        requiredFlags: contract.requiredFlags,
        status,
        enabled,
        detail: enabled ? contract.detailWhenReady : contract.detailWhenBlocked,
      };
    }),
  };
}
