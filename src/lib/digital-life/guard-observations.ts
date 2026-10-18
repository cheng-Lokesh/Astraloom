import { z } from "zod";
import { buildDigitalLifeModel, digitalLifeModelSchema, listDigitalLifeEnvironmentVariables } from "./model";
import { guardObservationsSchema, type GuardObservations } from "./guard-observation-contracts";
export { guardObservationSchema, guardObservationsSchema, pathDiagnosticsSchema, type GuardObservations, type PathDiagnostics } from "./guard-observation-contracts";
import { describeWorldGuard, observeWorldGuard, ruleAssumptionStatement } from "./world-guards";
import { createStableAgentWorldIdFactoryV2 } from "@/lib/v2/agent-world/ids";
import { validateWorldV2 } from "@/lib/v2/agent-world/validation";
import { approveActionProposalV2 } from "@/lib/v2/agent-world/action-proposal";
import { applyWorldTransitionV2 } from "@/lib/v2/agent-world/world-transition";
import { parseTrajectoryResultForFeatureV2 } from "@/lib/v2/trajectory-analysis/trajectory-result-validation";
import type { DigitalLifeProposalBindings } from "@/lib/formal-sandbox/digital-life-proposals";
import { proposeSandboxCandidates } from "@/lib/formal-sandbox/candidate-pipeline";
import { bindPlanningWorld } from "@/lib/formal-planning/world-binding";
import { frozenDefaultPlanningEnvelopeSchema } from "@/lib/formal-planning/contracts";
import { createSeededRngV2, selectSeededIndexV2 } from "@/lib/v2/trajectory/seeded-rng";
import type { WorldStateV2 } from "@/lib/v2/agent-world/types";
import type { BatchAnalysisV2 } from "@/lib/v2/trajectory-analysis/types";
import { buildFormalSandboxInitialWorld, initialWorldSourceSchema } from "@/lib/formal-sandbox/initial-world";

