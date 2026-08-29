import { createHash } from "node:crypto";

import { z } from "zod";

import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import {
  AGENT_WORLD_ENGINE_VERSION_V2,
  type ActionProposalInputV2,
  type AgentDefinitionIdV2,
  type WorldEntityIdV2,
  type WorldResourceIdV2,
} from "@/lib/v2/agent-world/types";
import { initializeWorldV2 } from "@/lib/v2/agent-world/world-initializer";
import { buildClaimsV2, buildClaimsReportV2 } from "@/lib/v2/claims-reports";
import {
  createControlledAsyncSimulationExecutorV2,
  createInMemoryAsyncSimulationJobRepositoryV2,
} from "@/lib/v2/migration-async-execution";
import { buildForecastLockV2, createInMemoryOutcomeCalibrationRepositoryV2 } from "@/lib/v2/outcome-calibration";
import { createStableRealityBoundaryIdFactoryV2 } from "@/lib/v2/reality-boundary/ids";
import { buildAssumptionLedgerV2 } from "@/lib/v2/reality-boundary/assumption-ledger";
import { buildEvidenceLedgerV2 } from "@/lib/v2/reality-boundary/evidence-ledger";
import { REALITY_BOUNDARY_SCHEMA_VERSION_V2 } from "@/lib/v2/reality-boundary/types";
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

const agent = z.object({
  id: z.string().uuid(),
  displayName: z.string().trim().min(1).max(200),
  actorType: z.enum(["self", "third_party"]),
  evidenceRefs: z.array(z.string().trim().min(1).max(500)).min(1),
}).strict();

const edge = z.object({
  id: z.string().uuid(),
  fromAgentId: z.string().uuid(),
  toAgentId: z.string().uuid(),
  relationshipType: z.string().trim().min(1).max(100),
  evidenceRefs: z.array(z.string().trim().min(1).max(500)).min(1),
}).strict();

const inputSchema = z.object({
  ownerId: z.string().uuid(),
  seedContextId: z.string().uuid(),
  graphSnapshotId: z.string().uuid(),
  agentSnapshotId: z.string().uuid(),
  horizonDays: z.union([z.literal(30), z.literal(90)]),
  deterministicSeed: z.number().int().positive().max(2_000_000_000),
  startedAt: z.string().datetime({ offset: true }),
  seedSummary: z.string().trim().min(1).max(4_000),
  agents: z.array(agent).min(1).max(50),
  edges: z.array(edge).min(1).max(200),
  safetyLevel: z.enum(["safe", "caution", "blocked", "downgraded"]),
  symbolicLens: z.object({ mode: z.literal("bounded_fusion"), summary: z.string().trim().max(1_000) }).strict(),
  calibrationSnapshot: z.record(z.string(), z.unknown()),
}).strict().superRefine((value, context) => {
  const ids = new Set(value.agents.map((item) => item.id));
  if (value.agents.filter((item) => item.actorType === "self").length !== 1) context.addIssue({ code: "custom", message: "one self agent required" });
  for (const relation of value.edges) if (!ids.has(relation.fromAgentId) || !ids.has(relation.toAgentId) || relation.fromAgentId === relation.toAgentId) context.addIssue({ code: "custom", message: "edge endpoint mismatch" });
});

export type FormalSandboxRuntimeInput = z.infer<typeof inputSchema>;

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

function fingerprint(value: unknown) {
  return createHash("sha256").update(canonical(value)).digest("hex").slice(0, 24);
}

function lockTime(startedAt: string) {
  return new Date(Date.parse(startedAt) - 1).toISOString();
}

