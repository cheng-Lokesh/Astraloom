import { z } from "zod";

import { parseRealityBoundarySnapshotV2 } from "../claims-reports/validation";
import type { EvidenceItemV2, RealEvidenceIdV2 } from "../reality-boundary/types";
import { canonicalStage7JsonV2, outcomeIdV2, stage7FingerprintV2 } from "./ids";
import type { OutcomeV2 } from "./types";
import {
  OUTCOME_CALIBRATION_ENGINE_VERSION_V2,
  OUTCOME_SCHEMA_VERSION_V2,
} from "./types";

const bounded = z.string().trim().min(1).max(2000);
const namespaced = (prefix: string) => z.string().regex(new RegExp(`^${prefix}[a-z0-9][a-z0-9_-]*$`));
const strictTimestamp = bounded.refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  return !Number.isNaN(Date.parse(value));
});
const sourceSchema = z.object({
  realEvidenceId: z.string().regex(/^real_evidence_v2_[a-z0-9]+$/i),
  sourceKind: z.enum(["user_statement", "user_material", "external_source", "official_record"]),
  sourceRef: bounded,
  verificationStatus: z.enum(["user_confirmed", "source_verified"]),
}).strict();
const uncertaintySchema = z.object({
  level: z.enum(["low", "medium", "high"]),
  statement: bounded,
  limitations: z.array(bounded).min(1).max(100),
}).strict();
const claimReferenceSchema = z.object({
  claimId: namespaced("claim_v2_"),
  clusterId: namespaced("trajectory_cluster_v2_"),
}).strict();
const captureInputSchema = z.object({
  outcomeSpecId: namespaced("outcome_spec_v2_"),
  seedContextId: bounded,
  realityBoundary: z.unknown(),
  claimReference: claimReferenceSchema,
  observed: z.enum(["occurred", "did_not_occur"]),
  occurredAt: strictTimestamp,
  recordedAt: strictTimestamp,
  realEvidenceIds: z.array(z.string().regex(/^real_evidence_v2_[a-z0-9]+$/i)).min(1).max(100),
  source: sourceSchema,
  uncertainty: uncertaintySchema,
}).strict();

const versionsSchema = z.object({
  outcomeCalibrationEngineVersion: z.literal(OUTCOME_CALIBRATION_ENGINE_VERSION_V2),
  outcomeSchemaVersion: z.literal(OUTCOME_SCHEMA_VERSION_V2),
  realityBoundarySchemaVersion: z.literal("2.0"),
  realityBoundaryRevision: z.number().int().nonnegative(),
}).strict();
const outcomeSchema = z.object({
  id: namespaced("outcome_v2_"),
  outcomeSpecId: namespaced("outcome_spec_v2_"),
  seedContextId: bounded,
  status: z.literal("actual_observation"),
  evidenceClass: z.literal("real_world"),
  claimReference: claimReferenceSchema,
  observed: z.enum(["occurred", "did_not_occur"]),
  occurredAt: strictTimestamp,
  recordedAt: strictTimestamp,
  realEvidenceIds: z.array(z.string().regex(/^real_evidence_v2_[a-z0-9]+$/i)).min(1).max(100),
  source: sourceSchema,
  uncertainty: uncertaintySchema,
  realityBoundarySnapshot: z.unknown(),
  versions: versionsSchema,
  outcomeIntegritySignature: z.string().regex(/^[a-f0-9]{24}$/),
}).strict();

function sortedUnique(values: string[]) {
  return [...new Set(values)].sort();
}

function sourceMatchesEvidence(input: z.infer<typeof captureInputSchema>, evidence: EvidenceItemV2) {
  return evidence.id === input.source.realEvidenceId &&
    evidence.sourceKind === input.source.sourceKind &&
    evidence.verificationStatus === input.source.verificationStatus &&
    evidence.occurredAt === input.occurredAt &&
    evidence.capturedAt === input.recordedAt &&
    evidence.provenance.some((item) =>
      item.sourceRef === input.source.sourceRef &&
      item.occurredAt === input.occurredAt &&
      item.capturedAt === input.recordedAt);
}

