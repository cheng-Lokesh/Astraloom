import "server-only";

import type {
  ServerWriterStubCheck,
  ServerWriterStubModule,
  ServerWriterStubProbeResult,
} from "@/types/server-writer-stub";
import type { ServiceRoleAdapterOperation } from "@/types/service-role-adapter";
import type {
  SystemWriterContractCategory,
  SystemWriterContractId,
} from "@/types/system-writer-contract";

type CreateBlockedServerWriterStubInput = {
  contractId: SystemWriterContractId;
  category: SystemWriterContractCategory;
  targetTables: string[];
  intendedOperation: ServiceRoleAdapterOperation;
  modulePath: string;
  exportedSymbol: string;
  summary: string;
};

function check(input: ServerWriterStubCheck): ServerWriterStubCheck {
  return input;
}

function buildStubChecks(input: CreateBlockedServerWriterStubInput) {
  return [
    check({
      id: "starts_with_server_only_import",
      category: "server_only_boundary",
      title: "Starts with server-only import",
      passed: true,
      blocking: true,
      detail:
        "The stub file starts with import \"server-only\" and is reserved for server execution only.",
    }),
    check({
      id: "client_import_forbidden",
      category: "client_bundle",
      title: "Client import forbidden",
      passed: true,
      blocking: true,
      detail:
        "Client components must receive serialized metadata only and must never import this writer stub.",
    }),
    check({
      id: "real_implementation_absent",
      category: "privileged_client",
      title: "Real implementation absent",
      passed: true,
      blocking: true,
      detail:
        "The stub does not import a real writer implementation or privileged Supabase client factory.",
    }),
    check({
      id: "secret_read_blocked",
      category: "secret_handling",
      title: "Secret read blocked",
      passed: true,
      blocking: true,
      detail:
        "The stub does not read, serialize, log, or return service-role secret values.",
    }),
    check({
      id: "write_path_blocked",
      category: "write_block",
      title: "Write path blocked",
      passed: true,
      blocking: true,
      detail: `The stub cannot ${input.intendedOperation} ${input.targetTables.join(
        ", ",
      )}; it only returns blocked metadata.`,
    }),
    check({
      id: "external_side_effects_blocked",
      category: "external_side_effect",
      title: "External side effects blocked",
      passed: true,
      blocking: true,
      detail:
        "The stub does not call AI providers, Stripe, webhooks, storage, RPC, email, or report unlock paths.",
    }),
    check({
      id: "history_mutation_blocked",
      category: "history_safety",
      title: "History mutation blocked",
      passed: true,
      blocking: true,
      detail:
        "The stub cannot mutate generated history, payment history, consent history, audit rows, idempotency keys, or compensation rows.",
    }),
  ];
}

export function createBlockedServerWriterStub(
  input: CreateBlockedServerWriterStubInput,
): ServerWriterStubModule {
  return {
    contractId: input.contractId,
    category: input.category,
    targetTables: input.targetTables,
    intendedOperation: input.intendedOperation,
    modulePath: input.modulePath,
    exportedSymbol: input.exportedSymbol,
    mode: "inert_server_only_stub",
    startsWithServerOnlyImport: true,
    serverOnly: true,
    inert: true,
    clientImportAllowed: false,
    browserBundleAllowed: false,
    wouldImportRealWriterImplementation: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldWriteRows: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    wouldUnlockReports: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKey: false,
    wouldWriteCompensationRows: false,
    summary: input.summary,
    checks: buildStubChecks(input),
  };
}

export function blockServerWriterStub(
  stub: ServerWriterStubModule,
): ServerWriterStubProbeResult {
  return {
    safeMode: true,
    readOnly: true,
    blocked: true,
    reasonCode: "inert_stub_noop",
    contractId: stub.contractId,
    modulePath: stub.modulePath,
    exportedSymbol: stub.exportedSymbol,
    importsInertServerOnlyStub: true,
    wouldImportRealWriterImplementation: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldWriteRows: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    wouldUnlockReports: false,
    checks: stub.checks,
    summary:
      "Writer stub probe blocked as designed: the inert server-only stub was imported, but no real implementation, privileged client, secret read, write, AI call, Stripe call, or report unlock was attempted.",
  };
}
