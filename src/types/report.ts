import type { SafetyLevel } from "@/types/safety-review";
import type { ProductPreview } from "@/types/product-preview";
import type { ClaimDraft as EvidenceClaimDraft, ClaimRiskLevel } from "@/types/claim";
import type { RelationWeights } from "@/types/relation-edge";
import type { SimulationBranchId, SimulationEventType } from "@/types/simulation-run";

export type ReportStatus = "locked" | "ready_placeholder";

export type EvidenceRefDraft = {
  id: string;
  sourceType: "event" | "agent" | "safety" | "seed_context";
  sourceId: string;
  label: string;
};

export type ClaimDraft = {
  id: string;
  simulationRunId: string;
  claimText: string;
  confidence: number;
  evidenceRefs: EvidenceRefDraft[];
  createdAt: string;
};

export type ReportJsonDraft = {
  title: string;
  executiveSummary: string;
  preview?: ProductPreview;
  sections: Array<{
    id: string;
    title: string;
    body: string;
    locked: boolean;
  }>;
};

export type ReportDraft = {
  id: string;
  seedContextId: string;
  simulationRunId: string;
  status: ReportStatus;
  reportJson: ReportJsonDraft;
  safetyLevel: SafetyLevel;
  safetyReviewId: string;
  claims: ClaimDraft[];
  lockedReason: string;
  createdAt: string;
  updatedAt: string;
};

export type StrategyType =
  | "observe"
  | "communicate"
  | "delay"
  | "proceed"
  | "boundary"
  | "information_fill"
  | "resource_exchange"
  | "exit_prepare";

export type ReportStrategyOption = {
  id: string;
  claimId: string;
  strategyType: StrategyType;
  title: string;
  body: string;
  expectedUse: string;
};

export type ReportEvidenceEvent = {
  id: string;
  claimIds: string[];
  branchId: SimulationBranchId | "unknown";
  tickIndex: number;
  timeLabel: string;
  eventType: SimulationEventType;
  participants: string[];
  relationEdgeIds: string[];
  causes: string[];
  action: string;
  beforeState: {
    weights: Record<string, RelationWeights>;
  };
  afterState: {
    weights: Record<string, RelationWeights>;
  };
  edgeWeightDeltas: Record<string, Partial<RelationWeights>>;
  evidenceRefs: string[];
  confidence: number;
};

export type ReportBranchComparison = {
  branchId: SimulationBranchId;
  label: string;
  claimIds: string[];
  eventCount: number;
  riskSignalCount: number;
  supportSignalCount: number;
};

export type FreePreviewReport = {
  claimIds: string[];
  summaryClaimIds: string[];
  overallRisk: ClaimRiskLevel;
  overallRiskLabel: string;
  summaryClaims: EvidenceClaimDraft[];
  vagueTimeline: Array<{
    label: string;
    eventCount: number;
    riskHint: "low" | "medium" | "high";
  }>;
  limitedEvidenceCount: number;
  unlockCta: string;
};

export type PaidFullReport = {
  claimIds: string[];
  fullClaims: EvidenceClaimDraft[];
  fullEventChain: ReportEvidenceEvent[];
  involvedAgentIds: string[];
  involvedRelationEdgeIds: string[];
  branchComparison: ReportBranchComparison[];
  strategyOptions: ReportStrategyOption[];
};

export type ReportEngineV1Output = {
  id: string;
  seedContextId: string;
  simulationRunId: string;
  version: "report-engine-v1";
  generatedAt: string;
  freePreview: FreePreviewReport;
  paidReport: PaidFullReport;
  invariant: {
    claimIds: string[];
    paidDoesNotCreateClaims: true;
    paidDoesNotRaiseConfidence: true;
    paidDoesNotChangeRiskLevel: true;
  };
};
