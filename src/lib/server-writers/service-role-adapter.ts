import "server-only";

import { getServerWriterConfig } from "@/lib/server-writers/config";
import { buildSystemWriterContracts } from "@/lib/server-writers/contracts";
import type {
  SystemWriterContract,
  SystemWriterContractId,
  SystemWriterFeatureFlag,
} from "@/types/system-writer-contract";
import type {
  ServiceRoleAdapterBlockCode,
  ServiceRoleAdapterCheck,
  ServiceRoleAdapterOperation,
  ServiceRoleAdapterPlan,
  ServiceRoleAdapterProbeResult,
  ServiceRoleAdapterStatusPayload,
} from "@/types/service-role-adapter";

const operationByContract: Record<
  SystemWriterContractId,
  ServiceRoleAdapterOperation
> = {
  agent_profile_generation: "insert",
  relation_edge_generation: "upsert",
  simulation_run_create: "insert",
  event_tick_append: "append",
  claim_generation: "insert",
  report_generation: "upsert",
  payment_entitlement_record: "append",
  consent_event_record: "append",
};

const moduleByContract: Record<SystemWriterContractId, string> = {
  agent_profile_generation:
    "@/lib/server-writers/adapters/agent-profile-writer.server",
  relation_edge_generation:
    "@/lib/server-writers/adapters/relation-edge-writer.server",
  simulation_run_create:
    "@/lib/server-writers/adapters/simulation-run-writer.server",
  event_tick_append: "@/lib/server-writers/adapters/event-writer.server",
  claim_generation: "@/lib/server-writers/adapters/claim-writer.server",
  report_generation: "@/lib/server-writers/adapters/report-writer.server",
  payment_entitlement_record:
    "@/lib/server-writers/adapters/payment-entitlement-writer.server",
  consent_event_record: "@/lib/server-writers/adapters/consent-writer.server",
};

