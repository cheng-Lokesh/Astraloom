import { evaluateAssumptionReadinessV2 } from "../reality-boundary/assumption-ledger";
import type { WorldStateV2 } from "../agent-world/types";
import type { AssumptionIdV2 } from "../reality-boundary/types";
import { canonicalJsonV2, stableAnalysisFingerprintV2 } from "./ids";
import { buildFeatureIntegritySignatureV2, type TrajectoryOutcomePayloadV2 } from "./feature-integrity";
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
    const operationSequence = events.map((event) => canonicalJsonV2({
      eventType: event.eventType,
      operation: event.operation,
      deltas: event.deltas,
    }));
    const causalRealEvidenceIds = sortedUnique(events.flatMap((event) => event.causalRealEvidenceIds));
    const causalAssumptionIds = sortedUnique(events.flatMap((event) => event.causalAssumptionIds));
    const outcome: TrajectoryOutcomePayloadV2 = {
      terminalStatus: trajectory.status as "completed" | "no_actions",
      executedTickCount: trajectory.steps.length,
      revisionDelta: events.length,
      simulationEventCount: events.length,
      operationSequence,
      affectedEntityIds: sortedUnique(events.flatMap((event) => event.targetEntityIds)),
      affectedResourceIds: sortedUnique(events.flatMap((event) => event.targetResourceIds)),
      affectedRelationIds: sortedUnique(events.flatMap((event) => event.targetRelationIds)),
      affectedVariableIds: sortedUnique(events.flatMap((event) => event.targetVariableIds)),
      causalRealEvidenceIds,
      causalAssumptionIds,
      inputAssumptionIds,
    };
    const outcomeSignature = canonicalJsonV2(outcome);
    const featureSignature = stableAnalysisFingerprintV2(outcome);
    const unsignedFeature: Omit<TrajectoryFeatureV2, "featureIntegritySignature"> = {
      seedContextId: trajectory.seedContextId,
      trajectoryId: trajectory.trajectoryId,
      trajectorySeed: trajectory.trajectorySeed,
      terminalStatus: trajectory.status,
      executedTickCount: trajectory.steps.length,
      revisionDelta: events.length,
      simulationEventCount: events.length,
      operationSequence,
      affectedEntityIds: outcome.affectedEntityIds,
      affectedResourceIds: outcome.affectedResourceIds,
      affectedRelationIds: outcome.affectedRelationIds,
      affectedVariableIds: outcome.affectedVariableIds,
      outcomeSignature,
      featureSignature,
      simulationEventIds: eventIds,
      causalRealEvidenceIds,
      causalAssumptionIds,
      inputAssumptionIds,
      trajectoryEngineVersion: trajectory.trajectoryEngineVersion,
      agentWorldEngineVersion: trajectory.agentWorldEngineVersion,
      policyId: trajectory.policyId,
      policyVersion: trajectory.policyVersion,
      analysisEngineVersion: ANALYSIS_ENGINE_VERSION_V2,
      featureSchemaVersion: FEATURE_SCHEMA_VERSION_V2,
      realityBoundaryRevision: initialWorld.realityBoundaryRevisionSnapshot,
    };
    const feature: TrajectoryFeatureV2 = {
      ...unsignedFeature,
      featureIntegritySignature: buildFeatureIntegritySignatureV2(unsignedFeature),
    };
    return { ok: true as const, feature };
  } catch {
    return { ok: false as const, errorCode: "invalid_feature_input" as const };
  }
}
