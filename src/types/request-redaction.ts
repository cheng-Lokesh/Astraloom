import type { SystemWriterContractId } from "@/types/system-writer-contract";

export type RequestRedactionMode = "fixture_only";

export type RedactedValue =
  | string
  | number
  | boolean
  | null
  | RedactedValue[]
  | { [key: string]: RedactedValue };

export type RedactionAction =
  | "kept_safe_metadata"
  | "hashed_identifier"
  | "hashed_reference"
  | "redacted_private_text"
  | "redacted_sensitive_key"
  | "kept_boolean_or_number";

export type RedactionEntry = {
  path: string;
  action: RedactionAction;
  detail: string;
};

export type RequestRedactionCheckCategory =
  | "canonicalization"
  | "hashing"
  | "redaction"
  | "sensitive_key_guard"
  | "audit_alignment"
  | "idempotency_alignment"
  | "write_block";

export type RequestRedactionCheck = {
  id: string;
  category: RequestRedactionCheckCategory;
  title: string;
  passed: boolean;
  blocking: true;
  detail: string;
};

export type RequestRedactionFixture = {
  contractId: SystemWriterContractId;
  hashAlgorithm: "sha256";
  canonicalizationVersion: "stable_json_v1";
  requestHash: string;
  userIdHash?: string;
  idempotencyKeyTemplate: string;
  originalInputKeys: string[];
  redactedPayloadPreview: Record<string, RedactedValue>;
  redactionEntries: RedactionEntry[];
  forbiddenKeyMatches: string[];
  privateTextRedactions: number;
  hashedIdentifierCount: number;
  hashedReferenceCount: number;
  wouldStoreRawPayload: false;
  wouldStorePrivateNarrative: false;
  wouldStoreSecrets: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKey: false;
  checks: RequestRedactionCheck[];
};

export type RequestRedactionPayload = {
  safeMode: true;
  readOnly: true;
  redactionMode: RequestRedactionMode;
  hashAlgorithm: "sha256";
  canonicalizationVersion: "stable_json_v1";
  wouldPersistRequestHash: false;
  wouldStoreRawPayload: false;
  wouldStorePrivateNarrative: false;
  wouldStoreSecrets: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKeys: false;
  wouldWriteIdempotencyRows: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldWriteRows: false;
  wouldCallAi: false;
  wouldCallStripe: false;
  allFixturesRedacted: boolean;
  fixtureCount: number;
  globalRules: string[];
  sharedChecks: RequestRedactionCheck[];
  fixtures: RequestRedactionFixture[];
};

export type RequestRedactionProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  contractId?: SystemWriterContractId;
  redactionMode: RequestRedactionMode;
  requestHash?: string;
  userIdHash?: string;
  wouldPersistRequestHash: false;
  wouldStoreRawPayload: false;
  wouldStorePrivateNarrative: false;
  wouldStoreSecrets: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKey: false;
  wouldCreateServiceRoleClient: false;
  wouldWriteRows: false;
  checks: RequestRedactionCheck[];
  summary: string;
};
