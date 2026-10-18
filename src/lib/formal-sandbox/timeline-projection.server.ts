import { z } from "zod";
import { buildDigitalLifeModel, digitalLifeModelSchema, listDigitalLifeEnvironmentVariables } from "@/lib/digital-life/model";
import { frozenDefaultPlanningEnvelopeSchema } from "@/lib/formal-planning/contracts";
import { bindPlanningWorld } from "@/lib/formal-planning/world-binding";
import { approveActionProposalV2 } from "@/lib/v2/agent-world/action-proposal";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import { applyWorldTransitionV2 } from "@/lib/v2/agent-world/world-transition";
import type { WorldEventV2, WorldStateV2 } from "@/lib/v2/agent-world/types";
import { parseBatchRunSpecV2 } from "@/lib/v2/trajectory-analysis/validation";
import { parseTrajectoryResultForFeatureV2 } from "@/lib/v2/trajectory-analysis/trajectory-result-validation";
import type { BatchAnalysisV2 } from "@/lib/v2/trajectory-analysis/types";
import { createSeededRngV2, selectSeededIndexV2 } from "@/lib/v2/trajectory/seeded-rng";
import { buildFormalSandboxInitialWorld, initialWorldSourceSchema } from "./initial-world";
import { proposeSandboxCandidates, type CandidatePipelineContext } from "./candidate-pipeline";
import { safeSimulationTimelineSchema, type SafeSimulationTimeline } from "./timeline-contracts";

