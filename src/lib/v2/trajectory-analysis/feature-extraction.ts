import type { WorldEventV2, WorldStateV2 } from "../agent-world/types";
import { validateWorldV2 } from "../agent-world/validation";
import type { TrajectoryResultV2 } from "../trajectory/types";
import { canonicalJsonV2, stableAnalysisFingerprintV2 } from "./ids";
import { ANALYSIS_ENGINE_VERSION_V2, FEATURE_SCHEMA_VERSION_V2, type TrajectoryFeatureV2 } from "./types";

const sortedUnique = <T extends string>(values: T[]) => [...new Set(values)].sort() as T[];
const trajectoryKeys = ["agentWorldEngineVersion", "completedAt", "finalWorld", "horizonDays", "initialWorldId", "initialWorldRevision", "policyId", "policyVersion", "runSpecId", "seedContextId", "startedAt", "status", "steps", "trajectoryEngineVersion", "trajectoryId", "trajectorySeed"].sort();

function exactKeys(value: object, expected: string[]) {
  return JSON.stringify(Object.keys(value).sort()) === JSON.stringify(expected);
}

export function extractTrajectoryFeatureV2(initialWorldInput: unknown, trajectoryInput: unknown) {
  try {
    const initialWorld = initialWorldInput as WorldStateV2;
    const trajectory = trajectoryInput as TrajectoryResultV2;
    if (!initialWorld || !trajectory || typeof initialWorld !== "object" || typeof trajectory !== "object" || !exactKeys(trajectory, trajectoryKeys) || !validateWorldV2(initialWorld).ok || !validateWorldV2(trajectory.finalWorld).ok) return { ok: false as const, errorCode: "invalid_feature_input" as const };
    if (trajectory.seedContextId !== initialWorld.seedContextId || trajectory.initialWorldId !== initialWorld.id || trajectory.initialWorldRevision !== initialWorld.revision || trajectory.finalWorld.seedContextId !== initialWorld.seedContextId || trajectory.trajectoryEngineVersion !== "trajectory-engine-v2-stage-4") return { ok: false as const, errorCode: "invalid_feature_input" as const };
    const eventIds = trajectory.steps.flatMap((step) => step.worldEventId ? [step.worldEventId] : []);
    if (new Set(eventIds).size !== eventIds.length) return { ok: false as const, errorCode: "invalid_feature_input" as const };
    const eventsById = new Map(trajectory.finalWorld.worldEvents.map((event) => [event.id, event]));
    const events: WorldEventV2[] = [];
    for (const id of eventIds) {
      const event = eventsById.get(id);
      if (!event || event.seedContextId !== initialWorld.seedContextId || !trajectory.finalWorld.worldEventIds.includes(id)) return { ok: false as const, errorCode: "invalid_feature_input" as const };
      events.push(event);
    }
    const evidenceIds = new Set(initialWorld.realityBoundarySnapshot.evidenceLedger.items.map((item) => item.id));
    const assumptionIds = new Set(initialWorld.realityBoundarySnapshot.assumptionLedger.assumptions.map((item) => item.id));
    if (events.some((event) => event.causalRealEvidenceIds.some((id) => !evidenceIds.has(id)) || event.causalAssumptionIds.some((id) => !assumptionIds.has(id)))) return { ok: false as const, errorCode: "invalid_feature_input" as const };
    const outcome = {
      terminalStatus: trajectory.status,
      executedTickCount: trajectory.steps.length,
      revisionDelta: trajectory.finalWorld.revision - initialWorld.revision,
      operations: events.map((event) => ({ eventType: event.eventType, operation: event.operation, deltas: event.deltas })),
    };
    const outcomeSignature = canonicalJsonV2(outcome);
    const featureSignature = stableAnalysisFingerprintV2(outcome);
    const feature: TrajectoryFeatureV2 = {
      seedContextId: trajectory.seedContextId,
      trajectoryId: trajectory.trajectoryId,
      trajectorySeed: trajectory.trajectorySeed,
      terminalStatus: trajectory.status,
      executedTickCount: trajectory.steps.length,
      revisionDelta: trajectory.finalWorld.revision - initialWorld.revision,
      simulationEventCount: events.length,
      operationSequence: events.map((event) => `${event.eventType}:${canonicalJsonV2(event.operation)}`),
      affectedEntityIds: sortedUnique(events.flatMap((event) => event.targetEntityIds)),
      affectedResourceIds: sortedUnique(events.flatMap((event) => event.targetResourceIds)),
      affectedRelationIds: sortedUnique(events.flatMap((event) => event.targetRelationIds)),
      affectedVariableIds: sortedUnique(events.flatMap((event) => event.targetVariableIds)),
      outcomeSignature,
      featureSignature,
      simulationEventIds: eventIds,
      causalRealEvidenceIds: sortedUnique(events.flatMap((event) => event.causalRealEvidenceIds)),
      causalAssumptionIds: sortedUnique(events.flatMap((event) => event.causalAssumptionIds)),
      trajectoryEngineVersion: trajectory.trajectoryEngineVersion,
      agentWorldEngineVersion: trajectory.agentWorldEngineVersion,
      policyId: trajectory.policyId,
      policyVersion: trajectory.policyVersion,
      analysisEngineVersion: ANALYSIS_ENGINE_VERSION_V2,
      featureSchemaVersion: FEATURE_SCHEMA_VERSION_V2,
      realityBoundaryRevision: initialWorld.realityBoundaryRevisionSnapshot,
    };
    return { ok: true as const, feature };
  } catch {
    return { ok: false as const, errorCode: "invalid_feature_input" as const };
  }
}
