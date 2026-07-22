import { createHash } from "node:crypto";

import { z } from "zod";

import { parseNormalizedSeedContextDraft } from "@/lib/seed-context/storage";
import type { SeedContextDraft } from "@/types/seed-context";
import { validateWorldV2 } from "../agent-world/validation";
import { validateClaimsReportV2 } from "../claims-reports/report-builder";
import { parseRealityBoundarySnapshotV2 } from "../claims-reports/validation";
import { buildSimulationFrequencyV2 } from "../trajectory-analysis/simulation-frequency";
import { parseTrajectoryResultForFeatureV2 } from "../trajectory-analysis/trajectory-result-validation";
import { parseBatchRunSpecV2 } from "../trajectory-analysis/validation";
import type { BatchAnalysisV2, BatchRunSpecV2 } from "../trajectory-analysis/types";
import { parseValidatedForecastLockPersistenceVersionV2 } from "../outcome-calibration/forecast-lock";

export const MIGRATION_SCHEMA_VERSION_V2 = "v1-local-draft-to-v2-2" as const;
export const MIGRATION_ENGINE_VERSION_V2 = "stage-8-migration-engine-v2-2" as const;
export const ASYNC_JOB_SCHEMA_VERSION_V2 = "async-simulation-job-v2-2" as const;
const leaseDurationMs = 60_000;

type Ok<T> = { ok: true; data: T; errorCode: null };
type Fail<E extends string> = { ok: false; data: null; errorCode: E };
const fail = <E extends string>(errorCode: E): Fail<E> => ({ ok: false, data: null, errorCode });
const clone = <T>(value: T): T => structuredClone(value);
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}
const fingerprint = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex").slice(0, 24);
const normalizedText = (value: string | undefined) => value === undefined ? undefined : value.trim().replace(/\s+/g, " ");
function logicalIdentity(id: string) { return id.includes(":") ? id.slice(id.lastIndexOf(":") + 1) : id; }

type MigratedV2Draft = Omit<SeedContextDraft, "id" | "destinyBirthInfo" | "recentEventsText" | "decisionOptionsText" | "forbiddenActionsText" | "desiredOutputText"> & { id: `seed_context_v2_${string}` };
export type V1DraftMigrationArtifactV2 = {
  artifactId: `v2_migrated_draft_${string}`;
  v2Draft: MigratedV2Draft;
  lineage: { sourceIdentity: string; sourceIdentities: string[]; logicalSourceIdentity: string; sourceVersion: "local-deterministic-v0"; sourceFingerprint: string; migrationSchemaVersion: typeof MIGRATION_SCHEMA_VERSION_V2; migrationEngineVersion: typeof MIGRATION_ENGINE_VERSION_V2; parentArtifactId: `v2_migrated_draft_${string}` | null; targetArtifactIds: string[] };
  integritySignature: string;
};
type MigrationSuccess = Ok<V1DraftMigrationArtifactV2> & { idempotent: boolean; warningCodes: string[] };
type MigrationFailure = Fail<"invalid_migration_input" | "incompatible_v1_draft"> & { idempotent: false; warningCodes: string[] };
const migrationEnvelope = z.object({ source: z.object({ kind: z.literal("v1_local_draft"), identity: z.string().trim().min(1), artifactVersion: z.literal("local-deterministic-v0"), draft: z.unknown() }).strict() }).strict();

function canonicalizeDraft(draft: SeedContextDraft): { ok: true; value: Omit<MigratedV2Draft, "id"> } | { ok: false } {
  const pair = (left: string | undefined, right: string | undefined) => {
    const a = normalizedText(left); const b = normalizedText(right);
    return a !== undefined && b !== undefined && a !== b ? null : a ?? b;
  };
  const recentEvents = pair(draft.recentEvents, draft.recentEventsText);
  const decisionOptions = pair(draft.decisionOptions, draft.decisionOptionsText);
  const forbiddenActions = pair(draft.forbiddenActions, draft.forbiddenActionsText);
  const desiredOutput = pair(draft.desiredOutput, draft.desiredOutputText);
  if ([recentEvents, decisionOptions, forbiddenActions, desiredOutput].some((value) => value === null) ||
      (draft.privacySafetyAck !== undefined && draft.privacySafetyAck !== draft.privacyAck)) return { ok: false };
  const { id: _id, destinyBirthInfo: _destiny, recentEventsText: _ret, decisionOptionsText: _dot, forbiddenActionsText: _fat, desiredOutputText: _dyt, ...base } = draft;
  void _id; void _destiny; void _ret; void _dot; void _fat; void _dyt;
  return { ok: true, value: { ...base, recentEvents: recentEvents ?? undefined, decisionOptions: decisionOptions ?? undefined, forbiddenActions: forbiddenActions ?? undefined, desiredOutput: desiredOutput ?? undefined, privacySafetyAck: draft.privacyAck, missingContextHints: [...(draft.missingContextHints ?? [])].map((hint) => normalizedText(hint) ?? "").filter(Boolean) } };
}

