import { z } from "zod";

import { validateWorldV2 } from "../agent-world/validation";
import type { WorldEventV2, WorldStateV2 } from "../agent-world/types";
import { addTrajectoryDaysV2, parseTrajectoryInstantV2 } from "../trajectory/time";
import {
  SEEDED_RNG_ALGORITHM_V2,
  SEEDED_RNG_VERSION_V2,
  TRAJECTORY_ENGINE_VERSION_V2,
  type TrajectoryResultV2,
} from "../trajectory/types";
import { canonicalJsonV2 } from "./ids";
import { buildChildTrajectoryRunSpecV2 } from "./child-run-spec";
import { parseBatchRunSpecV2 } from "./validation";

const uint32 = z.number().finite().int().min(0).max(0xffff_ffff);
const nonNegativeInteger = z.number().finite().int().nonnegative();
const namespaced = (prefix: string) => z.string().regex(new RegExp(`^${prefix}[a-z0-9][a-z0-9_-]*$`));

const rngAuditSchema = z.object({
  algorithm: z.literal(SEEDED_RNG_ALGORITHM_V2),
  version: z.literal(SEEDED_RNG_VERSION_V2),
  seed: uint32,
  drawIndex: nonNegativeInteger,
  rawValue: uint32,
  selectedIndex: nonNegativeInteger,
}).strict();

const stepSchema = z.object({
  tickIndex: nonNegativeInteger,
  occurredAt: z.string(),
  selectedCandidateIndex: nonNegativeInteger.optional(),
  rngAudit: rngAuditSchema.optional(),
  proposalId: namespaced("action_proposal_v2_").optional(),
  commandId: namespaced("transition_command_v2_").optional(),
  worldEventId: namespaced("world_event_v2_").optional(),
  beforeRevision: nonNegativeInteger,
  afterRevision: nonNegativeInteger,
  termination: z.object({ reason: z.literal("no_actions") }).strict().optional(),
  error: z.object({ code: z.string().min(1) }).strict().optional(),
}).strict();

const trajectorySchema = z.object({
  trajectoryId: namespaced("trajectory_v2_"),
  runSpecId: namespaced("trajectory_run_spec_v2_"),
  seedContextId: z.string().min(1),
  trajectorySeed: uint32,
  trajectoryEngineVersion: z.literal(TRAJECTORY_ENGINE_VERSION_V2),
  agentWorldEngineVersion: z.literal("agent-world-engine-v2-stage-3"),
  policyId: z.string().min(1),
  policyVersion: z.string().min(1),
  horizonDays: z.union([z.literal(30), z.literal(90)]),
  startedAt: z.string(),
  completedAt: z.string(),
  status: z.enum(["completed", "no_actions"]),
  initialWorldId: namespaced("world_v2_"),
  initialWorldRevision: nonNegativeInteger,
  finalWorld: z.unknown(),
  steps: z.array(stepSchema).min(1).max(100),
}).strict();

const contextSchema = z.object({
  seedContextId: z.string().min(1),
  trajectorySeed: uint32,
  policyId: z.string().min(1),
  policyVersion: z.string().min(1),
  trajectoryEngineVersion: z.literal(TRAJECTORY_ENGINE_VERSION_V2),
  batchRunSpec: z.unknown(),
}).strict();

function failure(path: string, message: string) {
  return { ok: false as const, errorCode: "invalid_feature_input" as const, issues: [`${path}: ${message}`] };
}

function same(valueA: unknown, valueB: unknown) {
  return canonicalJsonV2(valueA) === canonicalJsonV2(valueB);
}

function prefixMatches<T>(prefix: T[], full: T[]) {
  return full.length >= prefix.length && prefix.every((item, index) => same(item, full[index]));
}

