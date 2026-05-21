import "server-only";

import { getServerWriterConfig } from "@/lib/server-writers/config";
import { buildSystemWriterContracts } from "@/lib/server-writers/contracts";
import type {
  SystemWriterContract,
  SystemWriterContractId,
  SystemWriterFeatureFlag,
} from "@/types/system-writer-contract";
import type {
  SystemWriterDryRunCatalog,
  SystemWriterDryRunContractSpec,
  SystemWriterDryRunIssue,
  SystemWriterDryRunResult,
} from "@/types/system-writer-dry-run";

const dryRunSpecs: Record<
  SystemWriterContractId,
  Omit<SystemWriterDryRunContractSpec, "contractId">
> = {
  agent_profile_generation: {
    requiredInputKeys: [
      "userId",
      "seedContextId",
      "confirmedKeyPersonIds",
      "promptVersion",
      "modelVersion",
    ],
    optionalInputKeys: ["parallelSelfCount", "locale"],
    sampleRequest: {
      contractId: "agent_profile_generation",
      input: {
        userId: "dry_user_123",
        seedContextId: "seed_123",
        confirmedKeyPersonIds: ["person_1", "person_2"],
        promptVersion: "agent-profile-v1",
        modelVersion: "disabled-dry-run",
        parallelSelfCount: 2,
      },
    },
  },
  relation_edge_generation: {
    requiredInputKeys: [
      "userId",
      "seedContextId",
      "agentProfileIds",
      "relationshipEvidenceRefs",
      "promptVersion",
      "modelVersion",
    ],
    optionalInputKeys: ["minConfidence", "locale"],
    sampleRequest: {
      contractId: "relation_edge_generation",
      input: {
        userId: "dry_user_123",
        seedContextId: "seed_123",
        agentProfileIds: ["agent_self", "agent_npc_1"],
        relationshipEvidenceRefs: ["seed_context:seed_123"],
        promptVersion: "relation-edge-v1",
        modelVersion: "disabled-dry-run",
      },
    },
  },
  simulation_run_create: {
    requiredInputKeys: [
      "userId",
      "seedContextId",
      "track",
      "timeWindow",
      "scenarioQuestion",
      "costBudget",
      "safetyReviewId",
    ],
    optionalInputKeys: ["entitlementId", "locale"],
    sampleRequest: {
      contractId: "simulation_run_create",
      input: {
        userId: "dry_user_123",
        seedContextId: "seed_123",
        track: "A",
        timeWindow: "90_days",
        scenarioQuestion: "Should I change jobs this quarter?",
        costBudget: "mvp_safe_budget",
        safetyReviewId: "safety_123",
      },
    },
  },
  event_tick_append: {
    requiredInputKeys: [
      "userId",
      "runId",
      "tickIndex",
      "agentStateSnapshot",
      "relationStateSnapshot",
      "executorVersion",
    ],
    optionalInputKeys: ["costUsed", "locale"],
    sampleRequest: {
      contractId: "event_tick_append",
      input: {
        userId: "dry_user_123",
        runId: "run_123",
        tickIndex: 0,
        agentStateSnapshot: "snapshot_ref_agent_0",
        relationStateSnapshot: "snapshot_ref_relation_0",
        executorVersion: "sim-executor-v1",
      },
    },
  },
  claim_generation: {
    requiredInputKeys: [
      "userId",
      "runId",
      "eventIds",
      "evidenceRefs",
      "safetyReviewId",
      "claimSchemaVersion",
    ],
    optionalInputKeys: ["locale"],
    sampleRequest: {
      contractId: "claim_generation",
      input: {
        userId: "dry_user_123",
        runId: "run_123",
        eventIds: ["event_1", "event_2"],
        evidenceRefs: ["event:event_1"],
        safetyReviewId: "safety_123",
        claimSchemaVersion: "claim-v1",
      },
    },
  },
  report_generation: {
    requiredInputKeys: [
      "userId",
      "runId",
      "claimIds",
      "reportTemplateVersion",
      "entitlementId",
      "safetyReviewId",
    ],
    optionalInputKeys: ["locale", "reportMode"],
    sampleRequest: {
      contractId: "report_generation",
      input: {
        userId: "dry_user_123",
        runId: "run_123",
        claimIds: ["claim_1", "claim_2"],
        reportTemplateVersion: "report-v1",
        entitlementId: "entitlement_123",
        safetyReviewId: "safety_123",
      },
    },
  },
  payment_entitlement_record: {
    requiredInputKeys: [
      "userId",
      "stripeCustomerId",
      "stripeCheckoutSessionId",
      "stripeEventId",
      "productSku",
      "entitlementScope",
    ],
    optionalInputKeys: ["amount", "currency"],
    sampleRequest: {
      contractId: "payment_entitlement_record",
      input: {
        userId: "dry_user_123",
        stripeCustomerId: "cus_dry_123",
        stripeCheckoutSessionId: "cs_dry_123",
        stripeEventId: "evt_dry_123",
        productSku: "deep_report_mvp",
        entitlementScope: "single_report",
      },
    },
  },
  consent_event_record: {
    requiredInputKeys: [
      "userId",
      "consentType",
      "policyVersion",
      "decision",
      "sourceRoute",
      "createdAt",
    ],
    optionalInputKeys: ["locale"],
    sampleRequest: {
      contractId: "consent_event_record",
      input: {
        userId: "dry_user_123",
        consentType: "privacy_acknowledgement",
        policyVersion: "mvp-policy-v1",
        decision: "accepted",
        sourceRoute: "/intake",
        createdAt: "2026-05-19T00:00:00.000Z",
      },
    },
  },
};