export function parseV1DraftMigrationArtifactV2(input: unknown) {
  try {
    const parsed = z.object({ artifactId: z.string().regex(/^v2_migrated_draft_[a-f0-9]{24}$/), v2Draft: z.unknown(), lineage: z.object({ sourceIdentity: z.string().min(1), sourceIdentities: z.array(z.string().min(1)).min(1), logicalSourceIdentity: z.string().min(1), sourceVersion: z.literal("local-deterministic-v0"), sourceFingerprint: z.string().regex(/^[a-f0-9]{24}$/), migrationSchemaVersion: z.literal(MIGRATION_SCHEMA_VERSION_V2), migrationEngineVersion: z.literal(MIGRATION_ENGINE_VERSION_V2), parentArtifactId: z.string().regex(/^v2_migrated_draft_[a-f0-9]{24}$/).nullable(), targetArtifactIds: z.array(z.string().min(1)).min(1) }).strict(), integritySignature: z.string().regex(/^[a-f0-9]{24}$/) }).strict().safeParse(input);
    if (!parsed.success) return fail("invalid_migration_input");
    if (parsed.data.v2Draft === null || typeof parsed.data.v2Draft !== "object" || Array.isArray(parsed.data.v2Draft)) return fail("invalid_migration_input");
    const source = parseNormalizedSeedContextDraft({ ...(parsed.data.v2Draft as Record<string, unknown>), id: parsed.data.lineage.sourceIdentity, destinyBirthInfo: undefined, recentEventsText: undefined, decisionOptionsText: undefined, forbiddenActionsText: undefined, desiredOutputText: undefined, status: "draft" });
    if (!source.ok) return fail("invalid_migration_input");
    const content = canonicalizeDraft(source.draft); if (!content.ok) return fail("incompatible_v1_draft");
    const expectedFingerprint = fingerprint(content.value);
    const unsigned = { artifactId: `v2_migrated_draft_${expectedFingerprint}`, v2Draft: { ...content.value, id: `seed_context_v2_${expectedFingerprint}` }, lineage: parsed.data.lineage };
    if (expectedFingerprint !== parsed.data.lineage.sourceFingerprint || unsigned.artifactId !== parsed.data.artifactId || canonical(unsigned.v2Draft) !== canonical(parsed.data.v2Draft) || parsed.data.integritySignature !== fingerprint(unsigned) || !parsed.data.lineage.sourceIdentities.includes(parsed.data.lineage.sourceIdentity) || parsed.data.lineage.logicalSourceIdentity !== logicalIdentity(parsed.data.lineage.sourceIdentity)) return fail("invalid_migration_input");
    return { ok: true as const, artifact: clone(parsed.data as V1DraftMigrationArtifactV2), errorCode: null };
  } catch { return fail("invalid_migration_input"); }
}

