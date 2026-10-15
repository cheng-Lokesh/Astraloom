import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import type { WorldEventV2, WorldStateV2, WorldEntityIdV2 } from "@/lib/v2/agent-world/types";
import type { AssumptionInputV2 } from "@/lib/v2/reality-boundary/types";
import { digitalLifeRulesSchema } from "@/lib/digital-life/model";
import type { DefaultPlanningSource, FrozenDefaultPlanning } from "./contracts";
import { canonicalRelationshipValue as canonical, frozenRelationshipResponseSchema, type FrozenRelationshipResponse, type RelationshipResponseRequest } from "./relationship-contracts";

export const RELATIONSHIP_ASSUMPTION_CATEGORY = "formal_relationship_response_v1";

/** Explicit self-response hypothesis, not third-party personality or symbolic Real Evidence. */
export function freezeRelationshipResponse(authorization: RelationshipResponseRequest, source: DefaultPlanningSource, resources: FrozenDefaultPlanning["resources"]): FrozenRelationshipResponse {
  const { model } = source;
  const { requestRule, responseRule, pathKey } = authorization;
  for (const rule of [requestRule, responseRule]) {
    if (canonical(model.rules.actions.find(item => item.key === rule.key)) !== canonical(rule)) throw new Error("invalid_planning_request");
  }
  const self = model.agents.find(item => pathKey === "main" ? item.role === "user_core" : item.key === pathKey && item.role === "user_variant" && item.strategyStatus === "explicit");
  const npc = model.agents.find(item => item.key === responseRule.actorKey && (item.role === "npc" || item.role === "group"));
  if (!self || !npc || requestRule.actorKey !== self.key || requestRule.operation.actionType !== "request_information" || responseRule.operation.actionType !== "update_relation_signal") throw new Error("invalid_planning_request");
  const relation = model.relationships.find(item => item.key === (responseRule.operation.actionType === "update_relation_signal" ? responseRule.operation.relationKey : ""));
  const originalSelf = model.agents.find(item => item.role === "user_core")!;
  if (!relation || ![relation.fromPersonKey, relation.toPersonKey].includes(npc.key) || ![relation.fromPersonKey, relation.toPersonKey].includes(originalSelf.key)) throw new Error("invalid_planning_request");
  const resource = resources.find(item => item.resourceKey === authorization.resourceKey);
  if (!resource) throw new Error("invalid_planning_request");
  const lens = source.symbolicLens;
  if (authorization.symbolicSensitivity.enabled && (!("version" in lens) || lens.status !== "attached" || !lens.frame || !lens.provenance)) throw new Error("invalid_planning_request");
  const frame = authorization.symbolicSensitivity.enabled && "version" in lens ? lens.frame : null;
  const symbolicInputs = frame ? { responsibilityCount: frame.calculation.groupCounts.responsibility, peerCount: frame.calculation.groupCounts.peer } : null;
  const symbolicAdditionalReduction = symbolicInputs && symbolicInputs.responsibilityCount > symbolicInputs.peerCount ? 0.05 : 0;
  return frozenRelationshipResponseSchema.parse({ authorization, status: resource.status,
    selfLabel: self.label, npcLabel: npc.label, relationLabel: relation.label,
    selfSourceAgentId: self.sourceAgentId, npcSourceAgentId: npc.sourceAgentId, npcSourceOrdinal: model.agents.indexOf(npc) + 1,
    sourceEdgeId: relation.sourceEdgeId, effectiveRulesSignature: canonical(model.rules),
    ruleBindings: { agents: model.agents.map((agent, index) => ({ key: agent.key, sourceAgentId: agent.sourceAgentId, sourceOrdinal: index + 1, role: agent.role })),
      relations: model.relationships.map(item => ({ key: item.key, sourceEdgeId: item.sourceEdgeId, fromPersonKey: item.fromPersonKey, toPersonKey: item.toPersonKey })),
      resources: source.realityProfileSnapshot.profile.worldInputs.resources.map((item, index) => ({ key: `resource-${index + 1}`, profileResourceKey: item.key })) },
    baseNegativeReduction: 0.05, symbolicAdditionalReduction, negativeReduction: 0.05 + symbolicAdditionalReduction, reductionCap: 0.1,
    symbolicStatus: frame ? "active" : "off", symbolicInputs,
    symbolicSource: frame && "version" in lens && lens.provenance ? { sourceVersion: frame.sourceVersion, snapshotId: lens.provenance.snapshotId,
      preferenceRevision: lens.preferenceRevision, frameVersion: frame.version, ruleVersion: frame.ruleVersion, calculationVersion: frame.calculation.calculationVersion } : null,
    classification: "hypothesis", realWorldEvidence: false, scientificProbability: false,
  });
}

