import { createHash } from "node:crypto";

import { z } from "zod";
import { buildDigitalLifeModel, digitalLifeAgentInputSchema, digitalLifeEdgeInputSchema, digitalLifeRulesSchema, ordinalPerson, roleForAgent, type DigitalLifeModel } from "@/lib/digital-life/model";
import { proposeDigitalLifeActions } from "./digital-life-proposals";
import { parseFrozenSymbolicLens, runSymbolicLensSchema } from "./symbolic-lens";
import { applyFrozenCorrections, frozenOutcomeCalibrationSchema } from "./outcomes/rule-corrections";
import { buildFrozenRealityCriteria } from "./outcomes/core-adapter";

import { LIFE_MODEL_DOMAIN_ENTRY_PREFIX, listRealityProfileEntries, realityProfileDraftSchema } from "@/lib/reality-profile/profile";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import {
  AGENT_WORLD_ENGINE_VERSION_V2,
  type ActionProposalInputV2,
  type AgentDefinitionIdV2,
  type WorldConstraintIdV2,
  type WorldEntityIdV2,
  type WorldResourceIdV2,
  type WorldVariableIdV2,
  type WorldRelationIdV2,
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
  return createHash("sha256").update(canonical(value)).digest("hex").slice(0, 24);
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
  if (!input.realityProfileSnapshot.profile.worldInputs.resources.some((resource) => resource.usePerTick !== null) && modeled.model.rules.actions.length === 0) {
    return { ok: false as const, errorCode: "world_model_required" as const };
  }
  const baseline = await buildFormalSandboxPathV2(input, modeled.model, "main");
  if (!baseline.ok) return baseline;
  const paths: Array<{ key: string; label: string; bundle: typeof baseline.bundle }> = [];
  for (const strategy of modeled.model.rules.strategies) {
    const path = await buildFormalSandboxPathV2(input, modeled.model, strategy.participantKey);
    if (!path.ok) return path;
    paths.push({ key: strategy.participantKey, label: strategy.label, bundle: path.bundle });
  }
  return { ok: true as const, bundle: { ...baseline.bundle, strategyPaths: { version: "digital-life-paths-v1" as const, paths } } };
}