type Links = { readonly participantKeys: readonly string[]; readonly relationshipKeys: readonly string[] };
export type TimelineProjectionReferences = {
  eventKeys: Map<string, string>; eventLinks: Map<string, Links>;
  claimKeys: Map<string, string[]>; factKeys: Map<string, string>; assumptionKeys: Map<string, string>;
  relationLabels: Map<string, string>;
};
const same = (left: unknown, right: unknown): boolean => {
  const canonical = (value: unknown): string => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}` : JSON.stringify(value);
  return canonical(JSON.parse(JSON.stringify(left))) === canonical(JSON.parse(JSON.stringify(right)));
};
const frameSchema = z.object({
  causalFingerprint: z.string().regex(/^[a-f0-9]{24}$/), policyFingerprint: z.string().regex(/^[a-f0-9]{24}$/).optional(),
  inputSnapshot: initialWorldSourceSchema.extend({ digitalLifeModel: digitalLifeModelSchema, activePathKey: z.string() }),
  sourceBoundary: z.object({ updatedAt: z.string().datetime({ offset: true }) }).passthrough(),
  defaultPlanningSnapshot: frozenDefaultPlanningEnvelopeSchema.optional(),
  worldSnapshots: z.array(z.unknown()).length(3), events: z.array(z.unknown()),
  trajectoryAnalysis: z.object({ spec: z.unknown(), trajectories: z.array(z.unknown()).length(3) }).passthrough(),
}).passthrough();

function projectChanges(event: WorldEventV2, before: WorldStateV2, refs: TimelineProjectionReferences, variableLabels: Map<string, string>) {
  const changes: Array<{ kind: "resource" | "relationship" | "environment" | "commitment" | "information_request"; label: string; before: string | number | null; after: string | number | null; unit: string | null }> = [];
  for (const delta of event.deltas) {
    if (delta.valueType === "resource") {
      const resource = before.resources.find(item => delta.path === `resources.${item.id}.available`);
      if (!resource) throw new Error("unbound_resource_delta");
      changes.push({ kind: "resource", label: resource.label, before: delta.before, after: delta.after, unit: resource.unit });
    } else if (delta.valueType === "relation") {
      const relation = before.relations.find(item => delta.path === `relations.${item.id}.signal`);
      const label = relation ? refs.relationLabels.get(relation.id) : undefined;
      if (!label) throw new Error("unbound_relation_delta");
      changes.push({ kind: "relationship", label, before: delta.before, after: delta.after, unit: null });
    } else if (delta.valueType === "variable") {
      const variable = before.externalVariables.find(item => delta.path === `externalVariables.${item.id}.value`);
      const label = variable ? variableLabels.get(variable.key) : undefined;
      if (!label) throw new Error("unbound_variable_delta");
      changes.push({ kind: "environment", label, before: delta.before, after: delta.after, unit: variable?.variableType === "number" ? variable.unit : null });
    } else if (event.operation.actionType === "update_commitment") {
      const operation = event.operation;
      const previous = delta.before.commitments.find(item => item.id === operation.commitmentId);
      const next = delta.after.commitments.find(item => item.id === operation.commitmentId);
      if (!next || next.label !== operation.label) throw new Error("unbound_commitment_delta");
      changes.push({ kind: "commitment", label: next.label, before: previous?.status ?? null, after: next.status, unit: null });
    } else if (event.operation.actionType === "request_information") {
      changes.push({ kind: "information_request", label: event.operation.question, before: delta.before.observableStatus, after: delta.after.observableStatus, unit: null });
    } else throw new Error("unsupported_timeline_delta");
  }
  return changes;
}

/** Even old bundles without a typed model must not turn damaged recorded analysis into a legacy fallback. */
export function validateRecordedTimelineAnalysis(raw: unknown): boolean {
  try {
    const parsed = z.object({ trajectoryAnalysis: z.object({ spec: z.unknown(), trajectories: z.array(z.unknown()).length(3) }).passthrough(), worldSnapshots: z.array(z.unknown()).length(3), events: z.array(z.unknown()) }).passthrough().safeParse(raw);
    if (!parsed.success) return false;
    const frame = parsed.data, analysis = frame.trajectoryAnalysis as BatchAnalysisV2;
    const spec = parseBatchRunSpecV2(analysis.spec);
    if (!spec.ok || spec.value.sampleCount !== 3 || spec.value.trajectorySeeds.length !== 3) return false;
    for (const [index, trajectory] of analysis.trajectories.entries()) {
      if (trajectory.trajectorySeed !== spec.value.trajectorySeeds[index] || !same(trajectory.finalWorld, frame.worldSnapshots[index])) return false;
      const valid = parseTrajectoryResultForFeatureV2(spec.value.trajectoryTemplate.initialWorld, trajectory, { seedContextId: spec.value.seedContextId, trajectorySeed: trajectory.trajectorySeed, policyId: spec.value.policyId, policyVersion: spec.value.policyVersion, trajectoryEngineVersion: spec.value.trajectoryEngineVersion, batchRunSpec: spec.value });
      if (!valid.ok) return false;
      const seen = new Set<string>();
      for (const step of trajectory.steps) if (step.worldEventId) {
        const event = trajectory.finalWorld.worldEvents.find(item => item.id === step.worldEventId);
        if (!event || seen.has(event.id) || event.priorWorldEventIds.some(id => !seen.has(id))) return false;
        seen.add(event.id);
      }
      if (seen.size !== trajectory.finalWorld.worldEvents.length) return false;
    }
    const flattened = analysis.trajectories.flatMap(trajectory => trajectory.finalWorld.worldEvents.map((event, tickIndex) => ({ ...event, branchId: trajectory.trajectoryId, tickIndex })));
    return same(flattened, frame.events) && new Set(flattened.map(event => event.id)).size === flattened.length;
  } catch { return false; }
}

/** Reads frozen steps and verifies their controlled transitions on clones; it never executes a new trajectory. */
export function projectFormalSandboxTimeline(raw: unknown, refs: TimelineProjectionReferences): SafeSimulationTimeline | null {
  try {
    const parsed = frameSchema.safeParse(raw);
    if (!parsed.success) return null;
    const frame = parsed.data, input = frame.inputSnapshot, model = input.digitalLifeModel;
    const analysis = frame.trajectoryAnalysis as BatchAnalysisV2;
    const spec = parseBatchRunSpecV2(analysis.spec);
    if (!spec.ok || spec.value.sampleCount !== 3 || spec.value.trajectorySeeds.length !== 3 || spec.value.trajectoryTemplate.maxTicks !== (input.horizonDays === 30 ? 3 : 6)
      || spec.value.horizonDays !== input.horizonDays || spec.value.trajectoryTemplate.startAt !== input.startedAt
      || spec.value.policyId !== "formal_account_sandbox_policy" || spec.value.policyVersion !== (model.version === "digital-life-model-v3" ? "digital-life-adapter-v3" : "digital-life-adapter-v1")) return null;
    const sourceModel = buildDigitalLifeModel(input, model.rules);
    if (!sourceModel.ok || !same(sourceModel.model, model) || input.safetyLevel === "blocked" || input.safetyLevel === "downgraded"
      || (input.activePathKey !== "main" && !model.rules.strategies.some(strategy => strategy.participantKey === input.activePathKey))) return null;
    const boundaryAt = frame.sourceBoundary.updatedAt;
    if (input.acceptedAt ? Date.parse(boundaryAt) < Date.parse(input.acceptedAt) || Date.parse(boundaryAt) >= Date.parse(input.startedAt) : boundaryAt !== new Date(Date.parse(input.startedAt) - 2).toISOString()) return null;
    const namespace = frame.policyFingerprint ?? frame.causalFingerprint;
    const expected = buildFormalSandboxInitialWorld(input, model, input.activePathKey, namespace, boundaryAt, frame.defaultPlanningSnapshot);
    const initial = spec.value.trajectoryTemplate.initialWorld;
    if (!expected.worldResult.ok || !same(initial, expected.worldResult.world) || !same(frame.sourceBoundary, initial.realityBoundarySnapshot)) return null;
    const flattened = analysis.trajectories.flatMap(trajectory => trajectory.finalWorld.worldEvents.map((event, eventOrdinal) => ({ ...event, branchId: trajectory.trajectoryId, tickIndex: eventOrdinal })));
    // Top-level tickIndex is the persisted event-array ordinal, NOT the actual executed cycle.
    if (!same(flattened, frame.events) || new Set(flattened.map(event => event.id)).size !== flattened.length) return null;
    const binding = frame.defaultPlanningSnapshot ? bindPlanningWorld(frame.defaultPlanningSnapshot, initial, `formal-${namespace}`, input.activePathKey, input.startedAt) : undefined;
    const pipeline: CandidatePipelineContext = {
      rules: expected.activeRules, declaredResources: expected.worldInputs.resources,
      actorAgentId: expected.agentIds.get(expected.self.id)!, actorEntityId: expected.entityIds.get(expected.self.id)!, primaryEvidenceId: expected.primaryEvidenceId,
      assumptionByCategory: new Map(expected.assumptionLedger.assumptions.map(item => [item.category, item.id])),
      planning: frame.defaultPlanningSnapshot, planningWorldBinding: binding, pathKey: input.activePathKey,
      bindings: {
        agents: new Map(input.agents.map((item, index) => [`person-${index + 1}`, expected.agentIds.get(item.id)!])),
        entities: new Map(input.agents.map((item, index) => [`person-${index + 1}`, expected.entityIds.get(item.id)!])),
        relations: new Map(input.edges.map((item, index) => [`relation-${index + 1}`, expected.worldIds("world_relation", item.id) as WorldStateV2["relations"][number]["id"]])),
        resources: new Map(expected.worldInputs.resources.map((item, index) => [`resource-${index + 1}`, expected.resourceIdsByKey.get(item.key)!])),
        variables: new Map(expected.profileVariableSpecs.map(item => [item.key, item.id])),
        evidence: new Map(input.agents.map((_, index) => [`person-${index + 1}`, expected.evidenceIdFor(`formal.agent.${index + 1}`)])),
        assumptions: new Map(expected.activeRules.map(rule => [rule.key, expected.assumptionIdFor(`digital_life_rule_${rule.key}`)])),
      },
    };
    const variableLabels = new Map(listDigitalLifeEnvironmentVariables(input.realityProfileSnapshot.profile).map(item => [item.key, item.label]));
    const ruleKeyByAssumptionId = new Map(expected.activeRules.map(rule => [expected.assumptionIdFor(`digital_life_rule_${rule.key}`), rule.key]));
    const samples: SafeSimulationTimeline["samples"] = [];
    for (const [sampleIndex, trajectory] of analysis.trajectories.entries()) {
      if (trajectory.trajectorySeed !== spec.value.trajectorySeeds[sampleIndex]) return null;
      const valid = parseTrajectoryResultForFeatureV2(initial, trajectory, { seedContextId: spec.value.seedContextId, trajectorySeed: trajectory.trajectorySeed, policyId: spec.value.policyId, policyVersion: spec.value.policyVersion, trajectoryEngineVersion: spec.value.trajectoryEngineVersion, batchRunSpec: spec.value });
      if (!valid.ok || !same(trajectory.finalWorld, frame.worldSnapshots[sampleIndex])) return null;
      let world = structuredClone(initial);
      const rng = createSeededRngV2(trajectory.trajectorySeed), seen = new Map<string, string>();
      const ticks: SafeSimulationTimeline["samples"][number]["ticks"] = [];
      for (let tickIndex = 0; tickIndex < spec.value.trajectoryTemplate.maxTicks; tickIndex++) {
        const step = trajectory.steps[tickIndex];
        if (!step) { ticks.push({ tickIndex, occurredAt: null, status: "not_reached", event: null }); continue; }
        const before = world;
        const candidates = proposeSandboxCandidates(pipeline, { world, tickIndex: step.tickIndex, occurredAt: step.occurredAt, namespace: `formal_${namespace}_${trajectory.trajectorySeed}` }).candidates;
        if (!step.worldEventId) {
          if (!step.termination || candidates.length > 0) return null;
          ticks.push({ tickIndex: step.tickIndex, occurredAt: step.occurredAt, status: "no_actions", event: null }); continue;
        }
        const event = trajectory.finalWorld.worldEvents.find(item => item.id === step.worldEventId);
        if (!event || !candidates.length || event.priorWorldEventIds.some(id => !seen.has(id))) return null;
        const audit = selectSeededIndexV2(rng, candidates.length);
        if (!same(audit, step.rngAudit) || audit.selectedIndex !== step.selectedCandidateIndex) return null;
        const proposal = candidates[audit.selectedIndex];
        if (proposal.id !== event.proposalId) return null;
        const runtime = { clock: () => step.occurredAt, idFactory: createStableAgentWorldIdFactoryV2(`formal-${namespace}-${trajectory.trajectorySeed}`) };
        const approved = approveActionProposalV2(proposal, world, world.revision, runtime);
        if (!approved.ok) return null;
        const transitioned = applyWorldTransitionV2(world, approved.command, runtime);
        if (!transitioned.ok || !same(transitioned.event, event)) return null;
        world = transitioned.world;
        const stepKey = refs.eventKeys.get(event.id), links = refs.eventLinks.get(event.id);
        if (!stepKey || !links) return null;
        const kind = event.eventType === "update_commitment" ? "commitment" : event.eventType === "allocate_resource" ? "resource" : event.eventType === "update_relation_signal" ? "relationship_response" : event.eventType === "update_external_variable" ? "environment" : event.eventType === "request_information" ? "information_request" : null;
        if (!kind) return null;
        const factKeys = event.causalRealEvidenceIds.flatMap(id => refs.factKeys.has(id) ? [refs.factKeys.get(id)!] : []);
        const assumptionKeys = event.causalAssumptionIds.flatMap(id => refs.assumptionKeys.has(id) ? [refs.assumptionKeys.get(id)!] : []);
        const ruleKeys = event.causalAssumptionIds.flatMap(id => ruleKeyByAssumptionId.has(id) ? [ruleKeyByAssumptionId.get(id)!] : []);
        const changes = projectChanges(event, before, refs, variableLabels);
        const labels = { commitment: "本人承诺更新", resource: "资源投入", relationship_response: "条件关系回应", environment: "环境条件变化", information_request: "信息确认请求" };
        ticks.push({ tickIndex: step.tickIndex, occurredAt: step.occurredAt, status: "event", event: { stepKey, label: labels[kind], kind, participantKeys: [...links.participantKeys], relationshipKeys: [...links.relationshipKeys], changes,
          causes: { priorStepKeys: event.priorWorldEventIds.map(id => seen.get(id)!), factKeys, assumptionKeys, ruleKeys, unrecorded: factKeys.length !== event.causalRealEvidenceIds.length || event.causalAssumptionIds.some(id => !refs.assumptionKeys.has(id) && !ruleKeyByAssumptionId.has(id)) },
          claimKeys: refs.claimKeys.get(event.id) ?? [],
        } });
        seen.set(event.id, stepKey);
      }
      if (!same(world, trajectory.finalWorld) || seen.size !== trajectory.finalWorld.worldEvents.length) return null;
      samples.push({ key: `sample-${sampleIndex + 1}`, terminalStatus: trajectory.status as "completed" | "no_actions", ticks });
    }
    return safeSimulationTimelineSchema.safeParse({ version: "formal-simulation-timeline-v1", samples }).data ?? null;
  } catch { return null; }
}
