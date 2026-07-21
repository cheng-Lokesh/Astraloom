import type {
  OutcomeCalibrationArtifactV2,
  OutcomeCalibrationPersistenceVersionV2,
} from "./types";

export type OutcomeCalibrationRepositoryErrorCodeV2 =
  | "invalid_repository_input"
  | "invalid_id"
  | "invalid_artifact"
  | "stale_version"
  | "idempotency_conflict"
  | "immutable_artifact_conflict"
  | "missing_dependency"
  | "cross_seed_reference"
  | "cross_ledger_reference";

export type OutcomeCalibrationRepositoryResultV2<T> =
  | { ok: true; data: T; errorCode: null }
  | { ok: false; data: null; errorCode: OutcomeCalibrationRepositoryErrorCodeV2 };

export type OutcomeCalibrationAppendResultV2 =
  | {
      ok: true;
      data: OutcomeCalibrationPersistenceVersionV2;
      errorCode: null;
      idempotent: boolean;
    }
  | {
      ok: false;
      data: null;
      errorCode: OutcomeCalibrationRepositoryErrorCodeV2;
    };

export type AppendOutcomeCalibrationArtifactInputV2 = {
  streamId: `outcome_calibration_stream_v2_${string}`;
  expectedVersion: number;
  idempotencyKey: `stage7_idempotency_v2_${string}`;
  persistedAt: string;
  artifact: OutcomeCalibrationArtifactV2;
};

export type OutcomeCalibrationRepositoryPortV2 = {
  append: (input: unknown) => Promise<OutcomeCalibrationAppendResultV2>;
  loadLatest: (input: unknown) => Promise<OutcomeCalibrationRepositoryResultV2<OutcomeCalibrationPersistenceVersionV2 | null>>;
  loadVersion: (input: unknown) => Promise<OutcomeCalibrationRepositoryResultV2<OutcomeCalibrationPersistenceVersionV2 | null>>;
  loadHistory: (input: unknown) => Promise<OutcomeCalibrationRepositoryResultV2<OutcomeCalibrationPersistenceVersionV2[]>>;
};
