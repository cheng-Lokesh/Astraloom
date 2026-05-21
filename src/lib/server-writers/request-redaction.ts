import "server-only";

import { createHash } from "node:crypto";

import { buildWriterPayloadParity } from "@/lib/server-writers/payload-parity";
import type {
  RedactedValue,
  RedactionEntry,
  RequestRedactionCheck,
  RequestRedactionFixture,
  RequestRedactionPayload,
  RequestRedactionProbeResult,
} from "@/types/request-redaction";
import type { SystemWriterContractId } from "@/types/system-writer-contract";

const sensitiveKeyPattern = /(secret|token|password|api[_-]?key|service[_-]?role|webhook)/i;
const identifierKeyPattern = /(^id$|id$|ids$|userId|seedContextId|runId|claimIds|eventIds|agentProfileIds|confirmedKeyPersonIds|stripeCustomerId|stripeCheckoutSessionId|stripeEventId|entitlementId|safetyReviewId)/i;
const referenceKeyPattern = /(refs?$|snapshot|evidence|stateSnapshot)/i;
const privateTextKeyPattern = /(question|narrative|prompt|response|description|message|text|scenarioQuestion)/i;

const safeMetadataKeys = new Set([
  "contractId",
  "track",
  "timeWindow",
  "costBudget",
  "promptVersion",
  "modelVersion",
  "executorVersion",
  "claimSchemaVersion",
  "reportTemplateVersion",
  "productSku",
  "entitlementScope",
  "consentType",
  "policyVersion",
  "decision",
  "sourceRoute",
  "createdAt",
  "locale",
  "reportMode",
  "currency",
  "amount",
  "parallelSelfCount",
  "minConfidence",
  "tickIndex",
]);

