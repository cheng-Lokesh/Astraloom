import { createHash } from "node:crypto";

import { z } from "zod";

import { validateWorldV2 } from "../agent-world/validation";
import { validateClaimsReportV2 } from "../claims-reports/report-builder";
import { validateRealityBoundaryDraftV2 } from "../reality-boundary/validation";
import { buildSimulationFrequencyV2 } from "../trajectory-analysis/simulation-frequency";
import { parseTrajectoryResultForFeatureV2 } from "../trajectory-analysis/trajectory-result-validation";
import { parseValidatedForecastLockV2 } from "../outcome-calibration/forecast-lock";

export const MIGRATION_SCHEMA_VERSION_V2 = "v1-local-draft-to-v2-1" as const;
export const MIGRATION_ENGINE_VERSION_V2 = "stage-8-migration-engine-v2-1" as const;
export const ASYNC_JOB_SCHEMA_VERSION_V2 = "async-simulation-job-v2-1" as const;

type Result<T, E extends string> =
  | { ok: true; data: T; errorCode: null }
  | { ok: false; data: null; errorCode: E };

const text = z.string().trim().min(1).max(10_000);
const isoTimestamp = text.refine((value) => !Number.isNaN(Date.parse(value)), "invalid timestamp");
const v1DraftSchema = z.object({
  id: text,
  questionText: text,
  trackType: z.enum(["crossroad", "life_climate"]),
  timeWindow: z.enum(["30_days", "90_days", "1_year", "3_years", "5_years"]),
  destinyBirthInfo: z.string().max(10_000).optional(),
  currentQuestionDescription: z.string().max(10_000).optional(),
  situationSummary: text,
  recentEvents: z.string().max(10_000).optional(),
  keyPeopleText: text,
  decisionOptions: z.string().max(10_000).optional(),
  worries: z.string().max(10_000).optional(),
  forbiddenActions: z.string().max(10_000).optional(),
  safetyBoundaries: z.string().max(10_000).optional(),
  desiredOutput: z.string().max(10_000).optional(),
  privacyAck: z.boolean(),
  locale: z.enum(["en", "zh"]),
  status: z.literal("draft"),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
}).strict();
const migrationInputSchema = z.object({
  source: z.object({
    kind: z.literal("v1_local_draft"),
    identity: text,
    artifactVersion: z.literal("local-deterministic-v0"),
    draft: v1DraftSchema,
  }).strict(),
}).strict();

export type V1DraftMigrationArtifactV2 = {
  artifactId: `v2_migrated_draft_${string}`;
  v2Draft: Omit<z.infer<typeof v1DraftSchema>, "id" | "destinyBirthInfo"> & { id: `seed_context_v2_${string}` };
  lineage: {
    sourceIdentity: string;
    sourceVersion: "local-deterministic-v0";
    sourceFingerprint: string;
    migrationSchemaVersion: typeof MIGRATION_SCHEMA_VERSION_V2;
    migrationEngineVersion: typeof MIGRATION_ENGINE_VERSION_V2;
    parentArtifactId: `v2_migrated_draft_${string}` | null;
    targetArtifactIds: string[];
  };
  integritySignature: string;
};
export type MigrationResultV2 = (Result<V1DraftMigrationArtifactV2, "invalid_migration_input" | "incompatible_v1_draft"> & { idempotent?: boolean; warningCodes?: string[] }) | { ok: true; data: V1DraftMigrationArtifactV2; errorCode: null; idempotent: boolean; warningCodes: string[] };

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stable(object[key])}`).join(",")}}`;
}

function fingerprint(value: unknown) {
  return createHash("sha256").update(stable(value)).digest("hex").slice(0, 24);
}
function clone<T>(value: T): T { return structuredClone(value); }
function failure<E extends string>(errorCode: E): Result<never, E> { return { ok: false, data: null, errorCode }; }

export function createV1DraftMigrationServiceV2() {
  const byContent = new Map<string, V1DraftMigrationArtifactV2>();
  const history: V1DraftMigrationArtifactV2[] = [];

  return {
    migrate(input: unknown): MigrationResultV2 {
      try {
        const parsed = migrationInputSchema.safeParse(input);
        if (!parsed.success) return { ...failure("invalid_migration_input"), idempotent: false, warningCodes: [] };
        const { source } = parsed.data;
        if (source.identity !== source.draft.id) return { ...failure("incompatible_v1_draft"), idempotent: false, warningCodes: [] };
        const content = { ...source.draft };
        Reflect.deleteProperty(content, "id");
        Reflect.deleteProperty(content, "destinyBirthInfo");
        const sourceFingerprint = fingerprint({ artifactVersion: source.artifactVersion, content });
        const existing = byContent.get(sourceFingerprint);
        const warningCodes = source.draft.destinyBirthInfo?.trim() ? ["legacy_destiny_isolated"] : [];
        if (existing) return { ok: true, data: clone(existing), errorCode: null, idempotent: true, warningCodes };
        const parent = history.at(-1) ?? null;
        const artifactId = `v2_migrated_draft_${sourceFingerprint}` as const;
        const unsigned = {
          artifactId,
          v2Draft: { ...content, id: `seed_context_v2_${sourceFingerprint}` as const },
          lineage: {
            sourceIdentity: source.identity,
            sourceVersion: source.artifactVersion,
            sourceFingerprint,
            migrationSchemaVersion: MIGRATION_SCHEMA_VERSION_V2,
            migrationEngineVersion: MIGRATION_ENGINE_VERSION_V2,
            parentArtifactId: parent?.artifactId ?? null,
            targetArtifactIds: [`seed_context_v2_${sourceFingerprint}`],
          },
        };
        const artifact: V1DraftMigrationArtifactV2 = { ...unsigned, integritySignature: fingerprint(unsigned) };
        byContent.set(sourceFingerprint, artifact);
        history.push(artifact);
        return { ok: true, data: clone(artifact), errorCode: null, idempotent: false, warningCodes };
      } catch {
        return { ...failure("invalid_migration_input"), idempotent: false, warningCodes: [] };
      }
    },
    history() { return clone(history); },
  };
}

