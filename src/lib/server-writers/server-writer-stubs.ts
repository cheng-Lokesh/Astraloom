import "server-only";

import {
  agentProfileWriterStub,
  probeAgentProfileWriterStub,
} from "@/lib/server-writers/adapters/agent-profile-writer.server";
import {
  claimWriterStub,
  probeClaimWriterStub,
} from "@/lib/server-writers/adapters/claim-writer.server";
import {
  consentWriterStub,
  probeConsentWriterStub,
} from "@/lib/server-writers/adapters/consent-writer.server";
import {
  eventWriterStub,
  probeEventWriterStub,
} from "@/lib/server-writers/adapters/event-writer.server";
import {
  paymentEntitlementWriterStub,
  probePaymentEntitlementWriterStub,
} from "@/lib/server-writers/adapters/payment-entitlement-writer.server";
import {
  relationEdgeWriterStub,
  probeRelationEdgeWriterStub,
} from "@/lib/server-writers/adapters/relation-edge-writer.server";
import {
  reportWriterStub,
  probeReportWriterStub,
} from "@/lib/server-writers/adapters/report-writer.server";
import {
  probeSimulationRunWriterStub,
  simulationRunWriterStub,
} from "@/lib/server-writers/adapters/simulation-run-writer.server";
import { getServerWriterConfig } from "@/lib/server-writers/config";
import type {
  ServerWriterStubCheck,
  ServerWriterStubModule,
  ServerWriterStubPayload,
  ServerWriterStubProbeResult,
} from "@/types/server-writer-stub";
import type { SystemWriterContractId } from "@/types/system-writer-contract";

const stubModules: ServerWriterStubModule[] = [
  agentProfileWriterStub,
  relationEdgeWriterStub,
  simulationRunWriterStub,
  eventWriterStub,
  claimWriterStub,
  reportWriterStub,
  paymentEntitlementWriterStub,
  consentWriterStub,
];

const probeByContract: Record<
  SystemWriterContractId,
  () => ServerWriterStubProbeResult
> = {
  agent_profile_generation: probeAgentProfileWriterStub,
  relation_edge_generation: probeRelationEdgeWriterStub,
  simulation_run_create: probeSimulationRunWriterStub,
  event_tick_append: probeEventWriterStub,
  claim_generation: probeClaimWriterStub,
  report_generation: probeReportWriterStub,
  payment_entitlement_record: probePaymentEntitlementWriterStub,
  consent_event_record: probeConsentWriterStub,
};

function check(input: ServerWriterStubCheck): ServerWriterStubCheck {
  return input;
}

function buildSharedChecks(): ServerWriterStubCheck[] {
  return [
    check({
      id: "all_stubs_static_server_imports",
      category: "server_only_boundary",
      title: "All stubs are static server imports",
      passed: true,
      blocking: true,
      detail:
        "The registry imports inert .server stubs from server-only code only; client pages receive serialized metadata.",
    }),
    check({
      id: "no_privileged_client_factory",
      category: "privileged_client",
      title: "No privileged client factory",
      passed: true,
      blocking: true,
      detail:
        "No stub imports a Supabase service-role client factory or constructs a privileged client.",
    }),
    check({
      id: "no_secret_value_access",
      category: "secret_handling",
      title: "No secret value access",
      passed: true,
      blocking: true,
      detail:
        "Stub metadata can report safe booleans, but stubs never read service-role secret values.",
    }),
    check({
      id: "no_write_api_surface",
      category: "write_block",
      title: "No write API surface",
      passed: true,
      blocking: true,
      detail:
        "Stub probes return blocked results only and expose no insert, update, upsert, delete, RPC, storage, audit, idempotency, rollback, entitlement, or report-unlock method.",
    }),
    check({
      id: "no_external_side_effects",
      category: "external_side_effect",
      title: "No external side effects",
      passed: true,
      blocking: true,
      detail:
        "Stub probes do not call AI providers, Stripe, webhooks, email, storage, or background executors.",
    }),
  ];
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

export function buildServerWriterStubCatalog(): ServerWriterStubModule[] {
  return stubModules;
}

export function buildServerWriterStubStatus(): ServerWriterStubPayload {
  const config = getServerWriterConfig();

  return {
    safeMode: true,
    readOnly: true,
    stubMode: "inert_server_only_stub",
    importsInertServerOnlyStubs: true,
    wouldImportRealWriterImplementation: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldExposeServiceRoleSecret: false,
    wouldWriteRows: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    wouldUnlockReports: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKeys: false,
    wouldWriteCompensationRows: false,
    serviceRoleConfigured: config.serviceRoleConfigured,
    systemWritersEnabled: config.systemWritersEnabled,
    aiGenerationEnabled: config.aiGenerationEnabled,
    stripeWritesEnabled: config.stripeWritesEnabled,
    globalRules: [
      "This stage imports only inert server-only writer stubs; no real writer implementation exists.",
      "Every stub starts with import \"server-only\" and is intended for server-side boundaries only.",
      "Stub probes return blocked metadata only and cannot create clients, read secrets, write rows, call AI, call Stripe, or unlock reports.",
      "Client components must never import .server stubs. Browser pages receive serialized metadata from server routes only.",
      "Real writers remain out of scope until request schema parity, idempotency, audit persistence, rollback persistence, cost controls, and rollout approval are reviewed together.",
    ],
    sharedChecks: buildSharedChecks(),
    stubs: stubModules,
  };
}

export function probeServerWriterStub(
  requestBody: unknown,
): ServerWriterStubProbeResult {
  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      reasonCode: "invalid_request",
      importsInertServerOnlyStub: false,
      wouldImportRealWriterImplementation: false,
      wouldCreateServiceRoleClient: false,
      wouldReadServiceRoleSecret: false,
      wouldWriteRows: false,
      wouldCallAi: false,
      wouldCallStripe: false,
      wouldUnlockReports: false,
      checks: buildSharedChecks(),
      summary:
        "Writer stub probe blocked: request body must be a JSON object and no stub, client, secret, write, AI, Stripe, or report unlock was attempted.",
    };
  }

  const contractId = (requestBody as { contractId?: unknown }).contractId;

  if (!isContractId(contractId)) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      reasonCode: "unknown_contract",
      importsInertServerOnlyStub: false,
      wouldImportRealWriterImplementation: false,
      wouldCreateServiceRoleClient: false,
      wouldReadServiceRoleSecret: false,
      wouldWriteRows: false,
      wouldCallAi: false,
      wouldCallStripe: false,
      wouldUnlockReports: false,
      checks: buildSharedChecks(),
      summary:
        "Writer stub probe blocked: unknown contract id and no stub, client, secret, write, AI, Stripe, or report unlock was attempted.",
    };
  }

  return probeByContract[contractId]();
}
