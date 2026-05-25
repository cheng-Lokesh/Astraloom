import type { ReportEngineV1Output } from "@/types/report";

import type {
  EntitlementDecision,
  EntitlementDraft,
  EntitlementLedgerDraft,
  EntitlementType,
} from "./entitlement-types";

const entitlementStorageKey = "mirofish.entitlements.local.v1";

function hashText(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function nowIso() {
  return new Date().toISOString();
}

export function buildDefaultEntitlementLedger(): EntitlementLedgerDraft {
  const now = nowIso();

  return {
    version: "local-entitlement-v1",
    entitlements: [
      {
        id: "entitlement_free_preview_default",
        entitlementType: "free_preview",
        status: "active",
        scope: {
          reportId: null,
          simulationRunId: null,
        },
        source: "default",
        createdAt: now,
        updatedAt: now,
      },
    ],
    updatedAt: now,
  };
}

export function loadEntitlementLedger(): EntitlementLedgerDraft {
  if (typeof window === "undefined") {
    return buildDefaultEntitlementLedger();
  }

  const raw = window.localStorage.getItem(entitlementStorageKey);
  if (!raw) return buildDefaultEntitlementLedger();

  try {
    const parsed = JSON.parse(raw) as EntitlementLedgerDraft;
    const hasFreePreview = parsed.entitlements.some(
      (item) => item.entitlementType === "free_preview",
    );
    return hasFreePreview
      ? parsed
      : {
          ...parsed,
          entitlements: [
            buildDefaultEntitlementLedger().entitlements[0],
            ...parsed.entitlements,
          ],
        };
  } catch {
    window.localStorage.removeItem(entitlementStorageKey);
    return buildDefaultEntitlementLedger();
  }
}

export function saveEntitlementLedger(draft: EntitlementLedgerDraft) {
  if (typeof window === "undefined") return draft;
  window.localStorage.setItem(entitlementStorageKey, JSON.stringify(draft));
  return draft;
}

export function clearEntitlementLedger() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(entitlementStorageKey);
}

export function grantMockPaidReport(
  ledger: EntitlementLedgerDraft,
  report: ReportEngineV1Output,
) {
  const now = nowIso();
  const existing = ledger.entitlements.find(
    (item) =>
      item.entitlementType === "paid_report" &&
      item.scope.reportId === report.id &&
      item.status === "active",
  );
  const paidReport: EntitlementDraft =
    existing ??
    {
      id: `entitlement_paid_${hashText(`${report.id}:${now}`)}`,
      entitlementType: "paid_report",
      status: "active",
      scope: {
        reportId: report.id,
        simulationRunId: report.simulationRunId,
      },
      source: "mock_unlock",
      createdAt: now,
      updatedAt: now,
    };

  return saveEntitlementLedger({
    ...ledger,
    entitlements: [
      ...ledger.entitlements.filter((item) => item.id !== paidReport.id),
      paidReport,
    ],
    updatedAt: now,
  });
}

function activeTypesForReport(
  ledger: EntitlementLedgerDraft,
  report: ReportEngineV1Output,
): EntitlementType[] {
  const types = ledger.entitlements
    .filter((item) => item.status === "active")
    .filter((item) => {
      if (item.entitlementType === "free_preview") return true;
      if (item.entitlementType === "subscription") return true;
      if (item.entitlementType === "admin_grant") return true;
      return (
        item.entitlementType === "paid_report" &&
        item.scope.reportId === report.id &&
        item.scope.simulationRunId === report.simulationRunId
      );
    })
    .map((item) => item.entitlementType);

  return Array.from(new Set(types));
}

export function evaluateReportEntitlement({
  ledger,
  report,
  safetyLevel,
}: {
  ledger: EntitlementLedgerDraft;
  report: ReportEngineV1Output;
  safetyLevel: EntitlementDecision["safetyLevel"];
}): EntitlementDecision {
  const activeTypes = activeTypesForReport(ledger, report);
  const safetyBlocked = safetyLevel === "blocked" || safetyLevel === "downgraded";
  const hasPaidScope =
    activeTypes.includes("paid_report") ||
    activeTypes.includes("subscription") ||
    activeTypes.includes("admin_grant");

  return {
    reportId: report.id,
    simulationRunId: report.simulationRunId,
    safetyLevel,
    activeTypes,
    canViewFreePreview: activeTypes.includes("free_preview"),
    canViewPaidReport: hasPaidScope && !safetyBlocked,
    blockedReason: safetyBlocked
      ? "Safety restrictions keep the report in preview mode."
      : hasPaidScope
        ? null
        : "Paid report depth is not unlocked for this report.",
    invariant: {
      claimIds: report.invariant.claimIds,
      claimIdsUnchanged: true,
      confidenceUnchanged: true,
      riskLevelUnchanged: true,
      safetyNotBypassed: true,
    },
  };
}
