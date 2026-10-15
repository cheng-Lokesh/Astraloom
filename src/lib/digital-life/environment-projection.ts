import { z } from "zod";
import { digitalLifeModelSchema, digitalLifeProfileSnapshotSchema, listDigitalLifeEnvironmentVariables } from "./model";
import { safeEnvironmentConditionSchema } from "./environment-contracts";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import { validateWorldV2 } from "@/lib/v2/agent-world/validation";
import type { ActionParametersV2, WorldEntityIdV2, WorldRelationIdV2, WorldEventV2, WorldStateV2 } from "@/lib/v2/agent-world/types";

const canonical = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
};
const rawSchema = z.object({
  causalFingerprint: z.string().regex(/^[a-f0-9]{24}$/), policyFingerprint: z.string().regex(/^[a-f0-9]{24}$/).optional(),
  inputSnapshot: z.object({ digitalLifeModel: digitalLifeModelSchema, realityProfileSnapshot: digitalLifeProfileSnapshotSchema, activePathKey: z.string(), horizonDays: z.union([z.literal(30), z.literal(90)]), startedAt: z.string().datetime({ offset: true }) }).passthrough(),
  trajectoryAnalysis: z.object({ trajectories: z.array(z.object({ trajectoryId: z.string(), trajectorySeed: z.number().int(), finalWorld: z.unknown(), steps: z.array(z.object({ tickIndex: z.number().int(), termination: z.unknown().optional() }).passthrough()) }).passthrough()).length(3) }).passthrough(),
  worldSnapshots: z.array(z.unknown()).length(3), events: z.array(z.unknown()), sourceBoundary: z.unknown(),
}).passthrough();