export async function buildFormalSandboxRunV2(rawInput: unknown) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false as const, errorCode: "invalid_run_input" as const };
  const input = parsed.data;
  if (input.safetyLevel === "blocked" || input.safetyLevel === "downgraded") return { ok: false as const, errorCode: "safety_blocked" as const };

  try {
    const causalInput = {
      ownerId: input.ownerId,
      seedContextId: input.seedContextId,
      graphSnapshotId: input.graphSnapshotId,
      agentSnapshotId: input.agentSnapshotId,
      horizonDays: input.horizonDays,
      deterministicSeed: input.deterministicSeed,
      startedAt: input.startedAt,
      seedSummary: input.seedSummary,
      agents: input.agents,
      edges: input.edges,
      safetyLevel: input.safetyLevel,
      calibrationSnapshot: input.calibrationSnapshot,
    };
    const causalFingerprint = fingerprint(causalInput);
    const boundaryAt = new Date(Date.parse(input.startedAt) - 2).toISOString();
    const realityRuntime = {
      clock: () => boundaryAt,
      idFactory: createStableRealityBoundaryIdFactoryV2(`formal-${causalFingerprint}`),
    };
    const evidenceLedger = buildEvidenceLedgerV2({
      seedContextId: input.seedContextId,
      runtime: realityRuntime,
      items: [
        {
          statement: input.seedSummary,
          claimKey: "formal.seed.summary",
          sourceKind: "user_statement",
          sourceTier: "tier_1_user_confirmed",
          verificationStatus: "user_confirmed",
          provenance: [{ sourceRef: `seed_context:${input.seedContextId}`, capturedAt: boundaryAt }],
          limitations: ["User-confirmed input can still be incomplete."],
        },
        ...input.edges.map((item, index) => ({
          statement: `Confirmed relationship ${index + 1}: ${item.relationshipType}.`,
          claimKey: `formal.relation.${index + 1}`,
          sourceKind: "user_statement" as const,
          sourceTier: "tier_1_user_confirmed" as const,
          verificationStatus: "user_confirmed" as const,
          provenance: [{ sourceRef: `relation_edge:${item.id}`, capturedAt: boundaryAt }],
          limitations: ["Relationship structure is confirmed; private intent is not inferred."],
        })),
      ],
    });
    const primaryEvidenceId = evidenceLedger.items[0]!.id;
    const assumptionLedger = buildAssumptionLedgerV2({
      seedContextId: input.seedContextId,
      evidenceLedger,
      runtime: realityRuntime,
      assumptions: [{
        statement: "Observed relationship conditions may remain stable during the selected horizon.",
        subjectType: "external_variable",
        category: "relationship_stability",
        epistemicStatus: "inferred",
        impactLevel: "medium",
        supportingRealEvidenceIds: [primaryEvidenceId],
        contradictingRealEvidenceIds: [],
        limitations: ["Visible simulation assumption, not a real-world fact."],
        confirmationRequirement: "not_required",
        confirmationStatus: "not_required",
      }],
    });
    const assumptionId = assumptionLedger.assumptions[0]!.id;
    const boundary = {
      seedContextId: input.seedContextId,
      schemaVersion: REALITY_BOUNDARY_SCHEMA_VERSION_V2,
      revision: 1,
      evidenceLedger: { ...evidenceLedger, revision: 1 },
      assumptionLedger: { ...assumptionLedger, revision: 1 },
      warnings: input.safetyLevel === "caution" ? ["Caution mode keeps conclusions conservative."] : [],
      createdAt: boundaryAt,
      updatedAt: boundaryAt,
    };

    const worldIds = createStableAgentWorldIdFactoryV2(`formal-${causalFingerprint}`);
    const agentIds = new Map(input.agents.map((item) => [item.id, worldIds("agent_definition", item.id) as AgentDefinitionIdV2]));
    const entityIds = new Map(input.agents.map((item) => [item.id, worldIds("world_entity", item.id) as WorldEntityIdV2]));
    const provenance = (withAssumption = false) => ({
      realEvidenceIds: [primaryEvidenceId],
      assumptionIds: withAssumption ? [assumptionId] : [],
      provisional: withAssumption,
      visible: true as const,
    });
    const self = input.agents.find((item) => item.actorType === "self")!;
    const timeResourceId = worldIds("world_resource", "decision_capacity") as WorldResourceIdV2;
    const worldResult = initializeWorldV2(boundary, {
      seedContextId: input.seedContextId,
      engineVersion: AGENT_WORLD_ENGINE_VERSION_V2,
      agentDefinitions: input.agents.map((item) => ({
        id: agentIds.get(item.id)!,
        actorType: item.actorType,
        displayName: item.displayName,
        role: item.actorType === "self" ? "Scenario decision maker" : "Confirmed scenario participant",
        realEvidenceIds: [primaryEvidenceId],
        assumptionIds: item.actorType === "self" ? [] : [assumptionId],
        fieldProvenance: { displayName: provenance(false), role: provenance(item.actorType !== "self") },
        constraints: ["Private thoughts and deterministic outcomes are not inferred."],
      })),
      agentStates: input.agents.map((item) => ({
        agentDefinitionId: agentIds.get(item.id)!,
        observableStatus: "available" as const,
        commitments: [],
        resourceAccessIds: item.id === self.id ? [timeResourceId] : [],
        observations: [],
        memory: [],
        activeAssumptionIds: item.actorType === "self" ? [] : [assumptionId],
        lastActionReference: null,
      })),
      entities: input.agents.map((item) => ({
        id: entityIds.get(item.id)!,
        entityType: "person" as const,
        label: item.displayName,
        agentDefinitionId: agentIds.get(item.id)!,
        provenance: provenance(item.actorType !== "self"),
      })),
      relations: input.edges.map((item) => ({
        id: worldIds("world_relation", item.id),
        relationType: "collaborates_with" as const,
        fromEntityId: entityIds.get(item.fromAgentId)!,
        toEntityId: entityIds.get(item.toAgentId)!,
        signal: "neutral" as const,
        provenance: provenance(true),
      })),
      resources: [{
        id: timeResourceId,
        resourceType: "time",
        label: "Decision capacity",
        ownerEntityId: entityIds.get(self.id)!,
        controllerAgentId: agentIds.get(self.id)!,
        available: 100,
        unit: "units",
        min: 0,
        max: 100,
        provenance: provenance(false),
      }],
      constraints: [],
      externalVariables: [],
    }, { clock: () => input.startedAt, idFactory: worldIds });
    if (!worldResult.ok) return { ok: false as const, errorCode: "world_initialization_failed" as const };

    const maxTicks = input.horizonDays === 30 ? 3 : 6;
    const trajectoryTemplate = {
      runSpecId: `trajectory_run_spec_v2_formal_${causalFingerprint}` as const,
      trajectoryId: `trajectory_v2_formal_${causalFingerprint}` as const,
      seedContextId: input.seedContextId,
      initialWorld: worldResult.world,
      expectedInitialWorldRevision: worldResult.world.revision,
      trajectorySeed: input.deterministicSeed,
      horizonDays: input.horizonDays,
      startAt: input.startedAt,
      tickIntervalDays: input.horizonDays === 30 ? 10 : 15,
      maxTicks,
      policyId: "formal_account_sandbox_policy",
      policyVersion: "1",
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
        candidatesForTick: ({ world, tickIndex, occurredAt }): ActionProposalInputV2[] => [{
          id: `action_proposal_v2_formal_${seed}_${tickIndex}`,
          seedContextId: world.seedContextId,
          actorAgentId: agentIds.get(self.id)!,
          actionType: "allocate_resource",
          targetEntityIds: [entityIds.get(self.id)!],
          targetResourceIds: [timeResourceId],
          targetRelationIds: [],
          targetVariableIds: [],
          parameters: { actionType: "allocate_resource", resourceId: timeResourceId, amount: 1 },
          realEvidenceIds: [primaryEvidenceId],
          assumptionIds: [assumptionId],
          priorWorldEventIds: [...world.worldEventIds],
          rationaleSummary: `Controlled option at tick ${tickIndex + 1}.`,
          createdAt: occurredAt,
        }],
      }),
      trajectoryRuntimeFactory: ({ seed }) => ({ agentWorldIdFactory: createStableAgentWorldIdFactoryV2(`formal-${causalFingerprint}-${seed}`) }),
      interventionRuntimeFactory: ({ interventionId }) => ({ clock: () => input.startedAt, idFactory: createStableAgentWorldIdFactoryV2(`formal-${causalFingerprint}-${interventionId}`) }),
    });
    const analyzed = analyzeTrajectoryBatchV2(spec, adapter);
    if (!analyzed.ok) return { ok: false as const, errorCode: "trajectory_execution_failed" as const };
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

    const lockedAt = lockTime(input.startedAt);
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
    const appended = await outcomeRepository.append({
      streamId,
      expectedVersion: 0,
      idempotencyKey: `stage7_idempotency_v2_formal_${causalFingerprint}`,
      persistedAt: lockedAt,
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

    const events = analyzed.analysis.trajectories.flatMap((trajectory) =>
      trajectory.finalWorld.worldEvents.map((event, tickIndex) => ({
        ...event,
        branchId: trajectory.trajectoryId,
        tickIndex,
      })),
    );
    const claims = [...claimsResult.claims].sort((left, right) => left.id.localeCompare(right.id));
    return {
      ok: true as const,
      bundle: {
        runtimePath: ["reality_boundary_v2", "agent_world_v2", "seeded_trajectory_v2", "trajectory_analysis_v2", "claims_reports_v2", "outcome_lock_v2", "stage8_canonical_validation"] as const,
        causalFingerprint,
        inputSnapshot: causalInput,
        symbolicLensSnapshot: input.symbolicLens,
        sourceBoundary: claimSet.realityBoundary,
        worldSnapshots: analyzed.analysis.trajectories.map((trajectory) => trajectory.finalWorld),
        trajectoryAnalysis: analyzed.analysis,
        events,
        claims,
        report: reportResult.report,
        forecastLockReference: canonicalBundle.stage7.forecastLockReference,
        versions: {
          runtime: "formal-account-sandbox-m1-v1",
          schema: "formal-run-bundle-m1-v1",
          world: AGENT_WORLD_ENGINE_VERSION_V2,
          trajectory: TRAJECTORY_ENGINE_VERSION_V2,
          analysis: ANALYSIS_ENGINE_VERSION_V2,
        },
      },
    };
  } catch {
    return { ok: false as const, errorCode: "runtime_failed" as const };
  }
}
