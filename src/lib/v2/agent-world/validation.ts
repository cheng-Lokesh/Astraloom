import { z } from "zod";

import { evaluateAssumptionReadinessV2 } from "../reality-boundary/assumption-ledger";
import { isAssumptionIdV2, isRealEvidenceIdV2 } from "../reality-boundary/ids";
import type { RealityBoundaryDraftV2 } from "../reality-boundary/types";
import {
  assumptionLedgerSchemaV2,
  evidenceLedgerSchemaV2,
  validateRealityBoundaryDraftV2,
} from "../reality-boundary/validation";
import {
  operationMatchesDeclaredTargetsV2,
  operationSourceMatchesCausalReferencesV2,
} from "./constraint-validation";
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
  AgentStateV2,
  AgentWorldIssueV2,
  ProvenanceRefSetV2,
  TransitionCommandV2,
  WorldEventV2,
  WorldInitializationSpecV2,
  WorldStateV2,
} from "./types";
import {
  AGENT_WORLD_ENGINE_VERSION_V2,
  AGENT_WORLD_SCHEMA_VERSION_V2,
} from "./types";

const nonEmpty = z.string().trim().min(1).max(2000);
const shortText = z.string().trim().min(1).max(1000);
const finiteNumber = z.number().finite();
const revision = finiteNumber.int().nonnegative();

function isIsoTimestamp(value: string) {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(
      value,
    );
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
  const daysByMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysByMonth[month - 1]! &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    offsetHour <= 23 &&
    offsetMinute <= 59 &&
    !Number.isNaN(Date.parse(value))
  );
}

const isoTimestamp = nonEmpty.refine(isIsoTimestamp, "Invalid ISO timestamp.");
const realEvidenceId = nonEmpty.refine(
  isRealEvidenceIdV2,
  "Invalid Real Evidence id namespace.",
);
const assumptionId = nonEmpty.refine(
  isAssumptionIdV2,
  "Invalid Assumption id namespace.",
);

function namespacedId(
  parser: (value: unknown) => string | null,
  label: string,
) {
  return nonEmpty.refine(
    (value) => parser(value) !== null,
    `Invalid ${label} id namespace.`,
  );
}

const worldId = namespacedId(parseWorldIdV2, "World");
const agentDefinitionId = namespacedId(
  parseAgentDefinitionIdV2,
  "Agent Definition",
);
const entityId = namespacedId(parseWorldEntityIdV2, "World Entity");
const resourceId = namespacedId(parseWorldResourceIdV2, "World Resource");
const relationId = namespacedId(parseWorldRelationIdV2, "World Relation");
const constraintId = namespacedId(parseWorldConstraintIdV2, "World Constraint");
const variableId = namespacedId(parseWorldVariableIdV2, "World Variable");
const actionProposalId = namespacedId(parseActionProposalIdV2, "Action Proposal");
const transitionCommandId = namespacedId(
  parseTransitionCommandIdV2,
  "Transition Command",
);
const worldEventId = namespacedId(parseWorldEventIdV2, "World Event");

const provenanceSchema = z
  .object({
    realEvidenceIds: z.array(realEvidenceId),
    assumptionIds: z.array(assumptionId),
    provisional: z.boolean(),
    visible: z.literal(true),
  })
  .strict();

const memorySourceSchema = z.discriminatedUnion("sourceType", [
  z.object({ sourceType: z.literal("real_evidence"), realEvidenceId }).strict(),
  z.object({ sourceType: z.literal("world_event"), worldEventId }).strict(),
]);

