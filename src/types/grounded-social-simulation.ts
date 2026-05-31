export type GroundedRealityNodeType =
  | "user"
  | "person"
  | "organization"
  | "institution"
  | "market"
  | "policy"
  | "opportunity_source"
  | "resource_holder"
  | "information_source"
  | "constraint"
  | "environment";

export type GroundedRealitySource =
  | "user_input"
  | "manual_reality_source"
  | "inferred_from_user_context"
  | "sample_data"
  | "future_external_data";

export type GroundedRealityNode = {
  id: string;
  label: string;
  nodeType: GroundedRealityNodeType;
  source: GroundedRealitySource;
  roleInSituation: string;
  resourcesControlled: string[];
  informationHeld: string[];
  opportunitiesProvided: string[];
  constraintsCreated: string[];
  evidenceRefs: string[];
  confidence: number;
};

export type GroundedRealityPressureType =
  | "resource_control"
  | "information_gap"
  | "timing_pressure"
  | "market_pressure"
  | "institutional_constraint"
  | "emotional_pressure"
  | "opportunity_pull"
  | "competition"
  | "support";

export type GroundedRealityPressure = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  pressureType: GroundedRealityPressureType;
  explanation: string;
  evidenceRefs: string[];
  confidence: number;
};

export type DestinyPersonModifier = {
  id: string;
  destinyProfileId: string;
  destinyClimateId: string;
  decisionStyle: string;
  stressResponse: string;
  opportunityResponse: string;
  resourcePressureResponse: string;
  relationshipPressureResponse: string;
  boundaryStyle: string;
  timingSensitivity: string;
  confidence: number;
  uncertaintyNotes: string[];
};

export type GroundedSimulationPathEvent = {
  id: string;
  branchId: string;
  step: number;
  realityNodeIds: string[];
  userAction: string;
  expectedRealityReaction: string;
  destinyModifierEffect: string;
  pressureChange: string;
  informationChange: string;
  opportunityChange: string;
  userFacingSummary: string;
  evidenceRefs: string[];
  confidence: number;
};

export type GroundedSocialSimulationDraft = {
  id: string;
  seedContextId: string;
  destinyProfileId: string;
  destinyClimateId: string;
  realityIntake: RealityIntakeDraft;
  realityNodes: GroundedRealityNode[];
  realityPressures: GroundedRealityPressure[];
  destinyPersonModifier: DestinyPersonModifier;
  pathEvents: GroundedSimulationPathEvent[];
  simulationSummary: string;
  keyUncertainties: string[];
  observableSignals: string[];
  confidence: number;
  createdAt: string;
};
import type { RealityIntakeDraft } from "./reality-intake";
