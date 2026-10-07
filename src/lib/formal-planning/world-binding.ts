import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import type { AgentDefinitionIdV2, WorldEntityIdV2, WorldResourceIdV2, WorldStateV2 } from "@/lib/v2/agent-world/types";
import { parseFrozenDefaultPlanning } from "./index";
import type { FrozenDefaultPlanning } from "./contracts";

/** Server-created, internal-only receipt. No client field accepts a namespace or Core ID. */
export type PlanningWorldBinding = {
  acceptedSourceSignature: string; worldNamespace: string; pathKey: string;
  actorAgentId: AgentDefinitionIdV2; actorEntityId: WorldEntityIdV2;
  actorSignature: string;
  capturedBoundaryAt: string; simulationStartAt: string;
  resources: Array<{ resourceKey: string; resourceId: WorldResourceIdV2; definitionSignature: string; provenanceSignature: string }>;
};

// A structural receipt, not a signature authenticating arbitrary untrusted requests. Admission and
// immutable persistence establish trust; this exact comparison detects source/world substitutions.
export function acceptedPlanningSourceSignature(planning: FrozenDefaultPlanning) {
  return JSON.stringify({ sourceBinding: planning.sourceBinding, resources: planning.resources, maxTicks: planning.maxTicks });
}

function resourceDefinition(resource: WorldStateV2["resources"][number]) {
  return JSON.stringify({ id: resource.id, resourceType: resource.resourceType, label: resource.label, unit: resource.unit,
    ownerEntityId: resource.ownerEntityId, controllerAgentId: resource.controllerAgentId, min: resource.min, max: resource.max });
}

function resourceProvenance(resource: WorldStateV2["resources"][number], world: WorldStateV2) {
  const boundary = world.realityBoundarySnapshot;
  return JSON.stringify({ provenance: resource.provenance,
    evidence: resource.provenance.realEvidenceIds.map(id => boundary.evidenceLedger.items.find(item => item.id === id)),
    assumptions: resource.provenance.assumptionIds.map(id => boundary.assumptionLedger.assumptions.find(item => item.id === id)),
  });
}

/** Called once, against the accepted initial World, before any path/sample is executed. */
export function bindPlanningWorld(planningInput: FrozenDefaultPlanning, initialWorld: WorldStateV2, worldNamespace: string, pathKey: string, simulationStartAt: string): PlanningWorldBinding {
  const planning = parseFrozenDefaultPlanning(planningInput);
  const path = planning.sourceBinding.allowedPaths.find(item => item.pathKey === pathKey);
  const capturedBoundaryAt = initialWorld.realityBoundarySnapshot.updatedAt;
  if (!Number.isFinite(Date.parse(capturedBoundaryAt)) || !Number.isFinite(Date.parse(simulationStartAt))
    || Date.parse(capturedBoundaryAt) < Date.parse(planning.sourceBinding.acceptedAt) || Date.parse(capturedBoundaryAt) > Date.parse(simulationStartAt)
    || Date.parse(planning.sourceBinding.acceptedAt) >= Date.parse(simulationStartAt)) throw new Error("invalid_planning_world_binding");
  if (!path || !/^[a-zA-Z0-9_-]{1,180}$/.test(worldNamespace) || initialWorld.seedContextId !== planning.sourceBinding.seedContextId || initialWorld.worldEvents.length) throw new Error("invalid_planning_world_binding");
  const ids = createStableAgentWorldIdFactoryV2(worldNamespace);
  const actorAgentId = ids("agent_definition", path.sourceAgentId) as AgentDefinitionIdV2;
  const actorEntityId = ids("world_entity", path.sourceAgentId) as WorldEntityIdV2;
  const actor = initialWorld.agentDefinitions.find(item => item.id === actorAgentId);
  const entity = initialWorld.entities.find(item => item.id === actorEntityId);
  if (actor?.actorType !== "self" || entity?.agentDefinitionId !== actorAgentId) throw new Error("invalid_planning_world_binding");
  const actorEvidence = initialWorld.realityBoundarySnapshot.evidenceLedger.items.find(item => item.id === actor.realEvidenceIds[0]);
  if (!actorEvidence || actorEvidence.claimKey !== `formal.agent.${path.sourceAgentOrdinal}`
    || !actorEvidence.provenance.some(item => item.sourceRef === `agent_snapshot:${planning.sourceBinding.agentSnapshotId}:${path.sourceAgentId}` && Date.parse(item.capturedAt) === Date.parse(capturedBoundaryAt))) throw new Error("invalid_planning_world_binding");
  const resources = planning.resources.filter(item => item.status === "active").map(plan => {
    const resourceId = ids("world_resource", plan.profileResourceKey) as WorldResourceIdV2;
    const resource = initialWorld.resources.find(item => item.id === resourceId);
    if (!resource || resource.ownerEntityId !== actorEntityId || resource.controllerAgentId !== actorAgentId
      || resource.resourceType !== plan.resourceType || resource.label !== plan.label || resource.unit !== plan.unit
      || resource.available !== plan.initialAvailable || resource.min !== plan.minimum || resource.max !== plan.maximum
      || resource.provenance.provisional !== (plan.classification === "assumption") || !resource.provenance.visible) throw new Error("invalid_planning_world_binding");
    const boundary = initialWorld.realityBoundarySnapshot;
    if (plan.classification === "fact") {
      const evidence = boundary.evidenceLedger.items.find(item => item.id === resource.provenance.realEvidenceIds[0]);
      const expectedRef = `reality_profile:${planning.sourceBinding.profileId ?? "absent"}:revision:${planning.sourceBinding.profileRevision}:world_resource:${plan.profileResourceKey}`;
      if (resource.provenance.realEvidenceIds.length !== 1 || resource.provenance.assumptionIds.length !== 0
        || evidence?.claimKey !== `reality.profile.world_resource.${plan.profileResourceKey}`
        || evidence.seedContextId !== planning.sourceBinding.seedContextId || !evidence.provenance.some(item => item.sourceRef === expectedRef && Date.parse(item.capturedAt) === Date.parse(capturedBoundaryAt))
        || !evidence.limitations.includes(`User-supplied basis: ${plan.evidenceSummary}`)) throw new Error("invalid_planning_world_binding");
    } else {
      const assumption = boundary.assumptionLedger.assumptions.find(item => item.id === resource.provenance.assumptionIds[0]);
      if (resource.provenance.realEvidenceIds.length !== 0 || resource.provenance.assumptionIds.length !== 1
        || assumption?.category !== `reality_profile_world_resource_${plan.profileResourceKey}`
        || assumption.seedContextId !== planning.sourceBinding.seedContextId || assumption.confirmationStatus !== "confirmed"
        || !assumption.limitations.includes(`User designated this resource value as a simulation assumption: ${plan.evidenceSummary}`)) throw new Error("invalid_planning_world_binding");
    }
    return { resourceKey: plan.resourceKey, resourceId, definitionSignature: resourceDefinition(resource), provenanceSignature: resourceProvenance(resource, initialWorld) };
  });
  return { acceptedSourceSignature: acceptedPlanningSourceSignature(planning), worldNamespace, pathKey, actorAgentId, actorEntityId, actorSignature: JSON.stringify({ actor, entity, actorEvidence }), capturedBoundaryAt, simulationStartAt, resources };
}