/** Replay the frozen model-to-event binding; a scenario condition is never a Reality fact. */
export function projectEnvironmentConditions(raw: unknown) {
  const parsed = rawSchema.safeParse(raw);
  if (!parsed.success) return null;
  const bundle = parsed.data;
  const source = bundle.inputSnapshot;
  if (source.digitalLifeModel.version !== "digital-life-model-v2") return null;
  const worlds = bundle.worldSnapshots as WorldStateV2[];
  if (worlds.some(world => !validateWorldV2(world).ok)) return null;
  const trajectories = bundle.trajectoryAnalysis.trajectories;
  const expectedEvents = worlds.flatMap((world, index) => world.worldEvents.map((event, tickIndex) => ({ ...event, branchId: trajectories[index].trajectoryId, tickIndex })));
  if (canonical(expectedEvents) !== canonical(bundle.events)) return null;
  if (worlds.some((world, index) => canonical(world) !== canonical(trajectories[index].finalWorld) || canonical(world.realityBoundarySnapshot) !== canonical(bundle.sourceBoundary))) return null;
  const variables = listDigitalLifeEnvironmentVariables(source.realityProfileSnapshot.profile);
  const rules = source.digitalLifeModel.rules.actions.filter(rule => rule.pathKey === source.activePathKey);
  const idFactory = createStableAgentWorldIdFactoryV2(`formal-${bundle.policyFingerprint ?? bundle.causalFingerprint}`);
  const allEvents = expectedEvents;
  const keyFor = (event: WorldEventV2) => `step-${allEvents.findIndex(item => item.id === event.id) + 1}`;
  const interval = source.horizonDays === 30 ? 10 : 15;
  const conditions = rules.filter(rule => rule.operation.actionType === "update_external_variable");
  const matchedBySample: Array<Map<string, WorldEventV2>> = [];
  for (const [index, world] of worlds.entries()) {
    const matches = new Map<string, WorldEventV2>();
    const namespace = `formal_${bundle.policyFingerprint ?? bundle.causalFingerprint}_${trajectories[index].trajectorySeed}`;
    if (world.externalVariables.length !== variables.length) return null;
    for (const variable of variables) {
      const actual = world.externalVariables.find(item => item.key === variable.key);
      const rule = conditions.find(item => item.operation.actionType === "update_external_variable" && item.operation.variableKey === variable.key);
      const values = [variable.value, ...(rule?.operation.actionType === "update_external_variable" ? [rule.operation.value] : [])];
      if (!actual || actual.variableType !== "enum" || actual.id !== idFactory("world_variable", `${variable.category === "pressure" ? "pressures" : "externalVariables"}.${variable.key.split("-").at(-1)}`)
        || canonical(actual.allowedValues) !== canonical(values) || actual.provisional !== (variable.classification === "assumption")) return null;
      const rawKey = `${variable.category === "pressure" ? "pressures" : "externalVariables"}.${variable.key.split("-").at(-1)}`;
      const evidence = world.realityBoundarySnapshot.evidenceLedger.items.find(item => item.claimKey === `reality.profile.${rawKey.toLowerCase()}`);
      const assumption = world.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.category === `reality_profile_${rawKey}`);
      if (variable.classification === "fact" ? !evidence : !assumption) return null;
      if (variable.classification === "fact" && (evidence!.statement !== `${variable.label}：${variable.value}` || evidence!.sourceKind !== "user_statement" || evidence!.verificationStatus !== "user_confirmed"
        || !evidence!.provenance.some(item => item.sourceRef === `reality_profile:${source.realityProfileSnapshot.profileId}:revision:${source.realityProfileSnapshot.revision}:${rawKey}`))) return null;
      if (variable.classification === "assumption" && (assumption!.statement !== variable.value || assumption!.epistemicStatus !== "confirmed_for_simulation" || assumption!.confirmationStatus !== "confirmed")) return null;
      const provenance = { realEvidenceIds: variable.classification === "fact" ? [evidence!.id] : [], assumptionIds: variable.classification === "assumption" ? [assumption!.id] : [], provisional: variable.classification === "assumption", visible: true };
      if (canonical(actual.provenance) !== canonical(provenance)) return null;
    }
    for (const event of world.worldEvents) {
      const tick = (Date.parse(event.createdAt) - Date.parse(source.startedAt)) / (interval * 86_400_000);
      const rule = rules.find(item => event.proposalId === `action_proposal_v2_${namespace}_${tick}_${item.key}`);
      if (!rule) {
        // Independently authorized planner/rate events retain their existing validators.
        if (event.operation.actionType === "update_external_variable") return null;
        continue;
      }
      if (!Number.isInteger(tick) || tick < 0 || tick >= (source.horizonDays === 30 ? 3 : 6) || matches.has(rule.key)) return null;
      const agent = source.digitalLifeModel.agents.find(item => item.key === rule.actorKey);
      if (!agent || event.actorId !== idFactory("agent_definition", agent.sourceAgentId)) return null;
      if (rule.when.kind === "at_tick" ? rule.when.tickIndex !== tick : !matches.has(rule.when.ruleKey)) return null;
      if (rule.when.kind === "after_rule") {
        const previous = matches.get(rule.when.ruleKey)!;
        if (!event.priorWorldEventIds.includes(previous.id) || Date.parse(event.createdAt) <= Date.parse(previous.createdAt)) return null;
      }
      const assumption = world.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.category === `digital_life_rule_${rule.key}`);
      if (!assumption || assumption.confirmationStatus !== "confirmed" || assumption.epistemicStatus !== "confirmed_for_simulation" || assumption.statement !== `用户确认的条件模拟规则：${rule.operation.actionType}。依据：${rule.evidenceSummary}` || !event.causalAssumptionIds.includes(assumption.id)) return null;
      const operation = rule.operation;
      let expected: ActionParametersV2;
      if (operation.actionType === "update_external_variable") {
        const variable = world.externalVariables.find(item => item.key === operation.variableKey);
        if (!variable || assumption.subjectType !== "external_variable") return null;
        const initial = variables.find(item => item.key === operation.variableKey);
        if (!initial || event.deltas.length !== 1 || canonical(event.deltas[0]) !== canonical({ path: `externalVariables.${variable.id}.value`, valueType: "variable", before: initial.value, after: operation.value })) return null;
        const actorOrdinal = source.digitalLifeModel.agents.findIndex(item => item.key === rule.actorKey) + 1;
        const actorEvidence = world.realityBoundarySnapshot.evidenceLedger.items.find(item => item.claimKey === `formal.agent.${actorOrdinal}`);
        if (!actorEvidence || !actorEvidence.provenance.some(item => item.sourceRef === `agent_snapshot:${source.digitalLifeModel.agentSnapshotId}:${agent.sourceAgentId}`
          && Date.parse(item.capturedAt) === Date.parse(world.realityBoundarySnapshot.updatedAt))) return null;
        // Mirror the explicit-rule producer exactly. Baseline variable sources remain
        // in variable.provenance; the proposal itself names only actor evidence and this rule.
        const prior = rule.when.kind === "at_tick" ? [] : [matches.get(rule.when.ruleKey)!.id];
        if (canonical(event.targetEntityIds) !== canonical([idFactory("world_entity", agent.sourceAgentId)])
          || canonical(event.targetResourceIds) !== canonical([]) || canonical(event.targetRelationIds) !== canonical([])
          || canonical(event.targetVariableIds) !== canonical([variable.id])
          || canonical(event.causalRealEvidenceIds) !== canonical([actorEvidence.id])
          || canonical(event.causalAssumptionIds) !== canonical([assumption.id])
          || canonical(event.priorWorldEventIds) !== canonical(prior)
          || event.eventType !== operation.actionType || event.commandCreatedAt !== event.createdAt) return null;
        expected = { actionType: "update_external_variable", variableId: variable.id, value: operation.value };
      } else if (operation.actionType === "allocate_resource") {
        const resource = world.resources[Number(operation.resourceKey.split("-")[1]) - 1];
        if (!resource) return null;
        expected = { actionType: "allocate_resource", resourceId: resource.id, amount: operation.amount };
      } else if (operation.actionType === "update_commitment") {
        expected = { actionType: "update_commitment", commitmentId: `digital_life_${rule.actorKey}_${operation.commitmentKey}`, label: operation.label, status: operation.status };
      } else if (operation.actionType === "request_information") {
        const target = source.digitalLifeModel.agents.find(item => item.key === operation.targetPersonKey);
        if (!target) return null;
        expected = { actionType: "request_information", targetEntityId: idFactory("world_entity", target.sourceAgentId) as WorldEntityIdV2, question: operation.question };
      } else {
        const relation = source.digitalLifeModel.relationships.find(item => item.key === operation.relationKey);
        if (!relation) return null;
        expected = { actionType: "update_relation_signal", relationId: idFactory("world_relation", relation.sourceEdgeId) as WorldRelationIdV2, signal: operation.signal };
      }
      if (canonical(expected) !== canonical(event.operation)) return null;
      matches.set(rule.key, event);
    }
    for (const variable of variables) {
      const actual = world.externalVariables.find(item => item.key === variable.key)!;
      const rule = conditions.find(item => item.operation.actionType === "update_external_variable" && item.operation.variableKey === variable.key);
      const selected = rule ? matches.get(rule.key) : undefined;
      if (actual.value !== (selected && rule?.operation.actionType === "update_external_variable" ? rule.operation.value : variable.value)) return null;
    }
    matchedBySample.push(matches);
  }
  const projected = conditions.map((rule, index) => {
    if (rule.operation.actionType !== "update_external_variable") throw new Error("invalid_environment_rule");
    const operation = rule.operation;
    const variable = variables.find(item => item.key === operation.variableKey)!;
    const descendants = new Set<string>([rule.key]);
    for (const item of rules) if (item.when.kind === "after_rule" && descendants.has(item.when.ruleKey)) descendants.add(item.key);
    return {
      key: `environment-condition-${index + 1}`, ruleKey: rule.key, pathKey: rule.pathKey, variableKey: operation.variableKey,
      label: variable.label, initialValue: variable.value, initialClassification: variable.classification,
      proposedValue: operation.value, boundary: "confirmed_simulation_assumption" as const,
      samples: worlds.map((_, sampleIndex) => {
        const matches = matchedBySample[sampleIndex];
        const event = matches.get(rule.key);
        const reached = rule.when.kind === "at_tick" ? trajectories[sampleIndex].steps.some(item => item.tickIndex === (rule.when.kind === "at_tick" ? rule.when.tickIndex : -1)) : true;
        const triggered = rule.when.kind === "at_tick" || matches.has(rule.when.ruleKey);
        return { key: `sample-${sampleIndex + 1}`, state: event ? "selected" : !reached ? "not_reached" : !triggered ? "not_triggered" : "not_selected", stepKey: event ? keyFor(event) : null, actualValue: event ? operation.value : null,
          successorStepKeys: event ? [...matches].filter(([key]) => key !== rule.key && descendants.has(key)).map(([, next]) => keyFor(next)) : [] };
      }),
    };
  });
  const result = z.array(safeEnvironmentConditionSchema).max(1).safeParse(projected);
  return result.success ? result.data : null;
}