const sensitiveKeyPattern = /(secret|token|password|api[_-]?key|service[_-]?role)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyValue(value: unknown) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function isContractId(value: unknown): value is SystemWriterContractId {
  return typeof value === "string" && value in dryRunSpecs;
}

function getDisabledFlags(
  requiredFlags: SystemWriterFeatureFlag[],
  config: ReturnType<typeof getServerWriterConfig>,
) {
  return requiredFlags.filter((flag) => {
    if (flag === "ENABLE_SYSTEM_WRITERS") {
      return !config.systemWritersEnabled;
    }

    if (flag === "ENABLE_AI_GENERATION") {
      return !config.aiGenerationEnabled;
    }

    return !config.stripeWritesEnabled;
  });
}

function buildGateIssues(
  contract: SystemWriterContract,
  disabledFlags: SystemWriterFeatureFlag[],
  serviceRoleConfigured: boolean,
) {
  const issues: SystemWriterDryRunIssue[] = [];

  if (!serviceRoleConfigured) {
    issues.push({
      code: "missing_service_role",
      field: "serviceRoleConfigured",
      message:
        "Service-role configuration is not present, so system-owned writes are blocked.",
    });
  }

  for (const flag of disabledFlags) {
    issues.push({
      code: "feature_flag_disabled",
      field: flag,
      message: `${flag} is disabled for ${contract.id}.`,
    });
  }

  return issues;
}

export function buildSystemWriterDryRunCatalog(): SystemWriterDryRunCatalog {
  return {
    safeMode: true,
    wouldWrite: false,
    specs: Object.entries(dryRunSpecs).map(([contractId, spec]) => ({
      contractId: contractId as SystemWriterContractId,
      requiredInputKeys: spec.requiredInputKeys,
      optionalInputKeys: spec.optionalInputKeys,
      sampleRequest: spec.sampleRequest,
    })),
  };
}

