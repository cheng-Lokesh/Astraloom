import type {
  AssumptionIdV2,
  AssumptionLedgerV2,
  EvidenceLedgerV2,
  RealEvidenceIdV2,
} from "../reality-boundary/types";

export const AGENT_WORLD_SCHEMA_VERSION_V2 = "2.0" as const;
export const AGENT_WORLD_ENGINE_VERSION_V2 =
  "agent-world-engine-v2-stage-3" as const;

export type AgentDefinitionIdV2 = `agent_definition_v2_${string}`;
export type WorldIdV2 = `world_v2_${string}`;
export type WorldEntityIdV2 = `world_entity_v2_${string}`;
export type WorldRelationIdV2 = `world_relation_v2_${string}`;
export type WorldResourceIdV2 = `world_resource_v2_${string}`;
export type WorldConstraintIdV2 = `world_constraint_v2_${string}`;
export type WorldVariableIdV2 = `world_variable_v2_${string}`;
export type ActionProposalIdV2 = `action_proposal_v2_${string}`;
export type TransitionCommandIdV2 = `transition_command_v2_${string}`;
export type WorldEventIdV2 = `world_event_v2_${string}`;

export type AgentWorldIdKindV2 =
  | "world"
  | "agent_definition"
  | "world_entity"
  | "world_relation"
  | "world_resource"
  | "world_constraint"
  | "world_variable"
  | "action_proposal"
  | "transition_command"
  | "world_event";

export type AgentWorldIdFactoryV2 = (
  kind: AgentWorldIdKindV2,
  fingerprint: string,
) => string;

export type AgentWorldRuntimeV2 = {
  clock: () => string;
  idFactory: AgentWorldIdFactoryV2;
};

export type ProvenanceRefSetV2 = {
  realEvidenceIds: RealEvidenceIdV2[];
  assumptionIds: AssumptionIdV2[];
  provisional: boolean;
  visible: true;
};

export type AgentActorTypeV2 = "self" | "third_party" | "organization";

export type AgentDefinitionV2 = {
  id: AgentDefinitionIdV2;
  seedContextId: string;
  schemaVersion: typeof AGENT_WORLD_SCHEMA_VERSION_V2;
  actorType: AgentActorTypeV2;
  displayName: string;
  role: string;
  realEvidenceIds: RealEvidenceIdV2[];
  assumptionIds: AssumptionIdV2[];
  fieldProvenance: {
    displayName: ProvenanceRefSetV2;
    role: ProvenanceRefSetV2;
  };
  constraints: string[];
  createdAt: string;
};

export type MemorySourceRefV2 =
  | { sourceType: "real_evidence"; realEvidenceId: RealEvidenceIdV2 }
  | { sourceType: "world_event"; worldEventId: WorldEventIdV2 };

export type AgentMemoryEntryV2 = {
  id: string;
  source: MemorySourceRefV2;
  content: string;
  recordedAt: string;
};

export type AgentObservationV2 = {
  id: string;
  content: string;
  source: MemorySourceRefV2;
  observedAt: string;
};

export type AgentCommitmentV2 = {
  id: string;
  label: string;
  status: "planned" | "active" | "fulfilled" | "cancelled";
};

export type AgentActionReferenceV2 =
  | { referenceType: "action_proposal"; actionProposalId: ActionProposalIdV2 }
  | { referenceType: "world_event"; worldEventId: WorldEventIdV2 };

export type AgentStateV2 = {
  agentDefinitionId: AgentDefinitionIdV2;
  seedContextId: string;
  revision: number;
  observableStatus:
    | "available"
    | "awaiting_information"
    | "committed"
    | "unavailable";
  commitments: AgentCommitmentV2[];
  resourceAccessIds: WorldResourceIdV2[];
  observations: AgentObservationV2[];
  memory: AgentMemoryEntryV2[];
  activeAssumptionIds: AssumptionIdV2[];
  lastActionReference: AgentActionReferenceV2 | null;
  updatedAt: string;
};