export function createV1DraftMigrationServiceV2() {
  const byFingerprint = new Map<string, V1DraftMigrationArtifactV2>();
  const aliasIndex = new Map<string, string>();
  const lastByLogicalSource = new Map<string, V1DraftMigrationArtifactV2>();
  const history: V1DraftMigrationArtifactV2[] = [];
  return {
    migrate(input: unknown): MigrationSuccess | MigrationFailure {
      try {
        const envelope = migrationEnvelope.safeParse(input);
        const direct = envelope.success ? envelope.data.source : { kind: "v1_local_draft" as const, identity: undefined, artifactVersion: "local-deterministic-v0" as const, draft: input };
        const source = parseNormalizedSeedContextDraft(direct.draft);
        if (!source.ok || source.draft.status !== "draft") return { ...fail("invalid_migration_input"), idempotent: false, warningCodes: [] };
        if (direct.identity !== undefined && direct.identity !== source.draft.id) return { ...fail("incompatible_v1_draft"), idempotent: false, warningCodes: [] };
        const content = canonicalizeDraft(source.draft); if (!content.ok) return { ...fail("incompatible_v1_draft"), idempotent: false, warningCodes: [] };
        const sourceFingerprint = fingerprint(content.value); const logical = logicalIdentity(source.draft.id); const warningCodes = source.draft.destinyBirthInfo?.trim() ? ["legacy_destiny_isolated"] : [];
        const prior = byFingerprint.get(sourceFingerprint);
        if (prior) {
          aliasIndex.set(source.draft.id, prior.artifactId);
          return { ok: true, data: clone(prior), errorCode: null, idempotent: true, warningCodes };
        }
        const parent = lastByLogicalSource.get(logical) ?? null;
        const artifactId = `v2_migrated_draft_${sourceFingerprint}` as const;
        const v2Draft = { ...content.value, id: `seed_context_v2_${sourceFingerprint}` as const };
        const lineage: V1DraftMigrationArtifactV2["lineage"] = { sourceIdentity: source.draft.id, sourceIdentities: [source.draft.id], logicalSourceIdentity: logical, sourceVersion: "local-deterministic-v0", sourceFingerprint, migrationSchemaVersion: MIGRATION_SCHEMA_VERSION_V2, migrationEngineVersion: MIGRATION_ENGINE_VERSION_V2, parentArtifactId: parent?.artifactId ?? null, targetArtifactIds: [v2Draft.id] };
        const artifact: V1DraftMigrationArtifactV2 = { artifactId, v2Draft, lineage, integritySignature: fingerprint({ artifactId, v2Draft, lineage }) };
        byFingerprint.set(sourceFingerprint, artifact); aliasIndex.set(source.draft.id, artifactId); lastByLogicalSource.set(logical, artifact); history.push(artifact);
        return { ok: true, data: clone(artifact), errorCode: null, idempotent: false, warningCodes };
      } catch { return { ...fail("invalid_migration_input"), idempotent: false, warningCodes: [] }; }
    },
    history: () => clone(history),
    parseArtifact: parseV1DraftMigrationArtifactV2,
  };
}

export type CanonicalStage2To7ResultBundleV2 = { stage2RealityBoundary: unknown; stage3World: unknown; stage4: { runSpec: BatchRunSpecV2; trajectories: unknown[] }; stage5Analysis: BatchAnalysisV2; stage6: { claimSet: unknown; claims: unknown[]; report: unknown }; stage7: { forecastLockPersistenceVersion: unknown; history: unknown[] } };
function validateBundle(bundle: CanonicalStage2To7ResultBundleV2, job: AsyncSimulationJobV2) {
  try {
    const boundary = parseRealityBoundarySnapshotV2(bundle.stage2RealityBoundary);
    if (!boundary.ok || !validateWorldV2(bundle.stage3World).ok) return false;
    const spec = parseBatchRunSpecV2(bundle.stage4.runSpec); if (!spec.ok || canonical(spec.value) !== canonical(job.runSpec) || spec.value.seedContextId !== job.seedContext.id) return false;
    if (bundle.stage4.trajectories.length !== spec.value.trajectorySeeds.length || bundle.stage4.trajectories.some((trajectory) => !parseTrajectoryResultForFeatureV2(spec.value.trajectoryTemplate.initialWorld, trajectory, { seedContextId: spec.value.seedContextId, trajectorySeed: (trajectory as { trajectorySeed?: unknown }).trajectorySeed, policyId: spec.value.policyId, policyVersion: spec.value.policyVersion, trajectoryEngineVersion: spec.value.trajectoryEngineVersion, batchRunSpec: spec.value }).ok)) return false;
    if (canonical(bundle.stage5Analysis.spec) !== canonical(spec.value) || canonical(bundle.stage5Analysis.trajectories) !== canonical(bundle.stage4.trajectories) || !buildSimulationFrequencyV2(bundle.stage5Analysis.clusters, bundle.stage5Analysis.features).ok) return false;
    if (!validateClaimsReportV2(bundle.stage6.report, bundle.stage6.claimSet, bundle.stage6.claims).ok) return false;
    const persisted = parseValidatedForecastLockPersistenceVersionV2(bundle.stage7.forecastLockPersistenceVersion); if (!persisted.ok || persisted.persistenceVersion.seedContextId !== job.seedContext.id || persisted.persistenceVersion.version !== 1 || persisted.persistenceVersion.parentVersionId !== null || bundle.stage7.history.length !== 1 || canonical(bundle.stage7.history[0]) !== canonical(persisted.persistenceVersion)) return false;
    return true;
  } catch { return false; }
}
export function createStage2To7CanonicalArtifactValidatorV2() { return { validate: (bundle: CanonicalStage2To7ResultBundleV2, job: AsyncSimulationJobV2) => validateBundle(bundle, job) }; }

