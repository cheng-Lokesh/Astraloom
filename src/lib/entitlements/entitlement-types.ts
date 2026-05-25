import type { SafetyLevel } from "@/lib/safety/safety-types";

export type EntitlementType =
  | "free_preview"
  | "paid_report"
  | "subscription"
  | "admin_grant";

export type EntitlementStatus = "active" | "blocked" | "expired";

export type EntitlementDraft = {
  id: string;
  entitlementType: EntitlementType;
  status: EntitlementStatus;
  scope: {
    reportId: string | null;
    simulationRunId: string | null;
  };
  source: "default" | "mock_unlock" | "admin";
  createdAt: string;
  updatedAt: string;
};

export type EntitlementLedgerDraft = {
  version: "local-entitlement-v1";
  entitlements: EntitlementDraft[];
  updatedAt: string;
};

export type EntitlementDecision = {
  reportId: string;
  simulationRunId: string;
  safetyLevel: SafetyLevel | "unchecked";
  activeTypes: EntitlementType[];
  canViewFreePreview: boolean;
  canViewPaidReport: boolean;
  blockedReason: string | null;
  invariant: {
    claimIds: string[];
    claimIdsUnchanged: true;
    confidenceUnchanged: true;
    riskLevelUnchanged: true;
    safetyNotBypassed: true;
  };
};