const same = (a: unknown, b: unknown): boolean => {
  const canonical = (value: unknown): string => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value && typeof value === "object" ? `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${JSON.stringify(key)}:${canonical(value)}`).join(",")}}` : JSON.stringify(value);
  // Persisted Worlds follow JSON omission semantics for optional object fields.
  return canonical(JSON.parse(JSON.stringify(a))) === canonical(JSON.parse(JSON.stringify(b)));
};
const frameSchema = z.object({ causalFingerprint: z.string(), policyFingerprint: z.string().optional(), defaultPlanningSnapshot: frozenDefaultPlanningEnvelopeSchema.optional(), inputSnapshot: initialWorldSourceSchema.extend({ digitalLifeModel: digitalLifeModelSchema, activePathKey: z.string() }), sourceBoundary: z.object({ updatedAt: z.string().datetime({ offset: true }) }).passthrough(), trajectoryAnalysis: z.unknown(), worldSnapshots: z.array(z.unknown()).length(3), events: z.array(z.unknown()) }).passthrough();

/** Replays actual Core steps on a clone. No intermediate value is inferred from a terminal difference. */
export function projectGuardObservations(raw: unknown): GuardObservations | null {
  try {
    const parsed = frameSchema.safeParse(raw);
    if (!parsed.success || parsed.data.inputSnapshot.digitalLifeModel.version !== "digital-life-model-v3") return null;
    const frame = parsed.data, model = frame.inputSnapshot.digitalLifeModel, profile = frame.inputSnapshot.realityProfileSnapshot.profile;
    const analysis = frame.trajectoryAnalysis as BatchAnalysisV2;
    if (!analysis?.spec || analysis.spec.policyVersion !== "digital-life-adapter-v3" || analysis.trajectories.length !== 3) return null;
    const initial = analysis.spec.trajectoryTemplate.initialWorld;
    const sourceModel = buildDigitalLifeModel(frame.inputSnapshot, model.rules);
    if (!sourceModel.ok || !same(sourceModel.model, model)) return null;
    const boundaryAt = frame.sourceBoundary.updatedAt;
    if (frame.inputSnapshot.safetyLevel === "blocked" || frame.inputSnapshot.safetyLevel === "downgraded"
      || (frame.inputSnapshot.activePathKey !== "main" && !model.rules.strategies.some(strategy => strategy.participantKey === frame.inputSnapshot.activePathKey))
      || analysis.spec.trajectoryTemplate.startAt !== frame.inputSnapshot.startedAt
      || (frame.inputSnapshot.acceptedAt
        ? Date.parse(boundaryAt) < Date.parse(frame.inputSnapshot.acceptedAt) || Date.parse(boundaryAt) >= Date.parse(frame.inputSnapshot.startedAt)
        : boundaryAt !== new Date(Date.parse(frame.inputSnapshot.startedAt) - 2).toISOString())) return null;
    const expected = buildFormalSandboxInitialWorld(frame.inputSnapshot, model, frame.inputSnapshot.activePathKey, frame.policyFingerprint ?? frame.causalFingerprint, boundaryAt, frame.defaultPlanningSnapshot);
    if (!expected.worldResult.ok || !same(initial, expected.worldResult.world) || !same(frame.sourceBoundary, expected.worldResult.world.realityBoundarySnapshot)) return null;
    if (!validateWorldV2(initial).ok || initial.worldEvents.length !== 0 || initial.resources.length !== profile.worldInputs.resources.length) return null;
    const variables = listDigitalLifeEnvironmentVariables(profile);
    if (initial.externalVariables.length !== variables.length) return null;
    const context = { resources: profile.worldInputs.resources.map((item, index) => ({ ...item, key: `resource-${index + 1}` })), variables };
    const idFactory = createStableAgentWorldIdFactoryV2(`formal-${frame.policyFingerprint ?? frame.causalFingerprint}`);
    for (const [index, resource] of profile.worldInputs.resources.entries()) {
      const actual = initial.resources.find(item => item.id === idFactory("world_resource", resource.key));
      if (!actual || actual.available !== resource.available || actual.min !== resource.minimum || actual.max !== resource.maximum || actual.label !== resource.label || actual.unit !== resource.unit) return null;
      const expectedEvidence = initial.realityBoundarySnapshot.evidenceLedger.items.find(item => item.claimKey === `reality.profile.world_resource.${resource.key}`);
      const expectedAssumption = initial.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.category === `reality_profile_world_resource_${resource.key}`);
      const rateAssumption = initial.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.category === `reality_profile_world_rate_${resource.key}`);
      if (!same(actual.provenance.realEvidenceIds, resource.classification === "fact" ? [expectedEvidence?.id] : []) || !same(actual.provenance.assumptionIds, [...(resource.classification === "assumption" ? [expectedAssumption?.id] : []), ...(resource.usePerTick !== null ? [rateAssumption?.id] : [])]) || actual.id !== initial.resources[index]?.id) return null;
    }
    for (const variable of variables) {
      const actual = initial.externalVariables.find(item => item.key === variable.key);
      if (!actual || actual.variableType !== "enum" || actual.value !== variable.value || actual.id !== idFactory("world_variable", `${variable.category === "pressure" ? "pressures" : "externalVariables"}.${variable.key.split("-").at(-1)}`)) return null;
    }
    const activeRules = model.rules.actions.filter(rule => rule.pathKey === frame.inputSnapshot.activePathKey);
    for (const rule of activeRules) {
      const assumption = initial.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.category === `digital_life_rule_${rule.key}`);
      if (!assumption || assumption.statement !== ruleAssumptionStatement(rule, context)) return null;
    }
    const bindings: DigitalLifeProposalBindings = {
      agents: new Map(model.agents.map(agent => [agent.key, idFactory("agent_definition", agent.sourceAgentId) as WorldStateV2["agentDefinitions"][number]["id"]])),
      entities: new Map(model.agents.map(agent => [agent.key, idFactory("world_entity", agent.sourceAgentId) as WorldStateV2["entities"][number]["id"]])),
      relations: new Map(model.relationships.map(relation => [relation.key, idFactory("world_relation", relation.sourceEdgeId) as WorldStateV2["relations"][number]["id"]])),
      resources: new Map(profile.worldInputs.resources.map((resource, index) => [`resource-${index + 1}`, idFactory("world_resource", resource.key) as WorldStateV2["resources"][number]["id"]])),
      variables: new Map(initial.externalVariables.map(variable => [variable.key, variable.id])),
      evidence: new Map(model.agents.map(agent => [agent.key, initial.realityBoundarySnapshot.evidenceLedger.items.find(item => item.claimKey === `formal.agent.${Number(agent.key.slice(7))}`)!.id])),
      assumptions: new Map(activeRules.map(rule => [rule.key, initial.realityBoundarySnapshot.assumptionLedger.assumptions.find(item => item.category === `digital_life_rule_${rule.key}`)!.id])),
    };
    const flattened = analysis.trajectories.flatMap((trajectory, index) => trajectory.finalWorld.worldEvents.map((event, tickIndex) => ({ ...event, branchId: analysis.trajectories[index].trajectoryId, tickIndex })));
    if (!same(flattened, frame.events)) return null;
    const self = model.agents.find(agent => frame.inputSnapshot.activePathKey === "main" ? agent.role === "user_core" : agent.key === frame.inputSnapshot.activePathKey);
    if (!self) return null;
    const planningWorldBinding = frame.defaultPlanningSnapshot ? bindPlanningWorld(frame.defaultPlanningSnapshot, initial, `formal-${frame.policyFingerprint ?? frame.causalFingerprint}`, frame.inputSnapshot.activePathKey, analysis.spec.trajectoryTemplate.startAt) : undefined;
    const pipeline = { rules: activeRules, bindings, declaredResources: profile.worldInputs.resources, actorAgentId: bindings.agents.get(self.key)!, actorEntityId: bindings.entities.get(self.key)!, primaryEvidenceId: initial.realityBoundarySnapshot.evidenceLedger.items.find(item => item.claimKey === "formal.seed.summary")!.id, assumptionByCategory: new Map(initial.realityBoundarySnapshot.assumptionLedger.assumptions.map(item => [item.category, item.id])), planning: frame.defaultPlanningSnapshot, planningWorldBinding, pathKey: frame.inputSnapshot.activePathKey };
    const samples: GuardObservations["samples"] = [];
    for (const [index, trajectory] of analysis.trajectories.entries()) {
      const valid = parseTrajectoryResultForFeatureV2(initial, trajectory, { seedContextId: analysis.spec.seedContextId, trajectorySeed: trajectory.trajectorySeed, policyId: analysis.spec.policyId, policyVersion: analysis.spec.policyVersion, trajectoryEngineVersion: analysis.spec.trajectoryEngineVersion, batchRunSpec: analysis.spec });
      if (!valid.ok || !same(trajectory.finalWorld, frame.worldSnapshots[index])) return null;
      let world = structuredClone(initial);
      const replayRng = createSeededRngV2(trajectory.trajectorySeed);
      const namespace = `formal_${frame.policyFingerprint ?? frame.causalFingerprint}_${trajectory.trajectorySeed}`;
      const ticks: GuardObservations["samples"][number]["ticks"] = [];
      for (let tickIndex = 0; tickIndex < analysis.spec.trajectoryTemplate.maxTicks; tickIndex++) {
        const step = trajectory.steps[tickIndex];
        const before = world;
        const offeredCandidates = step ? proposeSandboxCandidates(pipeline, { world, tickIndex, occurredAt: step.occurredAt, namespace }).candidates : [];
        const event = step?.worldEventId ? trajectory.finalWorld.worldEvents.find(item => item.id === step.worldEventId) : undefined;
        if (event) {
          if (!offeredCandidates.length) return null;
          const audit = selectSeededIndexV2(replayRng, offeredCandidates.length);
          if (!same(audit, step.rngAudit) || audit.selectedIndex !== step.selectedCandidateIndex) return null;
          const proposal = offeredCandidates[audit.selectedIndex];
          if (proposal.id !== event.proposalId) return null;
          const runtime = { clock: () => step.occurredAt, idFactory: createStableAgentWorldIdFactoryV2(`formal-${frame.policyFingerprint ?? frame.causalFingerprint}-${trajectory.trajectorySeed}`) };
          const approved = approveActionProposalV2(proposal, world, world.revision, runtime);
          if (!approved.ok) return null;
          const transitioned = applyWorldTransitionV2(world, approved.command, runtime);
          if (!transitioned.ok || !same(transitioned.event, event) || step.beforeRevision !== world.revision || step.afterRevision !== transitioned.world.revision) return null;
          world = transitioned.world;
        } else if (step && (!step.termination || offeredCandidates.length > 0)) return null;
        const observations = activeRules.filter(rule => rule.guard).map(rule => {
          const guard = rule.guard!;
          const resource = guard.kind === "resource_balance" ? context.resources.find(item => item.key === guard.resourceKey) : undefined;
          const variable = guard.kind === "environment_equals" ? variables.find(item => item.key === guard.variableKey) : undefined;
          const already = before.worldEvents.some(item => item.proposalId.endsWith(`_${rule.key}`));
          const due = rule.when.kind === "at_tick" ? rule.when.tickIndex === tickIndex : before.worldEvents.some(item => item.proposalId.endsWith(`_${rule.when.kind === "after_rule" ? rule.when.ruleKey : ""}`));
          const observed = step ? observeWorldGuard(guard, before, bindings.agents.get(rule.actorKey)!, bindings.resources, bindings.variables) : null;
          const after = step ? observeWorldGuard(guard, world, bindings.agents.get(rule.actorKey)!, bindings.resources, bindings.variables) : null;
          const offered = offeredCandidates.some(candidate => candidate.id === `action_proposal_v2_${namespace}_${tickIndex}_${rule.key}`);
          const selected = offered && event?.proposalId === `action_proposal_v2_${namespace}_${tickIndex}_${rule.key}`;
          return { ruleKey: rule.key, tickIndex, label: resource?.label ?? variable!.label, unit: resource?.unit ?? null, conditionDescription: describeWorldGuard(guard, context), schedule: !step ? "not_reached" as const : already ? "already_selected" as const : due ? "due" as const : "not_due" as const, guard: step && due && !already ? observed?.satisfied ?? null : null,
            candidate: !step || !due || already || !observed?.satisfied ? null : selected ? "selected" as const : offered ? "not_selected" as const : "ineligible" as const,
            before: observed?.value ?? null, after: after?.value ?? null, stepKey: selected && event ? `step-${flattened.findIndex(item => item.id === event.id) + 1}` : null };
        });
        ticks.push({ tickIndex, occurredAt: step?.occurredAt ?? null, observations });
      }
      if (!same(world, trajectory.finalWorld)) return null;
      samples.push({ key: `sample-${index + 1}`, ticks });
    }
    return guardObservationsSchema.parse({ version: "digital-life-guard-observations-v1", samples });
  } catch { return null; }
}
