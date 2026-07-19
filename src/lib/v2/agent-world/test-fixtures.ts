import { buildAssumptionLedgerV2 } from "../reality-boundary/assumption-ledger";
import { buildEvidenceLedgerV2 } from "../reality-boundary/evidence-ledger";
import { createStableRealityBoundaryIdFactoryV2 } from "../reality-boundary/ids";
import type { RealityBoundaryDraftV2 } from "../reality-boundary/types";
import type { AssumptionIdV2 } from "../reality-boundary/types";
import { REALITY_BOUNDARY_SCHEMA_VERSION_V2 } from "../reality-boundary/types";
import { createStableAgentWorldIdFactoryV2 } from "./ids";
import type {
  ActionProposalInputV2,
  AgentWorldRuntimeV2,
  WorldInitializationSpecV2,
  WorldStateV2,
} from "./types";

export const fixedWorldNowV2 = "2026-07-19T10:00:00.000Z";
export const seedContextIdV2 = "seed_career_decision";

export const idsV2 = {
  self: "agent_definition_v2_self" as const,
  manager: "agent_definition_v2_manager" as const,
  recruiter: "agent_definition_v2_recruiter" as const,
  currentCompany: "world_entity_v2_current_company" as const,
  offer: "world_entity_v2_offer" as const,
  managerEntity: "world_entity_v2_manager" as const,
  recruiterEntity: "world_entity_v2_recruiter" as const,
  reportsTo: "world_relation_v2_reports_to" as const,
  recruits: "world_relation_v2_recruits" as const,
  time: "world_resource_v2_time" as const,
  budget: "world_resource_v2_budget" as const,
  deadline: "world_constraint_v2_offer_deadline" as const,
  approval: "world_constraint_v2_promotion_approval" as const,
  offerAvailability: "world_variable_v2_offer_available" as const,
  promotionBudget: "world_variable_v2_promotion_budget" as const,
};

export function createFixedAgentWorldRuntimeV2(): AgentWorldRuntimeV2 {
  return {
    clock: () => fixedWorldNowV2,
    idFactory: createStableAgentWorldIdFactoryV2("stage-3-tests"),
  };
}

export function realityBoundaryV2(): RealityBoundaryDraftV2 {
  const runtime = {
    clock: () => fixedWorldNowV2,
    idFactory: createStableRealityBoundaryIdFactoryV2("stage-3-tests"),
  };
  const evidenceLedger = buildEvidenceLedgerV2({
    seedContextId: seedContextIdV2,
    runtime,
    items: [
      {
        statement: "The written offer expires on 2026-07-25.",
        claimKey: "offer.deadline",
        sourceKind: "user_material",
        sourceTier: "unrated",
        verificationStatus: "user_confirmed",
        provenance: [{ sourceRef: "manual:offer", capturedAt: fixedWorldNowV2 }],
        limitations: [],
      },
      {
        statement: "The manager controls the promotion budget request.",
        claimKey: "promotion.approver",
        sourceKind: "user_statement",
        sourceTier: "tier_1_user_confirmed",
        verificationStatus: "user_confirmed",
        provenance: [{ sourceRef: "seed:situation", capturedAt: fixedWorldNowV2 }],
        limitations: [],
      },
    ],
  });
  const [offerEvidenceId, managerEvidenceId] = evidenceLedger.items.map(
    (item) => item.id,
  );
  const assumptionLedger = buildAssumptionLedgerV2({
    seedContextId: seedContextIdV2,
    evidenceLedger,
    runtime,
    assumptions: [
      {
        statement: "The manager may delay approval.",
        subjectType: "third_party",
        category: "approval_timing",
        epistemicStatus: "confirmed_for_simulation",
        impactLevel: "high",
        supportingRealEvidenceIds: [managerEvidenceId!],
        contradictingRealEvidenceIds: [],
        limitations: ["Simulation assumption, not a private-thought fact."],
        confirmationRequirement: "required",
        confirmationStatus: "confirmed",
      },
      {
        statement: "The recruiter may allow a short extension.",
        subjectType: "third_party",
        category: "deadline_flexibility",
        epistemicStatus: "inferred",
        impactLevel: "medium",
        supportingRealEvidenceIds: [offerEvidenceId!],
        contradictingRealEvidenceIds: [],
        limitations: ["Must remain visible and provisional."],
        confirmationRequirement: "not_required",
        confirmationStatus: "not_required",
      },
    ],
  });
  return {
    seedContextId: seedContextIdV2,
    schemaVersion: REALITY_BOUNDARY_SCHEMA_VERSION_V2,
    revision: 2,
    evidenceLedger: { ...evidenceLedger, revision: 2 },
    assumptionLedger: { ...assumptionLedger, revision: 2 },
    warnings: [],
    createdAt: fixedWorldNowV2,
    updatedAt: fixedWorldNowV2,
  };
}

function provenance(
  boundary = realityBoundaryV2(),
  assumptionIds: AssumptionIdV2[] = [],
) {
  return {
    realEvidenceIds: [boundary.evidenceLedger.items[0]!.id],
    assumptionIds,
    provisional: assumptionIds.length > 0,
    visible: true as const,
  };
}

