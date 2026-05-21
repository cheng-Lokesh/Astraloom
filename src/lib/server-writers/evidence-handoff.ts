import "server-only";

import { buildWriterAuditModel } from "@/lib/server-writers/audit";
import { buildWriterIdempotencyModel } from "@/lib/server-writers/idempotency";
import { buildRequestRedactionFixtures } from "@/lib/server-writers/request-redaction";
import type { RequestRedactionFixture } from "@/types/request-redaction";
import type { SystemWriterContractId } from "@/types/system-writer-contract";
import type { WriterAuditEventContract } from "@/types/system-writer-audit";
import type { WriterIdempotencyContract } from "@/types/system-writer-idempotency";
import type {
  WriterEvidenceHandoffCheck,
  WriterEvidenceHandoffFixture,
  WriterEvidenceHandoffPayload,
  WriterEvidenceHandoffProbeResult,
} from "@/types/writer-evidence-handoff";

const futureAuditTableName = "writer_audit_events" as const;
const futureIdempotencyTableName = "writer_idempotency_keys" as const;
const forbiddenEvidenceFields = [
  "rawPayload",
  "rawRequest",
  "rawPrompt",
  "rawModelResponse",
  "rawStripePayload",
  "accessToken",
  "refreshToken",
  "password",
  "apiKey",
  "serviceRoleKey",
  "webhookSecret",
];

