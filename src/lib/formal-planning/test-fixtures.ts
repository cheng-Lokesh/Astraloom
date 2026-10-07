import { buildDigitalLifeModel } from "@/lib/digital-life/model";
import { digitalLifeInput } from "@/lib/digital-life/test-fixtures";
import { attachedSymbolicFixture } from "@/lib/formal-sandbox/symbolic-lens.test-fixtures";
import { buildAssumptionLedgerV2 } from "@/lib/v2/reality-boundary/assumption-ledger";
import { createStableRealityBoundaryIdFactoryV2 } from "@/lib/v2/reality-boundary/ids";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import { initializeWorldV2 } from "@/lib/v2/agent-world/world-initializer";
import { idsV2, realityBoundaryV2, worldInitializationSpecV2 } from "@/lib/v2/agent-world/test-fixtures";
import type { AgentDefinitionIdV2, WorldEntityIdV2, WorldResourceIdV2, WorldStateV2 } from "@/lib/v2/agent-world/types";
import { bindPlanningWorld } from "./world-binding";
import type { RealEvidenceIdV2 } from "@/lib/v2/reality-boundary/types";
import { createPlanningAssumptions } from "./index";
import type { DefaultPlanningSource, FrozenDefaultPlanning } from "./contracts";

export function planningSource(): DefaultPlanningSource {
  const input = digitalLifeInput();
  input.realityProfileSnapshot.profile.worldInputs.resources[0].usePerTick = null;
  const built = buildDigitalLifeModel(input);
  if (!built.ok) throw new Error("fixture_invalid");
  const symbolicLens = attachedSymbolicFixture();
  symbolicLens.frame.calculation.groupCounts = { peer: 0, expression: 0, resource: 0, responsibility: 1, support: 0 };
  symbolicLens.frame.calculation.natalDayElement = "wood";
  symbolicLens.frame.calculation.periodYearElement = "wood";
  symbolicLens.frame.calculation.periodMonthElement = "fire";
  return { model: built.model, realityProfileSnapshot: input.realityProfileSnapshot, horizonDays: 30, acceptedAt: symbolicLens.frozenAt, symbolicLens, consentContext: "a".repeat(64) };
}

export const planningRequest = (enabled = true) => ({ version: "formal-default-planner-v1", consentContext: "a".repeat(64), resources: [{ resourceKey: "resource-1", totalBudgetLimit: 3, confirmedForSimulation: true }], fusion: { enabled, confirmedForSimulation: enabled } });

const worldNamespace = "planning-tests-accepted-source";
const bindingsByWorld = new WeakMap<WorldStateV2, ReturnType<typeof bindPlanningWorld>>();

