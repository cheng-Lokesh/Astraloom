import { z } from "zod";

import { evaluateAssumptionReadinessV2 } from "../reality-boundary/assumption-ledger";
import { isAssumptionIdV2, isRealEvidenceIdV2 } from "../reality-boundary/ids";
import type { RealityBoundaryDraftV2 } from "../reality-boundary/types";
import {
  parseActionProposalIdV2,
  parseAgentDefinitionIdV2,
  parseTransitionCommandIdV2,
  parseWorldConstraintIdV2,
  parseWorldEntityIdV2,
  parseWorldEventIdV2,
  parseWorldIdV2,
  parseWorldRelationIdV2,
  parseWorldResourceIdV2,
  parseWorldVariableIdV2,
} from "./ids";
import type {
  ActionProposalInputV2,
  AgentWorldIssueV2,
  ProvenanceRefSetV2,
  WorldInitializationSpecV2,
  WorldStateV2,
} from "./types";

const nonEmpty = z.string().trim().min(1);
function isIsoTimestamp(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = Number(match[8] ?? 0);
  const offsetMinute = Number(match[9] ?? 0);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysByMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= daysByMonth[month - 1]! && hour <= 23 && minute <= 59 && second <= 59 && offsetHour <= 23 && offsetMinute <= 59;
}
const isoTimestamp = nonEmpty.refine(isIsoTimestamp, "Must be an ISO timestamp.");
const realEvidenceId = nonEmpty.refine(isRealEvidenceIdV2);
const assumptionId = nonEmpty.refine(isAssumptionIdV2);
const agentDefinitionId = nonEmpty.refine(
  (value) => parseAgentDefinitionIdV2(value) !== null,
);
const entityId = nonEmpty.refine((value) => parseWorldEntityIdV2(value) !== null);
const resourceId = nonEmpty.refine(
  (value) => parseWorldResourceIdV2(value) !== null,
);
const relationId = nonEmpty.refine(
  (value) => parseWorldRelationIdV2(value) !== null,
);
const variableId = nonEmpty.refine(
  (value) => parseWorldVariableIdV2(value) !== null,
);
const worldEventId = nonEmpty.refine(
  (value) => parseWorldEventIdV2(value) !== null,
);

const memorySourceSchema = z.discriminatedUnion("sourceType", [
  z.object({ sourceType: z.literal("real_evidence"), realEvidenceId }).strict(),
  z.object({ sourceType: z.literal("world_event"), worldEventId }).strict(),
]);

const actionParametersSchema = z.discriminatedUnion("actionType", [
  z
    .object({
      actionType: z.literal("record_observation"),
      observation: nonEmpty,
      source: memorySourceSchema,
    })
    .strict(),
  z
    .object({
      actionType: z.literal("request_information"),
      question: nonEmpty,
      targetEntityId: entityId.optional(),
    })
    .strict(),
  z
    .object({
      actionType: z.literal("update_commitment"),
      commitmentId: nonEmpty,
      label: nonEmpty,
      status: z.enum(["planned", "active", "fulfilled", "cancelled"]),
    })
    .strict(),
  z
    .object({
      actionType: z.literal("allocate_resource"),
      resourceId,
      amount: z.number().finite().positive(),
    })
    .strict(),
  z
    .object({
      actionType: z.literal("update_external_variable"),
      variableId,
      value: z.union([z.number().finite(), nonEmpty]),
    })
    .strict(),
  z
    .object({
      actionType: z.literal("update_relation_signal"),
      relationId,
      signal: z.enum(["negative", "neutral", "positive"]),
    })
    .strict(),
]);

export const actionProposalSchemaV2 = z
  .object({
    id: nonEmpty.refine((value) => parseActionProposalIdV2(value) !== null),
    seedContextId: nonEmpty,
    actorAgentId: agentDefinitionId,
    actionType: z.enum([
      "record_observation",
      "request_information",
      "update_commitment",
      "allocate_resource",
      "update_external_variable",
      "update_relation_signal",
    ]),
    targetEntityIds: z.array(entityId),
    targetResourceIds: z.array(resourceId),
    targetRelationIds: z.array(relationId),
    targetVariableIds: z.array(variableId),
    parameters: actionParametersSchema,
    realEvidenceIds: z.array(realEvidenceId),
    assumptionIds: z.array(assumptionId),
    priorWorldEventIds: z.array(worldEventId),
    rationaleSummary: nonEmpty.max(1000),
    createdAt: isoTimestamp,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.actionType !== value.parameters.actionType) {
      context.addIssue({
        code: "custom",
        path: ["parameters", "actionType"],
        message: "Action type and parameters must match.",
      });
    }
  });