function check(input: WriterEvidenceHandoffCheck): WriterEvidenceHandoffCheck {
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

function shortHash(requestHash: string) {
  return requestHash.replace("sha256:", "").slice(0, 16);
}

function redactedPreviewKeys(fixture: RequestRedactionFixture) {
  return Object.keys(fixture.redactedPayloadPreview).sort();
}

function evidenceRef(contractId: SystemWriterContractId, requestHash: string) {
  return `redacted_evidence:${contractId}:${shortHash(requestHash)}`;
}

function sourceFixtureRef(contractId: SystemWriterContractId, requestHash: string) {
  return `request_redaction_fixture:${contractId}:${shortHash(requestHash)}`;
}

function auditEvidenceRef(contractId: SystemWriterContractId, requestHash: string) {
  return `audit_evidence:${contractId}:${shortHash(requestHash)}`;
}

function buildFixtureChecks(input: {
  fixture: WriterEvidenceHandoffFixture;
  redactionFixture: RequestRedactionFixture;
  auditContract?: WriterAuditEventContract;
  idempotencyContract?: WriterIdempotencyContract;
}) {
  const previewKeys = redactedPreviewKeys(input.redactionFixture);
  const draftValues = [
    ...Object.keys(input.fixture.auditEvidenceDraft),
    ...Object.keys(input.fixture.idempotencyEvidenceDraft),
  ];
  const forbiddenMatches = draftValues.filter((key) =>
    forbiddenEvidenceFields.some(
      (forbidden) => forbidden.toLowerCase() === key.toLowerCase(),
    ),
  );

  return [
    check({
      id: "redaction_fixture_present",
      category: "redaction_source",
      title: "Redaction fixture present",
      passed: Boolean(input.redactionFixture.requestHash),
      blocking: true,
      detail:
        "Handoff fixture is built from an existing request redaction fixture, not from raw payload input.",
    }),
    check({
      id: "request_hash_matches_redaction",
      category: "correlation",
      title: "Request hash matches redaction",
      passed: input.fixture.requestHash === input.redactionFixture.requestHash,
      blocking: true,
      detail:
        "Audit and idempotency evidence drafts carry the same requestHash produced by the redaction layer.",
    }),
    check({
      id: "redacted_preview_reference_only",
      category: "redaction_source",
      title: "Redacted preview reference only",
      passed:
        input.fixture.redactedPreviewKeyCount === previewKeys.length &&
        input.fixture.redactedEvidenceRef.startsWith("redacted_evidence:"),
      blocking: true,
      detail:
        "Handoff evidence references the redacted preview and key count; it does not copy raw request payloads.",
    }),
    check({
      id: "audit_contract_aligned",
      category: "audit_evidence",
      title: "Audit contract aligned",
      passed:
        Boolean(input.auditContract) &&
        input.fixture.auditEvidenceDraft.futureTableName ===
          futureAuditTableName &&
        input.fixture.auditEvidenceDraft.requestHash === input.fixture.requestHash,
      blocking: true,
      detail:
        "Future audit evidence draft uses the audit model table name and requestHash without writing an audit row.",
    }),
    check({
      id: "idempotency_contract_aligned",
      category: "idempotency_evidence",
      title: "Idempotency contract aligned",
      passed:
        Boolean(input.idempotencyContract) &&
        input.fixture.idempotencyEvidenceDraft.futureTableName ===
          futureIdempotencyTableName &&
        input.fixture.idempotencyEvidenceDraft.requestHash ===
          input.fixture.requestHash &&
        input.fixture.auditEvidenceDraft.idempotencyKeyTemplate ===
          input.fixture.idempotencyEvidenceDraft.keyTemplate,
      blocking: true,
      detail:
        "Future idempotency evidence draft uses the idempotency model table name and requestHash without reserving a key.",
    }),
    check({
      id: "audit_and_idempotency_share_correlation",
      category: "correlation",
      title: "Audit and idempotency share correlation",
      passed:
        input.fixture.auditEvidenceDraft.redactedEvidenceRef ===
          input.fixture.redactedEvidenceRef &&
        input.fixture.idempotencyEvidenceDraft.auditEvidenceRef ===
          auditEvidenceRef(input.fixture.contractId, input.fixture.requestHash),
      blocking: true,
      detail:
        "Audit evidence and idempotency evidence are linked by deterministic references derived from the same contract and requestHash.",
    }),
    check({
      id: "forbidden_evidence_fields_absent",
      category: "forbidden_field_guard",
      title: "Forbidden evidence fields absent",
      passed:
        input.fixture.forbiddenFieldMatches.length === 0 &&
        forbiddenMatches.length === 0,
      blocking: true,
      detail:
        "Evidence handoff drafts do not include raw payload, token, API key, service-role, webhook secret, prompt, or provider response fields.",
    }),
    check({
      id: "persistence_paths_blocked",
      category: "write_block",
      title: "Persistence paths blocked",
      passed:
        !input.fixture.wouldPersistEvidence &&
        !input.fixture.wouldWriteAuditRows &&
        !input.fixture.wouldReserveIdempotencyKey &&
        !input.fixture.wouldWriteIdempotencyRows &&
        !input.fixture.wouldCreateServiceRoleClient &&
        !input.fixture.wouldWriteRows,
      blocking: true,
      detail:
        "Handoff fixtures do not persist evidence, write audit rows, reserve idempotency keys, create clients, or write rows.",
    }),
  ];
}

function buildFixture(input: {
  redactionFixture: RequestRedactionFixture;
  auditContract?: WriterAuditEventContract;
  idempotencyContract?: WriterIdempotencyContract;
}): WriterEvidenceHandoffFixture {
  const { redactionFixture, auditContract, idempotencyContract } = input;
  const redactedEvidenceRef = evidenceRef(
    redactionFixture.contractId,
    redactionFixture.requestHash,
  );
  const sourceRedactionFixtureRef = sourceFixtureRef(
    redactionFixture.contractId,
    redactionFixture.requestHash,
  );
  const auditRef = auditEvidenceRef(
    redactionFixture.contractId,
    redactionFixture.requestHash,
  );
  const idempotencyKeyTemplate =
    idempotencyContract?.keyTemplate ?? redactionFixture.idempotencyKeyTemplate;
  const blockedCodes = ["fixture_only", "service_role_disabled", "write_blocked"];
  const fixture: WriterEvidenceHandoffFixture = {
    contractId: redactionFixture.contractId,
    category: auditContract?.category ?? "compliance",
    targetTables: auditContract?.targetTables ?? [],
    requestHash: redactionFixture.requestHash,
    userIdHash: redactionFixture.userIdHash,
    redactedPreviewKeyCount: redactedPreviewKeys(redactionFixture).length,
    redactionEntryCount: redactionFixture.redactionEntries.length,
    privateTextRedactions: redactionFixture.privateTextRedactions,
    hashedIdentifierCount: redactionFixture.hashedIdentifierCount,
    hashedReferenceCount: redactionFixture.hashedReferenceCount,
    redactedEvidenceRef,
    sourceRedactionFixtureRef,
    auditEvidenceDraft: {
      futureTableName: futureAuditTableName,
      eventType: `writer.${redactionFixture.contractId}.gate_blocked`,
      lifecycle: "gate_blocked",
      actorContext: auditContract?.actorContext ?? "authenticated_user_request",
      gateDecision: "blocked",
      blockedCodes,
      requestHash: redactionFixture.requestHash,
      userIdHash: redactionFixture.userIdHash,
      idempotencyKeyTemplate,
      redactedEvidenceRef,
      sourceRedactionFixtureRef,
      wouldWriteAuditRows: false,
      wouldStoreRawPayload: false,
      wouldStorePrivateNarrative: false,
      wouldStoreSecrets: false,
    },
    idempotencyEvidenceDraft: {
      futureTableName: futureIdempotencyTableName,
      scope: idempotencyContract?.scope ?? "consent_policy",
      operation: idempotencyContract?.operation ?? "insert",
      keyTemplate: idempotencyKeyTemplate,
      requestHash: redactionFixture.requestHash,
      auditEvidenceRef: auditRef,
      replayRule:
        idempotencyContract?.replayRule ??
        "Same key and same requestHash replays the existing result reference.",
      conflictRule:
        "Same idempotency key with a different requestHash must be rejected before any writer executes.",
      wouldReserveKey: false,
      wouldWriteRegistryRows: false,
      wouldWriteAuditRows: false,
    },
    forbiddenFieldMatches: redactionFixture.forbiddenKeyMatches,
    wouldPersistEvidence: false,
    wouldStoreRawPayload: false,
    wouldStorePrivateNarrative: false,
    wouldStoreSecrets: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKey: false,
    wouldWriteIdempotencyRows: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldWriteRows: false,
    checks: [],
  };

  return {
    ...fixture,
    checks: buildFixtureChecks({
      fixture,
      redactionFixture,
      auditContract,
      idempotencyContract,
    }),
  };
}

function buildFixtures() {
  const redaction = buildRequestRedactionFixtures();
  const audit = buildWriterAuditModel();
  const idempotency = buildWriterIdempotencyModel();
  const auditById = Object.fromEntries(
    audit.contracts.map((contract) => [contract.contractId, contract]),
  );
  const idempotencyById = Object.fromEntries(
    idempotency.contracts.map((contract) => [contract.contractId, contract]),
  );

  return redaction.fixtures.map((redactionFixture) =>
    buildFixture({
      redactionFixture,
      auditContract: auditById[redactionFixture.contractId],
      idempotencyContract: idempotencyById[redactionFixture.contractId],
    }),
  );
}

function buildSharedChecks(fixtures: WriterEvidenceHandoffFixture[]) {
  return [
    check({
      id: "all_handoff_fixtures_present",
      category: "redaction_source",
      title: "All handoff fixtures present",
      passed: fixtures.length === 8,
      blocking: true,
      detail:
        "Every system writer contract has an evidence handoff fixture derived from request redaction output.",
    }),
    check({
      id: "all_request_hashes_present",
      category: "correlation",
      title: "All request hashes present",
      passed: fixtures.every((fixture) =>
        /^sha256:[a-f0-9]{64}$/.test(fixture.requestHash),
      ),
      blocking: true,
      detail:
        "Every handoff fixture carries a deterministic requestHash for future audit and idempotency correlation.",
    }),
    check({
      id: "all_audit_drafts_blocked",
      category: "audit_evidence",
      title: "All audit drafts blocked",
      passed: fixtures.every((fixture) => !fixture.wouldWriteAuditRows),
      blocking: true,
      detail:
        "Audit evidence drafts are visible, but none writes or persists a future audit event.",
    }),
    check({
      id: "all_idempotency_drafts_blocked",
      category: "idempotency_evidence",
      title: "All idempotency drafts blocked",
      passed: fixtures.every(
        (fixture) =>
          !fixture.wouldReserveIdempotencyKey &&
          !fixture.wouldWriteIdempotencyRows,
      ),
      blocking: true,
      detail:
        "Idempotency evidence drafts are visible, but none reserves or writes a future registry row.",
    }),
    check({
      id: "all_write_paths_blocked",
      category: "write_block",
      title: "All write paths blocked",
      passed: fixtures.every(
        (fixture) =>
          !fixture.wouldPersistEvidence &&
          !fixture.wouldCreateServiceRoleClient &&
          !fixture.wouldReadServiceRoleSecret &&
          !fixture.wouldWriteRows,
      ),
      blocking: true,
      detail:
        "Evidence handoff fixtures do not persist evidence, create privileged clients, read secrets, or write rows.",
    }),
  ];
}

export function buildWriterEvidenceHandoff(): WriterEvidenceHandoffPayload {
  const fixtures = buildFixtures();
  const sharedChecks = buildSharedChecks(fixtures);
  const allFixturesReady =
    fixtures.every((fixture) =>
      fixture.checks.every((fixtureCheck) => fixtureCheck.passed),
    ) && sharedChecks.every((sharedCheck) => sharedCheck.passed);

  return {
    safeMode: true,
    readOnly: true,
    handoffMode: "fixture_only",
    futureAuditTableName,
    futureIdempotencyTableName,
    wouldPersistEvidence: false,
    wouldStoreRawPayload: false,
    wouldStorePrivateNarrative: false,
    wouldStoreSecrets: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKeys: false,
    wouldWriteIdempotencyRows: false,
    wouldCreateServiceRoleClient: false,
    wouldReadServiceRoleSecret: false,
    wouldWriteRows: false,
    wouldCallAi: false,
    wouldCallStripe: false,
    allFixturesReady,
    fixtureCount: fixtures.length,
    globalRules: [
      "This stage defines evidence handoff fixtures only; it does not persist evidence.",
      "Every handoff fixture starts from request redaction output, not raw request payloads.",
      "Future audit events should reference requestHash, redactedEvidenceRef, sourceRedactionFixtureRef, and idempotency key metadata.",
      "Future idempotency rows should compare requestHash and link to audit evidence before any writer executes.",
      "Evidence handoff drafts must not include raw prompts, raw model responses, raw Stripe payloads, access tokens, refresh tokens, API keys, service-role values, or webhook secrets.",
      "No service-role client, secret read, database write, AI call, Stripe call, audit write, idempotency mutation, or writer execution can happen in this stage.",
    ],
    sharedChecks,
    fixtures,
  };
}

export function probeWriterEvidenceHandoff(
  requestBody: unknown,
): WriterEvidenceHandoffProbeResult {
  const payload = buildWriterEvidenceHandoff();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      handoffMode: "fixture_only",
      wouldPersistEvidence: false,
      wouldStoreRawPayload: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKey: false,
      wouldWriteIdempotencyRows: false,
      wouldCreateServiceRoleClient: false,
      wouldWriteRows: false,
      checks: payload.sharedChecks,
      summary:
        "Evidence handoff probe blocked: request body must be a JSON object and no persistence was attempted.",
    };
  }

  const contractId = (requestBody as { contractId?: unknown }).contractId;

  if (!isContractId(contractId)) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      handoffMode: "fixture_only",
      wouldPersistEvidence: false,
      wouldStoreRawPayload: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKey: false,
      wouldWriteIdempotencyRows: false,
      wouldCreateServiceRoleClient: false,
      wouldWriteRows: false,
      checks: payload.sharedChecks,
      summary:
        "Evidence handoff probe blocked: unknown contract id and no persistence was attempted.",
    };
  }

  const fixture = payload.fixtures.find((item) => item.contractId === contractId);

  return {
    safeMode: true,
    readOnly: true,
    blocked: true,
    contractId,
    handoffMode: "fixture_only",
    requestHash: fixture?.requestHash,
    redactedEvidenceRef: fixture?.redactedEvidenceRef,
    auditEvidenceRef: fixture
      ? auditEvidenceRef(fixture.contractId, fixture.requestHash)
      : undefined,
    idempotencyKeyTemplate: fixture?.idempotencyEvidenceDraft.keyTemplate,
    wouldPersistEvidence: false,
    wouldStoreRawPayload: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKey: false,
    wouldWriteIdempotencyRows: false,
    wouldCreateServiceRoleClient: false,
    wouldWriteRows: false,
    checks: fixture?.checks ?? payload.sharedChecks,
    summary:
      "Evidence handoff probe blocked as designed: audit and idempotency evidence drafts were prepared from redacted request evidence, but no evidence, audit row, idempotency row, service-role write, AI call, or Stripe call was attempted.",
  };
}
