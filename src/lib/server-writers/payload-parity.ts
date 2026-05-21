import "server-only";

import { buildSystemWriterContracts } from "@/lib/server-writers/contracts";
import {
  buildSystemWriterDryRunCatalog,
  runSystemWriterDryRun,
} from "@/lib/server-writers/dry-run";
import { buildServerWriterStubCatalog } from "@/lib/server-writers/server-writer-stubs";
import type { SystemWriterDryRunResult } from "@/types/system-writer-dry-run";
import type { SystemWriterContractId } from "@/types/system-writer-contract";
import type {
  WriterPayloadParityCheck,
  WriterPayloadParityFixture,
  WriterPayloadParityPayload,
  WriterPayloadParityProbeResult,
} from "@/types/writer-payload-parity";

const sensitiveKeyPattern = /(secret|token|password|api[_-]?key|service[_-]?role)/i;

function check(input: WriterPayloadParityCheck): WriterPayloadParityCheck {
  return input;
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

function inputKeysOf(input: unknown) {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return [];
  }

  return Object.keys(input);
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function sampleHasAllRequiredInputs(
  sampleInputKeys: string[],
  requiredInputKeys: string[],
) {
  const sampleKeys = new Set(sampleInputKeys);
  return requiredInputKeys.every((key) => sampleKeys.has(key));
}

function unexpectedInputKeys(
  sampleInputKeys: string[],
  requiredInputKeys: string[],
  optionalInputKeys: string[],
) {
  const allowedKeys = new Set([...requiredInputKeys, ...optionalInputKeys]);
  return sampleInputKeys.filter((key) => !allowedKeys.has(key));
}

function sensitiveInputKeys(sampleInputKeys: string[]) {
  return sampleInputKeys.filter((key) => sensitiveKeyPattern.test(key));
}

function dryRunShapeStatus(result: SystemWriterDryRunResult) {
  return result.status === "dry_run_ready" ? "dry_run_ready" : "blocked_by_gate";
}

function buildFixtureChecks(input: {
  contractId: SystemWriterContractId;
  contractPresent: boolean;
  stubPresent: boolean;
  sampleHasAllRequired: boolean;
  sampleUnexpectedKeys: string[];
  sampleSensitiveKeys: string[];
  dryRunResult: SystemWriterDryRunResult;
}) {
  const validationIssues = input.dryRunResult.issues.filter(
    (issue) =>
      issue.code !== "missing_service_role" &&
      issue.code !== "feature_flag_disabled",
  );

  return [
    check({
      id: "contract_metadata_present",
      category: "contract_coverage",
      title: "Contract metadata present",
      passed: input.contractPresent,
      blocking: true,
      detail: `${input.contractId} has controlled writer contract metadata.`,
    }),
    check({
      id: "dry_run_sample_has_required_inputs",
      category: "dry_run_shape",
      title: "Dry-run sample has required inputs",
      passed: input.sampleHasAllRequired,
      blocking: true,
      detail: input.sampleHasAllRequired
        ? "The dry-run sample includes every required input key."
        : "The dry-run sample is missing one or more required input keys.",
    }),
    check({
      id: "dry_run_sample_has_no_unexpected_inputs",
      category: "dry_run_shape",
      title: "Dry-run sample has no unexpected inputs",
      passed: input.sampleUnexpectedKeys.length === 0,
      blocking: true,
      detail:
        input.sampleUnexpectedKeys.length === 0
          ? "The dry-run sample contains only required or optional input keys."
          : `Unexpected keys: ${input.sampleUnexpectedKeys.join(", ")}.`,
    }),
    check({
      id: "dry_run_sample_has_no_sensitive_keys",
      category: "sensitive_input_guard",
      title: "Dry-run sample has no sensitive keys",
      passed: input.sampleSensitiveKeys.length === 0,
      blocking: true,
      detail:
        input.sampleSensitiveKeys.length === 0
          ? "The sample request does not include secret, token, password, API key, or service-role-like input keys."
          : `Sensitive-looking keys: ${input.sampleSensitiveKeys.join(", ")}.`,
    }),
    check({
      id: "dry_run_validation_has_no_shape_errors",
      category: "dry_run_shape",
      title: "Dry-run validation has no shape errors",
      passed: validationIssues.length === 0,
      blocking: true,
      detail:
        validationIssues.length === 0
          ? "The dry-run sample is accepted by shape validation; only environment gates may block it."
          : `Shape issues: ${validationIssues
              .map((issue) => issue.code)
              .join(", ")}.`,
    }),
    check({
      id: "stub_probe_uses_same_contract_id",
      category: "stub_probe_shape",
      title: "Stub probe uses same contract id",
      passed: input.stubPresent,
      blocking: true,
      detail: input.stubPresent
        ? "The inert stub probe request uses the same contract id as the dry-run sample."
        : "No inert stub exists for this contract id.",
    }),
    check({
      id: "future_writer_shape_matches_dry_run",
      category: "future_writer_shape",
      title: "Future writer shape matches dry-run",
      passed: input.sampleHasAllRequired && input.sampleUnexpectedKeys.length === 0,
      blocking: true,
      detail:
        "The future writer request fixture is derived from the dry-run required and optional input keys.",
    }),
    check({
      id: "idempotency_template_present",
      category: "idempotency",
      title: "Idempotency template present",
      passed: Boolean(input.dryRunResult.idempotencyKeyTemplate),
      blocking: true,
      detail:
        "The parity fixture carries the controlled idempotency key template but does not reserve a key.",
    }),
    check({
      id: "environment_gates_remain_blocking",
      category: "gate_alignment",
      title: "Environment gates remain blocking",
      passed:
        input.dryRunResult.status === "blocked_by_gate" ||
        input.dryRunResult.status === "dry_run_ready",
      blocking: true,
      detail:
        "Fixture validation may run dry-run shape checks, but it does not bypass disabled service-role, AI, Stripe, audit, idempotency, or rollback gates.",
    }),
  ];
}

function buildSharedChecks(fixtures: WriterPayloadParityFixture[]) {
  const allFixtureChecksPassed = fixtures.every((fixture) =>
    fixture.checks.every((fixtureCheck) => fixtureCheck.passed),
  );

  return [
    check({
      id: "all_contracts_have_fixtures",
      category: "contract_coverage",
      title: "All contracts have fixtures",
      passed: fixtures.length === 8,
      blocking: true,
      detail:
        "Every controlled writer contract has a dry-run sample, stub probe request, and future writer request shape.",
    }),
    check({
      id: "all_fixture_checks_pass",
      category: "future_writer_shape",
      title: "All fixture checks pass",
      passed: allFixtureChecksPassed,
      blocking: true,
      detail:
        "Every fixture keeps required inputs, optional inputs, stub probe contract ids, and idempotency templates aligned.",
    }),
    check({
      id: "no_sensitive_fixture_keys",
      category: "sensitive_input_guard",
      title: "No sensitive fixture keys",
      passed: fixtures.every(
        (fixture) => fixture.sampleSensitiveInputKeys.length === 0,
      ),
      blocking: true,
      detail:
        "Fixtures must not include secret, token, password, API key, or service-role-like input keys.",
    }),
    check({
      id: "future_writer_execution_blocked",
      category: "gate_alignment",
      title: "Future writer execution blocked",
      passed: fixtures.every((fixture) => !fixture.wouldExecuteFutureWriter),
      blocking: true,
      detail:
        "Parity fixtures do not execute future writers, create clients, write rows, call AI, or call Stripe.",
    }),
  ];
}

function buildFixtures(): WriterPayloadParityFixture[] {
  const catalog = buildSystemWriterDryRunCatalog();
  const contracts = buildSystemWriterContracts();
  const stubs = buildServerWriterStubCatalog();
  const contractsById = Object.fromEntries(
    contracts.contracts.map((contract) => [contract.id, contract]),
  );
  const stubIds = new Set(stubs.map((stub) => stub.contractId));

  return catalog.specs.map((spec) => {
    const contract = contractsById[spec.contractId];
    const sampleInputKeys = uniqueSorted(inputKeysOf(spec.sampleRequest.input));
    const allRequiredPresent = sampleHasAllRequiredInputs(
      sampleInputKeys,
      spec.requiredInputKeys,
    );
    const unexpectedKeys = unexpectedInputKeys(
      sampleInputKeys,
      spec.requiredInputKeys,
      spec.optionalInputKeys,
    );
    const sensitiveKeys = sensitiveInputKeys(sampleInputKeys);
    const dryRunResult = runSystemWriterDryRun(spec.sampleRequest);
    const contractPresent = Boolean(contract);
    const stubPresent = stubIds.has(spec.contractId);
    const idempotencyKeyTemplate =
      dryRunResult.idempotencyKeyTemplate ?? contract?.idempotencyKey ?? "";
    const checks = buildFixtureChecks({
      contractId: spec.contractId,
      contractPresent,
      stubPresent,
      sampleHasAllRequired: allRequiredPresent,
      sampleUnexpectedKeys: unexpectedKeys,
      sampleSensitiveKeys: sensitiveKeys,
      dryRunResult,
    });

    return {
      contractId: spec.contractId,
      category: contract?.category ?? "compliance",
      targetTables: contract?.targetTables ?? [],
      requiredFlags: contract?.requiredFlags ?? [],
      requiredInputKeys: spec.requiredInputKeys,
      optionalInputKeys: spec.optionalInputKeys,
      dryRunSampleRequest: spec.sampleRequest,
      stubProbeRequest: {
        contractId: spec.contractId,
      },
      futureWriterRequestShape: {
        contractId: spec.contractId,
        inputKeys: uniqueSorted([
          ...spec.requiredInputKeys,
          ...spec.optionalInputKeys,
        ]),
        requiredInputKeys: spec.requiredInputKeys,
        optionalInputKeys: spec.optionalInputKeys,
        idempotencyKeyTemplate,
        wouldAcceptSameInputAsDryRun: true,
        wouldWrite: false,
      },
      idempotencyKeyTemplate,
      sampleHasAllRequiredInputs: allRequiredPresent,
      sampleUnexpectedInputKeys: unexpectedKeys,
      sampleSensitiveInputKeys: sensitiveKeys,
      dryRunValidationStatus: dryRunShapeStatus(dryRunResult),
      wouldRunDryRun: true,
      wouldProbeStub: true,
      wouldExecuteFutureWriter: false,
      wouldCreateServiceRoleClient: false,
      wouldReadServiceRoleSecret: false,
      wouldWriteRows: false,
      wouldCallAi: false,
      wouldCallStripe: false,
      checks,
    } satisfies WriterPayloadParityFixture;
  });
}

export function buildWriterPayloadParity(): WriterPayloadParityPayload {
  const fixtures = buildFixtures();
  const sharedChecks = buildSharedChecks(fixtures);
  const allFixturesAligned =
    fixtures.every((fixture) =>
      fixture.checks.every((fixtureCheck) => fixtureCheck.passed),
    ) && sharedChecks.every((sharedCheck) => sharedCheck.passed);

  return {
    safeMode: true,
    readOnly: true,
    parityMode: "fixture_only",
    wouldRunDryRunValidation: true,
    wouldProbeInertStubs: true,
    wouldExecuteFutureWriter: false,
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
    allFixturesAligned,
    fixtureCount: fixtures.length,
    globalRules: [
      "This stage defines fixture-only request parity; it does not implement real writer execution.",
      "Dry-run samples, inert stub probe requests, and future writer request shapes must share the same contract ids and input keys.",
      "Parity fixtures may run dry-run validation, but only to inspect request shape and disabled gates.",
      "Future writer request shapes carry idempotency templates only; they do not reserve idempotency keys.",
      "No service-role client, secret read, database write, AI call, Stripe call, report unlock, audit write, idempotency mutation, or compensation write can happen in this stage.",
    ],
    sharedChecks,
    fixtures,
  };
}

export function probeWriterPayloadParity(
  requestBody: unknown,
): WriterPayloadParityProbeResult {
  const payload = buildWriterPayloadParity();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      parityMode: "fixture_only",
      wouldRunDryRunValidation: false,
      wouldProbeInertStub: false,
      wouldExecuteFutureWriter: false,
      wouldCreateServiceRoleClient: false,
      wouldReadServiceRoleSecret: false,
      wouldWriteRows: false,
      wouldCallAi: false,
      wouldCallStripe: false,
      checks: payload.sharedChecks,
      summary:
        "Payload parity probe blocked: request body must be a JSON object and no writer execution was attempted.",
    };
  }

  const contractId = (requestBody as { contractId?: unknown }).contractId;

  if (!isContractId(contractId)) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      parityMode: "fixture_only",
      wouldRunDryRunValidation: false,
      wouldProbeInertStub: false,
      wouldExecuteFutureWriter: false,
      wouldCreateServiceRoleClient: false,
      wouldReadServiceRoleSecret: false,
      wouldWriteRows: false,
      wouldCallAi: false,
      wouldCallStripe: false,
      checks: payload.sharedChecks,
      summary:
        "Payload parity probe blocked: unknown contract id and no writer execution was attempted.",
    };
  }

  const fixture = payload.fixtures.find((item) => item.contractId === contractId);

  return {
    safeMode: true,
    readOnly: true,
    blocked: true,
    contractId,
    parityMode: "fixture_only",
    dryRunValidationStatus: fixture?.dryRunValidationStatus,
    wouldRunDryRunValidation: true,
    wouldProbeInertStub: true,
    wouldExecuteFutureWriter: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldWriteRows: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    checks: fixture?.checks ?? payload.sharedChecks,
    summary:
      "Payload parity probe blocked as designed: dry-run, stub probe, and future writer request shape were compared, but no future writer was executed.",
  };
}
