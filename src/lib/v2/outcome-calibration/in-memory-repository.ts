import { z } from "zod";

import { parseValidatedBacktestV2 } from "./backtesting";
import { parseValidatedCalibrationV2 } from "./calibration";
import { parseValidatedForecastLockV2, validateForecastLockWriteTimingV2 } from "./forecast-lock";
import { persistenceVersionIdV2, stage7FingerprintV2 } from "./ids";
import { parseValidatedOutcomeV2 } from "./outcome-capture";
import { parseTrajectoryInstantV2 } from "../trajectory/time";
import type {
  OutcomeCalibrationAppendResultV2,
  OutcomeCalibrationRepositoryErrorCodeV2,
  OutcomeCalibrationRepositoryPortV2,
  OutcomeCalibrationRepositoryResultV2,
} from "./repository";
import type {
  OutcomeCalibrationArtifactV2,
  OutcomeCalibrationPersistenceVersionV2,
} from "./types";
import { PERSISTENCE_SCHEMA_VERSION_V2 } from "./types";

const bounded = z.string().trim().min(1).max(2000);
function isValidIsoTimestamp(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = Number(match[9] ?? 0);
  const offsetMinute = Number(match[10] ?? 0);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysByMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= daysByMonth[month - 1]! &&
    hour <= 23 && minute <= 59 && second <= 59 && offsetHour <= 23 && offsetMinute <= 59 &&
    !Number.isNaN(Date.parse(value));
}
const strictTimestamp = bounded.refine(isValidIsoTimestamp);
const streamIdSchema = z.string().regex(/^outcome_calibration_stream_v2_[a-z0-9][a-z0-9_-]*$/);
const artifactSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("forecast_lock"), value: z.unknown() }).strict(),
  z.object({ kind: z.literal("outcome"), value: z.unknown() }).strict(),
  z.object({ kind: z.literal("backtest"), value: z.unknown() }).strict(),
  z.object({ kind: z.literal("calibration"), value: z.unknown() }).strict(),
]);
const appendSchema = z.object({
  streamId: streamIdSchema,
  expectedVersion: z.number().int().nonnegative(),
  idempotencyKey: z.string().regex(/^stage7_idempotency_v2_[a-z0-9][a-z0-9_-]*$/),
  persistedAt: strictTimestamp,
  artifact: artifactSchema,
}).strict();
const loadSchema = z.object({ streamId: streamIdSchema }).strict();
const versionSchema = z.object({ streamId: streamIdSchema, version: z.number().int().positive() }).strict();

function clone<T>(value: T): T {
  return structuredClone(value);
}

function success<T>(data: T): OutcomeCalibrationRepositoryResultV2<T> {
  return { ok: true, data: clone(data), errorCode: null };
}

function failure(errorCode: OutcomeCalibrationRepositoryErrorCodeV2) {
  return { ok: false as const, data: null, errorCode };
}

function appendSuccess(data: OutcomeCalibrationPersistenceVersionV2, idempotent: boolean): OutcomeCalibrationAppendResultV2 {
  return { ok: true, data: clone(data), errorCode: null, idempotent };
}

function artifactIdentity(artifact: OutcomeCalibrationArtifactV2) {
  return artifact.value.id;
}

function validateArtifact(artifact: z.infer<typeof artifactSchema>) {
  if (artifact.kind === "forecast_lock") {
    const result = parseValidatedForecastLockV2(artifact.value);
    return result.ok ? { ok: true as const, artifact: { kind: "forecast_lock" as const, value: result.forecastLock } } : null;
  }
  if (artifact.kind === "outcome") {
    const result = parseValidatedOutcomeV2(artifact.value);
    return result.ok ? { ok: true as const, artifact: { kind: "outcome" as const, value: result.outcome } } : null;
  }
  if (artifact.kind === "backtest") {
    const result = parseValidatedBacktestV2(artifact.value);
    return result.ok ? { ok: true as const, artifact: { kind: "backtest" as const, value: result.backtest } } : null;
  }
  const result = parseValidatedCalibrationV2(artifact.value);
  return result.ok ? { ok: true as const, artifact: { kind: "calibration" as const, value: result.calibration } } : null;
}

