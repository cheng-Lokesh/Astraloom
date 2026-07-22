import { z } from "zod";

import { buildClaimsV2 } from "../claims-reports/claim-builder";
import { canonicalClaimsJsonV2 } from "../claims-reports/ids";
import { validateClaimsReportV2 } from "../claims-reports/report-builder";
import type { ClaimV2, ClaimsReportV2 } from "../claims-reports/types";
import { parseRealityBoundarySnapshotV2, parseValidatedClaimV2 } from "../claims-reports/validation";
import type { BatchAnalysisV2, TrajectoryClusterV2 } from "../trajectory-analysis/types";
import { addTrajectoryDaysV2, parseTrajectoryInstantV2 } from "../trajectory/time";
import { parseTrajectoryRunSpecV2 } from "../trajectory/validation";
import {
  canonicalStage7JsonV2,
  forecastLockIdV2,
  persistenceVersionIdV2,
  stage7FingerprintV2,
} from "./ids";
import type {
  ForecastLockV2,
  ForecastUnitSemanticsV2,
  OutcomeCalibrationPersistenceVersionV2,
  Stage7ClaimSetSnapshotV2,
  Stage7RunSnapshotV2,
} from "./types";
import {
  FORECAST_LOCK_SCHEMA_VERSION_V2,
  OUTCOME_CALIBRATION_ENGINE_VERSION_V2,
  PERSISTENCE_SCHEMA_VERSION_V2,
} from "./types";

const bounded = z.string().trim().min(1).max(2000);
const namespaced = (prefix: string) => z.string().regex(new RegExp(`^${prefix}[a-z0-9][a-z0-9_-]*$`));
const strictTimestamp = bounded.refine((value) => parseTrajectoryInstantV2(value).ok);
const runSchema = z.object({
  kind: z.enum(["batch", "sensitivity", "intervention"]),
  payload: z.unknown(),
}).strict();
const claimSetSchema = z.object({
  kind: z.enum(["batch", "sensitivity", "intervention"]),
  payload: z.unknown(),
  realityBoundary: z.unknown(),
}).strict();
const buildSchema = z.object({
  forecastLockSpecId: namespaced("forecast_lock_spec_v2_"),
  lockedAt: strictTimestamp,
  run: runSchema,
  claimSet: claimSetSchema,
  claims: z.array(z.unknown()).min(1).max(1000),
  report: z.unknown(),
}).strict();
const lockSchema = z.object({
  id: namespaced("forecast_lock_v2_"),
  forecastLockSpecId: namespaced("forecast_lock_spec_v2_"),
  seedContextId: bounded,
  status: z.literal("locked"),
  lockedAt: strictTimestamp,
  canonicalContentSignature: z.string().regex(/^[a-f0-9]{24}$/),
  realityBoundaryBinding: z.object({
    revision: z.number().int().nonnegative(),
    fingerprint: z.string().regex(/^[a-f0-9]{24}$/),
    evidenceLedgerId: bounded,
    assumptionLedgerId: bounded,
  }).strict(),
  forecastUnits: z.array(z.object({
    claimId: namespaced("claim_v2_"),
    clusterId: namespaced("trajectory_cluster_v2_"),
    semantics: z.unknown(),
    forecastUnitSignature: z.string().regex(/^[a-f0-9]{24}$/),
  }).strict()).min(1),
  sourceSnapshots: z.object({
    run: runSchema,
    claimSet: claimSetSchema,
    claims: z.array(z.unknown()).min(1),
    report: z.unknown(),
  }).strict(),
  versions: z.object({
    outcomeCalibrationEngineVersion: z.literal(OUTCOME_CALIBRATION_ENGINE_VERSION_V2),
    forecastLockSchemaVersion: z.literal(FORECAST_LOCK_SCHEMA_VERSION_V2),
  }).strict(),
  forecastLockIntegritySignature: z.string().regex(/^[a-f0-9]{24}$/),
}).strict();
const persistenceSchema = z.object({
  id: namespaced("outcome_calibration_version_v2_"),
  streamId: namespaced("outcome_calibration_stream_v2_"),
  seedContextId: bounded,
  evidenceLedgerId: bounded,
  assumptionLedgerId: bounded,
  realityBoundaryRevision: z.number().int().nonnegative(),
  version: z.number().int().positive(),
  parentVersionId: namespaced("outcome_calibration_version_v2_").nullable(),
  idempotencyKey: namespaced("stage7_idempotency_v2_"),
  requestFingerprint: z.string().regex(/^[a-f0-9]{24}$/),
  persistedAt: strictTimestamp,
  persistenceSchemaVersion: z.literal(PERSISTENCE_SCHEMA_VERSION_V2),
  artifact: z.object({ kind: z.literal("forecast_lock"), value: z.unknown() }).strict(),
  persistenceIntegritySignature: z.string().regex(/^[a-f0-9]{24}$/),
}).strict();