export function parseTrajectoryResultForFeatureV2(
  initialWorldInput: unknown,
  trajectoryInput: unknown,
  contextInput: unknown,
) {
  const initialValidation = validateWorldV2(initialWorldInput);
  if (!initialValidation.ok) return failure("initialWorld", "invalid World");
  const parsed = trajectorySchema.safeParse(trajectoryInput);
  if (!parsed.success) return failure(parsed.error.issues[0]?.path.join(".") ?? "trajectory", parsed.error.issues[0]?.message ?? "invalid trajectory");
  const context = contextSchema.safeParse(contextInput);
  if (!context.success) return failure(context.error.issues[0]?.path.join(".") ?? "context", context.error.issues[0]?.message ?? "invalid context");
  const batch = parseBatchRunSpecV2(context.data.batchRunSpec);
  if (!batch.ok) return failure("context.batchRunSpec", "invalid Batch Run Spec");
  if (!batch.value.trajectorySeeds.includes(context.data.trajectorySeed)) return failure("context.trajectorySeed", "seed is not part of Batch Run Spec");
  const childSpec = buildChildTrajectoryRunSpecV2(batch.value, context.data.trajectorySeed);
  const initialWorld = structuredClone(initialWorldInput as WorldStateV2);
  const trajectory = structuredClone(parsed.data as TrajectoryResultV2);
  const finalValidation = validateWorldV2(trajectory.finalWorld);
  if (!finalValidation.ok) return failure("trajectory.finalWorld", "invalid World");
  const finalWorld = trajectory.finalWorld;

  if (
    trajectory.trajectoryId !== childSpec.trajectoryId
  ) return failure("trajectory.trajectoryId", "does not match child Run Spec");
  if (
    trajectory.runSpecId !== childSpec.runSpecId
  ) return failure("trajectory.runSpecId", "does not match child Run Spec");
  if (
    trajectory.horizonDays !== childSpec.horizonDays
  ) return failure("trajectory.horizonDays", "does not match child Run Spec");
  if (
    trajectory.startedAt !== childSpec.startAt
  ) return failure("trajectory.startedAt", "does not match child Run Spec");
  if (
    trajectory.seedContextId !== context.data.seedContextId ||
    trajectory.trajectorySeed !== context.data.trajectorySeed ||
    trajectory.policyId !== context.data.policyId ||
    trajectory.policyVersion !== context.data.policyVersion ||
    trajectory.trajectoryEngineVersion !== context.data.trajectoryEngineVersion
  ) return failure("trajectory", "ownership or version mismatch");
  if (
    context.data.seedContextId !== batch.value.seedContextId ||
    context.data.policyId !== batch.value.policyId ||
    context.data.policyVersion !== batch.value.policyVersion ||
    context.data.trajectoryEngineVersion !== batch.value.trajectoryEngineVersion ||
    trajectory.trajectorySeed !== childSpec.trajectorySeed ||
    trajectory.policyId !== childSpec.policyId ||
    trajectory.policyVersion !== childSpec.policyVersion ||
    trajectory.trajectoryEngineVersion !== childSpec.trajectoryEngineVersion
  ) return failure("trajectory", "does not match child Run Spec ownership or versions");
  if (!same(initialWorld, childSpec.initialWorld)) return failure("initialWorld", "does not match child Run Spec initial World");
  if (
    trajectory.initialWorldId !== initialWorld.id ||
    trajectory.initialWorldRevision !== initialWorld.revision ||
    trajectory.seedContextId !== initialWorld.seedContextId ||
    finalWorld.id !== initialWorld.id ||
    finalWorld.seedContextId !== initialWorld.seedContextId ||
    trajectory.agentWorldEngineVersion !== initialWorld.engineVersion ||
    finalWorld.engineVersion !== initialWorld.engineVersion ||
    finalWorld.realityBoundaryRevisionSnapshot !== initialWorld.realityBoundaryRevisionSnapshot ||
    !same(finalWorld.realityBoundarySnapshot, initialWorld.realityBoundarySnapshot) ||
    !same(finalWorld.realityBoundarySnapshot.evidenceLedger, initialWorld.realityBoundarySnapshot.evidenceLedger)
  ) return failure("trajectory.finalWorld", "initial World ownership or Reality Boundary changed");
  if (
    !prefixMatches(initialWorld.worldEvents, finalWorld.worldEvents) ||
    !prefixMatches(initialWorld.worldEventIds, finalWorld.worldEventIds) ||
    !prefixMatches(initialWorld.appliedTransitionCommandIds, finalWorld.appliedTransitionCommandIds)
  ) return failure("trajectory.finalWorld", "World history prefix mismatch");

  const started = parseTrajectoryInstantV2(trajectory.startedAt);
  const completed = parseTrajectoryInstantV2(trajectory.completedAt);
  if (!started.ok || !completed.ok || completed.value.epochMilliseconds < started.value.epochMilliseconds) return failure("trajectory.completedAt", "invalid or non-monotonic time");

  let expectedRevision = initialWorld.revision;
  let previousTime = started.value.epochMilliseconds;
  const actionSteps = [];
  for (let index = 0; index < trajectory.steps.length; index += 1) {
    const step = trajectory.steps[index]!;
    const occurred = parseTrajectoryInstantV2(step.occurredAt);
    const expectedTick = started.ok
      ? addTrajectoryDaysV2(started.value, index * childSpec.tickIntervalDays)
      : null;
    if (!expectedTick?.ok || step.occurredAt !== expectedTick.value.isoTimestamp) return failure(`trajectory.steps.${index}.occurredAt`, "does not match child Run Spec Tick schedule");
    if (!occurred.ok || occurred.value.epochMilliseconds < previousTime || occurred.value.epochMilliseconds > completed.value.epochMilliseconds) return failure(`trajectory.steps.${index}.occurredAt`, "invalid or non-monotonic time");
    if (index > 0 && occurred.value.epochMilliseconds <= previousTime) return failure(`trajectory.steps.${index}.occurredAt`, "step times must increase");
    previousTime = occurred.value.epochMilliseconds;
    if (step.tickIndex !== index || step.beforeRevision !== expectedRevision) return failure(`trajectory.steps.${index}`, "tick or revision chain mismatch");
    const isTermination = step.termination?.reason === "no_actions";
    if (isTermination) {
      if (
        trajectory.status !== "no_actions" || index !== trajectory.steps.length - 1 || step.afterRevision !== step.beforeRevision ||
        step.selectedCandidateIndex !== undefined || step.rngAudit !== undefined || step.proposalId !== undefined ||
        step.commandId !== undefined || step.worldEventId !== undefined || step.error !== undefined
      ) return failure(`trajectory.steps.${index}`, "invalid no_actions termination");
    } else {
      if (
        step.error !== undefined || step.termination !== undefined || step.afterRevision !== step.beforeRevision + 1 ||
        step.selectedCandidateIndex === undefined || !step.rngAudit || !step.proposalId || !step.commandId || !step.worldEventId ||
        step.rngAudit.seed !== trajectory.trajectorySeed || step.rngAudit.selectedIndex !== step.selectedCandidateIndex
      ) return failure(`trajectory.steps.${index}`, "invalid successful action step");
      actionSteps.push(step);
      expectedRevision = step.afterRevision;
    }
  }
  if (trajectory.status === "completed" && trajectory.steps.length !== childSpec.maxTicks) return failure("trajectory.steps", "completed trajectory must execute the complete child Run Spec schedule");
  if (trajectory.status === "no_actions" && (trajectory.steps.length < 1 || trajectory.steps.length > childSpec.maxTicks)) return failure("trajectory.steps", "no_actions termination is outside the child Run Spec schedule");
  if (trajectory.status === "completed" && trajectory.steps.some((step) => step.termination || step.error)) return failure("trajectory.status", "completed trajectory contains termination or error");
  if (trajectory.status === "no_actions" && trajectory.steps.filter((step) => step.termination).length !== 1) return failure("trajectory.status", "no_actions requires one final termination");
  if (completed.value.epochMilliseconds !== previousTime) return failure("trajectory.completedAt", "must equal final step time");

  const eventSuffix = finalWorld.worldEvents.slice(initialWorld.worldEvents.length);
  const eventIdSuffix = finalWorld.worldEventIds.slice(initialWorld.worldEventIds.length);
  const commandSuffix = finalWorld.appliedTransitionCommandIds.slice(initialWorld.appliedTransitionCommandIds.length);
  if (eventSuffix.length !== actionSteps.length || eventIdSuffix.length !== actionSteps.length || commandSuffix.length !== actionSteps.length || finalWorld.revision - initialWorld.revision !== actionSteps.length) return failure("trajectory.finalWorld", "transition suffix or revision delta mismatch");
  for (let index = 0; index < actionSteps.length; index += 1) {
    const step = actionSteps[index]!;
    const event = eventSuffix[index] as WorldEventV2;
    const eventTime = parseTrajectoryInstantV2(event.createdAt);
    const stepTime = parseTrajectoryInstantV2(step.occurredAt);
    if (
      event.id !== step.worldEventId || eventIdSuffix[index] !== step.worldEventId ||
      event.commandId !== step.commandId || commandSuffix[index] !== step.commandId ||
      event.proposalId !== step.proposalId || event.beforeRevision !== step.beforeRevision ||
      event.afterRevision !== step.afterRevision || !eventTime.ok || !stepTime.ok ||
      eventTime.value.epochMilliseconds !== stepTime.value.epochMilliseconds
    ) return failure(`trajectory.steps.${step.tickIndex}`, "step does not match World Event suffix");
  }
  return { ok: true as const, initialWorld, trajectory, events: eventSuffix };
}