function check(input: RequestRedactionCheck): RequestRedactionCheck {
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

function sha256(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

function hashValue(path: string, value: unknown) {
  return sha256(`${path}:${stableJson(value)}`);
}

function redactedMarker(kind: string, path: string, value: unknown) {
  return `[${kind}:${hashValue(path, value).slice(7, 19)}]`;
}

function redactValue(
  key: string,
  value: unknown,
  path: string,
  entries: RedactionEntry[],
): RedactedValue {
  if (sensitiveKeyPattern.test(key)) {
    entries.push({
      path,
      action: "redacted_sensitive_key",
      detail: "Sensitive-looking key removed from redacted preview.",
    });
    return "[redacted:sensitive]";
  }

  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      redactValue(key, item, `${path}[${index}]`, entries),
    );
  }

  if (typeof value === "object") {
    const output: Record<string, RedactedValue> = {};
    for (const [childKey, childValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      output[childKey] = redactValue(
        childKey,
        childValue,
        `${path}.${childKey}`,
        entries,
      );
    }
    return output;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    entries.push({
      path,
      action: "kept_boolean_or_number",
      detail: "Boolean or numeric value is safe to keep in the redacted preview.",
    });
    return value;
  }

  if (identifierKeyPattern.test(key)) {
    entries.push({
      path,
      action: "hashed_identifier",
      detail: "Identifier value replaced with a short hash marker.",
    });
    return redactedMarker("id", path, value);
  }

  if (referenceKeyPattern.test(key)) {
    entries.push({
      path,
      action: "hashed_reference",
      detail: "Evidence or snapshot reference replaced with a short hash marker.",
    });
    return redactedMarker("ref", path, value);
  }

  if (safeMetadataKeys.has(key)) {
    entries.push({
      path,
      action: "kept_safe_metadata",
      detail: "Safe operational metadata kept in the redacted preview.",
    });
    return String(value);
  }

  if (privateTextKeyPattern.test(key)) {
    entries.push({
      path,
      action: "redacted_private_text",
      detail:
        "Free-text or prompt-like value removed to avoid storing private narrative text.",
    });
    return redactedMarker("private_text", path, value);
  }

  entries.push({
    path,
    action: "redacted_private_text",
    detail:
      "Unclassified string value removed by default until a future review marks it safe.",
  });
  return redactedMarker("redacted", path, value);
}

function redactPayload(payload: Record<string, unknown>) {
  const entries: RedactionEntry[] = [];
  const redactedPayloadPreview: Record<string, RedactedValue> = {};

  for (const [key, value] of Object.entries(payload)) {
    redactedPayloadPreview[key] = redactValue(key, value, key, entries);
  }

  return {
    redactedPayloadPreview,
    redactionEntries: entries,
  };
}

function collectForbiddenKeyMatches(keys: string[]) {
  return keys.filter((key) => sensitiveKeyPattern.test(key));
}

function buildChecks(input: {
  fixture: RequestRedactionFixture;
  canonical: string;
}) {
  return [
    check({
      id: "canonical_payload_stable",
      category: "canonicalization",
      title: "Canonical payload stable",
      passed: input.canonical.startsWith("{") && input.canonical.endsWith("}"),
      blocking: true,
      detail:
        "Redacted payload preview is serialized with stable sorted keys before hashing.",
    }),
    check({
      id: "request_hash_present",
      category: "hashing",
      title: "Request hash present",
      passed: /^sha256:[a-f0-9]{64}$/.test(input.fixture.requestHash),
      blocking: true,
      detail:
        "Fixture includes a deterministic SHA-256 hash of the canonical redacted payload preview.",
    }),
    check({
      id: "no_forbidden_keys_in_sample",
      category: "sensitive_key_guard",
      title: "No forbidden keys in sample",
      passed: input.fixture.forbiddenKeyMatches.length === 0,
      blocking: true,
      detail:
        input.fixture.forbiddenKeyMatches.length === 0
          ? "Sample input keys do not include secret, token, API key, service-role, password, or webhook-like names."
          : `Forbidden keys: ${input.fixture.forbiddenKeyMatches.join(", ")}.`,
    }),
    check({
      id: "raw_payload_not_stored",
      category: "redaction",
      title: "Raw payload not stored",
      passed:
        !input.fixture.wouldStoreRawPayload &&
        !input.fixture.wouldStorePrivateNarrative &&
        !input.fixture.wouldStoreSecrets,
      blocking: true,
      detail:
        "Fixture exposes a redacted preview and hash only; it does not persist the raw request payload.",
    }),
    check({
      id: "private_text_redacted_or_absent",
      category: "redaction",
      title: "Private text redacted or absent",
      passed:
        input.fixture.privateTextRedactions > 0 ||
        !Object.keys(input.fixture.redactedPayloadPreview).some((key) =>
          privateTextKeyPattern.test(key) &&
          !safeMetadataKeys.has(key) &&
          !identifierKeyPattern.test(key) &&
          !referenceKeyPattern.test(key),
        ),
      blocking: true,
      detail:
        "Prompt-like or narrative-like fields are removed from the redacted preview when present.",
    }),
    check({
      id: "audit_evidence_ready_without_write",
      category: "audit_alignment",
      title: "Audit evidence ready without write",
      passed: !input.fixture.wouldWriteAuditRows,
      blocking: true,
      detail:
        "Fixture can provide requestHash and redacted preview for a future audit event, but it does not write audit rows.",
    }),
    check({
      id: "idempotency_evidence_ready_without_reservation",
      category: "idempotency_alignment",
      title: "Idempotency evidence ready without reservation",
      passed: !input.fixture.wouldReserveIdempotencyKey,
      blocking: true,
      detail:
        "Fixture carries the idempotency key template and requestHash, but it does not reserve a key.",
    }),
    check({
      id: "write_paths_blocked",
      category: "write_block",
      title: "Write paths blocked",
      passed:
        !input.fixture.wouldWriteAuditRows &&
        !input.fixture.wouldReserveIdempotencyKey,
      blocking: true,
      detail:
        "Hashing/redaction fixtures do not write rows, call providers, or execute future writers.",
    }),
  ];
}

function buildFixture(input: {
  contractId: SystemWriterContractId;
  idempotencyKeyTemplate: string;
  sampleInput: Record<string, unknown>;
}): RequestRedactionFixture {
  const { redactedPayloadPreview, redactionEntries } = redactPayload({
    contractId: input.contractId,
    ...input.sampleInput,
  });
  const canonical = stableJson(redactedPayloadPreview);
  const userIdValue = input.sampleInput.userId;
  const userIdHash =
    typeof userIdValue === "string" ? sha256(`userId:${userIdValue}`) : undefined;
  const originalInputKeys = Object.keys(input.sampleInput).sort();
  const fixture: RequestRedactionFixture = {
    contractId: input.contractId,
    hashAlgorithm: "sha256",
    canonicalizationVersion: "stable_json_v1",
    requestHash: sha256(canonical),
    userIdHash,
    idempotencyKeyTemplate: input.idempotencyKeyTemplate,
    originalInputKeys,
    redactedPayloadPreview,
    redactionEntries,
    forbiddenKeyMatches: collectForbiddenKeyMatches(originalInputKeys),
    privateTextRedactions: redactionEntries.filter(
      (entry) => entry.action === "redacted_private_text",
    ).length,
    hashedIdentifierCount: redactionEntries.filter(
      (entry) => entry.action === "hashed_identifier",
    ).length,
    hashedReferenceCount: redactionEntries.filter(
      (entry) => entry.action === "hashed_reference",
    ).length,
    wouldStoreRawPayload: false,
    wouldStorePrivateNarrative: false,
    wouldStoreSecrets: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKey: false,
    checks: [],
  };

  return {
    ...fixture,
    checks: buildChecks({ fixture, canonical }),
  };
}

function buildFixtures(): RequestRedactionFixture[] {
  const parity = buildWriterPayloadParity();

  return parity.fixtures.map((fixture) =>
    buildFixture({
      contractId: fixture.contractId,
      idempotencyKeyTemplate: fixture.idempotencyKeyTemplate,
      sampleInput: fixture.dryRunSampleRequest.input ?? {},
    }),
  );
}

function buildSharedChecks(fixtures: RequestRedactionFixture[]) {
  return [
    check({
      id: "all_redaction_fixtures_present",
      category: "canonicalization",
      title: "All redaction fixtures present",
      passed: fixtures.length === 8,
      blocking: true,
      detail:
        "Every writer payload parity fixture has a request hash and redacted preview fixture.",
    }),
    check({
      id: "all_request_hashes_present",
      category: "hashing",
      title: "All request hashes present",
      passed: fixtures.every((fixture) =>
        /^sha256:[a-f0-9]{64}$/.test(fixture.requestHash),
      ),
      blocking: true,
      detail:
        "Every fixture has a deterministic SHA-256 request hash for future audit/idempotency evidence.",
    }),
    check({
      id: "no_fixture_stores_raw_payload",
      category: "redaction",
      title: "No fixture stores raw payload",
      passed: fixtures.every(
        (fixture) =>
          !fixture.wouldStoreRawPayload &&
          !fixture.wouldStorePrivateNarrative &&
          !fixture.wouldStoreSecrets,
      ),
      blocking: true,
      detail:
        "Fixtures expose only redacted previews and hashes; raw request payloads are not stored.",
    }),
    check({
      id: "no_fixture_writes_audit_or_idempotency",
      category: "write_block",
      title: "No fixture writes audit or idempotency",
      passed: fixtures.every(
        (fixture) =>
          !fixture.wouldWriteAuditRows && !fixture.wouldReserveIdempotencyKey,
      ),
      blocking: true,
      detail:
        "Hashing/redaction fixtures do not write audit rows or reserve idempotency keys.",
    }),
  ];
}

export function buildRequestRedactionFixtures(): RequestRedactionPayload {
  const fixtures = buildFixtures();
  const sharedChecks = buildSharedChecks(fixtures);
  const allFixturesRedacted =
    fixtures.every((fixture) =>
      fixture.checks.every((fixtureCheck) => fixtureCheck.passed),
    ) && sharedChecks.every((sharedCheck) => sharedCheck.passed);

  return {
    safeMode: true,
    readOnly: true,
    redactionMode: "fixture_only",
    hashAlgorithm: "sha256",
    canonicalizationVersion: "stable_json_v1",
    wouldPersistRequestHash: false,
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
    allFixturesRedacted,
    fixtureCount: fixtures.length,
    globalRules: [
      "This stage creates request hashing and redaction fixtures only; it does not persist request evidence.",
      "Request hashes are deterministic SHA-256 values over stable JSON redacted previews.",
      "Redacted previews keep safe metadata, hash identifiers/references, and remove private narrative or prompt-like text.",
      "Future audit events should store requestHash and redacted evidence references, not raw payloads.",
      "Future idempotency rows should compare requestHash values, but this stage does not reserve or write keys.",
      "No service-role client, secret read, database write, AI call, Stripe call, audit write, idempotency mutation, or compensation write can happen in this stage.",
    ],
    sharedChecks,
    fixtures,
  };
}

export function probeRequestRedaction(
  requestBody: unknown,
): RequestRedactionProbeResult {
  const payload = buildRequestRedactionFixtures();

  if (
    typeof requestBody !== "object" ||
    requestBody === null ||
    Array.isArray(requestBody)
  ) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      redactionMode: "fixture_only",
      wouldPersistRequestHash: false,
      wouldStoreRawPayload: false,
      wouldStorePrivateNarrative: false,
      wouldStoreSecrets: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKey: false,
      wouldCreateServiceRoleClient: false,
      wouldWriteRows: false,
      checks: payload.sharedChecks,
      summary:
        "Request redaction probe blocked: request body must be a JSON object and no persistence was attempted.",
    };
  }

  const contractId = (requestBody as { contractId?: unknown }).contractId;

  if (!isContractId(contractId)) {
    return {
      safeMode: true,
      readOnly: true,
      blocked: true,
      redactionMode: "fixture_only",
      wouldPersistRequestHash: false,
      wouldStoreRawPayload: false,
      wouldStorePrivateNarrative: false,
      wouldStoreSecrets: false,
      wouldWriteAuditRows: false,
      wouldReserveIdempotencyKey: false,
      wouldCreateServiceRoleClient: false,
      wouldWriteRows: false,
      checks: payload.sharedChecks,
      summary:
        "Request redaction probe blocked: unknown contract id and no persistence was attempted.",
    };
  }

  const fixture = payload.fixtures.find((item) => item.contractId === contractId);

  return {
    safeMode: true,
    readOnly: true,
    blocked: true,
    contractId,
    redactionMode: "fixture_only",
    requestHash: fixture?.requestHash,
    userIdHash: fixture?.userIdHash,
    wouldPersistRequestHash: false,
    wouldStoreRawPayload: false,
    wouldStorePrivateNarrative: false,
    wouldStoreSecrets: false,
    wouldWriteAuditRows: false,
    wouldReserveIdempotencyKey: false,
    wouldCreateServiceRoleClient: false,
    wouldWriteRows: false,
    checks: fixture?.checks ?? payload.sharedChecks,
    summary:
      "Request redaction probe blocked as designed: request hash and redacted preview were prepared, but no audit row, idempotency row, service-role write, AI call, or Stripe call was attempted.",
  };
}