function canonicalClaims(input: unknown[]) {
  const claims: ClaimV2[] = [];
  for (const candidate of input) {
    const parsed = parseValidatedClaimV2(candidate);
    if (!parsed.ok) return parsed;
    claims.push(parsed.claim);
  }
  if (new Set(claims.map((claim) => claim.id)).size !== claims.length) {
    return { ok: false as const, errorCode: "duplicate_id" as const };
  }
  return { ok: true as const, claims: claims.sort((left, right) => left.id.localeCompare(right.id)) };
}

function analysesForRun(run: Stage7RunSnapshotV2): BatchAnalysisV2[] {
  if (run.kind === "batch") return [run.payload as BatchAnalysisV2];
  const comparison = run.payload as { baseline: BatchAnalysisV2; variants: Array<{ analysis: BatchAnalysisV2 }> };
  return [comparison.baseline, ...comparison.variants.map((variant) => variant.analysis)];
}

function normalizedSemanticValue(value: unknown, key?: string): unknown {
  if (key !== "seedContextId" && key && (key === "id" || /Ids?$/.test(key))) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => normalizedSemanticValue(item)).filter((item) => item !== undefined);
  }
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .map(([entryKey, item]) => [entryKey, normalizedSemanticValue(item, entryKey)] as const)
    .filter((entry): entry is readonly [string, unknown] => entry[1] !== undefined));
}

function evaluationWindow(run: Stage7RunSnapshotV2) {
  const analysis = analysesForRun(run)[0];
  const parsed = parseTrajectoryRunSpecV2(analysis?.spec.trajectoryTemplate);
  if (!parsed.ok) return null;
  const start = parseTrajectoryInstantV2(parsed.value.startAt);
  if (!start.ok) return null;
  const end = addTrajectoryDaysV2(start.value, parsed.value.horizonDays);
  return end.ok ? { startAt: start.value.isoTimestamp, horizonEnd: end.value.isoTimestamp } : null;
}

function clusterForClaim(run: Stage7RunSnapshotV2, claim: ClaimV2): TrajectoryClusterV2 | null {
  const matches = analysesForRun(run).flatMap((analysis) => analysis.clusters)
    .filter((cluster) => claim.clusterIds.includes(cluster.clusterId));
  return matches[0] ?? null;
}

