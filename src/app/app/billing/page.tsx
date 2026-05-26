"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { UnlockReportCard } from "@/components/billing/unlock-report-card";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { StatusPill } from "@/components/status-pill";
import {
  clearEntitlementLedger,
  evaluateReportEntitlement,
  grantMockPaidReport,
  loadEntitlementLedger,
} from "@/lib/entitlements/entitlement-engine";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { buildReportEngineV1 } from "@/lib/reports/report-engine";
import { verifySafety } from "@/lib/safety/safety-verifier";

const unlockModules = [
  "Complete EventLog chain",
  "Full involved Agent list",
  "Relation Edge before/after delta",
  "Branch comparison",
  "Strategy options",
];

export default function BillingPage() {
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [claimLedger] = useState(() => {
    if (!seedContext) return null;
    const result = repos.reports.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [simulationRun] = useState(() => {
    if (!seedContext) return null;
    const result = repos.simulations.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [agentEcology] = useState(() => {
    if (!seedContext) return null;
    const result = repos.agentProfiles.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [relationGraph] = useState(() => {
    if (!seedContext) return null;
    const result = repos.relationGraphs.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [ledger, setLedger] = useState(() => loadEntitlementLedger());
  const [message, setMessage] = useState("");

  const safetyDecision = useMemo(() => {
    if (!seedContext) return null;
    return verifySafety({
      seedContext,
      agents: agentEcology?.agents,
      relationEdges: relationGraph?.edges,
      simulationRun,
      claims: claimLedger?.claims ?? [],
    });
  }, [agentEcology, claimLedger, relationGraph, seedContext, simulationRun]);

  const report = useMemo(() => {
    if (!seedContext || !simulationRun || !claimLedger) return null;
    return buildReportEngineV1({
      seedContext,
      simulationRun,
      claims: claimLedger.claims,
      agents: agentEcology?.agents ?? [],
      relationEdges: relationGraph?.edges ?? [],
    });
  }, [agentEcology, claimLedger, relationGraph, seedContext, simulationRun]);

  const entitlementDecision = useMemo(() => {
    if (!report) return null;
    return evaluateReportEntitlement({
      ledger,
      report,
      safetyLevel: safetyDecision?.safetyLevel ?? "unchecked",
    });
  }, [ledger, report, safetyDecision]);

  function mockUnlock() {
    if (!report || !entitlementDecision) return;
    if (
      entitlementDecision.safetyLevel === "blocked" ||
      entitlementDecision.safetyLevel === "downgraded"
    ) {
      setMessage("Safety restrictions keep paid report depth locked.");
      return;
    }

    const nextLedger = grantMockPaidReport(ledger, report);
    setLedger(nextLedger);
    setMessage(
      "Mock paid_report granted for this report only. claim_id, confidence, and riskLevel were not changed.",
    );
  }

  function resetEntitlement() {
    clearEntitlementLedger();
    const nextLedger = loadEntitlementLedger();
    setLedger(nextLedger);
    setMessage("Local entitlement ledger reset to free_preview.");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <main className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <StatusPill tone="planned">Mock entitlement</StatusPill>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
              Unlock complete evidence depth without changing the report claims.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
              This local mock does not connect to any payment gateway and does
              not collect money. It only grants a local paid_report entitlement
              for the current report id.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {unlockModules.map((item) => (
                <div
                  key={item}
                  className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
                >
                  <p className="text-sm font-semibold text-[#11150f]">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md border border-[#d49b4a]/25 bg-[#fff8ed] p-4 text-sm leading-7 text-[#7c5524]">
              Paid unlock reveals the complete event chain and strategy depth.
              It does not represent a certain prediction, does not improve a
              prediction accuracy score, and cannot bypass safety restrictions.
            </div>
            {seedContext ? (
              <div className="mt-5 rounded-md border border-black/8 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                  Current question
                </p>
                <p className="mt-2 text-sm leading-7 text-[#3f483d]">
                  {seedContext.questionText}
                </p>
              </div>
            ) : null}
          </main>

          <UnlockReportCard
            report={report}
            decision={entitlementDecision}
            onUnlock={mockUnlock}
            onReset={resetEntitlement}
          />
        </section>

        {message ? (
          <p className="rounded-md border border-[#568262]/20 bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3d]">
            {message}
          </p>
        ) : null}

        {safetyDecision && safetyDecision.safetyLevel !== "safe" ? (
          <SafetyDowngradeNotice
            decision={safetyDecision}
            title="Full-depth safety gate"
          />
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <main className="rounded-lg border border-black/8 bg-white p-6">
            <h2 className="text-xl font-semibold text-[#11150f]">
              Entitlement ledger
            </h2>
            <div className="mt-5 space-y-3">
              {ledger.entitlements.map((item) => (
                <article
                  key={item.id}
                  className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[#11150f]">
                      {item.entitlementType}
                    </span>
                    <StatusPill tone={item.status === "active" ? "ready" : "blocked"}>
                      {item.status}
                    </StatusPill>
                  </div>
                  <code className="mt-2 block break-all text-xs text-[#7d8578]">
                    report: {item.scope.reportId ?? "all preview"}
                  </code>
                </article>
              ))}
            </div>
          </main>

          <aside className="rounded-lg border border-black/8 bg-white p-6">
            <h2 className="text-xl font-semibold text-[#11150f]">
              Current report gate
            </h2>
            <dl className="mt-5 space-y-4 text-sm leading-6 text-[#62695d]">
              <LedgerRow
                label="Free preview"
                value={entitlementDecision?.canViewFreePreview ? "active" : "blocked"}
              />
              <LedgerRow
                label="Paid report"
                value={entitlementDecision?.canViewPaidReport ? "active" : "locked"}
              />
              <LedgerRow
                label="claim_id"
                value={`${entitlementDecision?.invariant.claimIds.length ?? 0}`}
              />
              <LedgerRow
                label="Safety"
                value={entitlementDecision?.safetyLevel ?? "unchecked"}
              />
            </dl>
            <Link
              href="/app/simulation/result"
              className="mt-6 inline-flex w-full justify-center rounded-md bg-[#11150f] px-4 py-3 text-sm font-semibold text-white"
            >
              Back to report
            </Link>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-[#11150f]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