function captureOutcomeUnsafeV2(input: unknown) {
  const parsed = captureInputSchema.safeParse(input);
  if (!parsed.success) {
    const candidate = input as { outcomeSpecId?: unknown };
    if (typeof candidate?.outcomeSpecId === "string" && !/^outcome_spec_v2_[a-z0-9][a-z0-9_-]*$/.test(candidate.outcomeSpecId)) {
      return { ok: false as const, errorCode: "invalid_id" as const };
    }
    return { ok: false as const, errorCode: "invalid_outcome_input" as const };
  }
  const boundaryResult = parseRealityBoundarySnapshotV2(parsed.data.realityBoundary);
  if (!boundaryResult.ok) return { ok: false as const, errorCode: "invalid_outcome_input" as const };
  const boundary = boundaryResult.boundary;
  if (boundary.seedContextId !== parsed.data.seedContextId) {
    return { ok: false as const, errorCode: "cross_seed_reference" as const };
  }
  if (new Set(parsed.data.realEvidenceIds).size !== parsed.data.realEvidenceIds.length) {
    return { ok: false as const, errorCode: "duplicate_id" as const };
  }
  const byId = new Map(boundary.evidenceLedger.items.map((item) => [item.id, item]));
  if (parsed.data.realEvidenceIds.some((id) => !byId.has(id as RealEvidenceIdV2))) {
    return { ok: false as const, errorCode: "dangling_real_evidence" as const };
  }
  if (
    Date.parse(parsed.data.occurredAt) > Date.parse(parsed.data.recordedAt) ||
    Date.parse(parsed.data.recordedAt) > Date.parse(boundary.updatedAt)
  ) {
    return { ok: false as const, errorCode: "invalid_observation_time" as const };
  }
  const primaryEvidence = byId.get(parsed.data.source.realEvidenceId as RealEvidenceIdV2);
  if (!primaryEvidence || !parsed.data.realEvidenceIds.includes(primaryEvidence.id) || !sourceMatchesEvidence(parsed.data, primaryEvidence)) {
    return { ok: false as const, errorCode: "invalid_outcome_source" as const };
  }
  const unsigned: Omit<OutcomeV2, "id" | "outcomeIntegritySignature"> = {
    outcomeSpecId: parsed.data.outcomeSpecId as OutcomeV2["outcomeSpecId"],
    seedContextId: parsed.data.seedContextId,
    status: "actual_observation",
    evidenceClass: "real_world",
    claimReference: parsed.data.claimReference as OutcomeV2["claimReference"],
    observed: parsed.data.observed,
    occurredAt: parsed.data.occurredAt,
    recordedAt: parsed.data.recordedAt,
    realEvidenceIds: sortedUnique(parsed.data.realEvidenceIds) as RealEvidenceIdV2[],
    source: structuredClone(parsed.data.source) as OutcomeV2["source"],
    uncertainty: {
      ...structuredClone(parsed.data.uncertainty),
      limitations: sortedUnique(parsed.data.uncertainty.limitations),
    },
    realityBoundarySnapshot: structuredClone(boundary),
    versions: {
      outcomeCalibrationEngineVersion: OUTCOME_CALIBRATION_ENGINE_VERSION_V2,
      outcomeSchemaVersion: OUTCOME_SCHEMA_VERSION_V2,
      realityBoundarySchemaVersion: boundary.schemaVersion,
      realityBoundaryRevision: boundary.revision,
    },
  };
  const outcome: OutcomeV2 = {
    id: outcomeIdV2(unsigned),
    ...unsigned,
    outcomeIntegritySignature: stage7FingerprintV2(unsigned),
  };
  return { ok: true as const, outcome };
}

export function captureOutcomeV2(input: unknown) {
  try {
    return captureOutcomeUnsafeV2(input);
  } catch {
    return { ok: false as const, errorCode: "invalid_outcome_input" as const };
  }
}

export function parseValidatedOutcomeV2(input: unknown) {
  try {
    const candidate = input as { versions?: { outcomeCalibrationEngineVersion?: unknown; outcomeSchemaVersion?: unknown } };
    if (
      candidate?.versions?.outcomeCalibrationEngineVersion !== OUTCOME_CALIBRATION_ENGINE_VERSION_V2 ||
      candidate?.versions?.outcomeSchemaVersion !== OUTCOME_SCHEMA_VERSION_V2
    ) return { ok: false as const, errorCode: "version_mismatch" as const };
    const parsed = outcomeSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, errorCode: "outcome_tampering" as const };
    const rebuilt = captureOutcomeUnsafeV2({
      outcomeSpecId: parsed.data.outcomeSpecId,
      seedContextId: parsed.data.seedContextId,
      realityBoundary: parsed.data.realityBoundarySnapshot,
      claimReference: parsed.data.claimReference,
      observed: parsed.data.observed,
      occurredAt: parsed.data.occurredAt,
      recordedAt: parsed.data.recordedAt,
      realEvidenceIds: parsed.data.realEvidenceIds,
      source: parsed.data.source,
      uncertainty: parsed.data.uncertainty,
    });
    if (!rebuilt.ok || canonicalStage7JsonV2(rebuilt.outcome) !== canonicalStage7JsonV2(input)) {
      return { ok: false as const, errorCode: "outcome_tampering" as const };
    }
    return { ok: true as const, outcome: structuredClone(rebuilt.outcome) };
  } catch {
    return { ok: false as const, errorCode: "outcome_tampering" as const };
  }
}