async function buildFormalSandboxPathV2(input: FormalSandboxRuntimeInput, digitalLifeModel: DigitalLifeModel, activePathKey: string) {

  try {
    const causalInput = {
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
    };
    const causalFingerprint = fingerprint(causalInput);
    const boundaryAt = input.acceptedAt ? new Date().toISOString() : new Date(Date.parse(input.startedAt) - 2).toISOString();
    const realityRuntime = {
      clock: () => boundaryAt,
      idFactory: createStableRealityBoundaryIdFactoryV2(`formal-${causalFingerprint}`),
    };
    const profileEntries = listRealityProfileEntries(input.realityProfileSnapshot.profile).filter(({ key }) => !key.startsWith(LIFE_MODEL_DOMAIN_ENTRY_PREFIX));
    const worldInputs = input.realityProfileSnapshot.profile.worldInputs;
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
        ...input.agents.map((item, index) => ({
          statement: `${item.displayName}：${roleForAgent(item) === "user_core" ? "本人" : roleForAgent(item) === "user_variant" ? "本人在独立条件下的平行策略" : "账户确认的人物角色"}`,
          claimKey: `formal.agent.${index + 1}`,
          sourceKind: "user_statement" as const, sourceTier: "tier_1_user_confirmed" as const, verificationStatus: "user_confirmed" as const,
          provenance: [{ sourceRef: `agent_snapshot:${input.agentSnapshotId}:${item.id}`, capturedAt: boundaryAt }],
          limitations: ["Snapshot identity is supported; behavior and private intent are not inferred."],
        })),
        ...(input.outcomeCalibration?.corrections ?? []).map(correction=>({
          statement:correction.evidenceSummary,claimKey:`formal.outcome.correction.${correction.ruleKey}`,
          sourceKind:"user_statement" as const,sourceTier:"tier_1_user_confirmed" as const,verificationStatus:"user_confirmed" as const,
          provenance:[{sourceRef:`formal_user_observation:${correction.observationSignature}`,capturedAt:correction.recordedAt}],
          limitations:["本人观察记录，未独立核实；仅支持下次条件假设，不证明未来会重复。"],
        })),
        ...profileEntries.filter(({ field }) => field.classification === "fact").map(({ key, label, field }) => ({
          statement: `${label}：${field.value}`,
          claimKey: `reality.profile.${key}`,
          sourceKind: "user_statement" as const,
          sourceTier: "tier_1_user_confirmed" as const,
          verificationStatus: "user_confirmed" as const,
          provenance: [{ sourceRef: `reality_profile:${input.realityProfileSnapshot.profileId ?? "absent"}:revision:${input.realityProfileSnapshot.revision}:${key}`, capturedAt: boundaryAt }],
          limitations: [`User-supplied basis: ${field.evidenceSummary}`, "A user-recorded fact can still be incomplete."],
        })),
        ...worldInputs.resources.filter((resource) => resource.classification === "fact").map((resource) => ({
          statement: `${resource.label}：${resource.available} ${resource.unit}（范围 ${resource.minimum}–${resource.maximum} ${resource.unit}）`,
          claimKey: `reality.profile.world_resource.${resource.key}`,
          sourceKind: "user_statement" as const,
          sourceTier: "tier_1_user_confirmed" as const,
          verificationStatus: "user_confirmed" as const,
          provenance: [{ sourceRef: `reality_profile:${input.realityProfileSnapshot.profileId ?? "absent"}:revision:${input.realityProfileSnapshot.revision}:world_resource:${resource.key}`, capturedAt: boundaryAt }],
          limitations: [`User-supplied basis: ${resource.evidenceSummary}`, "A user-recorded resource can still be incomplete."],
        })),
        ...worldInputs.constraints.filter((constraint) => constraint.classification === "fact").map((constraint) => ({
          statement: `${constraint.label}：${constraint.rule.value} 之前`,
          claimKey: `reality.profile.world_constraint.${constraint.key}`,
          sourceKind: "user_statement" as const,
          sourceTier: "tier_1_user_confirmed" as const,
          verificationStatus: "user_confirmed" as const,
          provenance: [{ sourceRef: `reality_profile:${input.realityProfileSnapshot.profileId ?? "absent"}:revision:${input.realityProfileSnapshot.revision}:world_constraint:${constraint.key}`, capturedAt: boundaryAt }],
          limitations: [`User-supplied basis: ${constraint.evidenceSummary}`, "A user-recorded constraint can still be incomplete."],
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
      }, ...profileEntries.filter(({ field }) => field.classification === "assumption").map(({ key, field }) => ({
        statement: field.value,
        subjectType: "unknown" as const,
        category: `reality_profile_${key}`,
        epistemicStatus: "confirmed_for_simulation" as const,
        impactLevel: "low" as const,
        supportingRealEvidenceIds: [],
        contradictingRealEvidenceIds: [],
        limitations: [`User designated this as an assumption: ${field.evidenceSummary}`, "Not a verified real-world fact."],
        confirmationRequirement: "not_required" as const,
        confirmationStatus: "confirmed" as const,
      })),
      ...worldInputs.resources.flatMap((resource) => [
        ...(resource.classification === "assumption" ? [{
          statement: `模拟假设：${resource.label} 从 ${resource.available} ${resource.unit} 开始。`,
          subjectType: "self" as const,
          category: `reality_profile_world_resource_${resource.key}`,
          epistemicStatus: "confirmed_for_simulation" as const,
          impactLevel: "low" as const,
          supportingRealEvidenceIds: [],
          contradictingRealEvidenceIds: [],
          limitations: [`User designated this resource value as a simulation assumption: ${resource.evidenceSummary}`, "Not a verified real-world fact."],
          confirmationRequirement: "not_required" as const,
          confirmationStatus: "confirmed" as const,
        }] : []),
        ...(resource.usePerTick === null ? [] : [{
          statement: `模拟规则：当行动被选中时，从“${resource.label}”分配 ${resource.usePerTick} ${resource.unit}。`,
          subjectType: "self" as const,
          category: `reality_profile_world_rate_${resource.key}`,
          epistemicStatus: "confirmed_for_simulation" as const,
          impactLevel: "low" as const,
          supportingRealEvidenceIds: [],
          contradictingRealEvidenceIds: [],
          limitations: ["This is an explicit user-entered simulation rule, not a prediction or measured future change."],
          confirmationRequirement: "not_required" as const,
          confirmationStatus: "confirmed" as const,
        }]),
      ]),
      ...worldInputs.constraints.filter((constraint) => constraint.classification === "assumption").map((constraint) => ({
        statement: `模拟假设：${constraint.label} 适用于 ${constraint.rule.value} 之前。`,
        subjectType: "external_variable" as const,
        category: `reality_profile_world_constraint_${constraint.key}`,
        epistemicStatus: "confirmed_for_simulation" as const,
        impactLevel: "low" as const,
        supportingRealEvidenceIds: [],
        contradictingRealEvidenceIds: [],
        limitations: [`User designated this constraint as a simulation assumption: ${constraint.evidenceSummary}`, "Not a verified real-world fact."],
        confirmationRequirement: "not_required" as const,
        confirmationStatus: "confirmed" as const,
      })),
      ...digitalLifeModel.rules.actions.filter(rule => rule.pathKey === activePathKey).map(rule => ({
        statement: `用户确认的条件模拟规则：${rule.operation.actionType}。依据：${rule.evidenceSummary}`,
        subjectType: (digitalLifeModel.agents.find(agent => agent.key === rule.actorKey)?.role === "npc" || digitalLifeModel.agents.find(agent => agent.key === rule.actorKey)?.role === "group" ? "third_party" : "self") as "third_party" | "self",
        category: `digital_life_rule_${rule.key}`,
        epistemicStatus: "confirmed_for_simulation" as const, impactLevel: "high" as const,
        supportingRealEvidenceIds: input.outcomeCalibration?.corrections.some(c=>c.ruleKey===rule.key) ? [evidenceLedger.items.find(e=>e.claimKey===`formal.outcome.correction.${rule.key}`)!.id] : [], contradictingRealEvidenceIds: [],
        limitations: ["Explicit user-authored conditional simulation rule, not observed behavior or private intent."],
        confirmationRequirement: "required" as const, confirmationStatus: "confirmed" as const,
      })),
      ],
    });
    const assumptionId = assumptionLedger.assumptions[0]!.id;
    const evidenceIdFor = (claimKey: string) => evidenceLedger.items.find((item) => item.claimKey === claimKey)!.id;
    const assumptionIdFor = (category: string) => assumptionLedger.assumptions.find((item) => item.category === category)!.id;
    const worldIds = createStableAgentWorldIdFactoryV2(`formal-${causalFingerprint}`);
    const resourceIdsByKey = new Map<string, WorldResourceIdV2>(worldInputs.resources.map((resource) => [
      resource.key,
      worldIds("world_resource", resource.key) as WorldResourceIdV2,
    ]));
    const resourceAssumptionsByKey = new Map(worldInputs.resources.map((resource) => [
      resource.key,
      [
        ...(resource.classification === "assumption" ? [assumptionIdFor(`reality_profile_world_resource_${resource.key}`)] : []),
        ...(resource.usePerTick === null ? [] : [assumptionIdFor(`reality_profile_world_rate_${resource.key}`)]),
      ],
    ]));
    const modeledProfileVariables = profileEntries.filter(({ key, field }) =>
      (key.startsWith("pressures.") || key.startsWith("externalVariables.")) && field.classification !== "unknown",
    );
    const profileVariableSpecs = modeledProfileVariables.map(({ key, field }) => ({
      id: worldIds("world_variable", key) as WorldVariableIdV2,
      variableType: "enum" as const,
      key: key.startsWith("pressures.") ? `pressure-${key.slice("pressures.".length)}` : `external-variable-${key.slice("externalVariables.".length)}`,
      value: field.value,
      allowedValues: [field.value],
      provisional: field.classification === "assumption",
      provenance: {
        realEvidenceIds: field.classification === "fact" ? [evidenceIdFor(`reality.profile.${key.toLowerCase()}`)] : [],
        assumptionIds: field.classification === "assumption" ? [assumptionIdFor(`reality_profile_${key}`)] : [],
        provisional: field.classification === "assumption",
        visible: true as const,
      },
    }));
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

    const agentIds = new Map(input.agents.map((item) => [item.id, worldIds("agent_definition", item.id) as AgentDefinitionIdV2]));
    const entityIds = new Map(input.agents.map((item) => [item.id, worldIds("world_entity", item.id) as WorldEntityIdV2]));
    const coreSelf = input.agents.find((item) => roleForAgent(item) === "user_core")!;
    const self = activePathKey === "main" ? coreSelf : input.agents[Number(activePathKey.slice("person-".length)) - 1]!;
    const activeAgents = input.agents.filter(item => item.id === self.id || (roleForAgent(item) !== "user_core" && roleForAgent(item) !== "user_variant"));
    // A strategy substitutes for the main self in its own World, never coexists as a second real person.
    const activeEdges = input.edges.filter(item =>
      [item.fromAgentId, item.toAgentId].every(id => roleForAgent(input.agents.find(agent => agent.id === id)!) !== "user_variant"),
    ).map(item => ({ ...item, fromAgentId: item.fromAgentId === coreSelf.id ? self.id : item.fromAgentId, toAgentId: item.toAgentId === coreSelf.id ? self.id : item.toAgentId }));
    const activeRules = digitalLifeModel.rules.actions.filter(rule => rule.pathKey === activePathKey);
    const activeRuleIdsFor = (personKey: string) => activeRules.filter(rule => rule.actorKey === personKey).map(rule => assumptionIdFor(`digital_life_rule_${rule.key}`));
    const resourceProvenance = (realEvidenceIds: typeof primaryEvidenceId[], assumptionIds: typeof assumptionId[]) => ({
      realEvidenceIds,
      assumptionIds,
      provisional: assumptionIds.length > 0,
      visible: true as const,
    });
    const worldResult = initializeWorldV2(boundary, {
      seedContextId: input.seedContextId,
      engineVersion: AGENT_WORLD_ENGINE_VERSION_V2,
      agentDefinitions: activeAgents.map((item) => ({
        id: agentIds.get(item.id)!,
        actorType: item.actorType,
        displayName: item.displayName,
        role: item.id === self.id ? activePathKey === "main" ? "本人数字分身；目标与价值观作为有来源背景" : `本人平行策略：${digitalLifeModel.rules.strategies.find(strategy => strategy.participantKey === activePathKey)!.label}` : `账户确认的关键人物：${input.edges.find(edge => edge.fromAgentId === item.id || edge.toAgentId === item.id)?.relationshipType ?? "角色记录"}`,
        realEvidenceIds: [evidenceIdFor(`formal.agent.${input.agents.indexOf(item) + 1}`)],
        assumptionIds: activeRuleIdsFor(ordinalPerson(input.agents.indexOf(item))),
        fieldProvenance: { displayName: resourceProvenance([evidenceIdFor(`formal.agent.${input.agents.indexOf(item) + 1}`)], []), role: resourceProvenance([evidenceIdFor(`formal.agent.${input.agents.indexOf(item) + 1}`)], activeRuleIdsFor(ordinalPerson(input.agents.indexOf(item)))) },
        constraints: ["Private thoughts and deterministic outcomes are not inferred."],
      })),
      agentStates: activeAgents.map((item) => ({
        agentDefinitionId: agentIds.get(item.id)!,
        observableStatus: "available" as const,
        commitments: [...new Map(activeRules.filter(rule => rule.actorKey === ordinalPerson(input.agents.indexOf(item)) && rule.operation.actionType === "update_commitment").map(rule => { const operation = rule.operation; const id = operation.actionType === "update_commitment" ? `digital_life_${rule.actorKey}_${operation.commitmentKey}` : ""; return [id, { id, label: operation.actionType === "update_commitment" ? operation.label : "", status: "planned" as const }] as const; })).values()],
        resourceAccessIds: item.id === self.id ? [...resourceIdsByKey.values()] : [],
        observations: [],
        memory: [],
        activeAssumptionIds: activeRuleIdsFor(ordinalPerson(input.agents.indexOf(item))),
        lastActionReference: null,
      })),
      entities: activeAgents.map((item) => ({
        id: entityIds.get(item.id)!,
        entityType: item.actorType === "organization" ? "organization" as const : "person" as const,
        label: item.displayName,
        agentDefinitionId: agentIds.get(item.id)!,
        provenance: resourceProvenance([evidenceIdFor(`formal.agent.${input.agents.indexOf(item) + 1}`)], []),
      })),
      relations: activeEdges.map((item) => ({
        id: worldIds("world_relation", item.id),
        relationType: "collaborates_with" as const,
        fromEntityId: entityIds.get(item.fromAgentId)!,
        toEntityId: entityIds.get(item.toAgentId)!,
        signal: "neutral" as const,
        provenance: resourceProvenance([evidenceIdFor(`formal.relation.${input.edges.findIndex(edge => edge.id === item.id) + 1}`)], [assumptionId]),
      })),
      resources: worldInputs.resources.map((resource) => ({
        id: resourceIdsByKey.get(resource.key)!,
        resourceType: resource.resourceType,
        label: resource.label,
        ownerEntityId: entityIds.get(self.id)!,
        controllerAgentId: agentIds.get(self.id)!,
        available: resource.available,
        unit: resource.unit,
        min: resource.minimum,
        max: resource.maximum,
        provenance: resourceProvenance(
          resource.classification === "fact" ? [evidenceIdFor(`reality.profile.world_resource.${resource.key}`)] : [],
          resourceAssumptionsByKey.get(resource.key)!,
        ),
      })),
      constraints: worldInputs.constraints.map((constraint) => ({
        id: worldIds("world_constraint", constraint.key) as WorldConstraintIdV2,
        constraintType: "deadline" as const,
        target: { type: "resource" as const, id: resourceIdsByKey.get(constraint.resourceKey)! },
        rule: constraint.rule,
        provenance: resourceProvenance(
          constraint.classification === "fact" ? [evidenceIdFor(`reality.profile.world_constraint.${constraint.key}`)] : [],
          constraint.classification === "assumption" ? [assumptionIdFor(`reality_profile_world_constraint_${constraint.key}`)] : [],
        ),
      })),
      externalVariables: profileVariableSpecs,
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
      policyVersion: "digital-life-adapter-v1",
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
          const explicit = proposeDigitalLifeActions({
            rules: activeRules, world, tickIndex, occurredAt, namespace: `formal_${causalFingerprint}_${seed}`,
            bindings: {
              agents: new Map(input.agents.map((item, index) => [ordinalPerson(index), agentIds.get(item.id)!])),
              entities: new Map(input.agents.map((item, index) => [ordinalPerson(index), entityIds.get(item.id)!])),
              relations: new Map(input.edges.map((item, index) => [`relation-${index + 1}`, worldIds("world_relation", item.id) as WorldRelationIdV2])),
              resources: new Map(worldInputs.resources.map((item, index) => [`resource-${index + 1}`, resourceIdsByKey.get(item.key)!])),
              evidence: new Map(input.agents.map((_, index) => [ordinalPerson(index), evidenceIdFor(`formal.agent.${index + 1}`)])),
              assumptions: new Map(activeRules.map(rule => [rule.key, assumptionIdFor(`digital_life_rule_${rule.key}`)])),
            },
          });
          if (explicit.length > 0) return explicit;
          return worldInputs.resources.flatMap((resource) => {
          const resourceId = resourceIdsByKey.get(resource.key)!;
          const currentResource = world.resources.find((item) => item.id === resourceId);
          if (!currentResource || resource.usePerTick === null || currentResource.available - resource.usePerTick < currentResource.min) return [];
          if (world.constraints.some((constraint) =>
            constraint.constraintType === "deadline" &&
            constraint.target.type === "resource" &&
            constraint.target.id === resourceId &&
            constraint.rule.kind === "before_time" &&
            Date.parse(occurredAt) >= Date.parse(constraint.rule.value)
          )) return [];
          return [{
            id: `action_proposal_v2_formal_${causalFingerprint}_${seed}_${tickIndex}_${resource.key}`,
            seedContextId: world.seedContextId,
            actorAgentId: agentIds.get(self.id)!,
            actionType: "allocate_resource",
            targetEntityIds: [entityIds.get(self.id)!],
            targetResourceIds: [resourceId],
            targetRelationIds: [],
            targetVariableIds: [],
            parameters: { actionType: "allocate_resource", resourceId, amount: resource.usePerTick },
            realEvidenceIds: [...new Set([...currentResource.provenance.realEvidenceIds, primaryEvidenceId])],
            assumptionIds: [...new Set([
              ...currentResource.provenance.assumptionIds,
              assumptionIdFor(`reality_profile_world_rate_${resource.key}`),
            ])],
            priorWorldEventIds: [...world.worldEventIds],
            rationaleSummary: `User-declared resource rule at tick ${tickIndex + 1}.`,
            createdAt: occurredAt,
          }];
          });
        },
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