function buildUnsafe(input: unknown) {
  const parsed = buildSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, errorCode: "invalid_forecast_lock" as const };
  if (canonicalStage7JsonV2(parsed.data.run) !== canonicalStage7JsonV2({
    kind: parsed.data.claimSet.kind,
    payload: parsed.data.claimSet.payload,
  })) return { ok: false as const, errorCode: "run_mismatch" as const };
  const rebuiltClaims = buildClaimsV2(parsed.data.claimSet);
  if (!rebuiltClaims.ok) return rebuiltClaims;
  const suppliedClaims = canonicalClaims(parsed.data.claims);
  const canonicalBuilt = canonicalClaims(rebuiltClaims.claims);
  if (!suppliedClaims.ok || !canonicalBuilt.ok ||
      canonicalClaimsJsonV2(suppliedClaims.claims) !== canonicalClaimsJsonV2(canonicalBuilt.claims)) {
    return { ok: false as const, errorCode: "invalid_forecast_lock" as const };
  }
  const reportValidation = validateClaimsReportV2(parsed.data.report, parsed.data.claimSet, suppliedClaims.claims);
  if (!reportValidation.ok) return reportValidation;
  const boundaryResult = parseRealityBoundarySnapshotV2(parsed.data.claimSet.realityBoundary);
  if (!boundaryResult.ok) return boundaryResult;
  const boundary = boundaryResult.boundary;
  const locked = parseTrajectoryInstantV2(parsed.data.lockedAt);
  const boundaryUpdated = parseTrajectoryInstantV2(boundary.updatedAt);
  if (!locked.ok || !boundaryUpdated.ok || locked.value.epochMilliseconds < boundaryUpdated.value.epochMilliseconds) {
    return { ok: false as const, errorCode: "invalid_forecast_lock" as const };
  }
  const run = structuredClone(parsed.data.run) as Stage7RunSnapshotV2;
  const window = evaluationWindow(run);
  if (!window) return { ok: false as const, errorCode: "run_mismatch" as const };
  const normalizedRunSpec = normalizedSemanticValue(
    analysesForRun(run).map((analysis) => analysis.spec),
  );
  const boundaryFingerprint = stage7FingerprintV2(boundary);
  const units: ForecastLockV2["forecastUnits"] = [];
  for (const claim of suppliedClaims.claims) {
    const cluster = clusterForClaim(run, claim);
    if (!cluster) return { ok: false as const, errorCode: "invalid_forecast_lock" as const };
    const semantics: ForecastUnitSemanticsV2 = {
      normalizedRunSpec,
      evaluationWindow: window,
      seedContextId: claim.seedContextId,
      trajectorySeeds: [...cluster.memberTrajectorySeeds].sort((left, right) => left - right),
      policyAndEngineVersions: {
        policyVersion: claim.versions.policyVersion,
        trajectoryEngineVersion: claim.versions.trajectoryEngineVersion,
        analysisEngineVersion: claim.versions.analysisEngineVersion,
        featureSchemaVersion: claim.versions.featureSchemaVersion,
        clusteringAlgorithm: claim.versions.clusteringAlgorithm,
        clusteringVersion: claim.versions.clusteringVersion,
      },
      claim: { metric: claim.metric, numerator: claim.numerator, denominator: claim.denominator },
      clusterOutcome: {
        outcomeSignature: cluster.outcomeSignature,
        featureSignature: cluster.featureSignature,
        memberTrajectorySeeds: [...cluster.memberTrajectorySeeds].sort((left, right) => left - right),
      },
      forecastRealityBoundary: { fingerprint: boundaryFingerprint, revision: boundary.revision },
      lockedAt: locked.value.isoTimestamp,
    };
    units.push({
      claimId: claim.id,
      clusterId: cluster.clusterId,
      semantics,
      forecastUnitSignature: stage7FingerprintV2(semantics),
    });
  }
  units.sort((left, right) => left.claimId.localeCompare(right.claimId));
  const sourceSnapshots: ForecastLockV2["sourceSnapshots"] = {
    run,
    claimSet: {
      kind: parsed.data.claimSet.kind,
      payload: structuredClone(parsed.data.claimSet.payload),
      realityBoundary: structuredClone(boundary),
    } as Stage7ClaimSetSnapshotV2,
    claims: structuredClone(suppliedClaims.claims),
    report: structuredClone(parsed.data.report) as ClaimsReportV2,
  };
  const canonicalContentSignature = stage7FingerprintV2(sourceSnapshots);
  const unsigned: Omit<ForecastLockV2, "id" | "forecastLockIntegritySignature"> = {
    forecastLockSpecId: parsed.data.forecastLockSpecId as ForecastLockV2["forecastLockSpecId"],
    seedContextId: boundary.seedContextId,
    status: "locked",
    lockedAt: locked.value.isoTimestamp,
    canonicalContentSignature,
    realityBoundaryBinding: {
      revision: boundary.revision,
      fingerprint: boundaryFingerprint,
      evidenceLedgerId: boundary.evidenceLedger.id,
      assumptionLedgerId: boundary.assumptionLedger.id,
    },
    forecastUnits: units,
    sourceSnapshots,
    versions: {
      outcomeCalibrationEngineVersion: OUTCOME_CALIBRATION_ENGINE_VERSION_V2,
      forecastLockSchemaVersion: FORECAST_LOCK_SCHEMA_VERSION_V2,
    },
  };
  const forecastLock: ForecastLockV2 = {
    id: forecastLockIdV2(unsigned),
    ...unsigned,
    forecastLockIntegritySignature: stage7FingerprintV2(unsigned),
  };
  return { ok: true as const, forecastLock };
}

