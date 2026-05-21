import type { ServiceRoleAdapterOperation } from "@/types/service-role-adapter";
import type {
  SystemWriterContractCategory,
  SystemWriterContractId,
} from "@/types/system-writer-contract";
import type { WriterAuditLifecycle } from "@/types/system-writer-audit";
import type { WriterAuthContext } from "@/types/system-writer-guardrail";
import type { WriterIdempotencyScope } from "@/types/system-writer-idempotency";

export type WriterEvidenceHandoffMode = "fixture_only";

export type WriterEvidenceHandoffCheckCategory =
  | "redaction_source"
  | "audit_evidence"
  | "idempotency_evidence"
  | "correlation"
  | "forbidden_field_guard"
  | "write_block";

export type WriterEvidenceHandoffCheck = {
  id: string;
  category: WriterEvidenceHandoffCheckCategory;
  title: string;
  passed: boolean;
  blocking: true;
  detail: string;
};

export type AuditEvidenceDraft = {
  futureTableName: "writer_audit_events";
  eventType: string;
  lifecycle: WriterAuditLifecycle;
  actorContext: WriterAuthContext;
  gateDecision: "blocked";
  blockedCodes: string[];
  requestHash: string;
  userIdHash?: string;
  idempotencyKeyTemplate: string;
  redactedEvidenceRef: string;
  sourceRedactionFixtureRef: string;
  wouldWriteAuditRows: false;
  wouldStoreRawPayload: false;
  wouldStorePrivateNarrative: false;
  wouldStoreSecrets: false;
};

export type IdempotencyEvidenceDraft = {
  futureTableName: "writer_idempotency_keys";
  scope: WriterIdempotencyScope;
  operation: ServiceRoleAdapterOperation;
  keyTemplate: string;
  requestHash: string;
  auditEvidenceRef: string;
  replayRule: string;
  conflictRule: string;
  wouldReserveKey: false;
  wouldWriteRegistryRows: false;
  wouldWriteAuditRows: false;
};

export type WriterEvidenceHandoffFixture = {
  contractId: SystemWriterContractId;
  category: SystemWriterContractCategory;
  targetTables: string[];
  requestHash: string;
  userIdHash?: string;
  redactedPreviewKeyCount: number;
  redactionEntryCount: number;
  privateTextRedactions: number;
  hashedIdentifierCount: number;
  hashedReferenceCount: number;
  redactedEvidenceRef: string;
  sourceRedactionFixtureRef: string;
  auditEvidenceDraft: AuditEvidenceDraft;
  idempotencyEvidenceDraft: IdempotencyEvidenceDraft;
  forbiddenFieldMatches: string[];
  wouldPersistEvidence: false;
  wouldStoreRawPayload: false;
  wouldStorePrivateNarrative: false;
  wouldStoreSecrets: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKey: false;
  wouldWriteIdempotencyRows: false;
  wouldCreateServiceRoleClient: false;
  wouldReadServiceRoleSecret: false;
  wouldWriteRows: false;
  checks: WriterEvidenceHandoffCheck[];
};

export type WriterEvidenceHandoffPayload = {
  safeMode: true;
  readOnly: true;
  handoffMode: WriterEvidenceHandoffMode;
  futureAuditTableName: "writer_audit_events";
  futureIdempotencyTableName: "writer_idempotency_keys";
  wouldPersistEvidence: false;
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
  allFixturesReady: boolean;
  fixtureCount: number;
  globalRules: string[];
  sharedChecks: WriterEvidenceHandoffCheck[];
  fixtures: WriterEvidenceHandoffFixture[];
};

export type WriterEvidenceHandoffProbeResult = {
  safeMode: true;
  readOnly: true;
  blocked: true;
  contractId?: SystemWriterContractId;
  handoffMode: WriterEvidenceHandoffMode;
  requestHash?: string;
  redactedEvidenceRef?: string;
  auditEvidenceRef?: string;
  idempotencyKeyTemplate?: string;
  wouldPersistEvidence: false;
  wouldStoreRawPayload: false;
  wouldWriteAuditRows: false;
  wouldReserveIdempotencyKey: false;
  wouldWriteIdempotencyRows: false;
  wouldCreateServiceRoleClient: false;
  wouldWriteRows: false;
  checks: WriterEvidenceHandoffCheck[];
  summary: string;
};
