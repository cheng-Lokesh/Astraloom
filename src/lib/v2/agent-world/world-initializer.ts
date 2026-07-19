import { validateRealityBoundaryDraftV2 } from "../reality-boundary/validation";
import { createAgentDefinitionV2 } from "./agent-definition";
import { createAgentStateV2 } from "./agent-state";
import { parseWorldIdV2 } from "./ids";
import type {
  AgentWorldRuntimeV2,
  WorldInitializationErrorCodeV2,
  WorldInitializationResultV2,
  WorldInitializationSpecV2,
  WorldStateV2,
} from "./types";
import {
  AGENT_WORLD_SCHEMA_VERSION_V2,
} from "./types";
import type { RealityBoundaryDraftV2 } from "../reality-boundary/types";
import {
  executableAssumptionErrorV2,
  validateInitializationSpecV2,
  validateWorldV2,
} from "./validation";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function initializationFailure(
  errorCode: WorldInitializationErrorCodeV2,
  issues?: ReturnType<typeof validateInitializationSpecV2>,
): WorldInitializationResultV2 {
  return issues?.length ? { ok: false, errorCode, issues } : { ok: false, errorCode };
}

function referencedAssumptions(spec: WorldInitializationSpecV2) {
  return Array.from(
    new Set([
      ...spec.agentDefinitions.flatMap((item) => item.assumptionIds),
      ...spec.agentDefinitions.flatMap((item) => [
        ...item.fieldProvenance.displayName.assumptionIds,
        ...item.fieldProvenance.role.assumptionIds,
      ]),
      ...spec.agentStates.flatMap((item) => item.activeAssumptionIds),
      ...spec.entities.flatMap((item) => item.provenance.assumptionIds),
      ...spec.relations.flatMap((item) => item.provenance.assumptionIds),
      ...spec.resources.flatMap((item) => item.provenance.assumptionIds),
      ...spec.constraints.flatMap((item) => item.provenance.assumptionIds),
      ...spec.externalVariables.flatMap((item) => item.provenance.assumptionIds),
    ]),
  );
}

export function initializeWorldV2(
  realityBoundaryInput: RealityBoundaryDraftV2,
  initializationSpecInput: WorldInitializationSpecV2,
  runtime: AgentWorldRuntimeV2,
): WorldInitializationResultV2 {
  const boundaryValidation = validateRealityBoundaryDraftV2(realityBoundaryInput);
  if (!boundaryValidation.ok) {
    return { ok: false, errorCode: "invalid_reality_boundary" };
  }
  const boundary = clone(realityBoundaryInput);
  const spec = clone(initializationSpecInput);
  const specIssues = validateInitializationSpecV2(spec, boundary);
  const priority = [
    "cross_seed_reference",
    "unknown_real_evidence",
    "unknown_assumption",
  ] as const;
  for (const errorCode of priority) {
    if (specIssues.some((item) => item.code === errorCode)) {
      return initializationFailure(errorCode, specIssues);
    }
  }
  if (specIssues.length > 0) {
    return initializationFailure("invalid_initialization_spec", specIssues);
  }
  const assumptionError = executableAssumptionErrorV2(
    boundary,
    referencedAssumptions(spec),
  );
  if (assumptionError) return initializationFailure(assumptionError);

  const now = runtime.clock();
  const rawWorldId = runtime.idFactory(
    "world",
    JSON.stringify([spec.seedContextId, boundary.revision, spec.engineVersion]),
  );
  const worldId = parseWorldIdV2(rawWorldId);
  if (!worldId) return initializationFailure("invalid_initialization_spec");

  const realityBoundarySnapshot = {
    seedContextId: boundary.seedContextId,
    schemaVersion: boundary.schemaVersion,
    revision: boundary.revision,
    evidenceLedger: clone(boundary.evidenceLedger),
    assumptionLedger: clone(boundary.assumptionLedger),
    createdAt: boundary.createdAt,
    updatedAt: boundary.updatedAt,
  };
  const world: WorldStateV2 = {
    id: worldId,
    seedContextId: spec.seedContextId,
    schemaVersion: AGENT_WORLD_SCHEMA_VERSION_V2,
    engineVersion: spec.engineVersion,
    revision: 0,
    realityBoundaryRevisionSnapshot: boundary.revision,
    realityBoundarySnapshot,
    agentDefinitions: spec.agentDefinitions.map((item) =>
      createAgentDefinitionV2(spec.seedContextId, item, { ...runtime, clock: () => now }),
    ),
    agentStates: spec.agentStates.map((item) =>
      createAgentStateV2(spec.seedContextId, item, { ...runtime, clock: () => now }),
    ),
    entities: spec.entities.map((item) => ({ ...clone(item), seedContextId: spec.seedContextId })),
    relations: spec.relations.map((item) => ({ ...clone(item), seedContextId: spec.seedContextId })),
    resources: spec.resources.map((item) => ({ ...clone(item), seedContextId: spec.seedContextId })),
    constraints: spec.constraints.map((item) => ({ ...clone(item), seedContextId: spec.seedContextId })),
    externalVariables: spec.externalVariables.map((item) =>
      item.variableType === "number"
        ? { ...clone(item), seedContextId: spec.seedContextId }
        : { ...clone(item), seedContextId: spec.seedContextId },
    ),
    appliedTransitionCommandIds: [],
    worldEventIds: [],
    worldEvents: [],
    createdAt: now,
    updatedAt: now,
  };
  const worldValidation = validateWorldV2(world);
  return worldValidation.ok
    ? { ok: true, world }
    : { ok: false, errorCode: "invalid_initialization_spec", issues: worldValidation.issues };
}