function artifactBoundary(artifact: OutcomeCalibrationArtifactV2) {
  if (artifact.kind === "forecast_lock") return {
    seedContextId: artifact.value.seedContextId,
    evidenceLedgerId: artifact.value.realityBoundaryBinding.evidenceLedgerId,
    assumptionLedgerId: artifact.value.realityBoundaryBinding.assumptionLedgerId,
    revision: artifact.value.realityBoundaryBinding.revision,
  };
  if (artifact.kind === "outcome") return {
    seedContextId: artifact.value.seedContextId,
    evidenceLedgerId: artifact.value.realityBoundarySnapshot.evidenceLedger.id,
    assumptionLedgerId: artifact.value.realityBoundarySnapshot.assumptionLedger.id,
    revision: artifact.value.realityBoundarySnapshot.revision,
  };
  if (artifact.kind === "backtest") return {
    seedContextId: artifact.value.seedContextId,
    evidenceLedgerId: artifact.value.realityBoundaryBinding.evidenceLedgerId,
    assumptionLedgerId: artifact.value.realityBoundaryBinding.assumptionLedgerId,
    revision: artifact.value.realityBoundaryBinding.outcomeRevision,
  };
  return {
    seedContextId: artifact.value.seedContextId,
    evidenceLedgerId: artifact.value.realityBoundaryBinding.evidenceLedgerId,
    assumptionLedgerId: artifact.value.realityBoundaryBinding.assumptionLedgerId,
    revision: artifact.value.realityBoundaryBinding.maximumRevision,
  };
}

function dependenciesPresent(artifact: OutcomeCalibrationArtifactV2, history: OutcomeCalibrationPersistenceVersionV2[]) {
  if (artifact.kind === "forecast_lock") return true;
  if (artifact.kind === "outcome") {
    const primary = artifact.value.realityBoundarySnapshot.evidenceLedger.items.find(
      (item) => item.id === artifact.value.source.realEvidenceId,
    );
    const captured = parseTrajectoryInstantV2(primary?.capturedAt);
    const windowStart = parseTrajectoryInstantV2(artifact.value.observationWindow.startAt);
    const occurredAt = artifact.value.observed === "occurred"
      ? parseTrajectoryInstantV2(artifact.value.occurredAt)
      : null;
    return captured.ok && windowStart.ok && history.some((record) => {
      if (record.artifact.kind !== "forecast_lock") return false;
      const locked = parseTrajectoryInstantV2(record.artifact.value.lockedAt);
      const persisted = parseTrajectoryInstantV2(record.persistedAt);
      return locked.ok && persisted.ok &&
        locked.value.epochMilliseconds < windowStart.value.epochMilliseconds &&
        persisted.value.epochMilliseconds < windowStart.value.epochMilliseconds &&
        locked.value.epochMilliseconds < captured.value.epochMilliseconds &&
        persisted.value.epochMilliseconds < captured.value.epochMilliseconds &&
        (artifact.value.observed !== "occurred" ||
          (occurredAt?.ok && locked.value.epochMilliseconds < occurredAt.value.epochMilliseconds)) &&
        record.artifact.value.forecastUnits.some((unit) =>
          unit.claimId === artifact.value.claimReference.claimId &&
          unit.clusterId === artifact.value.claimReference.clusterId);
    });
  }
  if (artifact.kind === "backtest") {
    const lockPresent = history.some((record) =>
      record.id === artifact.value.forecastLockBinding.persistenceVersionId &&
      record.artifact.kind === "forecast_lock" &&
      record.artifact.value.id === artifact.value.forecastLockBinding.forecastLockId &&
      canonicalArtifact(record) === canonicalArtifact(artifact.value.sourceSnapshots.forecastLockPersistenceVersion));
    const outcomePresent = history.some((record) =>
      record.artifact.kind === "outcome" && record.artifact.value.id === artifact.value.outcomeId);
    return lockPresent && outcomePresent;
  }
  const persistedBacktests = new Set(history.flatMap((record) =>
    record.artifact.kind === "backtest" ? [record.artifact.value.id] : []));
  return artifact.value.backtestIds.every((id) => persistedBacktests.has(id));
}

function canonicalArtifact(value: unknown) {
  return stage7FingerprintV2(value);
}

function invalidIdInput(input: unknown) {
  const candidate = input as { streamId?: unknown };
  return typeof candidate?.streamId === "string" && !streamIdSchema.safeParse(candidate.streamId).success;
}