export const transitionCommandSchemaV2 = z
  .object({
    id: nonEmpty.refine((value) => parseTransitionCommandIdV2(value) !== null),
    proposalId: nonEmpty.refine((value) => parseActionProposalIdV2(value) !== null),
    seedContextId: nonEmpty,
    expectedWorldRevision: z.number().int().nonnegative(),
    actorId: agentDefinitionId,
    operation: actionParametersSchema,
    causalRealEvidenceIds: z.array(realEvidenceId),
    causalAssumptionIds: z.array(assumptionId),
    priorWorldEventIds: z.array(worldEventId),
    validationRuleIds: z.array(nonEmpty).min(1),
    createdAt: isoTimestamp,
  })
  .strict();

function issue(
  code: AgentWorldIssueV2["code"],
  path: string,
  message: string,
): AgentWorldIssueV2 {
  return { code, path, message };
}

function duplicateIssues(values: string[], path: string) {
  return new Set(values).size === values.length
    ? []
    : [issue("duplicate_id", path, "Ids must be unique.")];
}

function forbiddenKeyIssues(value: unknown): AgentWorldIssueV2[] {
  const issues: AgentWorldIssueV2[] = [];
  function visit(current: unknown, path: string) {
    if (!current || typeof current !== "object") return;
    for (const [key, child] of Object.entries(current)) {
      const childPath = path ? `${path}.${key}` : key;
      if (/probability|likelihood|destiny/i.test(key)) {
        issues.push(issue("forbidden_field", childPath, `Forbidden field: ${key}`));
      }
      visit(child, childPath);
    }
  }
  visit(value, "");
  return issues;
}

function unexpectedKeys(
  value: unknown,
  allowed: string[],
  path: string,
): AgentWorldIssueV2[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.keys(value)
    .filter((key) => !allowed.includes(key))
    .map((key) =>
      issue("forbidden_field", `${path}.${key}`, `Unexpected field: ${key}`),
    );
}

function validateProvenance(
  provenance: ProvenanceRefSetV2,
  boundary: RealityBoundaryDraftV2 | WorldStateV2["realityBoundarySnapshot"],
  path: string,
) {
  const issues: AgentWorldIssueV2[] = [];
  const evidenceIds = new Set(boundary.evidenceLedger.items.map((item) => item.id));
  const assumptionIds = new Set(
    boundary.assumptionLedger.assumptions.map((item) => item.id),
  );
  if (provenance.realEvidenceIds.some((id) => !evidenceIds.has(id))) {
    issues.push(issue("unknown_real_evidence", path, "Unknown Real Evidence reference."));
  }
  if (provenance.assumptionIds.some((id) => !assumptionIds.has(id))) {
    issues.push(issue("unknown_assumption", path, "Unknown Assumption reference."));
  }
  if (provenance.assumptionIds.length > 0 && (!provenance.visible || !provenance.provisional)) {
    issues.push(issue("missing_reference", path, "Assumption provenance must stay visible and provisional."));
  }
  return issues;
}

export function executableAssumptionErrorV2(
  boundary: RealityBoundaryDraftV2 | WorldStateV2["realityBoundarySnapshot"],
  assumptionIds: string[],
) {
  const byId = new Map(
    boundary.assumptionLedger.assumptions.map((assumption) => [assumption.id, assumption]),
  );
  for (const id of assumptionIds) {
    const assumption = byId.get(id as never);
    if (!assumption) return "unknown_assumption" as const;
    const readiness = evaluateAssumptionReadinessV2(assumption);
    if (
      assumption.subjectType === "third_party" &&
      assumption.impactLevel === "high" &&
      !readiness.downstreamReady
    ) {
      return "third_party_confirmation_required" as const;
    }
    if (!readiness.downstreamReady) return "assumption_not_executable" as const;
  }
  return null;
}