export function parseRelationshipResponse(input: unknown): FrozenRelationshipResponse {
  const frame = frozenRelationshipResponseSchema.parse(input);
  const symbolic = frame.authorization.symbolicSensitivity.enabled;
  const additional = frame.symbolicInputs && frame.symbolicInputs.responsibilityCount > frame.symbolicInputs.peerCount ? 0.05 : 0;
  if (frame.symbolicStatus !== (symbolic ? "active" : "off") || (symbolic ? !frame.symbolicInputs || !frame.symbolicSource : frame.symbolicInputs !== null || frame.symbolicSource !== null)
    || frame.symbolicAdditionalReduction !== additional || frame.negativeReduction !== 0.05 + additional) throw new Error("invalid_frozen_planning");
  return frame;
}

export function createRelationshipAssumption(frame: FrozenRelationshipResponse): AssumptionInputV2 {
  return { statement: `本人明确授权的关系回应假设：在已确认的条件回应发生后，首次本人资源候选在负向模拟信号下缩减百分之五，独立人生气候假设最多再缩减百分之五；正向和中性不缩减。`,
    subjectType: "self", category: RELATIONSHIP_ASSUMPTION_CATEGORY, epistemicStatus: "confirmed_for_simulation", impactLevel: "low",
    supportingRealEvidenceIds: [], contradictingRealEvidenceIds: [], confirmationRequirement: "required", confirmationStatus: "confirmed",
    parameterRange: { min: 0, max: 10, defaultValue: frame.negativeReduction * 100, unit: "percent reduction" },
    limitations: ["仅作用于本人明确授权的模拟候选，不代表第三人的心理、现实行为或科学概率。", "条件回应来自本次运行受控模拟事件，不是现实证据。", "仅首次实际选中投入消费此假设；不与首轮假设叠加。"] };
}

export type RelationshipTrigger = { request: WorldEventV2; response: WorldEventV2; responseTickIndex: number; signal: "negative" | "neutral" | "positive" };

