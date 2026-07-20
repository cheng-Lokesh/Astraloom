import { evaluateAssumptionReadinessV2 } from "../reality-boundary/assumption-ledger";
import type { WorldStateV2 } from "../agent-world/types";
import type { AssumptionIdV2 } from "../reality-boundary/types";
import { canonicalJsonV2, stableAnalysisFingerprintV2 } from "./ids";
import { ANALYSIS_ENGINE_VERSION_V2, FEATURE_SCHEMA_VERSION_V2, type TrajectoryFeatureV2 } from "./types";
import { parseTrajectoryResultForFeatureV2 } from "./trajectory-result-validation";

const sortedUnique = <T extends string>(values: T[]) => [...new Set(values)].sort() as T[];

function collectInputAssumptionIdsV2(initialWorld: WorldStateV2) {
  const ids: AssumptionIdV2[] = [];
  for (const definition of initialWorld.agentDefinitions) {
    ids.push(...definition.assumptionIds);
    ids.push(...definition.fieldProvenance.displayName.assumptionIds, ...definition.fieldProvenance.role.assumptionIds);
  }
  for (const state of initialWorld.agentStates) ids.push(...state.activeAssumptionIds);
  for (const item of [...initialWorld.entities, ...initialWorld.relations, ...initialWorld.resources, ...initialWorld.constraints, ...initialWorld.externalVariables]) ids.push(...item.provenance.assumptionIds);
  for (const event of initialWorld.worldEvents) ids.push(...event.causalAssumptionIds);
  return sortedUnique(ids);
}

export function extractTrajectoryFeatureV2(initialWorldInput: unknown, trajectoryInput: unknown, contextInput: unknown) {
  try {
    const parsed = parseTrajectoryResultForFeatureV2(initialWorldInput, trajectoryInput, contextInput);
    if (!parsed.ok) return parsed;
    const { initialWorld, trajectory, events } = parsed;
    const eventIds = events.map((event) => event.id);
    const evidenceIds = new Set(initialWorld.realityBoundarySnapshot.evidenceLedger.items.map((item) => item.id));
    const assumptions = new Map(initialWorld.realityBoundarySnapshot.assumptionLedger.assumptions.map((item) => [item.id, item]));
    const assumptionIds = new Set(assumptions.keys());
    if (events.some((event) => event.causalRealEvidenceIds.some((id) => !evidenceIds.has(id)) || event.causalAssumptionIds.some((id) => !assumptionIds.has(id)))) return { ok: false as const, errorCode: "invalid_feature_input" as const };
    const inputAssumptionIds = collectInputAssumptionIdsV2(initialWorld);
    if (inputAssumptionIds.some((id) => !assumptions.has(id) || !evaluateAssumptionReadinessV2(assumptions.get(id)!).downstreamReady)) return { ok: false as const, errorCode: "invalid_feature_input" as const };
    const outcome = {
      terminalStatus: trajectory.status,
      executedTickCount: trajectory.steps.length,
      revisionDelta: events.length,
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
      revisionDelta: events.length,
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
      inputAssumptionIds,
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