export function validateInitializationSpecV2(
  spec: WorldInitializationSpecV2,
  boundary: RealityBoundaryDraftV2,
) {
  const issues: AgentWorldIssueV2[] = [];
  if (spec.seedContextId !== boundary.seedContextId) {
    issues.push(issue("cross_seed_reference", "seedContextId", "Spec and Reality Boundary must share one Seed."));
  }
  const collections = [
    ["agentDefinitions", spec.agentDefinitions],
    ["agentStates", spec.agentStates],
    ["entities", spec.entities],
    ["relations", spec.relations],
    ["resources", spec.resources],
    ["constraints", spec.constraints],
    ["externalVariables", spec.externalVariables],
  ] as const;
  for (const [path, values] of collections) {
    for (const [index, value] of values.entries()) {
      if (value.seedContextId && value.seedContextId !== spec.seedContextId) {
        issues.push(issue("cross_seed_reference", `${path}.${index}.seedContextId`, "Entity belongs to another Seed."));
      }
    }
  }
  const evidenceIds = new Set(boundary.evidenceLedger.items.map((item) => item.id));
  const assumptionIds = new Set(boundary.assumptionLedger.assumptions.map((item) => item.id));
  const provenanceOwners = [
    ...spec.agentDefinitions.flatMap((definition) => [definition.fieldProvenance.displayName, definition.fieldProvenance.role]),
    ...spec.entities.map((item) => item.provenance),
    ...spec.relations.map((item) => item.provenance),
    ...spec.resources.map((item) => item.provenance),
    ...spec.constraints.map((item) => item.provenance),
    ...spec.externalVariables.map((item) => item.provenance),
  ];
  const directEvidence = spec.agentDefinitions.flatMap((item) => item.realEvidenceIds);
  const directAssumptions = [
    ...spec.agentDefinitions.flatMap((item) => item.assumptionIds),
    ...spec.agentStates.flatMap((item) => item.activeAssumptionIds),
  ];
  if ([...directEvidence, ...provenanceOwners.flatMap((item) => item.realEvidenceIds)].some((id) => !evidenceIds.has(id))) {
    issues.push(issue("unknown_real_evidence", "references", "Initialization references missing Real Evidence."));
  }
  if ([...directAssumptions, ...provenanceOwners.flatMap((item) => item.assumptionIds)].some((id) => !assumptionIds.has(id))) {
    issues.push(issue("unknown_assumption", "references", "Initialization references missing Assumption."));
  }
  for (const [index, provenance] of provenanceOwners.entries()) {
    issues.push(...validateProvenance(provenance, boundary, `provenance.${index}`));
  }
  issues.push(...forbiddenKeyIssues(spec));
  return issues;
}