/** Exact accepted rule + source + sample mapping. A suffix, pending proposal or Graph label is never proof. */
export function resolveRelationshipTrigger(frame: FrozenRelationshipResponse, world: WorldStateV2, namespace: string, worldNamespace: string, occurredAt: string, simulationStartAt: string, maxTicks: number): RelationshipTrigger | null {
  const { requestRule, responseRule } = frame.authorization;
  if (requestRule.operation.actionType !== "request_information" || responseRule.operation.actionType !== "update_relation_signal") return null;
  const ids = createStableAgentWorldIdFactoryV2(worldNamespace);
  const selfId = ids("agent_definition", frame.selfSourceAgentId);
  const selfEntity = ids("world_entity", frame.selfSourceAgentId) as WorldEntityIdV2;
  const npcId = ids("agent_definition", frame.npcSourceAgentId);
  const npcEntity = ids("world_entity", frame.npcSourceAgentId) as WorldEntityIdV2;
  const relationId = ids("world_relation", frame.sourceEdgeId);
  const relation = world.relations.find(item => item.id === relationId);
  const npc = world.agentDefinitions.find(item => item.id === npcId && (item.actorType === "third_party" || item.actorType === "organization"));
  if (!relation || !npc || !world.agentDefinitions.some(item => item.id === selfId && item.actorType === "self")
    || ![relation.fromEntityId, relation.toEntityId].includes(selfEntity) || ![relation.fromEntityId, relation.toEntityId].includes(npcEntity)) return null;
  const evidence = world.realityBoundarySnapshot.evidenceLedger.items.find(item => item.claimKey === `formal.agent.${frame.npcSourceOrdinal}`);
  if (!evidence || !npc.realEvidenceIds.includes(evidence.id) || !evidence.provenance.some(item => item.sourceRef === `agent_snapshot:${JSON.parse(frame.effectiveRulesSignature).agentSnapshotId}:${frame.npcSourceAgentId}`)) return null;
  const rules = digitalLifeRulesSchema.parse(JSON.parse(frame.effectiveRulesSignature));
  const find = (key: string) => world.worldEvents.find(event => {
    const prefix = `action_proposal_v2_${namespace}_`;
    if (!event.proposalId.startsWith(prefix)) return false;
    const suffix = event.proposalId.slice(prefix.length);
    const match = /^(\d+)_(rule-[1-9]\d*)$/.exec(suffix);
    return !!match && match[2] === key && Number(match[1]) >= 0 && Number(match[1]) <= 5;
  });
  const request = find(requestRule.key), response = find(responseRule.key);
  if (!request || !response) return null;
  const checked = new Set<string>();
  const visiting = new Set<string>();
  const validateRuleEvent = (rule: typeof requestRule, event: WorldEventV2): boolean => {
    if (checked.has(rule.key)) return true;
    if (visiting.has(rule.key) || rule.pathKey !== frame.authorization.pathKey) return false;
    visiting.add(rule.key);
    const sourceActor = frame.ruleBindings.agents.find(item => item.key === rule.actorKey);
    if (!sourceActor) return false;
    const actorId = ids("agent_definition", sourceActor.sourceAgentId);
    const actorEntity = ids("world_entity", sourceActor.sourceAgentId);
    const actor = world.agentDefinitions.find(item => item.id === actorId);
    const actorEvidence = world.realityBoundarySnapshot.evidenceLedger.items.find(item => item.claimKey === `formal.agent.${sourceActor.sourceOrdinal}`);
    const tick = Number(event.proposalId.slice(`action_proposal_v2_${namespace}_`.length).split("_")[0]);
    const expectedTime = Date.parse(simulationStartAt) + tick * (maxTicks === 3 ? 10 : 15) * 86_400_000;
    if (!actor || !actorEvidence || !actor.realEvidenceIds.includes(actorEvidence.id)
      || !actorEvidence.provenance.some(item => item.sourceRef === `agent_snapshot:${rules.agentSnapshotId}:${sourceActor.sourceAgentId}` && Date.parse(item.capturedAt) === Date.parse(world.realityBoundarySnapshot.updatedAt))
      || canonical(event.causalRealEvidenceIds) !== canonical([actorEvidence.id]) || event.actorId !== actorId || tick >= maxTicks
      || Date.parse(event.createdAt) !== expectedTime || Date.parse(event.commandCreatedAt) !== expectedTime) return false;
    const assumption = world.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.category === `digital_life_rule_${rule.key}`);
    if (event.seedContextId !== world.seedContextId || !world.worldEventIds.includes(event.id) || !world.appliedTransitionCommandIds.includes(event.commandId)
      || event.evidenceClass !== "world_transition_simulation_evidence" || event.engineVersion !== world.engineVersion || event.afterRevision !== event.beforeRevision + 1
      || event.afterRevision > world.revision || !assumption || event.causalAssumptionIds.length !== 1 || event.causalAssumptionIds[0] !== assumption.id
      || assumption.subjectType !== (rule.operation.actionType === "update_external_variable" ? "external_variable" : sourceActor.role === "npc" || sourceActor.role === "group" ? "third_party" : "self") || assumption.confirmationStatus !== "confirmed"
      || assumption.epistemicStatus !== "confirmed_for_simulation" || assumption.confirmationRequirement !== "required" || assumption.impactLevel !== "high"
      || assumption.statement !== `用户确认的条件模拟规则：${rule.operation.actionType}。依据：${rule.evidenceSummary}` || assumption.parameterRange !== undefined
      || assumption.contradictingRealEvidenceIds.length !== 0
      || assumption.supportingRealEvidenceIds.some(id => world.realityBoundarySnapshot.evidenceLedger.items.find(item => item.id === id)?.claimKey !== `formal.outcome.correction.${rule.key}`)) return false;
    let targetEntities = [actorEntity], targetRelations: string[] = [], targetResources: string[] = [], targetVariables: string[] = [];
    let operation: unknown;
    if (rule.operation.actionType === "request_information") {
      const target = frame.ruleBindings.agents.find(item => item.key === (rule.operation.actionType === "request_information" ? rule.operation.targetPersonKey : ""));
      if (!target) return false;
      const targetEntityId = ids("world_entity", target.sourceAgentId);
      targetEntities = [actorEntity, targetEntityId];
      operation = { actionType: "request_information", targetEntityId, question: rule.operation.question };
    } else if (rule.operation.actionType === "update_relation_signal") {
      const sourceRelation = frame.ruleBindings.relations.find(item => item.key === (rule.operation.actionType === "update_relation_signal" ? rule.operation.relationKey : ""));
      const actual = sourceRelation && world.relations.find(item => item.id === ids("world_relation", sourceRelation.sourceEdgeId));
      if (!actual) return false;
      targetEntities = [actual.fromEntityId, actual.toEntityId]; targetRelations = [actual.id];
      operation = { actionType: "update_relation_signal", relationId: actual.id, signal: rule.operation.signal };
    } else if (rule.operation.actionType === "allocate_resource") {
      const sourceResource = frame.ruleBindings.resources.find(item => item.key === (rule.operation.actionType === "allocate_resource" ? rule.operation.resourceKey : ""));
      if (!sourceResource) return false;
      const resourceId = ids("world_resource", sourceResource.profileResourceKey);
      targetResources = [resourceId]; operation = { actionType: "allocate_resource", resourceId, amount: rule.operation.amount };
    } else if (rule.operation.actionType === "update_external_variable") {
      const variableKey = rule.operation.variableKey;
      const profileKey = `${variableKey.startsWith("pressure-") ? "pressures" : "externalVariables"}.${variableKey.split("-").at(-1)}`;
      const variableId = ids("world_variable", profileKey);
      const variable = world.externalVariables.find(item => item.id === variableId && item.key === variableKey);
      if (!variable || variable.variableType !== "enum" || !variable.allowedValues.includes(rule.operation.value)) return false;
      targetVariables = [variableId]; operation = { actionType: "update_external_variable", variableId, value: rule.operation.value };
    } else operation = { actionType: "update_commitment", commitmentId: `digital_life_${rule.actorKey}_${rule.operation.commitmentKey}`, label: rule.operation.label, status: rule.operation.status };
    if (event.eventType !== rule.operation.actionType || canonical(event.operation) !== canonical(operation)
      || canonical(event.targetEntityIds) !== canonical(targetEntities) || canonical(event.targetResourceIds) !== canonical(targetResources)
      || canonical(event.targetRelationIds) !== canonical(targetRelations) || canonical(event.targetVariableIds) !== canonical(targetVariables)) return false;
    if (rule.when.kind === "at_tick") {
      if (tick !== rule.when.tickIndex || event.priorWorldEventIds.length) return false;
    } else {
      const previousRule = rules.actions.find(item => item.key === (rule.when.kind === "after_rule" ? rule.when.ruleKey : ""));
      const previous = previousRule && find(previousRule.key);
      if (!previousRule || !previous || !validateRuleEvent(previousRule, previous) || canonical(event.priorWorldEventIds) !== canonical([previous.id])
        || previous.afterRevision > event.beforeRevision || Date.parse(previous.createdAt) >= Date.parse(event.createdAt)
        || world.worldEvents.indexOf(previous) >= world.worldEvents.indexOf(event)) return false;
    }
    visiting.delete(rule.key); checked.add(rule.key); return true;
  };
  if (!validateRuleEvent(requestRule, request) || !validateRuleEvent(responseRule, response)) return null;
  const requestTickIndex = Number(request.proposalId.slice(`action_proposal_v2_${namespace}_`.length).split("_")[0]);
  const responseTickIndex = Number(response.proposalId.slice(`action_proposal_v2_${namespace}_`.length).split("_")[0]);
  if (requestRule.when.kind === "at_tick" && requestTickIndex !== requestRule.when.tickIndex) return null;
  if (request.actorId !== selfId || request.eventType !== "request_information" || request.operation.actionType !== "request_information"
    || request.operation.targetEntityId !== npcEntity || request.operation.question !== requestRule.operation.question
    || canonical(request.targetEntityIds) !== canonical([selfEntity, npcEntity]) || request.targetResourceIds.length || request.targetRelationIds.length || request.targetVariableIds.length
    || response.actorId !== npcId || response.eventType !== "update_relation_signal" || response.operation.actionType !== "update_relation_signal"
    || response.operation.relationId !== relationId || response.operation.signal !== responseRule.operation.signal
    || canonical(response.targetEntityIds) !== canonical([relation.fromEntityId, relation.toEntityId]) || canonical(response.targetRelationIds) !== canonical([relationId])
    || response.targetResourceIds.length || response.targetVariableIds.length || canonical(response.priorWorldEventIds) !== canonical([request.id])
    || request.afterRevision > response.beforeRevision || world.worldEvents.indexOf(request) >= world.worldEvents.indexOf(response)
    || requestTickIndex >= responseTickIndex || Date.parse(request.createdAt) >= Date.parse(response.createdAt) || Date.parse(response.createdAt) >= Date.parse(occurredAt)) return null;
  const expectedSignal = responseRule.operation.signal;
  if (canonical(response.causalRealEvidenceIds) !== canonical([evidence.id])
    || !response.deltas.some(delta => delta.valueType === "relation" && delta.path === `relations.${relationId}.signal` && delta.after === expectedSignal)) return null;
  return { request, response, responseTickIndex, signal: response.operation.signal };
}