export type WorldEntityV2 = {
  id: WorldEntityIdV2;
  seedContextId: string;
  entityType: "person" | "organization" | "opportunity";
  label: string;
  agentDefinitionId?: AgentDefinitionIdV2;
  provenance: ProvenanceRefSetV2;
};

export type WorldRelationV2 = {
  id: WorldRelationIdV2;
  seedContextId: string;
  relationType:
    | "reports_to"
    | "recruits"
    | "employed_by"
    | "offers"
    | "collaborates_with";
  fromEntityId: WorldEntityIdV2;
  toEntityId: WorldEntityIdV2;
  signal: "negative" | "neutral" | "positive";
  provenance: ProvenanceRefSetV2;
};

export type WorldResourceV2 = {
  id: WorldResourceIdV2;
  seedContextId: string;
  resourceType: "time" | "budget" | "position_availability" | "information";
  label: string;
  ownerEntityId?: WorldEntityIdV2;
  controllerAgentId?: AgentDefinitionIdV2;
  available: number;
  unit: string;
  min: number;
  max: number;
  provenance: ProvenanceRefSetV2;
};

export type WorldConstraintTargetV2 =
  | { type: "entity"; id: WorldEntityIdV2 }
  | { type: "resource"; id: WorldResourceIdV2 }
  | { type: "variable"; id: WorldVariableIdV2 };

export type WorldConstraintRuleV2 =
  | { kind: "before_time"; value: string }
  | { kind: "requires_agent"; value: AgentDefinitionIdV2 }
  | { kind: "max_value"; value: number };

export type WorldConstraintV2 = {
  id: WorldConstraintIdV2;
  seedContextId: string;
  constraintType: "deadline" | "approval_required" | "capacity_limit";
  target: WorldConstraintTargetV2;
  rule: WorldConstraintRuleV2;
  provenance: ProvenanceRefSetV2;
};

export type NumericWorldVariableV2 = {
  id: WorldVariableIdV2;
  seedContextId: string;
  variableType: "number";
  key: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  provisional: boolean;
  provenance: ProvenanceRefSetV2;
};

export type EnumWorldVariableV2 = {
  id: WorldVariableIdV2;
  seedContextId: string;
  variableType: "enum";
  key: string;
  value: string;
  allowedValues: string[];
  provisional: boolean;
  provenance: ProvenanceRefSetV2;
};

export type WorldVariableV2 = NumericWorldVariableV2 | EnumWorldVariableV2;

export type RealityBoundarySnapshotV2 = {
  seedContextId: string;
  schemaVersion: "2.0";
  revision: number;
  evidenceLedger: EvidenceLedgerV2;
  assumptionLedger: AssumptionLedgerV2;
  createdAt: string;
  updatedAt: string;
};

export type WorldEventDeltaV2 = {
  path: string;
  valueType: "agent_state" | "resource" | "relation" | "variable";
  before: unknown;
  after: unknown;
};

export type WorldEventV2 = {
  id: WorldEventIdV2;
  seedContextId: string;
  commandId: TransitionCommandIdV2;
  proposalId: ActionProposalIdV2;
  actorId: AgentDefinitionIdV2;
  eventType: ActionTypeV2;
  operation: ActionParametersV2;
  targetEntityIds: WorldEntityIdV2[];
  targetResourceIds: WorldResourceIdV2[];
  targetRelationIds: WorldRelationIdV2[];
  targetVariableIds: WorldVariableIdV2[];
  evidenceClass: "world_transition_simulation_evidence";
  beforeRevision: number;
  afterRevision: number;
  deltas: WorldEventDeltaV2[];
  causalRealEvidenceIds: RealEvidenceIdV2[];
  causalAssumptionIds: AssumptionIdV2[];
  priorWorldEventIds: WorldEventIdV2[];
  validationRuleIds: string[];
  engineVersion: typeof AGENT_WORLD_ENGINE_VERSION_V2;
  createdAt: string;
};