const actionParametersSchema = z.discriminatedUnion("actionType", [
  z
    .object({
      actionType: z.literal("record_observation"),
      observation: shortText,
      source: memorySourceSchema,
    })
    .strict(),
  z
    .object({
      actionType: z.literal("request_information"),
      question: shortText,
      targetEntityId: entityId.optional(),
    })
    .strict(),
  z
    .object({
      actionType: z.literal("update_commitment"),
      commitmentId: nonEmpty,
      label: shortText,
      status: z.enum(["planned", "active", "fulfilled", "cancelled"]),
    })
    .strict(),
  z
    .object({
      actionType: z.literal("allocate_resource"),
      resourceId,
      amount: finiteNumber.positive(),
    })
    .strict(),
  z
    .object({
      actionType: z.literal("update_external_variable"),
      variableId,
      value: z.union([finiteNumber, nonEmpty]),
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

const targetShape = {
  targetEntityIds: z.array(entityId),
  targetResourceIds: z.array(resourceId),
  targetRelationIds: z.array(relationId),
  targetVariableIds: z.array(variableId),
};

function addArrayUniquenessIssues(
  value: Record<string, unknown>,
  context: z.RefinementCtx,
  fields: string[],
) {
  for (const field of fields) {
    const values = value[field];
    if (Array.isArray(values) && new Set(values).size !== values.length) {
      context.addIssue({
        code: "custom",
        path: [field],
        message: "Duplicate ids are not allowed.",
      });
    }
  }
}

export const actionProposalSchemaV2 = z
  .object({
    id: actionProposalId,
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
    ...targetShape,
    parameters: actionParametersSchema,
    realEvidenceIds: z.array(realEvidenceId),
    assumptionIds: z.array(assumptionId),
    priorWorldEventIds: z.array(worldEventId),
    rationaleSummary: shortText,
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
    addArrayUniquenessIssues(value, context, [
      "targetEntityIds",
      "targetResourceIds",
      "targetRelationIds",
      "targetVariableIds",
      "realEvidenceIds",
      "assumptionIds",
      "priorWorldEventIds",
    ]);
  });

export const transitionCommandSchemaV2 = z
  .object({
    id: transitionCommandId,
    proposalId: actionProposalId,
    seedContextId: nonEmpty,
    expectedWorldRevision: revision,
    actorId: agentDefinitionId,
    operation: actionParametersSchema,
    ...targetShape,
    causalRealEvidenceIds: z.array(realEvidenceId),
    causalAssumptionIds: z.array(assumptionId),
    priorWorldEventIds: z.array(worldEventId),
    validationRuleIds: z.array(nonEmpty).min(1),
    createdAt: isoTimestamp,
  })
  .strict()
  .superRefine((value, context) => {
    addArrayUniquenessIssues(value, context, [
      "targetEntityIds",
      "targetResourceIds",
      "targetRelationIds",
      "targetVariableIds",
      "causalRealEvidenceIds",
      "causalAssumptionIds",
      "priorWorldEventIds",
      "validationRuleIds",
    ]);
  });

const agentDefinitionCoreSchema = z.object({
  id: agentDefinitionId,
  actorType: z.enum(["self", "third_party", "organization"]),
  displayName: shortText,
  role: shortText,
  realEvidenceIds: z.array(realEvidenceId),
  assumptionIds: z.array(assumptionId),
  fieldProvenance: z
    .object({ displayName: provenanceSchema, role: provenanceSchema })
    .strict(),
  constraints: z.array(shortText),
});

const agentDefinitionSchema = agentDefinitionCoreSchema
  .extend({
    seedContextId: nonEmpty,
    schemaVersion: z.literal(AGENT_WORLD_SCHEMA_VERSION_V2),
    createdAt: isoTimestamp,
  })
  .strict();

const commitmentSchema = z
  .object({
    id: nonEmpty,
    label: shortText,
    status: z.enum(["planned", "active", "fulfilled", "cancelled"]),
  })
  .strict();

const observationSchema = z
  .object({
    id: nonEmpty,
    content: shortText,
    source: memorySourceSchema,
    observedAt: isoTimestamp,
  })
  .strict();

const memorySchema = z
  .object({
    id: nonEmpty,
    source: memorySourceSchema,
    content: shortText,
    recordedAt: isoTimestamp,
  })
  .strict();

const lastActionReferenceSchema = z.discriminatedUnion("referenceType", [
  z
    .object({ referenceType: z.literal("action_proposal"), actionProposalId })
    .strict(),
  z.object({ referenceType: z.literal("world_event"), worldEventId }).strict(),
]);

const agentStateCoreSchema = z.object({
  agentDefinitionId,
  observableStatus: z.enum([
    "available",
    "awaiting_information",
    "committed",
    "unavailable",
  ]),
  commitments: z.array(commitmentSchema),
  resourceAccessIds: z.array(resourceId),
  observations: z.array(observationSchema),
  memory: z.array(memorySchema),
  activeAssumptionIds: z.array(assumptionId),
  lastActionReference: lastActionReferenceSchema.nullable(),
});

const agentStateSchema = agentStateCoreSchema
  .extend({
    seedContextId: nonEmpty,
    revision,
    updatedAt: isoTimestamp,
  })
  .strict();

const entityCoreSchema = z.object({
  id: entityId,
  entityType: z.enum(["person", "organization", "opportunity"]),
  label: shortText,
  agentDefinitionId: agentDefinitionId.optional(),
  provenance: provenanceSchema,
});
const entitySchema = entityCoreSchema.extend({ seedContextId: nonEmpty }).strict();

const relationCoreSchema = z.object({
  id: relationId,
  relationType: z.enum([
    "reports_to",
    "recruits",
    "employed_by",
    "offers",
    "collaborates_with",
  ]),
  fromEntityId: entityId,
  toEntityId: entityId,
  signal: z.enum(["negative", "neutral", "positive"]),
  provenance: provenanceSchema,
});
const relationSchema = relationCoreSchema.extend({ seedContextId: nonEmpty }).strict();

const resourceCoreSchema = z.object({
  id: resourceId,
  resourceType: z.enum(["time", "budget", "position_availability", "information"]),
  label: shortText,
  ownerEntityId: entityId.optional(),
  controllerAgentId: agentDefinitionId.optional(),
  available: finiteNumber,
  unit: nonEmpty,
  min: finiteNumber,
  max: finiteNumber,
  provenance: provenanceSchema,
});
const resourceSchema = resourceCoreSchema.extend({ seedContextId: nonEmpty }).strict();

const entityTargetSchema = z.object({ type: z.literal("entity"), id: entityId }).strict();
const resourceTargetSchema = z
  .object({ type: z.literal("resource"), id: resourceId })
  .strict();
const variableTargetSchema = z
  .object({ type: z.literal("variable"), id: variableId })
  .strict();

const constraintCoreSchema = z.discriminatedUnion("constraintType", [
  z
    .object({
      id: constraintId,
      constraintType: z.literal("deadline"),
      target: z.union([entityTargetSchema, resourceTargetSchema, variableTargetSchema]),
      rule: z.object({ kind: z.literal("before_time"), value: isoTimestamp }).strict(),
      provenance: provenanceSchema,
    })
    .strict(),
  z
    .object({
      id: constraintId,
      constraintType: z.literal("approval_required"),
      target: z.union([entityTargetSchema, resourceTargetSchema, variableTargetSchema]),
      rule: z.object({ kind: z.literal("requires_agent"), value: agentDefinitionId }).strict(),
      provenance: provenanceSchema,
    })
    .strict(),
  z
    .object({
      id: constraintId,
      constraintType: z.literal("capacity_limit"),
      target: z.union([resourceTargetSchema, variableTargetSchema]),
      rule: z.object({ kind: z.literal("max_value"), value: finiteNumber }).strict(),
      provenance: provenanceSchema,
    })
    .strict(),
]);

const constraintSchema = z.intersection(
  constraintCoreSchema,
  z.object({ seedContextId: nonEmpty }),
);

const numericVariableCoreSchema = z
  .object({
    id: variableId,
    variableType: z.literal("number"),
    key: nonEmpty,
    value: finiteNumber,
    unit: nonEmpty,
    min: finiteNumber,
    max: finiteNumber,
    provisional: z.boolean(),
    provenance: provenanceSchema,
  })
  .strict();
const enumVariableCoreSchema = z
  .object({
    id: variableId,
    variableType: z.literal("enum"),
    key: nonEmpty,
    value: nonEmpty,
    allowedValues: z.array(nonEmpty).min(1),
    provisional: z.boolean(),
    provenance: provenanceSchema,
  })
  .strict();
const variableSchema = z.union([
  numericVariableCoreSchema.extend({ seedContextId: nonEmpty }).strict(),
  enumVariableCoreSchema.extend({ seedContextId: nonEmpty }).strict(),
]);

const realityBoundarySnapshotSchema = z
  .object({
    seedContextId: nonEmpty,
    schemaVersion: z.literal("2.0"),
    revision,
    evidenceLedger: evidenceLedgerSchemaV2,
    assumptionLedger: assumptionLedgerSchemaV2,
    createdAt: isoTimestamp,
    updatedAt: isoTimestamp,
  })
  .strict();

const eventDeltaSchema = z.discriminatedUnion("valueType", [
  z
    .object({
      path: nonEmpty,
      valueType: z.literal("agent_state"),
      before: agentStateSchema,
      after: agentStateSchema,
    })
    .strict(),
  z
    .object({
      path: nonEmpty,
      valueType: z.literal("resource"),
      before: finiteNumber,
      after: finiteNumber,
    })
    .strict(),
  z
    .object({
      path: nonEmpty,
      valueType: z.literal("variable"),
      before: z.union([finiteNumber, z.string()]),
      after: z.union([finiteNumber, z.string()]),
    })
    .strict(),
  z
    .object({
      path: nonEmpty,
      valueType: z.literal("relation"),
      before: z.enum(["positive", "neutral", "negative"]),
      after: z.enum(["positive", "neutral", "negative"]),
    })
    .strict(),
]);

const worldEventSchema = z
  .object({
    id: worldEventId,
    seedContextId: nonEmpty,
    commandId: transitionCommandId,
    proposalId: actionProposalId,
    actorId: agentDefinitionId,
    eventType: z.enum([
      "record_observation",
      "request_information",
      "update_commitment",
      "allocate_resource",
      "update_external_variable",
      "update_relation_signal",
    ]),
    operation: actionParametersSchema,
    ...targetShape,
    evidenceClass: z.literal("world_transition_simulation_evidence"),
    beforeRevision: revision,
    afterRevision: revision,
    deltas: z.array(eventDeltaSchema).length(1),
    causalRealEvidenceIds: z.array(realEvidenceId),
    causalAssumptionIds: z.array(assumptionId),
    priorWorldEventIds: z.array(worldEventId),
    validationRuleIds: z.array(nonEmpty).min(1),
    engineVersion: z.literal(AGENT_WORLD_ENGINE_VERSION_V2),
    commandCreatedAt: isoTimestamp,
    createdAt: isoTimestamp,
  })
  .strict();

export const worldSchemaV2 = z
  .object({
    id: worldId,
    seedContextId: nonEmpty,
    schemaVersion: z.literal(AGENT_WORLD_SCHEMA_VERSION_V2),
    engineVersion: z.literal(AGENT_WORLD_ENGINE_VERSION_V2),
    revision,
    realityBoundaryRevisionSnapshot: revision,
    realityBoundarySnapshot: realityBoundarySnapshotSchema,
    agentDefinitions: z.array(agentDefinitionSchema),
    agentStates: z.array(agentStateSchema),
    entities: z.array(entitySchema),
    relations: z.array(relationSchema),
    resources: z.array(resourceSchema),
    constraints: z.array(constraintSchema),
    externalVariables: z.array(variableSchema),
    appliedTransitionCommandIds: z.array(transitionCommandId),
    worldEventIds: z.array(worldEventId),
    worldEvents: z.array(worldEventSchema),
    createdAt: isoTimestamp,
    updatedAt: isoTimestamp,
  })
  .strict();

const seedOwned = { seedContextId: nonEmpty.optional() };
const agentDefinitionSpecSchema = agentDefinitionCoreSchema.extend(seedOwned).strict();
const agentStateSpecSchema = agentStateCoreSchema.extend(seedOwned).strict();
const entitySpecSchema = entityCoreSchema.extend(seedOwned).strict();
const relationSpecSchema = relationCoreSchema.extend(seedOwned).strict();
const resourceSpecSchema = resourceCoreSchema.extend(seedOwned).strict();
const constraintSpecSchema = z.union([
  ...constraintCoreSchema.options.map((option) => option.extend(seedOwned).strict()),
]);
const variableSpecSchema = z.union([
  numericVariableCoreSchema.extend(seedOwned).strict(),
  enumVariableCoreSchema.extend(seedOwned).strict(),
]);

export const worldInitializationSpecSchemaV2 = z
  .object({
    seedContextId: nonEmpty,
    engineVersion: z.literal(AGENT_WORLD_ENGINE_VERSION_V2),
    agentDefinitions: z.array(agentDefinitionSpecSchema),
    agentStates: z.array(agentStateSpecSchema),
    entities: z.array(entitySpecSchema),
    relations: z.array(relationSpecSchema),
    resources: z.array(resourceSpecSchema),
    constraints: z.array(constraintSpecSchema),
    externalVariables: z.array(variableSpecSchema),
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

function sameStringSet(first: string[], second: string[]) {
  const left = new Set(first);
  const right = new Set(second);
  return left.size === right.size && [...left].every((value) => right.has(value));
}

function forbiddenKeyIssues(value: unknown): AgentWorldIssueV2[] {
  const issues: AgentWorldIssueV2[] = [];
  const visited = new Set<object>();
  function visit(current: unknown, path: string) {
    if (!current || typeof current !== "object" || visited.has(current)) return;
    visited.add(current);
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

function zodWorldIssues(error: z.ZodError) {
  return error.issues.map((item) => {
    const path = item.path.length ? `world.${item.path.join(".")}` : "world";
    const message = item.message;
    const code: AgentWorldIssueV2["code"] =
      item.code === "unrecognized_keys"
        ? "forbidden_field"
        : /duplicate/i.test(message)
          ? "duplicate_id"
          : /namespace/i.test(message)
            ? "invalid_id_namespace"
            : /timestamp/i.test(message)
              ? "invalid_timestamp"
              : /allowedValues/.test(path)
                ? "invalid_variable_range"
              : "invalid_world";
    return issue(code, path, message);
  });
}

function rawTopLevelDuplicateIssues(world: unknown) {
  if (!world || typeof world !== "object" || Array.isArray(world)) return [];
  const record = world as Record<string, unknown>;
  const issues: AgentWorldIssueV2[] = [];
  for (const field of [
    "agentDefinitions",
    "entities",
    "relations",
    "resources",
    "constraints",
    "externalVariables",
    "worldEvents",
  ]) {
    const collection = record[field];
    if (!Array.isArray(collection)) continue;
    const ids = collection.flatMap((item) =>
      item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string"
        ? [(item as { id: string }).id]
        : [],
    );
    issues.push(...duplicateIssues(ids, field));
  }
  for (const field of ["appliedTransitionCommandIds", "worldEventIds"]) {
    const collection = record[field];
    if (!Array.isArray(collection)) continue;
    issues.push(
      ...duplicateIssues(
        collection.filter((item): item is string => typeof item === "string"),
        field,
      ),
    );
  }
  return issues;
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
  if (provenance.realEvidenceIds.length + provenance.assumptionIds.length === 0) {
    issues.push(issue("missing_reference", path, "Provenance must reference Evidence or an Assumption."));
  }
  issues.push(
    ...duplicateIssues(provenance.realEvidenceIds, `${path}.realEvidenceIds`),
    ...duplicateIssues(provenance.assumptionIds, `${path}.assumptionIds`),
  );
  if (provenance.realEvidenceIds.some((id) => !evidenceIds.has(id))) {
    issues.push(issue("unknown_real_evidence", path, "Unknown Real Evidence reference."));
  }
  if (provenance.assumptionIds.some((id) => !assumptionIds.has(id))) {
    issues.push(issue("unknown_assumption", path, "Unknown Assumption reference."));
  }
  if (
    provenance.assumptionIds.length > 0 &&
    (!provenance.visible || !provenance.provisional)
  ) {
    issues.push(
      issue(
        "missing_reference",
        path,
        "Assumption provenance must stay visible and provisional.",
      ),
    );
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

export function parseWorldInitializationSpecV2(value: unknown) {
  const parsed = worldInitializationSpecSchemaV2.safeParse(value);
  return parsed.success
    ? { ok: true as const, value: parsed.data as WorldInitializationSpecV2 }
    : {
        ok: false as const,
        issues: zodWorldIssues(parsed.error),
      };
}

export function validateInitializationSpecV2(
  spec: WorldInitializationSpecV2,
  boundary: RealityBoundaryDraftV2,
) {
  const issues: AgentWorldIssueV2[] = [];
  if (spec.seedContextId !== boundary.seedContextId) {
    issues.push(
      issue(
        "cross_seed_reference",
        "seedContextId",
        "Spec and Reality Boundary must share one Seed.",
      ),
    );
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
        issues.push(
          issue(
            "cross_seed_reference",
            `${path}.${index}.seedContextId`,
            "Entity belongs to another Seed.",
          ),
        );
      }
    }
  }
  const evidenceIds = new Set(boundary.evidenceLedger.items.map((item) => item.id));
  const assumptionIds = new Set(
    boundary.assumptionLedger.assumptions.map((item) => item.id),
  );
  const provenanceOwners = [
    ...spec.agentDefinitions.flatMap((definition) => [
      definition.fieldProvenance.displayName,
      definition.fieldProvenance.role,
    ]),
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
  if (
    [...directEvidence, ...provenanceOwners.flatMap((item) => item.realEvidenceIds)].some(
      (id) => !evidenceIds.has(id),
    )
  ) {
    issues.push(
      issue(
        "unknown_real_evidence",
        "references",
        "Initialization references missing Real Evidence.",
      ),
    );
  }
  if (
    [...directAssumptions, ...provenanceOwners.flatMap((item) => item.assumptionIds)].some(
      (id) => !assumptionIds.has(id),
    )
  ) {
    issues.push(
      issue(
        "unknown_assumption",
        "references",
        "Initialization references missing Assumption.",
      ),
    );
  }
  for (const [index, provenance] of provenanceOwners.entries()) {
    issues.push(...validateProvenance(provenance, boundary, `provenance.${index}`));
  }
  for (const [index, definition] of spec.agentDefinitions.entries()) {
    const fieldEvidence = [
      ...definition.fieldProvenance.displayName.realEvidenceIds,
      ...definition.fieldProvenance.role.realEvidenceIds,
    ];
    const fieldAssumptions = [
      ...definition.fieldProvenance.displayName.assumptionIds,
      ...definition.fieldProvenance.role.assumptionIds,
    ];
    if (
      !sameStringSet(definition.realEvidenceIds, fieldEvidence) ||
      !sameStringSet(definition.assumptionIds, fieldAssumptions)
    ) {
      issues.push(
        issue(
          "missing_reference",
          `agentDefinitions.${index}`,
          "Agent aggregate provenance must equal the union of field provenance.",
        ),
      );
    }
  }
  issues.push(...forbiddenKeyIssues(spec));
  return issues;
}

function sameValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function expectedAgentStateAfterEvent(
  event: WorldEventV2,
  before: AgentStateV2,
) {
  const expected = structuredClone(before);
  const operation = event.operation;
  if (operation.actionType === "record_observation") {
    expected.observations.push({
      id: `observation_${event.id}`,
      content: operation.observation,
      source: structuredClone(operation.source),
      observedAt: event.createdAt,
    });
    expected.memory.push({
      id: `memory_${event.id}`,
      source: structuredClone(operation.source),
      content: operation.observation,
      recordedAt: event.createdAt,
    });
  } else if (operation.actionType === "request_information") {
    expected.observableStatus = "awaiting_information";
    expected.commitments.push({
      id: `request_${event.id}`,
      label: operation.question,
      status: "active",
    });
  } else if (operation.actionType === "update_commitment") {
    const existing = expected.commitments.find(
      (item) => item.id === operation.commitmentId,
    );
    if (existing) {
      existing.label = operation.label;
      existing.status = operation.status;
    } else {
      expected.commitments.push({
        id: operation.commitmentId,
        label: operation.label,
        status: operation.status,
      });
    }
    expected.observableStatus =
      operation.status === "active" ? "committed" : expected.observableStatus;
  }
  expected.revision += 1;
  expected.lastActionReference = {
    referenceType: "world_event",
    worldEventId: event.id,
  };
  expected.updatedAt = event.createdAt;
  return expected;
}

function eventDeltaIssues(
  value: WorldStateV2,
  event: WorldEventV2,
  index: number,
) {
  const issues: AgentWorldIssueV2[] = [];
  const delta = event.deltas[0];
  const path = `worldEvents.${index}.deltas.0`;
  if (!delta) return issues;
  const operation = event.operation;
  let valid = false;
  if (
    operation.actionType === "allocate_resource" &&
    delta.valueType === "resource"
  ) {
    const resource = value.resources.find(
      (item) => item.id === operation.resourceId,
    );
    valid =
      delta.path === `resources.${operation.resourceId}.available` &&
      Boolean(resource) &&
      Number.isFinite(delta.before) &&
      Number.isFinite(delta.after) &&
      delta.before >= resource!.min &&
      delta.before <= resource!.max &&
      delta.after >= resource!.min &&
      delta.after <= resource!.max &&
      delta.after === delta.before - operation.amount;
  } else if (
    operation.actionType === "update_external_variable" &&
    delta.valueType === "variable"
  ) {
    const variable = value.externalVariables.find(
      (item) => item.id === operation.variableId,
    );
    valid =
      delta.path === `externalVariables.${operation.variableId}.value` &&
      Boolean(variable) &&
      (variable!.variableType === "number"
        ? typeof delta.before === "number" &&
          Number.isFinite(delta.before) &&
          delta.before >= variable!.min &&
          delta.before <= variable!.max &&
          typeof delta.after === "number" &&
          Number.isFinite(delta.after) &&
          delta.after >= variable!.min &&
          delta.after <= variable!.max
        : typeof delta.before === "string" &&
          variable!.allowedValues.includes(delta.before) &&
          typeof delta.after === "string" &&
          variable!.allowedValues.includes(delta.after)) &&
      delta.after === operation.value;
  } else if (
    operation.actionType === "update_relation_signal" &&
    delta.valueType === "relation"
  ) {
    const relation = value.relations.find(
      (item) => item.id === operation.relationId,
    );
    valid =
      delta.path === `relations.${operation.relationId}.signal` &&
      Boolean(relation) &&
      delta.after === operation.signal;
  } else if (
    (operation.actionType === "record_observation" ||
      operation.actionType === "request_information" ||
      operation.actionType === "update_commitment") &&
    delta.valueType === "agent_state"
  ) {
    const suffix =
      operation.actionType === "record_observation"
        ? "observations"
        : operation.actionType === "request_information"
          ? "observableStatus"
          : "commitments";
    valid =
      delta.path === `agentStates.${event.actorId}.${suffix}` &&
      delta.before.agentDefinitionId === event.actorId &&
      delta.after.agentDefinitionId === event.actorId &&
      delta.before.seedContextId === event.seedContextId &&
      delta.after.seedContextId === event.seedContextId &&
      sameValue(delta.after, expectedAgentStateAfterEvent(event, delta.before));
  }
  if (!valid) {
    issues.push(
      issue(
        "invalid_world",
        path,
        "Event delta must be typed and exactly replay its declared operation.",
      ),
    );
  }
  return issues;
}

function eventDeltaReplayIssues(value: WorldStateV2) {
  const issues: AgentWorldIssueV2[] = [];
  const lastAfter = new Map<string, unknown>();
  const currentValue = new Map<string, unknown>();
  for (const [index, event] of value.worldEvents.entries()) {
    const delta = event.deltas[0];
    if (!delta) continue;
    let key: string | null = null;
    let current: unknown;
    if (delta.valueType === "agent_state") {
      key = `agent_state:${event.actorId}`;
      current = value.agentStates.find(
        (state) => state.agentDefinitionId === event.actorId,
      );
    } else if (
      delta.valueType === "resource" &&
      event.operation.actionType === "allocate_resource"
    ) {
      const resourceId = event.operation.resourceId;
      key = `resource:${resourceId}`;
      current = value.resources.find(
        (resource) => resource.id === resourceId,
      )?.available;
    } else if (
      delta.valueType === "variable" &&
      event.operation.actionType === "update_external_variable"
    ) {
      const variableId = event.operation.variableId;
      key = `variable:${variableId}`;
      current = value.externalVariables.find(
        (variable) => variable.id === variableId,
      )?.value;
    } else if (
      delta.valueType === "relation" &&
      event.operation.actionType === "update_relation_signal"
    ) {
      const relationId = event.operation.relationId;
      key = `relation:${relationId}`;
      current = value.relations.find(
        (relation) => relation.id === relationId,
      )?.signal;
    }
    if (!key) continue;
    if (lastAfter.has(key) && !sameValue(lastAfter.get(key), delta.before)) {
      issues.push(
        issue(
          "invalid_world",
          `worldEvents.${index}.deltas.0.before`,
          "Event delta history must replay continuously.",
        ),
      );
    }
    lastAfter.set(key, delta.after);
    currentValue.set(key, current);
  }
  for (const [key, after] of lastAfter) {
    if (!sameValue(after, currentValue.get(key))) {
      issues.push(
        issue(
          "invalid_world",
          "worldEvents.deltas",
          `Final Event delta for ${key} must match the current World state.`,
        ),
      );
    }
  }
  return issues;
}

function semanticWorldIssues(value: WorldStateV2) {
  const issues: AgentWorldIssueV2[] = [];
  const snapshot = value.realityBoundarySnapshot;
  const boundaryResult = validateRealityBoundaryDraftV2({
    ...snapshot,
    warnings: [],
  });
  if (!boundaryResult.ok) {
    issues.push(
      ...boundaryResult.issues.map((message) =>
        issue("invalid_world", "realityBoundarySnapshot", message),
      ),
    );
  }
  if (
    snapshot.seedContextId !== value.seedContextId ||
    snapshot.revision !== value.realityBoundaryRevisionSnapshot ||
    snapshot.evidenceLedger.revision !== snapshot.revision ||
    snapshot.assumptionLedger.revision !== snapshot.revision ||
    snapshot.evidenceLedger.seedContextId !== snapshot.seedContextId ||
    snapshot.assumptionLedger.seedContextId !== snapshot.seedContextId ||
    snapshot.evidenceLedger.items.some(
      (item) => item.seedContextId !== snapshot.seedContextId,
    ) ||
    snapshot.assumptionLedger.assumptions.some(
      (item) => item.seedContextId !== snapshot.seedContextId,
    )
  ) {
    issues.push(
      issue(
        "cross_seed_reference",
        "realityBoundarySnapshot",
        "World and Reality Boundary snapshot seed/revisions must match.",
      ),
    );
  }
  if (Date.parse(value.createdAt) > Date.parse(value.updatedAt)) {
    issues.push(
      issue(
        "invalid_timestamp",
        "updatedAt",
        "World updatedAt cannot precede World createdAt.",
      ),
    );
  }

  const seedCollections = [
    value.agentDefinitions,
    value.agentStates,
    value.entities,
    value.relations,
    value.resources,
    value.constraints,
    value.externalVariables,
  ];
  if (
    seedCollections.flat().some((item) => item.seedContextId !== value.seedContextId)
  ) {
    issues.push(
      issue(
        "cross_seed_reference",
        "seedContextId",
        "Every World object must share one Seed.",
      ),
    );
  }

  const definitionIds = value.agentDefinitions.map((item) => item.id);
  const entityIds = value.entities.map((item) => item.id);
  const relationIds = value.relations.map((item) => item.id);
  const resourceIds = value.resources.map((item) => item.id);
  const constraintIds = value.constraints.map((item) => item.id);
  const variableIds = value.externalVariables.map((item) => item.id);
  const eventIds = value.worldEvents.map((item) => item.id);
  const proposalIds = value.worldEvents.map((item) => item.proposalId);
  const commandIds = value.worldEvents.map((item) => item.commandId);
  issues.push(
    ...duplicateIssues(definitionIds, "agentDefinitions"),
    ...duplicateIssues(entityIds, "entities"),
    ...duplicateIssues(relationIds, "relations"),
    ...duplicateIssues(resourceIds, "resources"),
    ...duplicateIssues(constraintIds, "constraints"),
    ...duplicateIssues(variableIds, "externalVariables"),
    ...duplicateIssues(value.appliedTransitionCommandIds, "appliedTransitionCommandIds"),
    ...duplicateIssues(value.worldEventIds, "worldEventIds"),
    ...duplicateIssues(eventIds, "worldEvents.ids"),
    ...duplicateIssues(proposalIds, "worldEvents.proposalIds"),
    ...duplicateIssues(commandIds, "worldEvents.commandIds"),
  );

  if (
    value.agentStates.length !== definitionIds.length ||
    new Set(value.agentStates.map((state) => state.agentDefinitionId)).size !==
      definitionIds.length ||
    value.agentStates.some((state) => !definitionIds.includes(state.agentDefinitionId))
  ) {
    issues.push(
      issue(
        "missing_reference",
        "agentStates",
        "Agent Definitions and States must be one-to-one.",
      ),
    );
  }
  for (const state of value.agentStates) {
    issues.push(
      ...duplicateIssues(state.resourceAccessIds, `agentStates.${state.agentDefinitionId}.resourceAccessIds`),
      ...duplicateIssues(state.activeAssumptionIds, `agentStates.${state.agentDefinitionId}.activeAssumptionIds`),
      ...duplicateIssues(state.commitments.map((item) => item.id), `agentStates.${state.agentDefinitionId}.commitments`),
      ...duplicateIssues(state.observations.map((item) => item.id), `agentStates.${state.agentDefinitionId}.observations`),
      ...duplicateIssues(state.memory.map((item) => item.id), `agentStates.${state.agentDefinitionId}.memory`),
    );
    if (state.revision > value.revision) {
      issues.push(
        issue(
          "invalid_world",
          `agentStates.${state.agentDefinitionId}.revision`,
          "Agent State revision cannot exceed World revision.",
        ),
      );
    }
    if (state.resourceAccessIds.some((id) => !resourceIds.includes(id))) {
      issues.push(
        issue(
          "missing_reference",
          `agentStates.${state.agentDefinitionId}.resourceAccessIds`,
          "Agent resource access must reference existing Resources.",
        ),
      );
    }
    const last = state.lastActionReference;
    if (
      last &&
      ((last.referenceType === "world_event" && !eventIds.includes(last.worldEventId)) ||
        (last.referenceType === "action_proposal" &&
          !proposalIds.includes(last.actionProposalId)))
    ) {
      issues.push(
        issue(
          "missing_reference",
          `agentStates.${state.agentDefinitionId}.lastActionReference`,
          "Last action must reference an occurred Event or its Proposal.",
        ),
      );
    }
  }
  if (
    value.entities.some(
      (entity) =>
        entity.agentDefinitionId && !definitionIds.includes(entity.agentDefinitionId),
    )
  ) {
    issues.push(
      issue(
        "missing_reference",
        "entities.agentDefinitionId",
        "Entity Agent Definition must exist.",
      ),
    );
  }
  if (
    value.relations.some(
      (relation) =>
        !entityIds.includes(relation.fromEntityId) ||
        !entityIds.includes(relation.toEntityId),
    )
  ) {
    issues.push(
      issue("missing_reference", "relations", "Relation endpoints must exist."),
    );
  }
  if (
    value.resources.some(
      (resource) =>
        (resource.ownerEntityId && !entityIds.includes(resource.ownerEntityId)) ||
        (resource.controllerAgentId &&
          !definitionIds.includes(resource.controllerAgentId)),
    )
  ) {
    issues.push(
      issue(
        "missing_reference",
        "resources",
        "Resource owner and controller must exist.",
      ),
    );
  }
  if (
    value.resources.some(
      (resource) =>
        resource.min > resource.max ||
        resource.available < resource.min ||
        resource.available > resource.max,
    )
  ) {
    issues.push(
      issue(
        "invalid_variable_range",
        "resources",
        "Resource availability must stay inside its declared range.",
      ),
    );
  }
  for (const constraint of value.constraints) {
    const targetExists =
      (constraint.target.type === "entity" && entityIds.includes(constraint.target.id)) ||
      (constraint.target.type === "resource" &&
        resourceIds.includes(constraint.target.id)) ||
      (constraint.target.type === "variable" && variableIds.includes(constraint.target.id));
    if (!targetExists) {
      issues.push(
        issue(
          "missing_reference",
          `constraints.${constraint.id}.target`,
          "Constraint target must exist.",
        ),
      );
    }
    if (
      constraint.rule.kind === "requires_agent" &&
      !definitionIds.includes(constraint.rule.value)
    ) {
      issues.push(
        issue(
          "missing_reference",
          `constraints.${constraint.id}.rule`,
          "Constraint approver must exist.",
        ),
      );
    }
  }
  for (const variable of value.externalVariables) {
    if (
      variable.variableType === "number" &&
      (variable.min > variable.max ||
        variable.value < variable.min ||
        variable.value > variable.max)
    ) {
      issues.push(
        issue(
          "invalid_variable_range",
          `externalVariables.${variable.id}`,
          "Numeric variable is outside range.",
        ),
      );
    }
    if (
      variable.variableType === "enum" &&
      (new Set(variable.allowedValues).size !== variable.allowedValues.length ||
        !variable.allowedValues.includes(variable.value))
    ) {
      issues.push(
        issue(
          "invalid_variable_range",
          `externalVariables.${variable.id}`,
          "Enum values must be unique and contain the current value.",
        ),
      );
    }
  }

  if (eventIds.join("|") !== value.worldEventIds.join("|")) {
    issues.push(
      issue(
        "missing_reference",
        "worldEventIds",
        "World Event ids must match append-only event records.",
      ),
    );
  }
  if (
    value.worldEvents.length !== value.appliedTransitionCommandIds.length ||
    value.worldEvents.some(
      (event, index) =>
        event.commandId !== value.appliedTransitionCommandIds[index] ||
        event.beforeRevision !== index ||
        event.afterRevision !== index + 1 ||
        event.seedContextId !== value.seedContextId ||
        event.eventType !== event.operation.actionType,
    ) ||
    value.revision !== value.worldEvents.length
  ) {
    issues.push(
      issue(
        "missing_reference",
        "worldEvents",
        "Event and command history must be append-only and revision-complete.",
      ),
    );
  }

  const evidenceIds = new Set(snapshot.evidenceLedger.items.map((item) => item.id));
  const assumptionIds = new Set(
    snapshot.assumptionLedger.assumptions.map((item) => item.id),
  );
  const provenanceOwners = [
    ...value.agentDefinitions.flatMap((definition) => [
      definition.fieldProvenance.displayName,
      definition.fieldProvenance.role,
    ]),
    ...value.entities.map((item) => item.provenance),
    ...value.relations.map((item) => item.provenance),
    ...value.resources.map((item) => item.provenance),
    ...value.constraints.map((item) => item.provenance),
    ...value.externalVariables.map((item) => item.provenance),
  ];
  for (const [index, provenance] of provenanceOwners.entries()) {
    issues.push(...validateProvenance(provenance, snapshot, `provenance.${index}`));
  }
  for (const [index, definition] of value.agentDefinitions.entries()) {
    issues.push(
      ...duplicateIssues(definition.realEvidenceIds, `agentDefinitions.${index}.realEvidenceIds`),
      ...duplicateIssues(definition.assumptionIds, `agentDefinitions.${index}.assumptionIds`),
    );
    const fieldEvidence = [
      ...definition.fieldProvenance.displayName.realEvidenceIds,
      ...definition.fieldProvenance.role.realEvidenceIds,
    ];
    const fieldAssumptions = [
      ...definition.fieldProvenance.displayName.assumptionIds,
      ...definition.fieldProvenance.role.assumptionIds,
    ];
    if (
      !sameStringSet(definition.realEvidenceIds, fieldEvidence) ||
      !sameStringSet(definition.assumptionIds, fieldAssumptions)
    ) {
      issues.push(
        issue(
          "missing_reference",
          `agentDefinitions.${index}`,
          "Agent aggregate provenance must equal the union of field provenance.",
        ),
      );
    }
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
    issues.push(
      issue(
        "missing_reference",
        "agents",
        "Agent references must exist in the Reality Boundary snapshot.",
      ),
    );
  }
  const executableError = executableAssumptionErrorV2(
    snapshot,
    Array.from(
      new Set([
        ...value.agentDefinitions.flatMap((item) => item.assumptionIds),
        ...value.agentStates.flatMap((item) => item.activeAssumptionIds),
        ...provenanceOwners.flatMap((item) => item.assumptionIds),
      ]),
    ),
  );
  if (executableError) {
    issues.push(
      issue(
        executableError,
        "assumptions",
        "World contains a non-executable Assumption.",
      ),
    );
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
          : !eventIds.includes(source.worldEventId),
      )
    ) {
      issues.push(
        issue(
          "missing_reference",
          `agentStates.${state.agentDefinitionId}.memory`,
          "Memory sources must reference Real Evidence or an occurred World Event.",
        ),
      );
    }
  }
  for (const [index, event] of value.worldEvents.entries()) {
    issues.push(
      ...duplicateIssues(event.targetEntityIds, `worldEvents.${index}.targetEntityIds`),
      ...duplicateIssues(event.targetResourceIds, `worldEvents.${index}.targetResourceIds`),
      ...duplicateIssues(event.targetRelationIds, `worldEvents.${index}.targetRelationIds`),
      ...duplicateIssues(event.targetVariableIds, `worldEvents.${index}.targetVariableIds`),
      ...duplicateIssues(event.causalRealEvidenceIds, `worldEvents.${index}.causalRealEvidenceIds`),
      ...duplicateIssues(event.causalAssumptionIds, `worldEvents.${index}.causalAssumptionIds`),
      ...duplicateIssues(event.priorWorldEventIds, `worldEvents.${index}.priorWorldEventIds`),
      ...duplicateIssues(event.validationRuleIds, `worldEvents.${index}.validationRuleIds`),
    );
    if (!definitionIds.includes(event.actorId)) {
      issues.push(
        issue("missing_reference", `worldEvents.${index}.actorId`, "Event actor must exist."),
      );
    }
    const missingCausalReference =
      event.causalRealEvidenceIds.some((id) => !evidenceIds.has(id)) ||
      event.causalAssumptionIds.some((id) => !assumptionIds.has(id)) ||
      event.priorWorldEventIds.some((id) => !eventIds.includes(id));
    if (missingCausalReference) {
      issues.push(
        issue(
          "broken_causal_reference",
          `worldEvents.${index}.causalReferences`,
          "Event causal references must exist.",
        ),
      );
    }
    const eventAssumptionError = executableAssumptionErrorV2(
      snapshot,
      event.causalAssumptionIds,
    );
    if (eventAssumptionError && eventAssumptionError !== "unknown_assumption") {
      issues.push(
        issue(
          eventAssumptionError,
          `worldEvents.${index}.causalAssumptionIds`,
          "Event references a non-executable Assumption.",
        ),
      );
    }
    const eventTime = Date.parse(event.createdAt);
    if (
      Date.parse(event.commandCreatedAt) > eventTime ||
      eventTime > Date.parse(value.updatedAt) ||
      (index > 0 &&
        Date.parse(value.worldEvents[index - 1]!.createdAt) > eventTime)
    ) {
      issues.push(
        issue(
          "invalid_timestamp",
          `worldEvents.${index}.createdAt`,
          "Command, Event, and World audit timestamps must be non-decreasing.",
        ),
      );
    }
    for (const priorId of event.priorWorldEventIds) {
      const priorIndex = eventIds.indexOf(priorId);
      if (priorIndex >= index) {
        issues.push(
          issue(
            "missing_reference",
            `worldEvents.${index}.priorWorldEventIds`,
            "A prior World Event must appear earlier in history.",
          ),
        );
      } else if (
        priorIndex >= 0 &&
        Date.parse(value.worldEvents[priorIndex]!.createdAt) > eventTime
      ) {
        issues.push(
          issue(
            "invalid_timestamp",
            `worldEvents.${index}.priorWorldEventIds`,
            "A causal prior World Event cannot occur after the current Event.",
          ),
        );
      }
    }
    if (
      event.targetEntityIds.some((id) => !entityIds.includes(id)) ||
      event.targetResourceIds.some((id) => !resourceIds.includes(id)) ||
      event.targetRelationIds.some((id) => !relationIds.includes(id)) ||
      event.targetVariableIds.some((id) => !variableIds.includes(id)) ||
      !operationMatchesDeclaredTargetsV2(event.operation, event)
    ) {
      issues.push(
        issue(
          "missing_reference",
          `worldEvents.${index}.targets`,
          "Event operation and declared targets must agree and exist.",
        ),
      );
    }
    if (
      !operationSourceMatchesCausalReferencesV2(
        event.operation,
        event.causalRealEvidenceIds,
        event.priorWorldEventIds,
      )
    ) {
      issues.push(
        issue(
          "missing_reference",
          `worldEvents.${index}.operation.source`,
          "Event observation source must be declared causally.",
        ),
      );
    }
    issues.push(...eventDeltaIssues(value, event, index));
  }
  issues.push(...eventDeltaReplayIssues(value));
  return issues;
}

export function validateWorldV2(world: unknown) {
  const parsed = worldSchemaV2.safeParse(world);
  if (!parsed.success) {
    return {
      ok: false as const,
      issues: [
        ...zodWorldIssues(parsed.error),
        ...rawTopLevelDuplicateIssues(world),
      ],
    };
  }
  const value = parsed.data as WorldStateV2;
  const issues = [...semanticWorldIssues(value), ...forbiddenKeyIssues(world)];
  return issues.length
    ? { ok: false as const, issues }
    : { ok: true as const, issues: [] as [] };
}

export function parseActionProposalInputV2(value: unknown) {
  const parsed = actionProposalSchemaV2.safeParse(value);
  return parsed.success
    ? { ok: true as const, value: parsed.data as ActionProposalInputV2 }
    : {
        ok: false as const,
        issues: parsed.error.issues.map((item) =>
          `${item.path.join(".")}: ${item.message}`,
        ),
      };
}

export function parseTransitionCommandV2(value: unknown) {
  const parsed = transitionCommandSchemaV2.safeParse(value);
  return parsed.success
    ? { ok: true as const, value: parsed.data as TransitionCommandV2 }
    : {
        ok: false as const,
        issues: parsed.error.issues.map((item) =>
          `${item.path.join(".")}: ${item.message}`,
        ),
      };
}
