import { createHash } from "node:crypto";

import { z } from "zod";
import { buildDigitalLifeModel, digitalLifeAgentInputSchema, digitalLifeEdgeInputSchema, digitalLifeRulesSchema, ordinalPerson, roleForAgent, type DigitalLifeModel } from "@/lib/digital-life/model";
import { proposeSandboxCandidates } from "./candidate-pipeline";
import { buildFormalSandboxInitialWorld } from "./initial-world";
import { projectGuardObservations, pathDiagnosticsSchema } from "@/lib/digital-life/guard-observations";
import { parseFrozenSymbolicLens, runSymbolicLensSchema } from "./symbolic-lens";
import { applyFrozenCorrections, frozenOutcomeCalibrationSchema } from "./outcomes/rule-corrections";
import { buildFrozenRealityCriteria } from "./outcomes/core-adapter";
import { freezeDefaultPlanning } from "@/lib/formal-planning";
import { defaultPlanningRequestSchema, planningConsentContextSchema, type FrozenDefaultPlanning } from "@/lib/formal-planning/contracts";
import { bindPlanningWorld } from "@/lib/formal-planning/world-binding";
import type { PlanningProposalTrace } from "@/lib/formal-planning/proposals";
import { relationshipPolicyAuthorization } from "@/lib/formal-planning/relationship-contracts";

import { listRealityProfileEntries, realityProfileDraftSchema } from "@/lib/reality-profile/profile";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import {
  AGENT_WORLD_ENGINE_VERSION_V2,
  type ActionProposalInputV2,
  type WorldRelationIdV2,
} from "@/lib/v2/agent-world/types";
import { buildClaimsV2, buildClaimsReportV2 } from "@/lib/v2/claims-reports";
import {
  createControlledAsyncSimulationExecutorV2,
  createInMemoryAsyncSimulationJobRepositoryV2,
} from "@/lib/v2/migration-async-execution";
import { buildForecastLockV2, createInMemoryOutcomeCalibrationRepositoryV2 } from "@/lib/v2/outcome-calibration";
import { createLocalTrajectoryPolicyV2 } from "@/lib/v2/trajectory/local-adapter";
import { TRAJECTORY_ENGINE_VERSION_V2 } from "@/lib/v2/trajectory/types";
import { analyzeTrajectoryBatchV2 } from "@/lib/v2/trajectory-analysis/batch-runner";
import { createLocalTrajectoryAnalysisAdapterV2 } from "@/lib/v2/trajectory-analysis/local-adapter";
import {
  ANALYSIS_ENGINE_VERSION_V2,
  CLUSTERING_ALGORITHM_V2,
  CLUSTERING_VERSION_V2,
  FEATURE_SCHEMA_VERSION_V2,
} from "@/lib/v2/trajectory-analysis/types";

const agent = digitalLifeAgentInputSchema;
const edge = digitalLifeEdgeInputSchema;

const inputSchema = z.object({
  ownerId: z.string().uuid(),
  seedContextId: z.string().uuid(),
  graphSnapshotId: z.string().uuid(),
  agentSnapshotId: z.string().uuid(),
  realityProfileSnapshot: z.object({
    ownerId: z.string().uuid(),
    seedContextId: z.string().uuid(),
    profileId: z.string().uuid().nullable(),
    revision: z.number().int().nonnegative(),
    profile: realityProfileDraftSchema,
  }).strict(),
  horizonDays: z.union([z.literal(30), z.literal(90)]),
  deterministicSeed: z.number().int().positive().max(2_000_000_000),
  startedAt: z.string().datetime({ offset: true }),
  acceptedAt: z.string().datetime({ offset: true }).optional(),
  graphLockedAt: z.string().datetime({ offset: true }).optional(),
  seedSummary: z.string().trim().min(1).max(4_000),
  agents: z.array(agent).min(1).max(50),
  edges: z.array(edge).min(1).max(200),
  safetyLevel: z.enum(["safe", "caution", "blocked", "downgraded"]),
  symbolicLens: runSymbolicLensSchema,
  calibrationSnapshot: z.record(z.string(), z.unknown()),
  digitalLifeRules: digitalLifeRulesSchema.optional(),
  outcomeCalibration: frozenOutcomeCalibrationSchema.optional(),
  defaultPlanning: defaultPlanningRequestSchema.optional(), planningConsentContext: planningConsentContextSchema.optional(),
}).strict().superRefine((value, context) => {
  const ids = new Set(value.agents.map((item) => item.id));
  if (value.agents.filter((item) => roleForAgent(item) === "user_core").length !== 1) context.addIssue({ code: "custom", message: "one core self agent required" });
  for (const relation of value.edges) if (!ids.has(relation.fromAgentId) || !ids.has(relation.toAgentId) || relation.fromAgentId === relation.toAgentId) context.addIssue({ code: "custom", message: "edge endpoint mismatch" });
  const profileSnapshot = value.realityProfileSnapshot;
  if (profileSnapshot.ownerId !== value.ownerId || profileSnapshot.seedContextId !== value.seedContextId || profileSnapshot.revision !== profileSnapshot.profile.revision) {
    context.addIssue({ code: "custom", path: ["realityProfileSnapshot"], message: "Reality Profile snapshot scope or revision does not match the Run." });
  }
  if (profileSnapshot.profileId === null && (profileSnapshot.revision !== 0 || listRealityProfileEntries(profileSnapshot.profile).some(({ field }) => field.classification !== "unknown"))) {
    context.addIssue({ code: "custom", path: ["realityProfileSnapshot"], message: "An absent Reality Profile must remain explicitly unknown at revision zero." });
  }
});