/** Every continuation and Result comparison stays sealed to the same accepted path and source. */
export function planningWorldBindingMatches(planning: FrozenDefaultPlanning, world: WorldStateV2, binding: PlanningWorldBinding, pathKey: string) {
  if (binding.acceptedSourceSignature !== acceptedPlanningSourceSignature(planning) || binding.pathKey !== pathKey || world.seedContextId !== planning.sourceBinding.seedContextId) return false;
  if (binding.capturedBoundaryAt !== world.realityBoundarySnapshot.updatedAt || !Number.isFinite(Date.parse(binding.simulationStartAt))
    || Date.parse(binding.capturedBoundaryAt) < Date.parse(planning.sourceBinding.acceptedAt) || Date.parse(binding.capturedBoundaryAt) > Date.parse(binding.simulationStartAt)
    || Date.parse(planning.sourceBinding.acceptedAt) >= Date.parse(binding.simulationStartAt)) return false;
  const path = planning.sourceBinding.allowedPaths.find(item => item.pathKey === pathKey);
  if (!path) return false;
  const ids = createStableAgentWorldIdFactoryV2(binding.worldNamespace);
  if (binding.actorAgentId !== ids("agent_definition", path.sourceAgentId) || binding.actorEntityId !== ids("world_entity", path.sourceAgentId)) return false;
  const actor = world.agentDefinitions.find(item => item.id === binding.actorAgentId);
  const entity = world.entities.find(item => item.id === binding.actorEntityId);
  if (actor?.actorType !== "self" || entity?.agentDefinitionId !== binding.actorAgentId) return false;
  const actorEvidence = world.realityBoundarySnapshot.evidenceLedger.items.find(item => item.id === actor.realEvidenceIds[0]);
  if (JSON.stringify({ actor, entity, actorEvidence }) !== binding.actorSignature) return false;
  const active = planning.resources.filter(item => item.status === "active");
  if (active.length !== binding.resources.length) return false;
  return active.every(plan => {
    const bound = binding.resources.find(item => item.resourceKey === plan.resourceKey);
    const resource = bound && world.resources.find(item => item.id === bound.resourceId);
    return !!resource && bound!.resourceId === ids("world_resource", plan.profileResourceKey)
      && resourceDefinition(resource) === bound!.definitionSignature && resourceProvenance(resource, world) === bound!.provenanceSignature;
  });
}
