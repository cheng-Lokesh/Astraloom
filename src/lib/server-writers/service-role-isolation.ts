import "server-only";

import { buildSystemWriterContracts } from "@/lib/server-writers/contracts";
import { getServerWriterConfig } from "@/lib/server-writers/config";
import { buildDisabledServiceRoleAdapterStatus } from "@/lib/server-writers/service-role-adapter";
import { buildServerWriterStubCatalog } from "@/lib/server-writers/server-writer-stubs";
import type {
  ServiceRoleIsolationCheck,
  ServiceRoleIsolationPayload,
  ServiceRoleIsolationPlan,
  ServiceRoleIsolationProbeResult,
} from "@/types/service-role-isolation";
import type { SystemWriterContractId } from "@/types/system-writer-contract";

function check(input: ServiceRoleIsolationCheck): ServiceRoleIsolationCheck {
  return input;
}

function moduleSuffixOk(modulePath: string) {
  return modulePath.endsWith(".server");
}

function planChecks(
  modulePath: string,
  serverOnlyStubExists: boolean,
): ServiceRoleIsolationCheck[] {
  return [
    check({
      id: "server_only_module_suffix",
      category: "server_only_boundary",
      title: "Server-only module suffix",
      passed: moduleSuffixOk(modulePath),
      blocking: true,
      detail:
        "Future writer module paths must end in .server so code review can identify privileged boundaries quickly.",
    }),
    check({
      id: "server_only_import_required",
      category: "server_only_boundary",
      title: "server-only import required",
      passed: serverOnlyStubExists,
      blocking: true,
      detail: serverOnlyStubExists
        ? "The inert writer stub exists as a .server module that starts with import \"server-only\"."
        : "Future writer module files must start with import \"server-only\" before they can be used.",
    }),
    check({
      id: "client_import_forbidden",
      category: "client_bundle",
      title: "Client import forbidden",
      passed: true,
      blocking: true,
      detail:
        "Client components must never import the future service-role writer module. The current harness exposes metadata only.",
    }),
    check({
      id: "runtime_import_blocked",
      category: "runtime_import",
      title: "Runtime import blocked",
      passed: true,
      blocking: true,
      detail:
        "This diagnostic harness does not dynamically import real writer implementations and cannot execute writer code.",
    }),
    check({
      id: "client_creation_blocked",
      category: "secret_handling",
      title: "Client creation blocked",
      passed: true,
      blocking: true,
      detail:
        "This harness never creates a Supabase service-role client and never reads the service-role secret value.",
    }),
    check({
      id: "write_path_blocked",
      category: "write_block",
      title: "Write path blocked",
      passed: true,
      blocking: true,
      detail:
        "No insert, upsert, update, delete, RPC, storage, AI, Stripe, entitlement, or report unlock operation can run from this harness.",
    }),
  ];
}

function buildBoundaryChecks(): ServiceRoleIsolationCheck[] {
  return [
    check({
      id: "harness_is_server_only",
      category: "server_only_boundary",
      title: "Harness is server-only",
      passed: true,
      blocking: true,
      detail:
        "The service-role isolation model lives in a module guarded by import \"server-only\".",
    }),
    check({
      id: "metadata_only_response",
      category: "runtime_import",
      title: "Metadata-only response",
      passed: true,
      blocking: true,
      detail:
        "The API returns manifest metadata and checks only. It does not execute planned writer code.",
    }),
    check({
      id: "secret_value_never_read",
      category: "secret_handling",
      title: "Secret value never read",
      passed: true,
      blocking: true,
      detail:
        "The harness reports only whether service-role configuration exists; it never serializes or reads the secret value.",
    }),
    check({
      id: "browser_bundle_blocked",
      category: "client_bundle",
      title: "Browser bundle blocked",
      passed: true,
      blocking: true,
      detail:
        "Browser pages receive safe booleans and module labels only, not privileged client factories or secret-bearing code.",
    }),
    check({
      id: "real_writes_forbidden",
      category: "write_block",
      title: "Real writes forbidden",
      passed: true,
      blocking: true,
      detail:
        "The harness has no write adapter and no privileged database operation path.",
    }),
  ];
}

