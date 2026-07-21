import { z } from "zod";

import { canonicalJsonV2, stableAnalysisFingerprintV2 } from "./ids";
import {
  ANALYSIS_ENGINE_VERSION_V2,
  FEATURE_SCHEMA_VERSION_V2,
  type TrajectoryFeatureV2,
} from "./types";

const nonNegativeInteger = z.number().finite().int().nonnegative();
const uint32 = z.number().finite().int().min(0).max(0xffff_ffff);
const boundedText = z.string().max(1000).trim().min(1);
const fingerprint = z.string().regex(/^[a-f0-9]{24}$/);
const namespaced = (prefix: string) => z.string().regex(new RegExp(`^${prefix}[a-z0-9][a-z0-9_-]*$`));
const sortedUnique = <T extends string>(values: T[]) => [...new Set(values)].sort() as T[];
const isSortedUnique = (values: string[]) => canonicalJsonV2(values) === canonicalJsonV2(sortedUnique(values));

export const trajectoryOutcomeSchemaV2 = z.object({
  terminalStatus: z.enum(["completed", "no_actions"]),
  executedTickCount: z.number().finite().int().positive(),
  revisionDelta: nonNegativeInteger,
  simulationEventCount: nonNegativeInteger,
  operationSequence: z.array(z.string().min(1)),
  affectedEntityIds: z.array(namespaced("world_entity_v2_")),
  affectedResourceIds: z.array(namespaced("world_resource_v2_")),
  affectedRelationIds: z.array(namespaced("world_relation_v2_")),
  affectedVariableIds: z.array(namespaced("world_variable_v2_")),
  causalRealEvidenceIds: z.array(namespaced("real_evidence_v2_")),
  causalAssumptionIds: z.array(namespaced("assumption_v2_")),
  inputAssumptionIds: z.array(namespaced("assumption_v2_")),
}).strict();

export type TrajectoryOutcomePayloadV2 = z.infer<typeof trajectoryOutcomeSchemaV2>;

export const trajectoryFeatureEnvelopeSchemaV2 = z.object({
  seedContextId: boundedText,
  trajectoryId: namespaced("trajectory_v2_"),
  trajectorySeed: uint32,
  terminalStatus: z.enum(["completed", "no_actions"]),
  executedTickCount: nonNegativeInteger,
  revisionDelta: nonNegativeInteger,
  simulationEventCount: nonNegativeInteger,
  operationSequence: z.array(z.string().min(1)),
  affectedEntityIds: z.array(namespaced("world_entity_v2_")),
  affectedResourceIds: z.array(namespaced("world_resource_v2_")),
  affectedRelationIds: z.array(namespaced("world_relation_v2_")),
  affectedVariableIds: z.array(namespaced("world_variable_v2_")),
  outcomeSignature: z.string().min(1).max(1_000_000),
  featureSignature: fingerprint,
  featureIntegritySignature: fingerprint,
  simulationEventIds: z.array(namespaced("world_event_v2_")),
  causalRealEvidenceIds: z.array(namespaced("real_evidence_v2_")),
  causalAssumptionIds: z.array(namespaced("assumption_v2_")),
  inputAssumptionIds: z.array(namespaced("assumption_v2_")),
  trajectoryEngineVersion: z.literal("trajectory-engine-v2-stage-4"),
  agentWorldEngineVersion: z.literal("agent-world-engine-v2-stage-3"),
  policyId: boundedText,
  policyVersion: boundedText,
  analysisEngineVersion: z.literal(ANALYSIS_ENGINE_VERSION_V2),
  featureSchemaVersion: z.literal(FEATURE_SCHEMA_VERSION_V2),
  realityBoundaryRevision: nonNegativeInteger,
}).strict();

export function parseCanonicalOutcomeSignatureV2(value: string) {
  try {
    const raw = JSON.parse(value);
    const parsed = trajectoryOutcomeSchemaV2.safeParse(raw);
    if (!parsed.success || canonicalJsonV2(parsed.data) !== value) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function integrityPayload(feature: Omit<TrajectoryFeatureV2, "featureIntegritySignature">) {
  return {
    seedContextId: feature.seedContextId,
    trajectoryId: feature.trajectoryId,
    trajectorySeed: feature.trajectorySeed,
    outcomeSignature: feature.outcomeSignature,
    featureSignature: feature.featureSignature,
    simulationEventIds: feature.simulationEventIds,
    trajectoryEngineVersion: feature.trajectoryEngineVersion,
    agentWorldEngineVersion: feature.agentWorldEngineVersion,
    policyId: feature.policyId,
    policyVersion: feature.policyVersion,
    analysisEngineVersion: feature.analysisEngineVersion,
    featureSchemaVersion: feature.featureSchemaVersion,
    realityBoundaryRevision: feature.realityBoundaryRevision,
  };
}

export function buildFeatureIntegritySignatureV2(
  feature: Omit<TrajectoryFeatureV2, "featureIntegritySignature">,
) {
  return stableAnalysisFingerprintV2(integrityPayload(feature));
}

export function parseTrajectoryFeatureIntegrityV2(input: unknown): TrajectoryFeatureV2 | null {
  try {
    const envelope = trajectoryFeatureEnvelopeSchemaV2.safeParse(input);
    if (!envelope.success) return null;
    const feature = envelope.data as TrajectoryFeatureV2;
    const outcome = parseCanonicalOutcomeSignatureV2(feature.outcomeSignature);
    if (!outcome || stableAnalysisFingerprintV2(outcome) !== feature.featureSignature) return null;
    const derived = {
      terminalStatus: feature.terminalStatus,
      executedTickCount: feature.executedTickCount,
      revisionDelta: feature.revisionDelta,
      simulationEventCount: feature.simulationEventCount,
      operationSequence: feature.operationSequence,
      affectedEntityIds: feature.affectedEntityIds,
      affectedResourceIds: feature.affectedResourceIds,
      affectedRelationIds: feature.affectedRelationIds,
      affectedVariableIds: feature.affectedVariableIds,
      causalRealEvidenceIds: feature.causalRealEvidenceIds,
      causalAssumptionIds: feature.causalAssumptionIds,
      inputAssumptionIds: feature.inputAssumptionIds,
    };
    if (canonicalJsonV2(derived) !== canonicalJsonV2(outcome)) return null;
    const sets = [
      feature.affectedEntityIds, feature.affectedResourceIds, feature.affectedRelationIds,
      feature.affectedVariableIds, feature.causalRealEvidenceIds, feature.causalAssumptionIds,
      feature.inputAssumptionIds,
    ];
    if (sets.some((items) => !isSortedUnique(items))) return null;
    if (
      new Set(feature.simulationEventIds).size !== feature.simulationEventIds.length ||
      feature.revisionDelta !== feature.simulationEventCount ||
      feature.simulationEventCount !== feature.simulationEventIds.length ||
      feature.operationSequence.length !== feature.simulationEventCount ||
      (feature.terminalStatus === "completed" && feature.executedTickCount !== feature.simulationEventCount) ||
      (feature.terminalStatus === "no_actions" && feature.executedTickCount !== feature.simulationEventCount + 1)
    ) return null;
    const unsigned = { ...feature };
    delete (unsigned as Partial<TrajectoryFeatureV2>).featureIntegritySignature;
    if (buildFeatureIntegritySignatureV2(unsigned) !== feature.featureIntegritySignature) return null;
    return structuredClone(feature);
  } catch {
    return null;
  }
}

export function validateTrajectoryFeatureIntegrityV2(input: unknown) {
  return parseTrajectoryFeatureIntegrityV2(input) !== null;
}