const jobRequestSchema = z.object({
  idempotencyKey: z.string().regex(/^stage8_job_key_[a-z0-9][a-z0-9_-]*$/),
  seedContext: z.object({ id: text, summary: text }).strict(),
  runSpec: z.object({ id: text, seedContextId: text, horizonDays: z.union([z.literal(30), z.literal(90)]) }).strict(),
  schemaVersion: z.literal("2.0"),
  engineVersion: text,
}).strict().superRefine((value, context) => {
  if (value.seedContext.id !== value.runSpec.seedContextId) context.addIssue({ code: "custom", message: "cross Seed reference" });
});
const jobIdSchema = z.string().regex(/^async_simulation_job_v2_[a-f0-9]{24}$/);
const workerIdSchema = z.string().regex(/^worker_[a-z0-9][a-z0-9_-]*$/);

export type AsyncSimulationJobV2 = {
  jobId: `async_simulation_job_v2_${string}`;
  requestFingerprint: string;
  seedContext: { id: string; summary: string };
  runSpec: { id: string; seedContextId: string; horizonDays: 30 | 90 };
  schemaVersion: "2.0";
  engineVersion: string;
  status: "queued" | "running" | "succeeded" | "failed";
  attempt: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  resultIds: Record<string, string> | null;
  errorCode: string | null;
  integritySignature: string;
};
type SubmitResult = Result<AsyncSimulationJobV2, "invalid_job_input" | "idempotency_conflict"> & { idempotent?: boolean };
type JobResult = Result<AsyncSimulationJobV2 | null, "invalid_job_input">;
type LeaseResult = Result<AsyncSimulationJobV2 | null, "invalid_worker_input">;

function signedJob(unsigned: Omit<AsyncSimulationJobV2, "integritySignature">): AsyncSimulationJobV2 {
  return { ...unsigned, integritySignature: fingerprint(unsigned) };
}

export function createInMemoryAsyncSimulationJobRepositoryV2() {
  const jobs = new Map<string, AsyncSimulationJobV2>();
  const idempotency = new Map<string, { requestFingerprint: string; jobId: string }>();
  return {
    async submit(input: unknown): Promise<SubmitResult> {
      try {
        const parsed = jobRequestSchema.safeParse(input);
        if (!parsed.success) return { ...failure("invalid_job_input"), idempotent: false };
        const requestFingerprint = fingerprint({ ...parsed.data, idempotencyKey: undefined });
        const previous = idempotency.get(parsed.data.idempotencyKey);
        if (previous) {
          if (previous.requestFingerprint !== requestFingerprint) return { ...failure("idempotency_conflict"), idempotent: false };
          return { ok: true, data: clone(jobs.get(previous.jobId)!), errorCode: null, idempotent: true };
        }
        const now = new Date().toISOString();
        const jobId = `async_simulation_job_v2_${fingerprint({ requestFingerprint, idempotencyKey: parsed.data.idempotencyKey })}` as const;
        const job = signedJob({ jobId, requestFingerprint, seedContext: clone(parsed.data.seedContext), runSpec: clone(parsed.data.runSpec), schemaVersion: parsed.data.schemaVersion, engineVersion: parsed.data.engineVersion, status: "queued", attempt: 0, createdAt: now, startedAt: null, completedAt: null, resultIds: null, errorCode: null });
        jobs.set(jobId, job); idempotency.set(parsed.data.idempotencyKey, { requestFingerprint, jobId });
        return { ok: true, data: clone(job), errorCode: null, idempotent: false };
      } catch { return { ...failure("invalid_job_input"), idempotent: false }; }
    },
    async get(input: unknown): Promise<JobResult> {
      try { const parsed = z.object({ jobId: jobIdSchema }).strict().safeParse(input); if (!parsed.success) return failure("invalid_job_input"); return { ok: true, data: clone(jobs.get(parsed.data.jobId) ?? null), errorCode: null }; } catch { return failure("invalid_job_input"); }
    },
    async claim(input: unknown): Promise<LeaseResult> {
      try {
        const parsed = z.object({ workerId: workerIdSchema }).strict().safeParse(input);
        if (!parsed.success) return failure("invalid_worker_input");
        const queued = Array.from(jobs.values()).find((job) => job.status === "queued");
        if (!queued) return { ok: true, data: null, errorCode: null };
        const running = signedJob({ ...queued, status: "running", attempt: queued.attempt + 1, startedAt: new Date().toISOString(), completedAt: null, resultIds: null, errorCode: null });
        jobs.set(running.jobId, running); return { ok: true, data: clone(running), errorCode: null };
      } catch { return failure("invalid_worker_input"); }
    },
    async finalize(jobId: string, outcome: { status: "succeeded"; resultIds: Record<string, string>; integritySignature: string } | { status: "failed"; errorCode: string }): Promise<AsyncSimulationJobV2 | null> {
      const current = jobs.get(jobId); if (!current || current.status !== "running") return null;
      const next = outcome.status === "succeeded"
        ? signedJob({ ...current, status: "succeeded", completedAt: new Date().toISOString(), resultIds: clone(outcome.resultIds), errorCode: null })
        : signedJob({ ...current, status: "failed", completedAt: new Date().toISOString(), resultIds: null, errorCode: outcome.errorCode });
      jobs.set(jobId, next); return clone(next);
    },
  };
}