export type FormalSandboxRuntimeInput = z.infer<typeof inputSchema>;

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

function fingerprint(value: unknown) {
  return createHash("sha256").update(canonical(JSON.parse(JSON.stringify(value)))).digest("hex").slice(0, 24);
}

function lockTime(startedAt: string) {
  return new Date(Date.parse(startedAt) - 1).toISOString();
}

export async function buildFormalSandboxRunV2(rawInput: unknown) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false as const, errorCode: "invalid_run_input" as const };
  const input = parsed.data;
  try { parseFrozenSymbolicLens(input.symbolicLens, input.ownerId, input.acceptedAt ?? input.startedAt); }
  catch { return { ok: false as const, errorCode: "invalid_run_input" as const }; }
  if (input.acceptedAt && Date.now() >= Date.parse(input.startedAt)) return { ok: false as const, errorCode: "reservation_expired" as const };
  if (input.acceptedAt && (Date.parse(input.acceptedAt) > Date.now() || Date.parse(input.acceptedAt) >= Date.parse(input.startedAt))) return { ok: false as const, errorCode: "invalid_run_input" as const };
  if (input.safetyLevel === "blocked" || input.safetyLevel === "downgraded") return { ok: false as const, errorCode: "safety_blocked" as const };
  let effectiveRules;
  try { effectiveRules = applyFrozenCorrections(input, input.digitalLifeRules, input.outcomeCalibration); }
  catch { return { ok:false as const,errorCode:"invalid_correction" as const }; }
  const modeled = buildDigitalLifeModel(input, effectiveRules);
  if (!modeled.ok) return { ok: false as const, errorCode: "invalid_run_input" as const };
  let planning: FrozenDefaultPlanning | undefined;
  if (input.defaultPlanning) {
    if (!input.acceptedAt || !input.planningConsentContext) return { ok: false as const, errorCode: "invalid_planning_source" as const };
    const frozen = freezeDefaultPlanning(input.defaultPlanning, { model: modeled.model, realityProfileSnapshot: input.realityProfileSnapshot, horizonDays: input.horizonDays, acceptedAt: input.acceptedAt, symbolicLens: input.symbolicLens, consentContext: input.planningConsentContext });
    if (!frozen.ok) return frozen;
    planning = frozen.planning;
  } else if (input.planningConsentContext) return { ok: false as const, errorCode: "invalid_planning_source" as const };
  if (!input.realityProfileSnapshot.profile.worldInputs.resources.some((resource) => resource.usePerTick !== null) && modeled.model.rules.actions.length === 0 && planning?.status !== "active") {
    return { ok: false as const, errorCode: "world_model_required" as const };
  }
  const baseline = await buildFormalSandboxPathV2(input, modeled.model, "main", planning);
  if (!baseline.ok && baseline.errorCode !== "no_eligible_actions") return baseline;
  type PathBundle = Extract<Awaited<ReturnType<typeof buildFormalSandboxPathV2>>, { ok: true }>["bundle"];
  const paths: Array<{ key: string; label: string; bundle: PathBundle }> = [];
  const outcomes = [{ pathKey: "main", label: "当前路径", result: baseline }];
  for (const strategy of modeled.model.rules.strategies) {
    const path = await buildFormalSandboxPathV2(input, modeled.model, strategy.participantKey, planning);
    if (!path.ok && path.errorCode !== "no_eligible_actions") return path;
    outcomes.push({ pathKey: strategy.participantKey, label: strategy.label, result: path });
    if (path.ok) paths.push({ key: strategy.participantKey, label: strategy.label, bundle: path.bundle });
  }
  if (outcomes.some(item => !item.result.ok && item.result.errorCode === "no_eligible_actions")) {
    const frames = outcomes.map(item => ({ ...item, frame: item.result.ok ? item.result.bundle : "emptyFrame" in item.result ? item.result.emptyFrame : undefined }));
    if (frames.some(item => !item.frame)) return { ok: false as const, errorCode: "runtime_failed" as const };
    const pathDiagnostics = pathDiagnosticsSchema.safeParse({ version: "formal-path-diagnostics-v1", status: "not_saved", paths: frames.map((item, index) => ({ key: `path-${index + 1}`, label: item.label, status: item.frame!.events.length ? "has_events" : "no_actions", samples: item.frame!.trajectoryAnalysis.trajectories.map((trajectory, sample) => ({ key: `sample-${sample + 1}`, terminalStatus: trajectory.status, executedTickCount: trajectory.steps.length, selectedEventCount: trajectory.finalWorld.worldEvents.length })), guardObservations: projectGuardObservations(item.frame) })) });
    if (!pathDiagnostics.success) return { ok: false as const, errorCode: "runtime_failed" as const };
    const attempt = { version: "formal-guard-attempt-v1" as const, paths: frames.map(item => ({ pathKey: item.pathKey, causalFingerprint: item.frame!.causalFingerprint, ...(item.frame!.policyFingerprint ? { policyFingerprint: item.frame!.policyFingerprint } : {}), inputSnapshot: item.frame!.inputSnapshot, sourceBoundary: item.frame!.sourceBoundary, initialWorld: item.frame!.trajectoryAnalysis.spec.trajectoryTemplate.initialWorld, trajectories: item.frame!.trajectoryAnalysis.trajectories,
      ...(planning ? { defaultPlanningSnapshot: item.frame!.defaultPlanningSnapshot, defaultPlanningTraces: item.frame!.defaultPlanningTraces } : {}),
      ...(input.acceptedAt ? { forecastTiming: { acceptedAt: input.acceptedAt, boundaryAt: item.frame!.sourceBoundary.updatedAt, simulationStartAt: input.startedAt } } : {}),
    })) };
    return { ok: false as const, errorCode: "no_eligible_actions" as const, pathDiagnostics: pathDiagnostics.data, attempt };
  }
  if (!baseline.ok) return baseline;
  return { ok: true as const, bundle: { ...baseline.bundle, strategyPaths: { version: "digital-life-paths-v1" as const, paths } } };
}