export function buildForecastLockV2(input: unknown) {
  try {
    return buildUnsafe(input);
  } catch {
    return { ok: false as const, errorCode: "invalid_forecast_lock" as const };
  }
}

export function parseValidatedForecastLockV2(input: unknown) {
  try {
    const parsed = lockSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, errorCode: "invalid_forecast_lock" as const };
    const snapshots = parsed.data.sourceSnapshots;
    const rebuilt = buildUnsafe({
      forecastLockSpecId: parsed.data.forecastLockSpecId,
      lockedAt: parsed.data.lockedAt,
      run: snapshots.run,
      claimSet: snapshots.claimSet,
      claims: snapshots.claims,
      report: snapshots.report,
    });
    if (!rebuilt.ok || canonicalStage7JsonV2(rebuilt.forecastLock) !== canonicalStage7JsonV2(input)) {
      return { ok: false as const, errorCode: "invalid_forecast_lock" as const };
    }
    return { ok: true as const, forecastLock: structuredClone(rebuilt.forecastLock) };
  } catch {
    return { ok: false as const, errorCode: "invalid_forecast_lock" as const };
  }
}

export function parseValidatedForecastLockPersistenceVersionV2(input: unknown) {
  try {
    const parsed = persistenceSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, errorCode: "invalid_forecast_lock" as const };
    const lockResult = parseValidatedForecastLockV2(parsed.data.artifact.value);
    if (!lockResult.ok) return lockResult;
    const lock = lockResult.forecastLock;
    const persisted = parseTrajectoryInstantV2(parsed.data.persistedAt);
    const locked = parseTrajectoryInstantV2(lock.lockedAt);
    if (!persisted.ok || !locked.ok || persisted.value.epochMilliseconds < locked.value.epochMilliseconds ||
        parsed.data.seedContextId !== lock.seedContextId ||
        parsed.data.evidenceLedgerId !== lock.realityBoundaryBinding.evidenceLedgerId ||
        parsed.data.assumptionLedgerId !== lock.realityBoundaryBinding.assumptionLedgerId ||
        parsed.data.realityBoundaryRevision !== lock.realityBoundaryBinding.revision) {
      return { ok: false as const, errorCode: "invalid_forecast_lock" as const };
    }
    const candidate = structuredClone(parsed.data) as OutcomeCalibrationPersistenceVersionV2;
    const { id, persistenceIntegritySignature, ...unsigned } = candidate;
    const expectedRequestFingerprint = stage7FingerprintV2({
      streamId: candidate.streamId,
      expectedVersion: candidate.version - 1,
      idempotencyKey: candidate.idempotencyKey,
      persistedAt: candidate.persistedAt,
      artifact: candidate.artifact,
    });
    if (id !== persistenceVersionIdV2(unsigned) ||
        persistenceIntegritySignature !== stage7FingerprintV2(unsigned) ||
        candidate.requestFingerprint !== expectedRequestFingerprint) {
      return { ok: false as const, errorCode: "invalid_forecast_lock" as const };
    }
    return { ok: true as const, persistenceVersion: candidate, forecastLock: lock };
  } catch {
    return { ok: false as const, errorCode: "invalid_forecast_lock" as const };
  }
}