export function createInMemoryOutcomeCalibrationRepositoryV2(): OutcomeCalibrationRepositoryPortV2 {
  const streams = new Map<string, OutcomeCalibrationPersistenceVersionV2[]>();
  const idempotency = new Map<string, { fingerprint: string; record: OutcomeCalibrationPersistenceVersionV2 }>();

  return {
    async append(input) {
      const parsed = appendSchema.safeParse(input);
      if (!parsed.success) return failure(invalidIdInput(input) ? "invalid_id" : "invalid_repository_input");
      const requestFingerprint = stage7FingerprintV2(parsed.data);
      const idempotencyIdentity = `${parsed.data.streamId}:${parsed.data.idempotencyKey}`;
      const priorRequest = idempotency.get(idempotencyIdentity);
      if (priorRequest) {
        if (priorRequest.fingerprint !== requestFingerprint) return failure("idempotency_conflict");
        return appendSuccess(priorRequest.record, true);
      }
      const history = streams.get(parsed.data.streamId) ?? [];
      if (parsed.data.expectedVersion !== history.length) return failure("stale_version");
      const validated = validateArtifact(parsed.data.artifact);
      if (!validated) return failure("invalid_artifact");
      const artifact = validated.artifact as OutcomeCalibrationArtifactV2;
      if (artifact.kind === "forecast_lock" && !validateForecastLockWriteTimingV2(artifact.value, parsed.data.persistedAt).ok) {
        return failure("invalid_artifact");
      }
      const binding = artifactBoundary(artifact);
      const first = history[0];
      if (first && binding.seedContextId !== first.seedContextId) return failure("cross_seed_reference");
      if (first && (binding.evidenceLedgerId !== first.evidenceLedgerId || binding.assumptionLedgerId !== first.assumptionLedgerId)) {
        return failure("cross_ledger_reference");
      }
      if (history.some((record) => record.artifact.kind === artifact.kind && artifactIdentity(record.artifact) === artifactIdentity(artifact))) {
        return failure("immutable_artifact_conflict");
      }
      if (!dependenciesPresent(artifact, history)) return failure("missing_dependency");
      const parent = history.at(-1) ?? null;
      const unsigned: Omit<OutcomeCalibrationPersistenceVersionV2, "id" | "persistenceIntegritySignature"> = {
        streamId: parsed.data.streamId as OutcomeCalibrationPersistenceVersionV2["streamId"],
        seedContextId: binding.seedContextId,
        evidenceLedgerId: binding.evidenceLedgerId,
        assumptionLedgerId: binding.assumptionLedgerId,
        realityBoundaryRevision: binding.revision,
        version: history.length + 1,
        parentVersionId: parent?.id ?? null,
        idempotencyKey: parsed.data.idempotencyKey as OutcomeCalibrationPersistenceVersionV2["idempotencyKey"],
        requestFingerprint,
        persistedAt: parsed.data.persistedAt,
        persistenceSchemaVersion: PERSISTENCE_SCHEMA_VERSION_V2,
        artifact: clone(artifact),
      };
      const record: OutcomeCalibrationPersistenceVersionV2 = {
        id: persistenceVersionIdV2(unsigned),
        ...unsigned,
        persistenceIntegritySignature: stage7FingerprintV2(unsigned),
      };
      const nextHistory = [...history, record];
      streams.set(parsed.data.streamId, nextHistory);
      idempotency.set(idempotencyIdentity, { fingerprint: requestFingerprint, record });
      return appendSuccess(record, false);
    },

    async loadLatest(input) {
      const parsed = loadSchema.safeParse(input);
      if (!parsed.success) return failure(invalidIdInput(input) ? "invalid_id" : "invalid_repository_input");
      const history = streams.get(parsed.data.streamId) ?? [];
      return success(history.at(-1) ?? null);
    },

    async loadVersion(input) {
      const parsed = versionSchema.safeParse(input);
      if (!parsed.success) return failure(invalidIdInput(input) ? "invalid_id" : "invalid_repository_input");
      const history = streams.get(parsed.data.streamId) ?? [];
      return success(history.find((record) => record.version === parsed.data.version) ?? null);
    },

    async loadHistory(input) {
      const parsed = loadSchema.safeParse(input);
      if (!parsed.success) return failure(invalidIdInput(input) ? "invalid_id" : "invalid_repository_input");
      return success(streams.get(parsed.data.streamId) ?? []);
    },
  };
}