export function worldInitializationSpecV2(
  boundary = realityBoundaryV2(),
): WorldInitializationSpecV2 {
  const highAssumption = boundary.assumptionLedger.assumptions[0]!.id;
  const mediumAssumption = boundary.assumptionLedger.assumptions[1]!.id;
  const evidenceIds = boundary.evidenceLedger.items.map((item) => item.id);
  return {
    seedContextId: seedContextIdV2,
    engineVersion: "agent-world-engine-v2-stage-3",
    agentDefinitions: [
      {
        id: idsV2.self,
        actorType: "self",
        displayName: "User",
        role: "Career decision maker",
        realEvidenceIds: evidenceIds,
        assumptionIds: [],
        fieldProvenance: {
          displayName: provenance(boundary),
          role: provenance(boundary),
        },
        constraints: ["Do not infer private thoughts."],
      },
      {
        id: idsV2.manager,
        actorType: "third_party",
        displayName: "Current manager",
        role: "Promotion budget approver",
        realEvidenceIds: [evidenceIds[1]!],
        assumptionIds: [highAssumption],
        fieldProvenance: {
          displayName: provenance(boundary),
          role: provenance(boundary, [highAssumption]),
        },
        constraints: ["Private intent remains an assumption."],
      },
      {
        id: idsV2.recruiter,
        actorType: "third_party",
        displayName: "Recruiter",
        role: "Offer contact",
        realEvidenceIds: [evidenceIds[0]!],
        assumptionIds: [mediumAssumption],
        fieldProvenance: {
          displayName: provenance(boundary),
          role: provenance(boundary, [mediumAssumption]),
        },
        constraints: ["Deadline flexibility is provisional."],
      },
    ],
    agentStates: [idsV2.self, idsV2.manager, idsV2.recruiter].map((id) => ({
      agentDefinitionId: id,
      observableStatus: "available" as const,
      commitments: [],
      resourceAccessIds: id === idsV2.self ? [idsV2.time] : [],
      observations: [],
      memory: [],
      activeAssumptionIds:
        id === idsV2.manager
          ? [highAssumption]
          : id === idsV2.recruiter
            ? [mediumAssumption]
            : [],
      lastActionReference: null,
    })),
    entities: [
      { id: idsV2.currentCompany, entityType: "organization", label: "Current company", provenance: provenance(boundary) },
      { id: idsV2.offer, entityType: "opportunity", label: "New role offer", provenance: provenance(boundary) },
      { id: idsV2.managerEntity, entityType: "person", label: "Current manager", agentDefinitionId: idsV2.manager, provenance: provenance(boundary, [highAssumption]) },
      { id: idsV2.recruiterEntity, entityType: "person", label: "Recruiter", agentDefinitionId: idsV2.recruiter, provenance: provenance(boundary, [mediumAssumption]) },
    ],
    relations: [
      { id: idsV2.reportsTo, relationType: "reports_to", fromEntityId: idsV2.managerEntity, toEntityId: idsV2.currentCompany, signal: "neutral", provenance: provenance(boundary) },
      { id: idsV2.recruits, relationType: "recruits", fromEntityId: idsV2.recruiterEntity, toEntityId: idsV2.offer, signal: "positive", provenance: provenance(boundary, [mediumAssumption]) },
    ],
    resources: [
      { id: idsV2.time, resourceType: "time", label: "Decision time", ownerEntityId: idsV2.offer, controllerAgentId: idsV2.self, available: 6, unit: "days", min: 0, max: 30, provenance: provenance(boundary) },
      { id: idsV2.budget, resourceType: "budget", label: "Promotion budget", ownerEntityId: idsV2.currentCompany, controllerAgentId: idsV2.manager, available: 100, unit: "percent", min: 0, max: 100, provenance: provenance(boundary, [highAssumption]) },
    ],
    constraints: [
      { id: idsV2.deadline, constraintType: "deadline", target: { type: "entity", id: idsV2.offer }, rule: { kind: "before_time", value: "2026-07-25T17:00:00.000Z" }, provenance: provenance(boundary) },
      { id: idsV2.approval, constraintType: "approval_required", target: { type: "resource", id: idsV2.budget }, rule: { kind: "requires_agent", value: idsV2.manager }, provenance: provenance(boundary, [highAssumption]) },
    ],
    externalVariables: [
      { id: idsV2.offerAvailability, variableType: "enum", key: "offer_availability", value: "open", allowedValues: ["open", "closed"], provisional: false, provenance: provenance(boundary) },
      { id: idsV2.promotionBudget, variableType: "number", key: "promotion_budget_approval", value: 50, unit: "percent", min: 0, max: 100, provisional: true, provenance: provenance(boundary, [highAssumption]) },
    ],
  };
}

export function actionProposalInputV2(
  world: WorldStateV2,
  overrides: Partial<ActionProposalInputV2> = {},
): ActionProposalInputV2 {
  return {
    id: "action_proposal_v2_allocate_time",
    seedContextId: world.seedContextId,
    actorAgentId: idsV2.self,
    actionType: "allocate_resource",
    targetEntityIds: [idsV2.offer],
    targetResourceIds: [idsV2.time],
    targetRelationIds: [],
    targetVariableIds: [],
    parameters: { actionType: "allocate_resource", resourceId: idsV2.time, amount: 1 },
    realEvidenceIds: [world.realityBoundarySnapshot.evidenceLedger.items[0]!.id],
    assumptionIds: [],
    priorWorldEventIds: [],
    rationaleSummary: "Reserve one day to review the written offer.",
    createdAt: fixedWorldNowV2,
    ...overrides,
  } as ActionProposalInputV2;
}
