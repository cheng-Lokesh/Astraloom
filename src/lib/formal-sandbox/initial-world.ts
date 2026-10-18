import { z } from "zod";
import { digitalLifeAgentInputSchema, digitalLifeEdgeInputSchema, digitalLifeProfileSnapshotSchema, ordinalPerson, roleForAgent, listDigitalLifeEnvironmentVariables, type DigitalLifeModel } from "@/lib/digital-life/model";
import { ruleAssumptionStatement } from "@/lib/digital-life/world-guards";
import { LIFE_MODEL_DOMAIN_ENTRY_PREFIX, listRealityProfileEntries } from "@/lib/reality-profile/profile";
import { frozenOutcomeCalibrationSchema } from "./outcomes/correction-contracts";
import { createPlanningAssumptions } from "@/lib/formal-planning";
import type { FrozenDefaultPlanning } from "@/lib/formal-planning/contracts";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import { AGENT_WORLD_ENGINE_VERSION_V2, type AgentDefinitionIdV2, type WorldConstraintIdV2, type WorldEntityIdV2, type WorldResourceIdV2, type WorldVariableIdV2 } from "@/lib/v2/agent-world/types";
import { initializeWorldV2 } from "@/lib/v2/agent-world/world-initializer";
import { createStableRealityBoundaryIdFactoryV2 } from "@/lib/v2/reality-boundary/ids";
import { buildAssumptionLedgerV2 } from "@/lib/v2/reality-boundary/assumption-ledger";
import { buildEvidenceLedgerV2 } from "@/lib/v2/reality-boundary/evidence-ledger";
import { REALITY_BOUNDARY_SCHEMA_VERSION_V2 } from "@/lib/v2/reality-boundary/types";

export const initialWorldSourceSchema = z.object({
  ownerId: z.string().uuid(), seedContextId: z.string().uuid(), graphSnapshotId: z.string().uuid(), agentSnapshotId: z.string().uuid(),
  realityProfileSnapshot: digitalLifeProfileSnapshotSchema,
  horizonDays: z.union([z.literal(30), z.literal(90)]),
  startedAt: z.string().datetime({ offset: true }), acceptedAt: z.string().datetime({ offset: true }).optional(),
  seedSummary: z.string().trim().min(1).max(4_000),
  agents: z.array(digitalLifeAgentInputSchema).min(1).max(50), edges: z.array(digitalLifeEdgeInputSchema).min(1).max(200),
  safetyLevel: z.enum(["safe", "caution", "blocked", "downgraded"]),
  outcomeCalibration: frozenOutcomeCalibrationSchema.optional(),
}).passthrough();

/** Reconstructs authority only from frozen source inputs, never a supplied World or its ledgers. */
export function buildFormalSandboxInitialWorld(
  input: z.infer<typeof initialWorldSourceSchema>, digitalLifeModel: DigitalLifeModel,
  activePathKey: string, policyFingerprint: string, boundaryAt: string, planning?: FrozenDefaultPlanning,
) {
  const realityRuntime = {
    clock: () => boundaryAt,
    idFactory: createStableRealityBoundaryIdFactoryV2(`formal-${policyFingerprint}`),
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
      statement: ruleAssumptionStatement(rule, { resources: worldInputs.resources.map((item, index) => ({ ...item, key: `resource-${index + 1}` })), variables: listDigitalLifeEnvironmentVariables(input.realityProfileSnapshot.profile) }),
      subjectType: (rule.operation.actionType === "update_external_variable" ? "external_variable" : digitalLifeModel.agents.find(agent => agent.key === rule.actorKey)?.role === "npc" || digitalLifeModel.agents.find(agent => agent.key === rule.actorKey)?.role === "group" ? "third_party" : "self") as "external_variable" | "third_party" | "self",
      category: `digital_life_rule_${rule.key}`,
      epistemicStatus: "confirmed_for_simulation" as const, impactLevel: "high" as const,
      supportingRealEvidenceIds: input.outcomeCalibration?.corrections.some(c=>c.ruleKey===rule.key) ? [evidenceLedger.items.find(e=>e.claimKey===`formal.outcome.correction.${rule.key}`)!.id] : [], contradictingRealEvidenceIds: [],
      limitations: ["Explicit user-authored conditional simulation rule, not observed behavior or private intent."],
      confirmationRequirement: "required" as const, confirmationStatus: "confirmed" as const,
    })),
    ...(planning ? createPlanningAssumptions(planning) : []),
    ],
  });
  const assumptionId = assumptionLedger.assumptions[0]!.id;
  const evidenceIdFor = (claimKey: string) => evidenceLedger.items.find((item) => item.claimKey === claimKey)!.id;
  const assumptionIdFor = (category: string) => assumptionLedger.assumptions.find((item) => item.category === category)!.id;
  const worldIds = createStableAgentWorldIdFactoryV2(`formal-${policyFingerprint}`);
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
    allowedValues: [...new Set([field.value, ...digitalLifeModel.rules.actions.flatMap(rule => rule.pathKey === activePathKey && rule.operation.actionType === "update_external_variable" && rule.operation.variableKey === (key.startsWith("pressures.") ? `pressure-${key.slice("pressures.".length)}` : `external-variable-${key.slice("externalVariables.".length)}`) ? [rule.operation.value] : [])])],
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
  return { worldResult, boundary, worldInputs, assumptionLedger, primaryEvidenceId, agentIds, entityIds, resourceIdsByKey, activeRules, profileVariableSpecs, assumptionIdFor, evidenceIdFor, worldIds, self };
}