function hasFlag(
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

function getFlagBlockCode(
  flag: SystemWriterFeatureFlag,
): ServiceRoleAdapterBlockCode {
  if (flag === "ENABLE_SYSTEM_WRITERS") {
    return "system_writers_disabled";
  }

  if (flag === "ENABLE_AI_GENERATION") {
    return "ai_generation_disabled";
  }

  return "stripe_writes_disabled";
}

function uniqueBlockCodes(
  codes: ServiceRoleAdapterBlockCode[],
): ServiceRoleAdapterBlockCode[] {
  return Array.from(new Set(codes));
}

function buildGlobalBlockedCodes(
  config: ReturnType<typeof getServerWriterConfig>,
) {
  const codes: ServiceRoleAdapterBlockCode[] = [
    "real_writes_forbidden",
    "client_creation_forbidden",
  ];

  if (!config.serviceRoleConfigured) {
    codes.push("service_role_missing");
  }

  if (!config.systemWritersEnabled) {
    codes.push("system_writers_disabled");
  }

  if (!config.aiGenerationEnabled) {
    codes.push("ai_generation_disabled");
  }

  if (!config.stripeWritesEnabled) {
    codes.push("stripe_writes_disabled");
  }

  return uniqueBlockCodes(codes);
}

function buildChecks(
  contract: SystemWriterContract,
  config: ReturnType<typeof getServerWriterConfig>,
): ServiceRoleAdapterCheck[] {
  return [
    {
      id: "server_only_module",
      title: "Server-only module boundary",
      passed: true,
      blocking: true,
      detail:
        "The adapter boundary is defined in a server-only module and is not importable by client components.",
    },
    {
      id: "service_role_configured",
      title: "Service-role configured",
      passed: config.serviceRoleConfigured,
      blocking: true,
      detail:
        "A real service-role client cannot be created unless the service-role key is configured.",
    },
    {
      id: "system_writers_enabled",
      title: "System writers enabled",
      passed: config.systemWritersEnabled,
      blocking: true,
      detail:
        "ENABLE_SYSTEM_WRITERS must be true before any system-owned write can be considered.",
    },
    ...contract.requiredFlags
      .filter((flag) => flag !== "ENABLE_SYSTEM_WRITERS")
      .map((flag) => ({
        id: flag,
        title: `${flag} enabled`,
        passed: hasFlag(flag, config),
        blocking: true,
        detail: `${flag} must be true for ${contract.id}.`,
      })),
    {
      id: "real_write_kill_switch",
      title: "Real-write kill switch",
      passed: false,
      blocking: true,
      detail:
        "This adapter is intentionally disabled. It never creates a Supabase service-role client and never writes rows.",
    },
  ];
}

function buildPlan(
  contract: SystemWriterContract,
  config: ReturnType<typeof getServerWriterConfig>,
): ServiceRoleAdapterPlan {
  const flagBlocks = contract.requiredFlags
    .filter((flag) => !hasFlag(flag, config))
    .map(getFlagBlockCode);
  const blockedCodes = uniqueBlockCodes([
    ...(!config.serviceRoleConfigured ? ["service_role_missing" as const] : []),
    ...flagBlocks,
    "real_writes_forbidden",
    "client_creation_forbidden",
  ]);

  return {
    contractId: contract.id,
    targetTables: contract.targetTables,
    intendedOperation: operationByContract[contract.id],
    serverOnlyModule: moduleByContract[contract.id],
    requiredFlags: contract.requiredFlags,
    wouldCreateClient: false,
    wouldWrite: false,
    blocked: true,
    blockedCodes,
    checks: buildChecks(contract, config),
  };
}

function isContractId(value: unknown): value is SystemWriterContractId {
  return (
    typeof value === "string" &&
    value in operationByContract &&
    value in moduleByContract
  );
}

function isOperation(value: unknown): value is ServiceRoleAdapterOperation {
  return (
    value === "insert" ||
    value === "upsert" ||
    value === "update" ||
    value === "append"
  );
}

export function buildDisabledServiceRoleAdapterStatus(): ServiceRoleAdapterStatusPayload {
  const config = getServerWriterConfig();
  const contracts = buildSystemWriterContracts();

  return {
    safeMode: true,
    adapterMode: "disabled",
    wouldCreateClient: false,
    wouldWrite: false,
    serviceRoleConfigured: config.serviceRoleConfigured,
    systemWritersEnabled: config.systemWritersEnabled,
    aiGenerationEnabled: config.aiGenerationEnabled,
    stripeWritesEnabled: config.stripeWritesEnabled,
    globalBlockedCodes: buildGlobalBlockedCodes(config),
    adapterRules: [
      "This module is server-only and inert by default.",
      "No Supabase service-role client is created while the adapter is disabled.",
      "No insert, upsert, update, delete, RPC, AI call, Stripe call, report unlock, or entitlement grant may occur from this boundary.",
      "Every future real writer must pass dry-run validation and guardrail rollout gates first.",
      "Adapter responses may expose booleans and block codes only; they must not expose secret values or raw environment configuration.",
    ],
    plans: contracts.contracts.map((contract) => buildPlan(contract, config)),
  };
}

export function probeDisabledServiceRoleAdapter(
  requestBody: unknown,
): ServiceRoleAdapterProbeResult {
  const status = buildDisabledServiceRoleAdapterStatus();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      adapterMode: "disabled",
      wouldCreateClient: false,
      wouldWrite: false,
      blocked: true,
      blockedCodes: uniqueBlockCodes([
        "unknown_contract",
        ...status.globalBlockedCodes,
      ]),
      checks: [],
      summary:
        "Adapter probe blocked: request body must be a JSON object and no client/write was attempted.",
    };
  }

  const contractId = (requestBody as { contractId?: unknown }).contractId;
  const requestedOperation = (requestBody as { operation?: unknown }).operation;

  if (!isContractId(contractId)) {
    return {
      safeMode: true,
      adapterMode: "disabled",
      wouldCreateClient: false,
      wouldWrite: false,
      blocked: true,
      blockedCodes: uniqueBlockCodes([
        "unknown_contract",
        ...status.globalBlockedCodes,
      ]),
      checks: [],
      summary:
        "Adapter probe blocked: unknown contract id and no client/write was attempted.",
    };
  }

  const plan = status.plans.find((item) => item.contractId === contractId);
  const expectedOperation = operationByContract[contractId];
  const operation = isOperation(requestedOperation)
    ? requestedOperation
    : expectedOperation;

  return {
    safeMode: true,
    adapterMode: "disabled",
    contractId,
    requestedOperation: operation,
    expectedOperation,
    wouldCreateClient: false,
    wouldWrite: false,
    blocked: true,
    blockedCodes: plan?.blockedCodes ?? status.globalBlockedCodes,
    checks: plan?.checks ?? [],
    summary:
      operation === expectedOperation
        ? "Adapter probe blocked as expected: operation matches the plan, but the disabled adapter never creates a client or writes rows."
        : "Adapter probe blocked: requested operation differs from the planned operation and no client/write was attempted.",
  };
}