export function planningWorld(planning: FrozenDefaultPlanning): WorldStateV2 {
  const boundary = realityBoundaryV2();
  const seed = planning.sourceBinding.seedContextId;
  boundary.seedContextId = seed;
  boundary.evidenceLedger.seedContextId = seed;
  boundary.evidenceLedger.items.forEach(item => { item.seedContextId = seed; });
  const acceptedPath = planning.sourceBinding.allowedPaths[0];
  const evidenceIds = createStableRealityBoundaryIdFactoryV2("planning-source");
  const actorEvidenceId = evidenceIds("evidence", "accepted-actor") as RealEvidenceIdV2;
  boundary.evidenceLedger.items.push({ ...structuredClone(boundary.evidenceLedger.items[0]), id: actorEvidenceId, seedContextId: seed,
    claimKey: `formal.agent.${acceptedPath.sourceAgentOrdinal}`, provenance: [{ sourceRef: `agent_snapshot:${planning.sourceBinding.agentSnapshotId}:${acceptedPath.sourceAgentId}`, capturedAt: planning.sourceBinding.acceptedAt }],
  });
  for (const resource of planning.resources.filter(item => item.classification === "fact")) {
    boundary.evidenceLedger.items.push({ ...structuredClone(boundary.evidenceLedger.items[0]), id: evidenceIds("evidence", resource.profileResourceKey) as RealEvidenceIdV2, seedContextId: seed,
      claimKey: `reality.profile.world_resource.${resource.profileResourceKey}`, statement: resource.label,
      provenance: [{ sourceRef: `reality_profile:${planning.sourceBinding.profileId ?? "absent"}:revision:${planning.sourceBinding.profileRevision}:world_resource:${resource.profileResourceKey}`, capturedAt: planning.sourceBinding.acceptedAt }],
      limitations: [`User-supplied basis: ${resource.evidenceSummary}`],
    });
  }
  const originals = boundary.assumptionLedger.assumptions.map(item => ({
    statement: item.statement, subjectType: item.subjectType, category: item.category, epistemicStatus: item.epistemicStatus,
    impactLevel: item.impactLevel, supportingRealEvidenceIds: item.supportingRealEvidenceIds, contradictingRealEvidenceIds: item.contradictingRealEvidenceIds,
    limitations: item.limitations, confirmationRequirement: item.confirmationRequirement, confirmationStatus: item.confirmationStatus,
  }));
  boundary.assumptionLedger = buildAssumptionLedgerV2({ seedContextId: seed, evidenceLedger: boundary.evidenceLedger,
    runtime: { clock: () => planning.sourceBinding.acceptedAt, idFactory: createStableRealityBoundaryIdFactoryV2("planning-tests") },
    assumptions: [...originals, ...planning.resources.filter(item => item.classification === "assumption").map(item => ({ statement: item.label, subjectType: "self" as const, category: `reality_profile_world_resource_${item.profileResourceKey}`, epistemicStatus: "confirmed_for_simulation" as const, impactLevel: "low" as const, supportingRealEvidenceIds: [], contradictingRealEvidenceIds: [], confirmationRequirement: "not_required" as const, confirmationStatus: "confirmed" as const, limitations: [`User designated this resource value as a simulation assumption: ${item.evidenceSummary}`] })), ...createPlanningAssumptions(planning)],
  });
  boundary.assumptionLedger.revision = boundary.revision;
  boundary.updatedAt = planning.sourceBinding.acceptedAt;
  const worldIds = createStableAgentWorldIdFactoryV2(worldNamespace);
  const actorSource = planning.sourceBinding.allowedPaths[0].sourceAgentId;
  const actorId = worldIds("agent_definition", actorSource) as AgentDefinitionIdV2;
  const entityId = worldIds("world_entity", actorSource) as WorldEntityIdV2;
  const primaryResourceId = worldIds("world_resource", planning.resources[0].profileResourceKey) as WorldResourceIdV2;
  const spec = JSON.parse(JSON.stringify(worldInitializationSpecV2(boundary)).replaceAll(idsV2.self, actorId).replaceAll(idsV2.time, primaryResourceId)) as ReturnType<typeof worldInitializationSpecV2>;
  spec.agentDefinitions[0].realEvidenceIds = [actorEvidenceId];
  spec.agentDefinitions[0].fieldProvenance.displayName.realEvidenceIds = [actorEvidenceId];
  spec.agentDefinitions[0].fieldProvenance.role.realEvidenceIds = [actorEvidenceId];
  spec.seedContextId = seed;
  spec.entities.push({ id: entityId, entityType: "person", label: "本人", agentDefinitionId: actorId, provenance: spec.entities[0].provenance });
  const resource = planning.resources[0];
  const provenanceFor = (plan: FrozenDefaultPlanning["resources"][number]) => ({ realEvidenceIds: plan.classification === "fact" ? [boundary.evidenceLedger.items.find(item => item.claimKey === `reality.profile.world_resource.${plan.profileResourceKey}`)!.id] : [], assumptionIds: plan.classification === "assumption" ? [boundary.assumptionLedger.assumptions.find(item => item.category === `reality_profile_world_resource_${plan.profileResourceKey}`)!.id] : [], provisional: plan.classification === "assumption", visible: true as const });
  spec.resources[0] = { ...spec.resources[0], ownerEntityId: entityId, resourceType: resource.resourceType, label: resource.label, unit: resource.unit, available: resource.initialAvailable, min: resource.minimum, max: resource.maximum, provenance: provenanceFor(resource) };
  for (const second of planning.resources.slice(1)) {
    spec.resources.push({ ...spec.resources[0], id: worldIds("world_resource", second.profileResourceKey) as WorldResourceIdV2, resourceType: second.resourceType, label: second.label, unit: second.unit, available: second.initialAvailable, min: second.minimum, max: second.maximum, provenance: provenanceFor(second) });
  }
  const initialized = initializeWorldV2(boundary, spec, { clock: () => planning.sourceBinding.acceptedAt, idFactory: createStableAgentWorldIdFactoryV2("planning-tests") });
  if (!initialized.ok) throw new Error(initialized.errorCode);
  bindingsByWorld.set(initialized.world, bindPlanningWorld(planning, initialized.world, worldNamespace, "main", new Date(Date.parse(planning.sourceBinding.acceptedAt) + 300_000).toISOString()));
  return initialized.world;
}

export function planningBindings(world: WorldStateV2) {
  const worldBinding = bindingsByWorld.get(world);
  if (!worldBinding) throw new Error("fixture_invalid");
  return { actorAgentId: worldBinding.actorAgentId, actorEntityId: worldBinding.actorEntityId, worldBinding,
    resources: new Map(worldBinding.resources.map(item => [item.resourceKey, item.resourceId])),
    assumptions: new Map(world.realityBoundarySnapshot.assumptionLedger.assumptions.map(item => [item.category, item.id])),
  };
}