async function buildFormalSandboxPathV2(input: FormalSandboxRuntimeInput, digitalLifeModel: DigitalLifeModel, activePathKey: string, planning?: FrozenDefaultPlanning) {

  try {
    const policyInput = {
      ownerId: input.ownerId,
      seedContextId: input.seedContextId,
      graphSnapshotId: input.graphSnapshotId,
      agentSnapshotId: input.agentSnapshotId,
      realityProfileSnapshot: input.realityProfileSnapshot,
      horizonDays: input.horizonDays,
      deterministicSeed: input.deterministicSeed,
      startedAt: input.startedAt,
      ...(input.acceptedAt ? { acceptedAt: input.acceptedAt, graphLockedAt: input.graphLockedAt } : {}),
      seedSummary: input.seedSummary,
      agents: input.agents,
      edges: input.edges,
      safetyLevel: input.safetyLevel,
      calibrationSnapshot: input.calibrationSnapshot,
      ...(input.outcomeCalibration ? {outcomeCalibration:input.outcomeCalibration} : {}),
      digitalLifeModel,
      activePathKey,
      ...(planning ? { defaultPlanningAuthorization: { version: planning.version, resources: input.defaultPlanning!.resources } } : {}),
      ...(planning?.version === "formal-default-planner-v2" ? { relationshipResponseAuthorization: relationshipPolicyAuthorization(planning.relationshipResponse.authorization) } : {}),
    };
    // Prior changes the causal quantity, never candidate identity/ordering or the seeded policy lane.
    const policyFingerprint = fingerprint(policyInput);
    const causalInput = { ...policyInput, ...(planning ? { planningHypothesis: { version: planning.fusion.version, enabled: planning.fusion.enabled, status: planning.fusion.status, reductionCap: planning.fusion.reductionCap, reduction: planning.fusion.reduction, initialAmountFactor: planning.fusion.initialAmountFactor, inputs: planning.fusion.inputs, derivation: planning.fusion.derivation, classification: "hypothesis" as const, scientificProbability: false, realWorldEvidence: false } } : {}),
      ...(planning?.version === "formal-default-planner-v2" ? { relationshipResponseHypothesis: planning.relationshipResponse } : {}) };
    const causalFingerprint = fingerprint(causalInput);
    const boundaryAt = input.acceptedAt ? new Date().toISOString() : new Date(Date.parse(input.startedAt) - 2).toISOString();
    const { worldResult, boundary, worldInputs, assumptionLedger, primaryEvidenceId, agentIds, entityIds, resourceIdsByKey, activeRules, profileVariableSpecs, assumptionIdFor, evidenceIdFor, worldIds, self } = buildFormalSandboxInitialWorld(input, digitalLifeModel, activePathKey, policyFingerprint, boundaryAt, planning);
    if (!worldResult.ok) return { ok: false as const, errorCode: "world_initialization_failed" as const };
    const planningWorldBinding = planning ? bindPlanningWorld(planning, worldResult.world, `formal-${policyFingerprint}`, activePathKey, input.startedAt) : undefined;
    const planningTracesBySeed = new Map<number, PlanningProposalTrace[]>();

    const maxTicks = input.horizonDays === 30 ? 3 : 6;
    const trajectoryTemplate = {
      runSpecId: `trajectory_run_spec_v2_formal_${policyFingerprint}` as const,
      trajectoryId: `trajectory_v2_formal_${policyFingerprint}` as const,
      seedContextId: input.seedContextId,
      initialWorld: worldResult.world,
      expectedInitialWorldRevision: worldResult.world.revision,
      trajectorySeed: input.deterministicSeed,
      horizonDays: input.horizonDays,
      startAt: input.startedAt,
      tickIntervalDays: input.horizonDays === 30 ? 10 : 15,
      maxTicks,
      policyId: "formal_account_sandbox_policy",
      policyVersion: digitalLifeModel.version === "digital-life-model-v3" ? "digital-life-adapter-v3" : "digital-life-adapter-v1",
      trajectoryEngineVersion: TRAJECTORY_ENGINE_VERSION_V2,
    };
    const seeds = [input.deterministicSeed, input.deterministicSeed + 1, input.deterministicSeed + 2];
    const spec = {
      analysisRunSpecId: `analysis_run_spec_v2_formal_${causalFingerprint}` as const,
      seedContextId: input.seedContextId,
      trajectoryTemplate,
      trajectorySeeds: seeds,
      sampleCount: seeds.length,
      horizonDays: input.horizonDays,
      policyId: trajectoryTemplate.policyId,
      policyVersion: trajectoryTemplate.policyVersion,
      trajectoryEngineVersion: TRAJECTORY_ENGINE_VERSION_V2,
      analysisEngineVersion: ANALYSIS_ENGINE_VERSION_V2,
      featureSchemaVersion: FEATURE_SCHEMA_VERSION_V2,
      clusteringAlgorithm: CLUSTERING_ALGORITHM_V2,
      clusteringVersion: CLUSTERING_VERSION_V2,
    };
    const adapter = createLocalTrajectoryAnalysisAdapterV2({
      policyFactory: ({ seed }) => createLocalTrajectoryPolicyV2({
        policyId: spec.policyId,
        policyVersion: spec.policyVersion,
        candidatesForTick: ({ world, tickIndex, occurredAt }): ActionProposalInputV2[] => {
          const proposed = proposeSandboxCandidates({
            rules: activeRules, declaredResources: worldInputs.resources,
            actorAgentId: agentIds.get(self.id)!, actorEntityId: entityIds.get(self.id)!, primaryEvidenceId,
            assumptionByCategory: new Map(assumptionLedger.assumptions.map(item => [item.category, item.id])),
            planning, planningWorldBinding, pathKey: activePathKey,
            bindings: {
              agents: new Map(input.agents.map((item, index) => [ordinalPerson(index), agentIds.get(item.id)!])),
              entities: new Map(input.agents.map((item, index) => [ordinalPerson(index), entityIds.get(item.id)!])),
              relations: new Map(input.edges.map((item, index) => [`relation-${index + 1}`, worldIds("world_relation", item.id) as WorldRelationIdV2])),
              resources: new Map(worldInputs.resources.map((item, index) => [`resource-${index + 1}`, resourceIdsByKey.get(item.key)!])),
              variables: new Map(profileVariableSpecs.map(item => [item.key, item.id])),
              evidence: new Map(input.agents.map((_, index) => [ordinalPerson(index), evidenceIdFor(`formal.agent.${index + 1}`)])),
              assumptions: new Map(activeRules.map(rule => [rule.key, assumptionIdFor(`digital_life_rule_${rule.key}`)])),
            },
          }, { world, tickIndex, occurredAt, namespace: `formal_${policyFingerprint}_${seed}` });
          if (planning) planningTracesBySeed.set(seed, [...(planningTracesBySeed.get(seed) ?? []), ...proposed.trace]);
          return proposed.candidates;
        },
      }),
      trajectoryRuntimeFactory: ({ seed }) => ({ agentWorldIdFactory: createStableAgentWorldIdFactoryV2(`formal-${policyFingerprint}-${seed}`) }),
      interventionRuntimeFactory: ({ interventionId }) => ({ clock: () => input.startedAt, idFactory: createStableAgentWorldIdFactoryV2(`formal-${policyFingerprint}-${interventionId}`) }),
    });
    const analyzed = analyzeTrajectoryBatchV2(spec, adapter);
    if (!analyzed.ok) return { ok: false as const, errorCode: "trajectory_execution_failed" as const };
    if (digitalLifeModel.version === "digital-life-model-v3" && analyzed.analysis.trajectories.every(trajectory => trajectory.finalWorld.worldEvents.length === 0)) {
      const emptyFrame = { causalFingerprint, ...(planning ? { policyFingerprint, defaultPlanningSnapshot: planning, defaultPlanningTraces: analyzed.analysis.trajectories.map((trajectory, index) => ({ trajectoryId: trajectory.trajectoryId, trace: planningTracesBySeed.get(seeds[index]) ?? [] })) } : {}), inputSnapshot: causalInput, sourceBoundary: { seedContextId: boundary.seedContextId, schemaVersion: boundary.schemaVersion, revision: boundary.revision, evidenceLedger: boundary.evidenceLedger, assumptionLedger: boundary.assumptionLedger, createdAt: boundary.createdAt, updatedAt: boundary.updatedAt }, worldSnapshots: analyzed.analysis.trajectories.map(trajectory => trajectory.finalWorld), trajectoryAnalysis: analyzed.analysis, events: [] };
      return { ok: false as const, errorCode: "no_eligible_actions" as const, emptyFrame };
    }
    const claimSet = { kind: "batch" as const, payload: analyzed.analysis, realityBoundary: { seedContextId: boundary.seedContextId, schemaVersion: boundary.schemaVersion, revision: boundary.revision, evidenceLedger: boundary.evidenceLedger, assumptionLedger: boundary.assumptionLedger, createdAt: boundary.createdAt, updatedAt: boundary.updatedAt } };
    const claimsResult = buildClaimsV2(claimSet);
    if (!claimsResult.ok) return { ok: false as const, errorCode: "claim_build_failed" as const };
    const reportResult = buildClaimsReportV2({
      reportSpecId: `claims_report_spec_v2_formal_${causalFingerprint}`,
      seedContextId: input.seedContextId,
      claimSet,
      claims: claimsResult.claims,
      claimIds: claimsResult.claims.map((claim) => claim.id),
    });
    if (!reportResult.ok) return { ok: false as const, errorCode: "report_build_failed" as const };

    const lockedAt = input.acceptedAt ? new Date().toISOString() : lockTime(input.startedAt);
    if (input.acceptedAt && Date.parse(lockedAt) >= Date.parse(input.startedAt)) return { ok: false as const, errorCode: "reservation_expired" as const };
    const lockResult = buildForecastLockV2({
      forecastLockSpecId: `forecast_lock_spec_v2_formal_${causalFingerprint}`,
      lockedAt,
      run: { kind: "batch", payload: analyzed.analysis },
      claimSet,
      claims: claimsResult.claims,
      report: reportResult.report,
    });
    if (!lockResult.ok) return { ok: false as const, errorCode: "forecast_lock_failed" as const };
    const outcomeRepository = createInMemoryOutcomeCalibrationRepositoryV2();
    const streamId = `outcome_calibration_stream_v2_formal_${causalFingerprint}` as const;
    const generatedPersistedAt = input.acceptedAt ? new Date().toISOString() : lockedAt;
    const appended = await outcomeRepository.append({
      streamId,
      expectedVersion: 0,
      idempotencyKey: `stage7_idempotency_v2_formal_${causalFingerprint}`,
      persistedAt: generatedPersistedAt,
      artifact: { kind: "forecast_lock", value: lockResult.forecastLock },
    });
    if (!appended.ok) return { ok: false as const, errorCode: "forecast_lock_failed" as const };
    const canonicalBundle = {
      stage2RealityBoundary: claimSet.realityBoundary,
      stage3World: worldResult.world,
      stage4: { runSpec: spec, trajectories: analyzed.analysis.trajectories },
      stage5Analysis: analyzed.analysis,
      stage6: { claimSet, claims: claimsResult.claims, report: reportResult.report },
      stage7: { forecastLockReference: { streamId, version: appended.data.version } },
    };
    const epoch = Date.parse(lockedAt);
    const jobRepository = createInMemoryAsyncSimulationJobRepositoryV2(outcomeRepository, { nowEpochMs: () => epoch });
    const submitted = await jobRepository.submit({
      idempotencyKey: `stage8_job_key_formal_${causalFingerprint}`,
      seedContext: { id: input.seedContextId, summary: input.seedSummary },
      runSpec: spec,
      schemaVersion: "2.0",
    });
    if (!submitted.ok) return { ok: false as const, errorCode: "stage8_validation_failed" as const };
    const executor = createControlledAsyncSimulationExecutorV2(jobRepository, outcomeRepository, async () => canonicalBundle);
    const execution = await executor.runOnce("worker_formal_account_sandbox");
    if (execution.status !== "succeeded") return { ok: false as const, errorCode: "stage8_validation_failed" as const };
    if (input.acceptedAt && Date.now() >= Date.parse(input.startedAt)) return { ok: false as const, errorCode: "reservation_expired" as const };

    const events = analyzed.analysis.trajectories.flatMap((trajectory) =>
      trajectory.finalWorld.worldEvents.map((event, tickIndex) => ({
        ...event,
        branchId: trajectory.trajectoryId,
        tickIndex,
      })),
    );
    const claims = [...claimsResult.claims].sort((left, right) => left.id.localeCompare(right.id));
    const bundle = {
        runtimePath: ["reality_boundary_v2", "agent_world_v2", "seeded_trajectory_v2", "trajectory_analysis_v2", "claims_reports_v2", "outcome_lock_v2", "stage8_canonical_validation"] as const,
        causalFingerprint,
        ...(planning ? { policyFingerprint, defaultPlanningSnapshot: planning, defaultPlanningTraces: analyzed.analysis.trajectories.map((trajectory, index) => ({ trajectoryId: trajectory.trajectoryId, trace: planningTracesBySeed.get(seeds[index]) ?? [] })) } : {}),
        ...(input.acceptedAt ? { forecastTiming: { acceptedAt: input.acceptedAt, boundaryAt, lockedAt, generatedPersistedAt, simulationStartAt: input.startedAt } } : {}),
        inputSnapshot: causalInput,
        symbolicLensSnapshot: input.symbolicLens,
        sourceBoundary: claimSet.realityBoundary,
        worldSnapshots: analyzed.analysis.trajectories.map((trajectory) => trajectory.finalWorld),
        trajectoryAnalysis: analyzed.analysis,
        events,
        claims,
        report: reportResult.report,
        forecastLockReference: canonicalBundle.stage7.forecastLockReference,
        forecastPersistenceHistory: [appended.data],
        versions: {
          runtime: "formal-account-sandbox-m1-v1",
          schema: "formal-run-bundle-m1-v1",
          world: AGENT_WORLD_ENGINE_VERSION_V2,
          trajectory: TRAJECTORY_ENGINE_VERSION_V2,
          analysis: ANALYSIS_ENGINE_VERSION_V2,
        },
      };
    return {ok:true as const,bundle:{...bundle,frozenRealityCriteria:buildFrozenRealityCriteria(bundle)}};
  } catch {
    return { ok: false as const, errorCode: "runtime_failed" as const };
  }
}