const submitSchema = z.object({ idempotencyKey: z.string().regex(/^stage8_job_key_[a-z0-9][a-z0-9_-]*$/), seedContext: z.object({ id: z.string().min(1), summary: z.string().min(1) }).strict(), runSpec: z.unknown(), schemaVersion: z.literal("2.0") }).strict();
const workerSchema = z.object({ workerId: z.string().regex(/^worker_[a-z0-9][a-z0-9_-]*$/) }).strict();
const completionSchema = z.object({ jobId: z.string().regex(/^async_simulation_job_v2_[a-f0-9]{24}$/), workerId: z.string().regex(/^worker_[a-z0-9][a-z0-9_-]*$/), leaseToken: z.string().regex(/^lease_v2_[a-f0-9]{24}$/), attempt: z.number().int().positive(), resultBundle: z.unknown(), resultBindingIntegritySignature: z.string().regex(/^[a-f0-9]{24}$/) }).strict();
export type AsyncSimulationJobV2 = { jobId: `async_simulation_job_v2_${string}`; requestFingerprint: string; seedContext: { id: string; summary: string }; runSpec: BatchRunSpecV2; schemaVersion: "2.0"; engineVersion: BatchRunSpecV2["trajectoryEngineVersion"]; status: "queued" | "running" | "succeeded" | "failed"; attempt: number; createdAt: string; startedAt: string | null; completedAt: string | null; workerId: string | null; leaseToken: string | null; leasedAt: string | null; leaseExpiresAt: string | null; resultIds: Record<string, string> | null; errorCode: string | null; integritySignature: string; resultBindingIntegritySignature: string | null };
const signedJob = (job: Omit<AsyncSimulationJobV2, "integritySignature">): AsyncSimulationJobV2 => ({ ...job, integritySignature: fingerprint(job) });
function resultIds(bundle: CanonicalStage2To7ResultBundleV2) { const lock = bundle.stage7.forecastLockPersistenceVersion as { id?: string; artifact?: { value?: { id?: string } } }; return { evidenceLedgerId: (bundle.stage2RealityBoundary as { evidenceLedger?: { id?: string } }).evidenceLedger?.id ?? "", worldId: (bundle.stage3World as { id?: string }).id ?? "", analysisRunSpecId: bundle.stage5Analysis.spec.analysisRunSpecId, reportId: (bundle.stage6.report as { id?: string }).id ?? "", forecastLockPersistenceVersionId: lock.id ?? "", forecastLockId: lock.artifact?.value?.id ?? "" }; }
export type AsyncSimulationJobRepositoryPortV2 = { submit(input: unknown): Promise<Ok<AsyncSimulationJobV2> & { idempotent: boolean } | Fail<"invalid_job_input" | "idempotency_conflict">>; get(input: unknown): Promise<Ok<AsyncSimulationJobV2 | null> | Fail<"invalid_job_input">>; claim(input: unknown): Promise<Ok<AsyncSimulationJobV2 | null> | Fail<"invalid_worker_input">>; complete(input: unknown): Promise<Ok<AsyncSimulationJobV2> | Fail<"invalid_completion_input" | "lease_mismatch" | "invalid_canonical_artifacts" | "result_binding_tampering">>; fail(input: unknown): Promise<Ok<AsyncSimulationJobV2> | Fail<"invalid_completion_input" | "lease_mismatch">>; };
export function createInMemoryAsyncSimulationJobRepositoryV2(): AsyncSimulationJobRepositoryPortV2 {
  const jobs = new Map<string, AsyncSimulationJobV2>(); const keys = new Map<string, { fingerprint: string; jobId: string }>();
  return {
    async submit(input) { try { const parsed = submitSchema.safeParse(input); if (!parsed.success) return fail("invalid_job_input"); const spec = parseBatchRunSpecV2(parsed.data.runSpec); if (!spec.ok || spec.value.seedContextId !== parsed.data.seedContext.id) return fail("invalid_job_input"); const requestFingerprint = fingerprint({ seedContext: parsed.data.seedContext, runSpec: spec.value, schemaVersion: parsed.data.schemaVersion }); const existing = keys.get(parsed.data.idempotencyKey); if (existing) return existing.fingerprint === requestFingerprint ? { ok: true, data: clone(jobs.get(existing.jobId)!), errorCode: null, idempotent: true } : fail("idempotency_conflict"); const now = new Date().toISOString(); const jobId = `async_simulation_job_v2_${fingerprint({ requestFingerprint, key: parsed.data.idempotencyKey })}` as const; const job = signedJob({ jobId, requestFingerprint, seedContext: clone(parsed.data.seedContext), runSpec: clone(spec.value), schemaVersion: "2.0", engineVersion: spec.value.trajectoryEngineVersion, status: "queued", attempt: 0, createdAt: now, startedAt: null, completedAt: null, workerId: null, leaseToken: null, leasedAt: null, leaseExpiresAt: null, resultIds: null, errorCode: null, resultBindingIntegritySignature: null }); jobs.set(jobId, job); keys.set(parsed.data.idempotencyKey, { fingerprint: requestFingerprint, jobId }); return { ok: true, data: clone(job), errorCode: null, idempotent: false }; } catch { return fail("invalid_job_input"); } },
    async get(input) { try { const parsed = z.object({ jobId: z.string().regex(/^async_simulation_job_v2_[a-f0-9]{24}$/) }).strict().safeParse(input); return parsed.success ? { ok: true, data: clone(jobs.get(parsed.data.jobId) ?? null), errorCode: null } : fail("invalid_job_input"); } catch { return fail("invalid_job_input"); } },
    async claim(input) { try { const parsed = workerSchema.safeParse(input); if (!parsed.success) return fail("invalid_worker_input"); const now = Date.now(); const candidate = [...jobs.values()].find((job) => job.status === "queued" || (job.status === "running" && Date.parse(job.leaseExpiresAt ?? "") <= now)); if (!candidate) return { ok: true, data: null, errorCode: null }; const attempt = candidate.attempt + 1; const leasedAt = new Date(now).toISOString(); const leaseToken = `lease_v2_${fingerprint({ jobId: candidate.jobId, workerId: parsed.data.workerId, attempt, leasedAt })}` as const; const leased = signedJob({ ...candidate, status: "running", attempt, startedAt: candidate.startedAt ?? leasedAt, workerId: parsed.data.workerId, leaseToken, leasedAt, leaseExpiresAt: new Date(now + leaseDurationMs).toISOString(), resultIds: null, errorCode: null, completedAt: null, resultBindingIntegritySignature: null }); jobs.set(leased.jobId, leased); return { ok: true, data: clone(leased), errorCode: null }; } catch { return fail("invalid_worker_input"); } },
    async complete(input) { try { const parsed = completionSchema.safeParse(input); if (!parsed.success) return fail("invalid_completion_input"); const job = jobs.get(parsed.data.jobId); if (!job || job.status !== "running" || job.workerId !== parsed.data.workerId || job.leaseToken !== parsed.data.leaseToken || job.attempt !== parsed.data.attempt || Date.parse(job.leaseExpiresAt ?? "") < Date.now()) return fail("lease_mismatch"); const bundle = parsed.data.resultBundle as CanonicalStage2To7ResultBundleV2; if (!validateBundle(bundle, job)) return fail("invalid_canonical_artifacts"); const ids = resultIds(bundle); if (Object.values(ids).some((id) => !id)) return fail("invalid_canonical_artifacts"); const binding = fingerprint({ jobId: job.jobId, requestFingerprint: job.requestFingerprint, attempt: job.attempt, workerId: job.workerId, leaseToken: job.leaseToken, resultIds: ids, artifactFingerprints: Object.fromEntries(Object.entries(bundle).map(([key, value]) => [key, fingerprint(value)])), versions: { schemaVersion: job.schemaVersion, engineVersion: job.engineVersion } }); if (binding !== parsed.data.resultBindingIntegritySignature) return fail("result_binding_tampering"); const next = signedJob({ ...job, status: "succeeded", completedAt: new Date().toISOString(), resultIds: ids, errorCode: null, resultBindingIntegritySignature: binding }); jobs.set(job.jobId, next); return { ok: true, data: clone(next), errorCode: null }; } catch { return fail("invalid_completion_input"); } },
    async fail(input) { try { const parsed = z.object({ jobId: z.string().regex(/^async_simulation_job_v2_[a-f0-9]{24}$/), workerId: z.string().regex(/^worker_[a-z0-9][a-z0-9_-]*$/), leaseToken: z.string().regex(/^lease_v2_[a-f0-9]{24}$/), attempt: z.number().int().positive(), errorCode: z.string().min(1).max(200) }).strict().safeParse(input); if (!parsed.success) return fail("invalid_completion_input"); const job = jobs.get(parsed.data.jobId); if (!job || job.status !== "running" || job.workerId !== parsed.data.workerId || job.leaseToken !== parsed.data.leaseToken || job.attempt !== parsed.data.attempt) return fail("lease_mismatch"); const next = signedJob({ ...job, status: "failed", completedAt: new Date().toISOString(), resultIds: null, errorCode: parsed.data.errorCode, resultBindingIntegritySignature: null }); jobs.set(job.jobId, next); return { ok: true, data: clone(next), errorCode: null }; } catch { return fail("invalid_completion_input"); } },
  };
}
export function createControlledAsyncSimulationExecutorV2(repository: AsyncSimulationJobRepositoryPortV2, execute: (job: Readonly<AsyncSimulationJobV2>) => Promise<CanonicalStage2To7ResultBundleV2>) {
  return { async runOnce(workerId: unknown) {
    const claimed = await repository.claim({ workerId });
    if (!claimed.ok) return { status: "invalid_worker_input" as const };
    if (!claimed.data) return { status: "idle" as const };
    try {
      const bundle = await execute(clone(claimed.data)); const ids = resultIds(bundle);
      const signature = fingerprint({ jobId: claimed.data.jobId, requestFingerprint: claimed.data.requestFingerprint, attempt: claimed.data.attempt, workerId: claimed.data.workerId, leaseToken: claimed.data.leaseToken, resultIds: ids, artifactFingerprints: Object.fromEntries(Object.entries(bundle).map(([key, value]) => [key, fingerprint(value)])), versions: { schemaVersion: claimed.data.schemaVersion, engineVersion: claimed.data.engineVersion } });
      const completed = await repository.complete({ jobId: claimed.data.jobId, workerId: claimed.data.workerId, leaseToken: claimed.data.leaseToken, attempt: claimed.data.attempt, resultBundle: bundle, resultBindingIntegritySignature: signature });
      if (completed.ok) return { status: "succeeded" as const };
      await repository.fail({ jobId: claimed.data.jobId, workerId: claimed.data.workerId, leaseToken: claimed.data.leaseToken, attempt: claimed.data.attempt, errorCode: completed.errorCode });
      return { status: "failed" as const, errorCode: completed.errorCode };
    } catch {
      await repository.fail({ jobId: claimed.data.jobId, workerId: claimed.data.workerId, leaseToken: claimed.data.leaseToken, attempt: claimed.data.attempt, errorCode: "execution_failed" });
      return { status: "failed" as const, errorCode: "execution_failed" as const };
    }
  } };
}
export type AsyncSimulationExecutorPortV2 = ReturnType<typeof createControlledAsyncSimulationExecutorV2>;
