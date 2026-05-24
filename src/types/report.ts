import type { SafetyLevel } from "@/types/safety-review";
import type { ProductPreview } from "@/types/product-preview";

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