export type AsyncSimulationJobRepositoryPortV2 = ReturnType<typeof createInMemoryAsyncSimulationJobRepositoryV2>;
export type AsyncSimulationJobQueuePortV2 = Pick<AsyncSimulationJobRepositoryPortV2, "submit" | "claim">;

export type CanonicalStage2To7ArtifactsV2 = { stage2Evidence: unknown; stage3World: unknown; stage4Trajectory: unknown; stage5Analysis: unknown; stage6ClaimsReport: unknown; stage7OutcomeCalibration: unknown };
export type CanonicalArtifactValidatorPortV2 = { validate: (artifacts: CanonicalStage2To7ArtifactsV2) => boolean };

/** Production adapter: invokes the accepted Stage 2–7 validators; it does not reimplement them. */
export function createStage2To7CanonicalArtifactValidatorV2(): CanonicalArtifactValidatorPortV2 {
  return { validate(artifacts) {
    try {
      if (!validateRealityBoundaryDraftV2(artifacts.stage2Evidence).ok || !validateWorldV2(artifacts.stage3World).ok) return false;
      const trajectory = artifacts.stage4Trajectory as { initialWorld?: unknown; trajectory?: unknown; context?: unknown };
      if (!parseTrajectoryResultForFeatureV2(trajectory.initialWorld, trajectory.trajectory, trajectory.context).ok) return false;
      const analysis = artifacts.stage5Analysis as { clusters?: unknown; features?: unknown };
      if (!buildSimulationFrequencyV2(analysis.clusters as never, analysis.features).ok) return false;
      const report = artifacts.stage6ClaimsReport as { report?: unknown; claimSet?: unknown; claims?: unknown };
      if (!validateClaimsReportV2(report.report, report.claimSet, report.claims).ok) return false;
      return parseValidatedForecastLockV2(artifacts.stage7OutcomeCalibration).ok;
    } catch { return false; }
  } };
}

export function createControlledAsyncSimulationExecutorV2(repository: AsyncSimulationJobRepositoryPortV2, adapter: { execute: (job: Readonly<AsyncSimulationJobV2>) => Promise<CanonicalStage2To7ArtifactsV2>; validate: CanonicalArtifactValidatorPortV2["validate"] }) {
  return { async runOnce(workerInput: unknown) {
    const claimed = await repository.claim({ workerId: workerInput });
    if (!claimed.ok) return { status: "invalid_worker_input" as const, errorCode: claimed.errorCode };
    if (!claimed.data) return { status: "idle" as const };
    try {
      const artifacts = await adapter.execute(clone(claimed.data));
      if (!adapter.validate(clone(artifacts))) {
        await repository.finalize(claimed.data.jobId, { status: "failed", errorCode: "invalid_canonical_artifacts" });
        return { status: "failed" as const, errorCode: "invalid_canonical_artifacts" as const };
      }
      const resultIds = Object.fromEntries(Object.entries(artifacts).map(([key, value]) => [key, (value as { id: string }).id]));
      const integritySignature = fingerprint({ jobId: claimed.data.jobId, requestFingerprint: claimed.data.requestFingerprint, resultIds, artifacts });
      await repository.finalize(claimed.data.jobId, { status: "succeeded", resultIds, integritySignature });
      return { status: "succeeded" as const };
    } catch {
      await repository.finalize(claimed.data.jobId, { status: "failed", errorCode: "execution_failed" });
      return { status: "failed" as const, errorCode: "execution_failed" as const };
    }
  } };
}

export type AsyncSimulationExecutorPortV2 = ReturnType<typeof createControlledAsyncSimulationExecutorV2>;