function buildPlans(): ServiceRoleIsolationPlan[] {
  const adapterStatus = buildDisabledServiceRoleAdapterStatus();
  const stubs = buildServerWriterStubCatalog();
  const stubModulePaths = new Set(stubs.map((stub) => stub.modulePath));
  const contracts = buildSystemWriterContracts();
  const contractById = Object.fromEntries(
    contracts.contracts.map((contract) => [contract.id, contract]),
  ) as Record<SystemWriterContractId, (typeof contracts.contracts)[number]>;

  return adapterStatus.plans.map((plan) => ({
    contractId: plan.contractId,
    category: contractById[plan.contractId].category,
    targetTables: plan.targetTables,
    intendedOperation: plan.intendedOperation,
    serverOnlyModule: plan.serverOnlyModule,
    moduleSuffixOk: moduleSuffixOk(plan.serverOnlyModule),
    serverOnlyImportRequired: true,
    clientImportAllowed: false,
    browserBundleAllowed: false,
    wouldImportModule: false,
    wouldCreateClient: false,
    wouldReadSecretValue: false,
    wouldWrite: false,
    checks: planChecks(
      plan.serverOnlyModule,
      stubModulePaths.has(plan.serverOnlyModule),
    ),
  }));
}

function isContractId(value: unknown): value is SystemWriterContractId {
  return (
    value === "agent_profile_generation" ||
    value === "relation_edge_generation" ||
    value === "simulation_run_create" ||
    value === "event_tick_append" ||
    value === "claim_generation" ||
    value === "report_generation" ||
    value === "payment_entitlement_record" ||
    value === "consent_event_record"
  );
}

export function buildServiceRoleIsolationHarness(): ServiceRoleIsolationPayload {
  const config = getServerWriterConfig();

  return {
    safeMode: true,
    readOnly: true,
    harnessMode: "diagnostic_only",
    wouldImportServerWriter: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldExposeServiceRoleSecret: false,
    wouldWriteRows: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    serviceRoleConfigured: config.serviceRoleConfigured,
    systemWritersEnabled: config.systemWritersEnabled,
    aiGenerationEnabled: config.aiGenerationEnabled,
    stripeWritesEnabled: config.stripeWritesEnabled,
    globalRules: [
      "Current implementation is a diagnostic harness only; it does not import real writer implementations.",
      "Inert .server writer stubs may be inspected as metadata, but they expose no privileged write method.",
      "A future privileged Supabase client must live behind a server-only boundary and must never be imported by client components.",
      "The harness may expose booleans, module labels, and blocked checks only; it must not expose secret values or raw environment configuration.",
      "A future service-role writer must fail closed when the writer flag or required feature flag is disabled.",
      "No write, AI call, Stripe call, report unlock, entitlement grant, audit write, idempotency reservation, or compensation write can happen in this phase.",
    ],
    boundaryChecks: buildBoundaryChecks(),
    plans: buildPlans(),
  };
}

export function probeServiceRoleIsolation(
  requestBody: unknown,
): ServiceRoleIsolationProbeResult {
  const harness = buildServiceRoleIsolationHarness();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      wouldImportServerWriter: false,
      wouldCreateServiceRoleClient: false,
      wouldReadServiceRoleSecret: false,
      wouldWriteRows: false,
      blocked: true,
      checks: buildBoundaryChecks(),
      summary:
        "Isolation probe blocked: request body must be a JSON object and no real writer implementation import, client creation, secret read, or write was attempted.",
    };
  }

  const contractId = (requestBody as { contractId?: unknown }).contractId;

  if (!isContractId(contractId)) {
    return {
      safeMode: true,
      readOnly: true,
      wouldImportServerWriter: false,
      wouldCreateServiceRoleClient: false,
      wouldReadServiceRoleSecret: false,
      wouldWriteRows: false,
      blocked: true,
      checks: buildBoundaryChecks(),
      summary:
        "Isolation probe blocked: unknown contract id and no real writer implementation import, client creation, secret read, or write was attempted.",
    };
  }

  const plan = harness.plans.find((item) => item.contractId === contractId);

  return {
    safeMode: true,
    readOnly: true,
    contractId,
    serverOnlyModule: plan?.serverOnlyModule,
    wouldImportServerWriter: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldWriteRows: false,
    blocked: true,
    checks: plan?.checks ?? buildBoundaryChecks(),
    summary:
      "Isolation probe blocked as designed: the planned module was identified, but this harness does not import it, create a privileged client, read secrets, or write rows.",
  };
}