export type WorldStateV2 = {
  id: WorldIdV2;
  seedContextId: string;
  schemaVersion: typeof AGENT_WORLD_SCHEMA_VERSION_V2;
  engineVersion: typeof AGENT_WORLD_ENGINE_VERSION_V2;
  revision: number;
  realityBoundaryRevisionSnapshot: number;
  realityBoundarySnapshot: RealityBoundarySnapshotV2;
  agentDefinitions: AgentDefinitionV2[];
  agentStates: AgentStateV2[];
  entities: WorldEntityV2[];
  relations: WorldRelationV2[];
  resources: WorldResourceV2[];
  constraints: WorldConstraintV2[];
  externalVariables: WorldVariableV2[];
  appliedTransitionCommandIds: TransitionCommandIdV2[];
  worldEventIds: WorldEventIdV2[];
  worldEvents: WorldEventV2[];
  createdAt: string;
  updatedAt: string;
};

type SeedOwnedSpecV2 = { seedContextId?: string };
export type AgentDefinitionSpecV2 = SeedOwnedSpecV2 &
  Omit<AgentDefinitionV2, "seedContextId" | "schemaVersion" | "createdAt">;
export type AgentStateSpecV2 = SeedOwnedSpecV2 &
  Omit<AgentStateV2, "seedContextId" | "revision" | "updatedAt">;
export type WorldEntitySpecV2 = SeedOwnedSpecV2 &
  Omit<WorldEntityV2, "seedContextId">;
export type WorldRelationSpecV2 = SeedOwnedSpecV2 &
  Omit<WorldRelationV2, "seedContextId">;
export type WorldResourceSpecV2 = SeedOwnedSpecV2 &
  Omit<WorldResourceV2, "seedContextId">;
export type WorldConstraintSpecV2 = SeedOwnedSpecV2 &
  Omit<WorldConstraintV2, "seedContextId">;
export type WorldVariableSpecV2 =
  | (SeedOwnedSpecV2 & Omit<NumericWorldVariableV2, "seedContextId">)
  | (SeedOwnedSpecV2 & Omit<EnumWorldVariableV2, "seedContextId">);

export type WorldInitializationSpecV2 = {
  seedContextId: string;
  engineVersion: typeof AGENT_WORLD_ENGINE_VERSION_V2;
  agentDefinitions: AgentDefinitionSpecV2[];
  agentStates: AgentStateSpecV2[];
  entities: WorldEntitySpecV2[];
  relations: WorldRelationSpecV2[];
  resources: WorldResourceSpecV2[];
  constraints: WorldConstraintSpecV2[];
  externalVariables: WorldVariableSpecV2[];
};

export type ActionTypeV2 =
  | "record_observation"
  | "request_information"
  | "update_commitment"
  | "allocate_resource"
  | "update_external_variable"
  | "update_relation_signal";

export type ActionParametersV2 =
  | {
      actionType: "record_observation";
      observation: string;
      source: MemorySourceRefV2;
    }
  | {
      actionType: "request_information";
      question: string;
      targetEntityId?: WorldEntityIdV2;
    }
  | {
      actionType: "update_commitment";
      commitmentId: string;
      label: string;
      status: AgentCommitmentV2["status"];
    }
  | {
      actionType: "allocate_resource";
      resourceId: WorldResourceIdV2;
      amount: number;
    }
  | {
      actionType: "update_external_variable";
      variableId: WorldVariableIdV2;
      value: number | string;
    }
  | {
      actionType: "update_relation_signal";
      relationId: WorldRelationIdV2;
      signal: WorldRelationV2["signal"];
    };