export function runSystemWriterDryRun(
  requestBody: unknown,
): SystemWriterDryRunResult {
  const baseResult = {
    safeMode: true as const,
    wouldWrite: false as const,
    targetTables: [],
    requiredFlags: [],
    disabledFlags: [],
    requiredInputKeys: [],
    acceptedInputKeys: [],
    missingInputKeys: [],
    unexpectedInputKeys: [],
    issues: [],
  };

  if (!isRecord(requestBody)) {
    return {
      ...baseResult,
      status: "invalid_request",
      issues: [
        {
          code: "invalid_json",
          message: "Request body must be a JSON object.",
        },
      ],
      summary: "Dry-run rejected: request body is not a JSON object.",
    };
  }

  const contractId = requestBody.contractId;

  if (!isContractId(contractId)) {
    return {
      ...baseResult,
      status: "invalid_request",
      issues: [
        {
          code: "invalid_contract_id",
          field: "contractId",
          message: "Unknown or missing system writer contract id.",
        },
      ],
      summary: "Dry-run rejected: unknown system writer contract.",
    };
  }

  const catalog = buildSystemWriterContracts();
  const contract = catalog.contracts.find((item) => item.id === contractId);
  const spec = dryRunSpecs[contractId];

  if (!contract) {
    return {
      ...baseResult,
      status: "invalid_request",
      contractId,
      issues: [
        {
          code: "invalid_contract_id",
          field: "contractId",
          message: "Contract metadata is unavailable.",
        },
      ],
      summary: "Dry-run rejected: contract metadata is unavailable.",
    };
  }

  const input = requestBody.input;
  const inputIssues: SystemWriterDryRunIssue[] = [];

  if (input !== undefined && !isRecord(input)) {
    inputIssues.push({
      code: "invalid_input",
      field: "input",
      message: "Input must be a JSON object when provided.",
    });
  }

  const inputRecord = isRecord(input) ? input : {};
  const allowedInputKeys = new Set([
    ...spec.requiredInputKeys,
    ...spec.optionalInputKeys,
  ]);
  const inputKeys = Object.keys(inputRecord);
  const missingInputKeys = spec.requiredInputKeys.filter(
    (key) => !isNonEmptyValue(inputRecord[key]),
  );
  const unexpectedInputKeys = inputKeys.filter((key) => !allowedInputKeys.has(key));
  const sensitiveInputKeys = inputKeys.filter((key) =>
    sensitiveKeyPattern.test(key),
  );
  const acceptedInputKeys = inputKeys.filter(
    (key) => allowedInputKeys.has(key) && !sensitiveKeyPattern.test(key),
  );

  for (const key of missingInputKeys) {
    inputIssues.push({
      code: "missing_required_input",
      field: key,
      message: `${key} is required for ${contractId}.`,
    });
  }

  for (const key of unexpectedInputKeys) {
    inputIssues.push({
      code: "unexpected_input_key",
      field: key,
      message: `${key} is not part of the dry-run input contract.`,
    });
  }

  for (const key of sensitiveInputKeys) {
    inputIssues.push({
      code: "sensitive_input_key",
      field: key,
      message: `${key} looks sensitive and must not be sent to this dry-run endpoint.`,
    });
  }

  const config = getServerWriterConfig();
  const disabledFlags = getDisabledFlags(contract.requiredFlags, config);
  const gateIssues = buildGateIssues(
    contract,
    disabledFlags,
    config.serviceRoleConfigured,
  );
  const issues = [...inputIssues, ...gateIssues];
  const hasRequestErrors =
    inputIssues.some((issue) => issue.code !== "unexpected_input_key") ||
    sensitiveInputKeys.length > 0;
  const blockedByGate = gateIssues.length > 0;
  const status = hasRequestErrors
    ? "invalid_request"
    : blockedByGate
      ? "blocked_by_gate"
      : "dry_run_ready";

  return {
    safeMode: true,
    wouldWrite: false,
    status,
    contractId,
    targetTables: contract.targetTables,
    requiredFlags: contract.requiredFlags,
    disabledFlags,
    requiredInputKeys: spec.requiredInputKeys,
    acceptedInputKeys,
    missingInputKeys,
    unexpectedInputKeys,
    idempotencyKeyTemplate: contract.idempotencyKey,
    receivedIdempotencyKey:
      typeof requestBody.idempotencyKey === "string" &&
      requestBody.idempotencyKey.trim().length > 0,
    issues,
    summary:
      status === "dry_run_ready"
        ? "Dry-run request is shaped correctly, but no write was performed."
        : status === "blocked_by_gate"
          ? "Dry-run request shape is valid, but environment gates block the writer."
          : "Dry-run rejected because request validation failed.",
  };
}