export function validateWorldV2(world: unknown) {
  if (!world || typeof world !== "object") {
    return { ok: false as const, issues: [issue("invalid_world", "", "World must be an object.")] };
  }
  const value = world as WorldStateV2;
  const requiredCollections = [
    value.agentDefinitions,
    value.agentStates,
    value.entities,
    value.relations,
    value.resources,
    value.constraints,
    value.externalVariables,
    value.appliedTransitionCommandIds,
    value.worldEventIds,
    value.worldEvents,
  ];
  if (
    requiredCollections.some((collection) => !Array.isArray(collection)) ||
    !value.realityBoundarySnapshot ||
    typeof value.realityBoundarySnapshot !== "object"
  ) {
    return {
      ok: false as const,
      issues: [issue("invalid_world", "", "World is missing required collections or snapshot.")],
    };
  }
  const issues: AgentWorldIssueV2[] = [];
  issues.push(
    ...unexpectedKeys(
      value,
      [
        "id",
        "seedContextId",
        "schemaVersion",
        "engineVersion",
        "revision",
        "realityBoundaryRevisionSnapshot",
        "realityBoundarySnapshot",
        "agentDefinitions",
        "agentStates",
        "entities",
        "relations",
        "resources",
        "constraints",
        "externalVariables",
        "appliedTransitionCommandIds",
        "worldEventIds",
        "worldEvents",
        "createdAt",
        "updatedAt",
      ],
      "world",
    ),
  );
  for (const [index, definition] of value.agentDefinitions.entries()) {
    issues.push(
      ...unexpectedKeys(definition, ["id", "seedContextId", "schemaVersion", "actorType", "displayName", "role", "realEvidenceIds", "assumptionIds", "fieldProvenance", "constraints", "createdAt"], `agentDefinitions.${index}`),
      ...unexpectedKeys(definition.fieldProvenance, ["displayName", "role"], `agentDefinitions.${index}.fieldProvenance`),
    );
  }
  for (const [index, state] of value.agentStates.entries()) {
    issues.push(...unexpectedKeys(state, ["agentDefinitionId", "seedContextId", "revision", "observableStatus", "commitments", "resourceAccessIds", "observations", "memory", "activeAssumptionIds", "lastActionReference", "updatedAt"], `agentStates.${index}`));
    for (const [commitmentIndex, commitment] of state.commitments.entries()) {
      issues.push(...unexpectedKeys(commitment, ["id", "label", "status"], `agentStates.${index}.commitments.${commitmentIndex}`));
    }
    for (const [observationIndex, observation] of state.observations.entries()) {
      issues.push(
        ...unexpectedKeys(observation, ["id", "content", "source", "observedAt"], `agentStates.${index}.observations.${observationIndex}`),
        ...unexpectedKeys(observation.source, observation.source.sourceType === "real_evidence" ? ["sourceType", "realEvidenceId"] : ["sourceType", "worldEventId"], `agentStates.${index}.observations.${observationIndex}.source`),
      );
    }
    for (const [memoryIndex, memory] of state.memory.entries()) {
      issues.push(
        ...unexpectedKeys(memory, ["id", "source", "content", "recordedAt"], `agentStates.${index}.memory.${memoryIndex}`),
        ...unexpectedKeys(memory.source, memory.source.sourceType === "real_evidence" ? ["sourceType", "realEvidenceId"] : ["sourceType", "worldEventId"], `agentStates.${index}.memory.${memoryIndex}.source`),
      );
    }
  }
  for (const [index, entity] of value.entities.entries()) {
    issues.push(...unexpectedKeys(entity, ["id", "seedContextId", "entityType", "label", "agentDefinitionId", "provenance"], `entities.${index}`));
  }
  for (const [index, relation] of value.relations.entries()) {
    issues.push(...unexpectedKeys(relation, ["id", "seedContextId", "relationType", "fromEntityId", "toEntityId", "signal", "provenance"], `relations.${index}`));
  }
  for (const [index, resource] of value.resources.entries()) {
    issues.push(...unexpectedKeys(resource, ["id", "seedContextId", "resourceType", "label", "ownerEntityId", "controllerAgentId", "available", "unit", "min", "max", "provenance"], `resources.${index}`));
  }
  for (const [index, constraint] of value.constraints.entries()) {
    issues.push(
      ...unexpectedKeys(constraint, ["id", "seedContextId", "constraintType", "target", "rule", "provenance"], `constraints.${index}`),
      ...unexpectedKeys(constraint.target, ["type", "id"], `constraints.${index}.target`),
      ...unexpectedKeys(constraint.rule, ["kind", "value"], `constraints.${index}.rule`),
    );
  }
  for (const [index, variable] of value.externalVariables.entries()) {
    issues.push(...unexpectedKeys(variable, variable.variableType === "number" ? ["id", "seedContextId", "variableType", "key", "value", "unit", "min", "max", "provisional", "provenance"] : ["id", "seedContextId", "variableType", "key", "value", "allowedValues", "provisional", "provenance"], `externalVariables.${index}`));
  }
  for (const [index, event] of value.worldEvents.entries()) {
    issues.push(...unexpectedKeys(event, ["id", "seedContextId", "commandId", "proposalId", "actorId", "eventType", "evidenceClass", "beforeRevision", "afterRevision", "deltas", "causalRealEvidenceIds", "causalAssumptionIds", "priorWorldEventIds", "validationRuleIds", "engineVersion", "createdAt"], `worldEvents.${index}`));
    for (const [deltaIndex, delta] of event.deltas.entries()) {
      issues.push(...unexpectedKeys(delta, ["path", "valueType", "before", "after"], `worldEvents.${index}.deltas.${deltaIndex}`));
    }
  }
  for (const [index, provenance] of [
    ...value.agentDefinitions.flatMap((definition) => [definition.fieldProvenance.displayName, definition.fieldProvenance.role]),
    ...value.entities.map((item) => item.provenance),
    ...value.relations.map((item) => item.provenance),
    ...value.resources.map((item) => item.provenance),
    ...value.constraints.map((item) => item.provenance),
    ...value.externalVariables.map((item) => item.provenance),
  ].entries()) {
    issues.push(...unexpectedKeys(provenance, ["realEvidenceIds", "assumptionIds", "provisional", "visible"], `provenance.${index}`));
  }
  if (!parseWorldIdV2(value.id)) issues.push(issue("invalid_id_namespace", "id", "Invalid World id."));
  if (!Number.isInteger(value.revision) || value.revision < 0) issues.push(issue("invalid_world", "revision", "Revision must be non-negative."));
  const seedCollections = [value.agentDefinitions, value.agentStates, value.entities, value.relations, value.resources, value.constraints, value.externalVariables];
  if (seedCollections.flat().some((item) => item.seedContextId !== value.seedContextId)) {
    issues.push(issue("cross_seed_reference", "seedContextId", "Every World entity must share one Seed."));
  }
  const definitionIds = value.agentDefinitions.map((item) => item.id);
  const entityIds = value.entities.map((item) => item.id);
  const relationIds = value.relations.map((item) => item.id);
  const resourceIds = value.resources.map((item) => item.id);
  const constraintIds = value.constraints.map((item) => item.id);
  const variableIds = value.externalVariables.map((item) => item.id);
  if (
    definitionIds.some((id) => !parseAgentDefinitionIdV2(id)) ||
    entityIds.some((id) => !parseWorldEntityIdV2(id)) ||
    relationIds.some((id) => !parseWorldRelationIdV2(id)) ||
    resourceIds.some((id) => !parseWorldResourceIdV2(id)) ||
    constraintIds.some((id) => !parseWorldConstraintIdV2(id)) ||
    variableIds.some((id) => !parseWorldVariableIdV2(id)) ||
    value.appliedTransitionCommandIds.some((id) => !parseTransitionCommandIdV2(id)) ||
    value.worldEventIds.some((id) => !parseWorldEventIdV2(id))
  ) {
    issues.push(issue("invalid_id_namespace", "ids", "Every id must use its declared namespace."));
  }
  issues.push(
    ...duplicateIssues(definitionIds, "agentDefinitions"),
    ...duplicateIssues(entityIds, "entities"),
    ...duplicateIssues(relationIds, "relations"),
    ...duplicateIssues(resourceIds, "resources"),
    ...duplicateIssues(constraintIds, "constraints"),
    ...duplicateIssues(variableIds, "externalVariables"),
    ...duplicateIssues(value.appliedTransitionCommandIds, "appliedTransitionCommandIds"),
    ...duplicateIssues(value.worldEventIds, "worldEventIds"),
  );
  if (value.agentStates.length !== definitionIds.length || new Set(value.agentStates.map((state) => state.agentDefinitionId)).size !== definitionIds.length || value.agentStates.some((state) => !definitionIds.includes(state.agentDefinitionId))) {
    issues.push(issue("missing_reference", "agentStates", "Agent Definitions and States must be one-to-one."));
  }
  if (value.relations.some((relation) => !entityIds.includes(relation.fromEntityId) || !entityIds.includes(relation.toEntityId))) {
    issues.push(issue("missing_reference", "relations", "Relation endpoints must exist."));
  }
  if (value.resources.some((resource) => (resource.ownerEntityId && !entityIds.includes(resource.ownerEntityId)) || (resource.controllerAgentId && !definitionIds.includes(resource.controllerAgentId)))) {
    issues.push(issue("missing_reference", "resources", "Resource owner and controller must exist."));
  }
  if (
    value.resources.some(
      (resource) =>
        resource.min > resource.max ||
        resource.available < resource.min ||
        resource.available > resource.max,
    )
  ) {
    issues.push(issue("invalid_variable_range", "resources", "Resource availability must stay inside its declared range."));
  }
  for (const constraint of value.constraints) {
    const targetExists =
      (constraint.target.type === "entity" && entityIds.includes(constraint.target.id)) ||
      (constraint.target.type === "resource" && resourceIds.includes(constraint.target.id)) ||
      (constraint.target.type === "variable" && variableIds.includes(constraint.target.id));
    if (!targetExists) {
      issues.push(issue("missing_reference", `constraints.${constraint.id}.target`, "Constraint target must exist."));
    }
    if (
      constraint.rule.kind === "requires_agent" &&
      !definitionIds.includes(constraint.rule.value)
    ) {
      issues.push(issue("missing_reference", `constraints.${constraint.id}.rule`, "Constraint approver must exist."));
    }
  }
  for (const variable of value.externalVariables) {
    if (variable.variableType === "number" && (variable.min > variable.max || variable.value < variable.min || variable.value > variable.max)) {
      issues.push(issue("invalid_variable_range", `externalVariables.${variable.id}`, "Numeric variable is outside range."));
    }
    if (variable.variableType === "enum" && !variable.allowedValues.includes(variable.value)) {
      issues.push(issue("invalid_variable_range", `externalVariables.${variable.id}`, "Enum variable is outside allowed values."));
    }
  }
  if (value.worldEvents.map((event) => event.id).join("|") !== value.worldEventIds.join("|")) {
    issues.push(issue("missing_reference", "worldEventIds", "World Event ids must match append-only event records."));
  }
  if (
    value.worldEvents.length !== value.appliedTransitionCommandIds.length ||
    value.worldEvents.some(
      (event, index) =>
        event.commandId !== value.appliedTransitionCommandIds[index] ||
        event.beforeRevision !== index ||
        event.afterRevision !== index + 1 ||
        event.seedContextId !== value.seedContextId ||
        event.evidenceClass !== "world_transition_simulation_evidence",
    ) ||
    value.revision !== value.worldEvents.length
  ) {
    issues.push(issue("missing_reference", "worldEvents", "Event and command history must be append-only and revision-complete."));
  }
  const evidenceIds = new Set(value.realityBoundarySnapshot.evidenceLedger.items.map((item) => item.id));
  const assumptionIds = new Set(value.realityBoundarySnapshot.assumptionLedger.assumptions.map((item) => item.id));
  const provenanceOwners = [
    ...value.agentDefinitions.flatMap((definition) => [definition.fieldProvenance.displayName, definition.fieldProvenance.role]),
    ...value.entities.map((item) => item.provenance),
    ...value.relations.map((item) => item.provenance),
    ...value.resources.map((item) => item.provenance),
    ...value.constraints.map((item) => item.provenance),
    ...value.externalVariables.map((item) => item.provenance),
  ];
  for (const [index, provenance] of provenanceOwners.entries()) {
    issues.push(...validateProvenance(provenance, value.realityBoundarySnapshot, `provenance.${index}`));
  }
  if (
    value.agentDefinitions.some(
      (definition) =>
        definition.realEvidenceIds.some((id) => !evidenceIds.has(id)) ||
        definition.assumptionIds.some((id) => !assumptionIds.has(id)),
    ) ||
    value.agentStates.some((state) =>
      state.activeAssumptionIds.some((id) => !assumptionIds.has(id)),
    )
  ) {
    issues.push(issue("missing_reference", "agents", "Agent references must exist in the Reality Boundary snapshot."));
  }
  const executableError = executableAssumptionErrorV2(
    value.realityBoundarySnapshot,
    Array.from(
      new Set([
        ...value.agentDefinitions.flatMap((item) => item.assumptionIds),
        ...value.agentStates.flatMap((item) => item.activeAssumptionIds),
        ...provenanceOwners.flatMap((item) => item.assumptionIds),
      ]),
    ),
  );
  if (executableError) {
    issues.push(issue(executableError, "assumptions", "World contains a non-executable Assumption."));
  }
  for (const state of value.agentStates) {
    const sources = [
      ...state.memory.map((item) => item.source),
      ...state.observations.map((item) => item.source),
    ];
    if (
      sources.some((source) =>
        source.sourceType === "real_evidence"
          ? !evidenceIds.has(source.realEvidenceId)
          : !value.worldEventIds.includes(source.worldEventId),
      )
    ) {
      issues.push(issue("missing_reference", `agentStates.${state.agentDefinitionId}.memory`, "Memory sources must reference Real Evidence or an occurred World Event."));
    }
  }
  if (
    value.worldEvents.some(
      (event) =>
        event.causalRealEvidenceIds.some((id) => !evidenceIds.has(id)) ||
        event.causalAssumptionIds.some((id) => !assumptionIds.has(id)) ||
        event.priorWorldEventIds.some((id) => !value.worldEventIds.includes(id)),
    )
  ) {
    issues.push(issue("missing_reference", "worldEvents.causalReferences", "World Event causal references must exist."));
  }
  const timestamps = [value.createdAt, value.updatedAt, ...value.agentDefinitions.map((item) => item.createdAt), ...value.agentStates.map((item) => item.updatedAt), ...value.worldEvents.map((item) => item.createdAt)];
  if (timestamps.some((timestamp) => !isoTimestamp.safeParse(timestamp).success)) {
    issues.push(issue("invalid_timestamp", "timestamps", "All timestamps must be ISO."));
  }
  issues.push(...forbiddenKeyIssues(value));
  return issues.length ? { ok: false as const, issues } : { ok: true as const, issues: [] as [] };
}

export function parseActionProposalInputV2(value: unknown) {
  const parsed = actionProposalSchemaV2.safeParse(value);
  return parsed.success
    ? { ok: true as const, value: parsed.data as ActionProposalInputV2 }
    : {
        ok: false as const,
        issues: parsed.error.issues.map((item) => `${item.path.join(".")}: ${item.message}`),
      };
}