export type ActionProposalInputV2 = {
  id: ActionProposalIdV2;
  seedContextId: string;
  actorAgentId: AgentDefinitionIdV2;
  actionType: ActionTypeV2;
  targetEntityIds: WorldEntityIdV2[];
  targetResourceIds: WorldResourceIdV2[];
  targetRelationIds: WorldRelationIdV2[];
  targetVariableIds: WorldVariableIdV2[];
  parameters: ActionParametersV2;
  realEvidenceIds: RealEvidenceIdV2[];
  assumptionIds: AssumptionIdV2[];
  priorWorldEventIds: WorldEventIdV2[];
  rationaleSummary: string;
  createdAt: string;
};

export type ActionProposalV2 = Readonly<ActionProposalInputV2>;

export type TransitionCommandV2 = {
  id: TransitionCommandIdV2;
  proposalId: ActionProposalIdV2;
  seedContextId: string;
  expectedWorldRevision: number;
  actorId: AgentDefinitionIdV2;
  operation: ActionParametersV2;
  targetEntityIds: WorldEntityIdV2[];
  targetResourceIds: WorldResourceIdV2[];
  targetRelationIds: WorldRelationIdV2[];
  targetVariableIds: WorldVariableIdV2[];
  causalRealEvidenceIds: RealEvidenceIdV2[];
  causalAssumptionIds: AssumptionIdV2[];
  priorWorldEventIds: WorldEventIdV2[];
  validationRuleIds: string[];
  createdAt: string;
};

export type AgentWorldIssueCodeV2 =
  | "invalid_world"
  | "invalid_id_namespace"
  | "cross_seed_reference"
  | "duplicate_id"
  | "missing_reference"
  | "unknown_real_evidence"
  | "unknown_assumption"
  | "assumption_not_executable"
  | "third_party_confirmation_required"
  | "invalid_variable_range"
  | "invalid_timestamp"
  | "forbidden_field";

export type AgentWorldIssueV2 = {
  code: AgentWorldIssueCodeV2;
  path: string;
  message: string;
};

export type WorldValidationResultV2 =
  | { ok: true; issues: [] }
  | { ok: false; issues: AgentWorldIssueV2[] };

export type WorldInitializationErrorCodeV2 =
  | "invalid_reality_boundary"
  | "invalid_initialization_spec"
  | "cross_seed_reference"
  | "unknown_real_evidence"
  | "unknown_assumption"
  | "assumption_not_executable"
  | "third_party_confirmation_required";

export type WorldInitializationResultV2 =
  | { ok: true; world: WorldStateV2 }
  | { ok: false; errorCode: WorldInitializationErrorCodeV2; issues?: AgentWorldIssueV2[] };

export type ActionProposalErrorCodeV2 =
  | "invalid_action_proposal"
  | "cross_seed_reference"
  | "unknown_actor"
  | "unknown_target"
  | "target_mismatch"
  | "broken_causal_reference"
  | "assumption_not_executable"
  | "third_party_confirmation_required"
  | "value_out_of_range"
  | "constraint_violation"
  | "invalid_expected_revision";

export type ActionProposalResultV2 =
  | { ok: true; proposal: ActionProposalV2 }
  | { ok: false; errorCode: ActionProposalErrorCodeV2; issues?: string[] };

export type CommandApprovalResultV2 =
  | { ok: true; command: TransitionCommandV2 }
  | { ok: false; errorCode: ActionProposalErrorCodeV2; issues?: string[] };

export type WorldTransitionErrorCodeV2 =
  | "invalid_transition_command"
  | "cross_seed_reference"
  | "stale_world_revision"
  | "duplicate_transition"
  | "unknown_actor"
  | "unknown_entity"
  | "unknown_resource"
  | "unknown_relation"
  | "unknown_variable"
  | "target_mismatch"
  | "value_out_of_range"
  | "invalid_enum_value"
  | "broken_causal_reference"
  | "constraint_violation";

export type WorldTransitionResultV2 =
  | { ok: true; world: WorldStateV2; event: WorldEventV2 }
  | { ok: false; errorCode: WorldTransitionErrorCodeV2 };
