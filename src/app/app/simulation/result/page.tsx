"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { GraphSummaryCards } from "@/components/graph/graph-summary-cards";
import { ClaimCard } from "@/components/report/claim-card";
import { EvidenceDrawer } from "@/components/report/evidence-drawer";
import { PaidUnlockBoundary } from "@/components/report/paid-unlock-boundary";
import { ReportSummary } from "@/components/report/report-summary";
import { StrategyOptions } from "@/components/report/strategy-options";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { buildClaimLedgerDraft } from "@/lib/claims/build";
import {
  buildCalibrationProfile,
  saveCalibrationProfile,
} from "@/lib/calibration/calibration-engine";
import {
  evaluateReportEntitlement,
  loadEntitlementLedger,
} from "@/lib/entitlements/entitlement-engine";
import {
  buildEmptyFeedbackLedgerDraft,
  buildFeedbackDraft,
} from "@/lib/feedback/build";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { buildReportEngineV1 } from "@/lib/reports/report-engine";
import {
  filterClaimsBySafety,
  verifySafety,
} from "@/lib/safety/safety-verifier";
import type { AgentProfileDraft } from "@/types/agent-profile";
import type { ClaimDraft, ClaimLedgerDraft } from "@/types/claim";
import type {
  FeedbackLedgerDraft,
  FeedbackRating,
  FeedbackTargetType,
} from "@/types/feedback";
import type { RelationEdgeDraft } from "@/types/relation-edge";
import type { SimulationEventDraft } from "@/types/simulation-run";

const emptyClaims: ClaimDraft[] = [];

const feedbackTargets: { value: FeedbackTargetType; label: string }[] = [
  { value: "claim", label: "Selected claim" },
  { value: "agent", label: "Highlighted agent" },
  { value: "relation_edge", label: "Highlighted edge" },
  { value: "strategy", label: "Strategy usefulness" },
  { value: "overall", label: "Overall run" },
];

const feedbackRatings: { value: FeedbackRating; label: string }[] = [
  { value: "accurate", label: "Accurate" },
  { value: "partly_right", label: "Partly right" },
  { value: "off", label: "Off" },
  { value: "useful", label: "Useful" },
  { value: "not_useful", label: "Not useful" },
  { value: "unclear", label: "Unclear" },
  { value: "not_happened_yet", label: "Not happened yet" },
];

function riskTone(riskLevel: string) {
  if (riskLevel === "high") return "blocked";
  if (riskLevel === "medium") return "planned";
  return "ready";
}

function claimTitle(type: ClaimDraft["claimType"]) {
  const titles: Record<ClaimDraft["claimType"], string> = {
    risk_window: "Risk window",
    opportunity_window: "Opportunity window",
    friction_signal: "Friction signal",
    coordination_signal: "Coordination signal",
  };
  return titles[type];
}

function eventLabel(event: SimulationEventDraft) {
  if (event.eventType === "graph_freeze") return "Graph freeze";
  if (event.eventType === "avoidance") return "Avoidance";
  if (event.eventType === "cooperation") return "Cooperation";
  if (event.eventType === "direct_conflict") return "Direct conflict";
  if (event.eventType === "disclosure") return "Disclosure";
  if (event.eventType === "resource_competition") return "Resource competition";
  if (event.eventType === "support") return "Support";
  if (event.eventType === "opportunity_signal") return "Opportunity signal";
  if (event.eventType === "information_gap_widening") {
    return "Information gap widening";
  }
  if (event.eventType === "relation_pressure") return "Relation pressure";
  if (event.eventType === "agent_signal") return "Agent signal";
  return "Empty event";
}

function formatDelta(event: SimulationEventDraft) {
  const entries = Object.entries(event.edgeWeightDeltas).flatMap(([edgeId, delta]) =>
    Object.entries(delta).map(
      ([key, value]) =>
        `${edgeId} / ${key} ${value && value > 0 ? "+" : ""}${value}`,
    ),
  );
  return entries.length ? entries : ["No edge weight delta recorded."];
}

export default function ReportsPage() {
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [simulationRun] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.simulations.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [agentEcology] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.agentProfiles.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [relationGraph] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.relationGraphs.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [ledger, setLedger] = useState<ClaimLedgerDraft | null>(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    const runResult = seed ? repos.simulations.load(seed.id) : null;
    const run = runResult?.ok ? runResult.data : null;
    if (!seed || !run) return null;
    const result = repos.reports.load(seed.id);
    return (result.ok ? result.data : null) ?? buildClaimLedgerDraft(seed.id, run);
  });
  const [feedbackLedger, setFeedbackLedger] =
    useState<FeedbackLedgerDraft | null>(() => {
      const seedResult = repos.seedContexts.load();
      const seed = seedResult.ok ? seedResult.data : null;
      const runResult = seed ? repos.simulations.load(seed.id) : null;
      const run = runResult?.ok ? runResult.data : null;
      if (!seed || !run) return null;
      const result = repos.feedback.load(seed.id);
      return (
        (result.ok ? result.data : null) ??
        buildEmptyFeedbackLedgerDraft(seed.id, run.id)
      );
    });
  const [selectedClaimId, setSelectedClaimId] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [feedbackTarget, setFeedbackTarget] =
    useState<FeedbackTargetType>("claim");
  const [feedbackRating, setFeedbackRating] =
    useState<FeedbackRating>("partly_right");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [message, setMessage] = useState("");
  const [paidMode, setPaidMode] = useState(false);
  const [entitlementLedger] = useState(() => loadEntitlementLedger());

  const rawClaims = ledger?.claims ?? emptyClaims;
  const safetyDecision = useMemo(
    () =>
      seedContext
        ? verifySafety({
            seedContext,
            agents: agentEcology?.agents,
            relationEdges: relationGraph?.edges,
            simulationRun,
            claims: rawClaims,
          })
        : null,
    [agentEcology, rawClaims, relationGraph, seedContext, simulationRun],
  );
  const claims = safetyDecision
    ? filterClaimsBySafety(rawClaims, safetyDecision)
    : rawClaims;
  const selectedClaim = useMemo(
    () => claims.find((claim) => claim.id === selectedClaimId) ?? claims[0] ?? null,
    [claims, selectedClaimId],
  );
  const selectedEvent = useMemo(() => {
    const evidenceIds = selectedClaim?.evidenceEventIds ?? [];
    return (
      simulationRun?.events.find((event) => event.id === selectedEventId) ??
      simulationRun?.events.find((event) => evidenceIds.includes(event.id)) ??
      simulationRun?.events[0] ??
      null
    );
  }, [selectedClaim, selectedEventId, simulationRun]);
  const report = useMemo(() => {
    if (!seedContext || !simulationRun) return null;
    return buildReportEngineV1({
      seedContext,
      simulationRun,
      claims,
      agents: agentEcology?.agents ?? [],
      relationEdges: relationGraph?.edges ?? [],
    });
  }, [agentEcology, claims, relationGraph, seedContext, simulationRun]);
  const entitlementDecision = useMemo(() => {
    if (!report) return null;
    return evaluateReportEntitlement({
      ledger: entitlementLedger,
      report,
      safetyLevel: safetyDecision?.safetyLevel ?? "unchecked",
    });
  }, [entitlementLedger, report, safetyDecision]);
  const paidReportVisible = paidMode && Boolean(entitlementDecision?.canViewPaidReport);
  const reportClaims = report
    ? paidReportVisible
      ? report.paidReport.fullClaims
      : report.freePreview.summaryClaims
    : emptyClaims;
  const reportEvidenceEvents = report
    ? paidReportVisible
      ? report.paidReport.fullEventChain
      : report.paidReport.fullEventChain.filter((event) =>
          report.freePreview.summaryClaimIds.some((claimId) =>
            event.claimIds.includes(claimId),
          ),
        )
    : [];

  const highlightedAgentIds = useMemo(
    () => selectedClaim?.relatedAgentIds ?? [],
    [selectedClaim],
  );
  const highlightedEdgeIds = useMemo(
    () => selectedClaim?.relatedRelationEdgeIds ?? [],
    [selectedClaim],
  );
  const highlightedEventIds = useMemo(
    () => selectedClaim?.evidenceEventIds ?? [],
    [selectedClaim],
  );
  const feedbackTargetId = useMemo(() => {
    if (feedbackTarget === "claim") return selectedClaim?.id ?? "";
    if (feedbackTarget === "agent") return highlightedAgentIds[0] ?? "";
    if (feedbackTarget === "relation_edge") return highlightedEdgeIds[0] ?? "";
    if (feedbackTarget === "strategy") return simulationRun?.id ?? "";
    return seedContext?.id ?? "";
  }, [
    feedbackTarget,
    highlightedAgentIds,
    highlightedEdgeIds,
    selectedClaim,
    seedContext,
    simulationRun,
  ]);

  function saveLedger() {
    if (!ledger) return;
    const result = repos.reports.save(ledger);
    if (!result.ok) {
      setMessage(`Save failed: ${result.errorCode}`);
      return;
    }
    setMessage("Result Sandbox saved. Claims remain tied to evidence_event_ids.");
  }

  function rebuildLedger() {
    if (!seedContext || !simulationRun) return;
    const nextLedger = buildClaimLedgerDraft(seedContext.id, simulationRun);
    const result = repos.reports.save(nextLedger);
    if (!result.ok) {
      setMessage(`Save failed: ${result.errorCode}`);
      return;
    }
    setLedger(nextLedger);
    setSelectedClaimId("");
    setSelectedEventId("");
    setMessage("Rebuilt claims from the current Event Log.");
  }

  function saveFeedback() {
    if (!seedContext || !simulationRun || !feedbackLedger || !feedbackTargetId) {
      setMessage("Select a claim, agent, edge, or run target before saving feedback.");
      return;
    }

    const entry = buildFeedbackDraft({
      seedContextId: seedContext.id,
      simulationRunId: simulationRun.id,
      targetType: feedbackTarget,
      targetId: feedbackTargetId,
      rating: feedbackRating,
      note: feedbackNote,
    });
    const nextLedger = {
      ...feedbackLedger,
      feedback: [entry, ...feedbackLedger.feedback].slice(0, 80),
      updatedAt: new Date().toISOString(),
    };
    const result = repos.feedback.save(nextLedger);
    if (!result.ok) {
      setMessage(`Save failed: ${result.errorCode}`);
      return;
    }
    setFeedbackLedger(nextLedger);
    saveCalibrationProfile(buildCalibrationProfile(nextLedger));
    setFeedbackNote("");
    setMessage(
      "Feedback calibration saved locally. It generated a CalibrationProfile for the next run and did not rewrite claims or events.",
    );
  }

  if (!seedContext || !simulationRun || !ledger) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">Sandbox data required</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            Generate a local run with Event Log first.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            Result Sandbox only reads frozen Agents, Relation Edges, Simulation
            Ticks, Event Logs, and Claims. Without event evidence, no claim is
            shown.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <TrialSampleButton className="rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white">
              Load trial sample
            </TrialSampleButton>
            <Link
              href="/app/simulation/running"
              className="rounded-md border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#11150f]"
            >
              Open Event Log
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  if (safetyDecision?.safetyLevel === "blocked") {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl space-y-5">
          <SafetyDowngradeNotice
            decision={safetyDecision}
            title="Report rendering stopped by SafetyVerifier"
          />
          <Link
            href="/app/simulation/running"
            className="inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Event Log
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone="ready">Result sandbox</StatusPill>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Your situation is now an evidence-linked relationship sandbox.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            Each claim card traces back to Event Logs, related Agents, and
            Relation Edges. This is a scenario simulation surface, not a final
            certainty statement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveLedger}
            className="rounded-md bg-[#11150f] px-4 py-2 text-sm font-semibold text-white"
          >
            Save result
          </button>
          <button
            type="button"
            onClick={rebuildLedger}
            className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
          >
            Rebuild from events
          </button>
        </div>
      </div>

      {message ? (
        <p className="mb-5 rounded-md border border-[#568262]/20 bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3d]">
          {message}
        </p>
      ) : null}
      {safetyDecision && safetyDecision.safetyLevel !== "safe" ? (
        <div className="mb-5">
          <SafetyDowngradeNotice
            decision={safetyDecision}
            title="Report safety restrictions"
          />
        </div>
      ) : null}

      {report ? (
        <section className="mb-6 space-y-5">
          <ReportSummary report={report} paidMode={paidReportVisible} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPaidMode(false)}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                !paidMode
                  ? "bg-[#11150f] text-white"
                  : "border border-black/10 bg-white text-[#11150f]"
              }`}
            >
              Free preview
            </button>
            <button
              type="button"
              onClick={() => {
                if (entitlementDecision?.canViewPaidReport) {
                  setPaidMode(true);
                }
              }}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                paidReportVisible
                  ? "bg-[#11150f] text-white"
                  : "border border-black/10 bg-white text-[#11150f]"
              }`}
            >
              Full report depth
            </button>
          </div>
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <main className="space-y-4">
              {reportClaims.length ? (
                reportClaims.map((claim) => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    selected={selectedClaim?.id === claim.id}
                    onSelect={(claimId) => {
                      setSelectedClaimId(claimId);
                      const nextClaim = claims.find((item) => item.id === claimId);
                      setSelectedEventId(nextClaim?.evidenceEventIds[0] ?? "");
                    }}
                  />
                ))
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                  No evidence-backed Claim is available. Claims without
                  evidence_event_ids are hidden by Report Engine v1.
                </p>
              )}
            </main>
            <aside className="space-y-5">
              <EvidenceDrawer
                claim={selectedClaim}
                events={reportEvidenceEvents}
              />
              {paidReportVisible ? (
                <StrategyOptions
                  options={report.paidReport.strategyOptions}
                  selectedClaimId={selectedClaim?.id ?? ""}
                />
              ) : entitlementDecision ? (
                <PaidUnlockBoundary decision={entitlementDecision} />
              ) : null}
            </aside>
          </section>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="space-y-6">
          <section className="grid gap-4 md:grid-cols-5">
            <Metric label="Agents" value={agentEcology?.agents.length ?? simulationRun.agentIds.length} />
            <Metric label="Edges" value={relationGraph?.edges.length ?? simulationRun.relationEdgeIds.length} />
            <Metric label="Events" value={simulationRun.events.length} />
            <Metric label="Claims" value={claims.length} />
            <Metric label="Feedback" value={feedbackLedger?.feedback.length ?? 0} />
          </section>

          {relationGraph?.edges.length ? (
            <GraphSummaryCards edges={relationGraph.edges} />
          ) : null}

          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-base font-semibold text-[#11150f]">
                  Result cards
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  Select a card to highlight its Agents, Relation Edges, and
                  evidence events.
                </p>
              </div>
              <StatusPill tone={claims.length ? "ready" : "blocked"}>
                evidence linked
              </StatusPill>
            </div>

            {claims.length === 0 ? (
              <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                No claim card is available yet. Run Simulation Tick first so the
                Event Log contains relation evidence.
              </p>
            ) : (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {claims.map((claim) => (
                  <button
                    key={claim.id}
                    type="button"
                    onClick={() => {
                      setSelectedClaimId(claim.id);
                      setSelectedEventId(claim.evidenceEventIds[0] ?? "");
                    }}
                    className={`rounded-lg border p-5 text-left transition ${
                      selectedClaim?.id === claim.id
                        ? "border-[#568262]/50 bg-[#eef5ee]"
                        : "border-black/8 bg-[#f7f8f4] hover:border-[#568262]/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                          {claimTitle(claim.claimType)}
                        </p>
                        <h3 className="mt-2 text-base font-semibold leading-7 text-[#11150f]">
                          {claim.summary}
                        </h3>
                      </div>
                      <StatusPill tone={riskTone(claim.riskLevel)}>
                        {claim.riskLevel}
                      </StatusPill>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <MiniTag>confidence {claim.confidence}%</MiniTag>
                      <MiniTag>events {claim.evidenceEventIds.length}</MiniTag>
                      <MiniTag>edges {claim.relatedRelationEdgeIds.length}</MiniTag>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.55fr)]">
            <Timeline
              events={simulationRun.events}
              highlightedEventIds={highlightedEventIds}
              selectedEventId={selectedEvent?.id ?? ""}
              onSelect={(eventId) => setSelectedEventId(eventId)}
            />
            <AgentGraphSummary
              agents={agentEcology?.agents ?? []}
              edges={relationGraph?.edges ?? []}
              highlightedAgentIds={highlightedAgentIds}
              highlightedEdgeIds={highlightedEdgeIds}
            />
          </section>
        </main>

        <aside className="h-fit space-y-5">
          <section className="rounded-lg border border-black/8 bg-[#11150f] p-6 text-white shadow-[0_24px_80px_rgba(17,21,15,0.14)]">
            <h2 className="text-sm font-semibold text-[#b7e6c6]">
              Evidence chain
            </h2>
            {selectedClaim ? (
              <div className="mt-5 space-y-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">
                    selected claim
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/72">
                    {selectedClaim.summary}
                  </p>
                </div>
                <EvidenceList title="evidence_event_ids" values={selectedClaim.evidenceEventIds} />
                <EvidenceCount count={selectedClaim.evidenceEventIds.length} />
                <EvidenceList title="related_agent_ids" values={selectedClaim.relatedAgentIds} />
                <EvidenceList title="related_relation_edge_ids" values={selectedClaim.relatedRelationEdgeIds} />
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-white/62">
                Select a claim card to inspect evidence.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-5">
            <h2 className="text-sm font-semibold text-[#11150f]">
              Event detail
            </h2>
            {selectedEvent ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                      {eventLabel(selectedEvent)} / {selectedEvent.timeLabel}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#62695d]">
                      {selectedEvent.summary}
                    </p>
                  </div>
                  <StatusPill tone="planned">{selectedEvent.confidence}%</StatusPill>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                    edge deltas
                  </div>
                  <div className="mt-2 space-y-1">
                    {formatDelta(selectedEvent).map((line) => (
                      <code key={line} className="block break-all text-xs text-[#62695d]">
                        {line}
                      </code>
                    ))}
                  </div>
                </div>
                <Snapshot title="before" value={selectedEvent.beforeState.weights} />
                <Snapshot title="after" value={selectedEvent.afterState.weights} />
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[#62695d]">
                Select a timeline event to inspect before/after.
              </p>
            )}
          </section>

          <FeedbackPanel
            target={feedbackTarget}
            targetId={feedbackTargetId}
            rating={feedbackRating}
            note={feedbackNote}
            ledger={feedbackLedger}
            onTargetChange={setFeedbackTarget}
            onRatingChange={setFeedbackRating}
            onNoteChange={setFeedbackNote}
            onSave={saveFeedback}
          />

          <section className="rounded-lg border border-black/8 bg-[#dfe9dc] p-5">
            <h2 className="text-sm font-semibold text-[#11150f]">
              Paid unlock boundary
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#3f483d]">
              A paid layer may reveal deeper evidence, complete event chains,
              NPC paths, and strategy depth. It cannot change claim direction or
              make unsupported claims stronger.
            </p>
          </section>
        </aside>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_16px_48px_rgba(17,21,15,0.05)]">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-[#11150f]">{value}</div>
    </div>
  );
}

function FeedbackPanel({
  target,
  targetId,
  rating,
  note,
  ledger,
  onTargetChange,
  onRatingChange,
  onNoteChange,
  onSave,
}: {
  target: FeedbackTargetType;
  targetId: string;
  rating: FeedbackRating;
  note: string;
  ledger: FeedbackLedgerDraft | null;
  onTargetChange: (target: FeedbackTargetType) => void;
  onRatingChange: (rating: FeedbackRating) => void;
  onNoteChange: (note: string) => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#11150f]">
            Feedback calibration
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            Mark what felt right or wrong. Feedback is stored as a calibration
            ledger and never changes evidence-backed claims directly.
          </p>
        </div>
        <StatusPill tone={ledger?.feedback.length ? "ready" : "planned"}>
          {ledger?.feedback.length ?? 0} saved
        </StatusPill>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            target
          </label>
          <select
            value={target}
            onChange={(event) =>
              onTargetChange(event.target.value as FeedbackTargetType)
            }
            className="mt-2 w-full rounded-md border border-black/10 bg-[#f7f8f4] px-3 py-2 text-sm text-[#11150f]"
          >
            {feedbackTargets.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <code className="mt-2 block break-all rounded bg-[#f7f8f4] px-3 py-2 text-xs text-[#7d8578]">
            {targetId || "Select evidence-linked content first."}
          </code>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            rating
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {feedbackRatings.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onRatingChange(item.value)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  rating === item.value
                    ? "border-[#568262]/50 bg-[#eef5ee] text-[#2f5d3d]"
                    : "border-black/10 bg-white text-[#52594d] hover:border-[#568262]/30"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            short note
          </label>
          <textarea
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            maxLength={280}
            rows={3}
            placeholder="What should the next run calibrate?"
            className="mt-2 w-full resize-none rounded-md border border-black/10 bg-[#f7f8f4] px-3 py-2 text-sm leading-6 text-[#11150f] outline-none focus:border-[#568262]"
          />
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={!targetId}
          className="w-full rounded-md bg-[#11150f] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9aa096]"
        >
          Save calibration feedback
        </button>

        {ledger?.feedback.length ? (
          <div className="space-y-2 border-t border-black/8 pt-4">
            {ledger.feedback.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="rounded-md border border-black/8 bg-[#f7f8f4] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                    {entry.targetType}
                  </span>
                  <span className="text-xs font-semibold text-[#568262]">
                    {entry.rating}
                  </span>
                </div>
                <code className="mt-2 block break-all text-[11px] text-[#7d8578]">
                  {entry.targetId}
                </code>
                {entry.note ? (
                  <p className="mt-2 text-sm leading-6 text-[#62695d]">
                    {entry.note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MiniTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-black/8 bg-white px-2 py-1 text-xs text-[#3f483d]">
      {children}
    </span>
  );
}

function Timeline({
  events,
  highlightedEventIds,
  selectedEventId,
  onSelect,
}: {
  events: SimulationEventDraft[];
  highlightedEventIds: string[];
  selectedEventId: string;
  onSelect: (eventId: string) => void;
}) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <h2 className="text-sm font-semibold text-[#11150f]">Timeline</h2>
      <div className="mt-4 space-y-3">
        {events.map((event) => {
          const highlighted = highlightedEventIds.includes(event.id);
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelect(event.id)}
              className={`w-full rounded-md border p-4 text-left transition ${
                selectedEventId === event.id
                  ? "border-[#568262]/50 bg-[#eef5ee]"
                  : highlighted
                    ? "border-[#d49b4a]/40 bg-[#fff8ed]"
                    : "border-black/8 bg-[#f7f8f4] hover:border-[#568262]/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#11150f]">
                  Tick {event.tickIndex} / {eventLabel(event)}
                </span>
                <span className="text-xs font-semibold text-[#568262]">
                  {event.timeLabel}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#62695d]">
                {event.summary}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AgentGraphSummary({
  agents,
  edges,
  highlightedAgentIds,
  highlightedEdgeIds,
}: {
  agents: AgentProfileDraft[];
  edges: RelationEdgeDraft[];
  highlightedAgentIds: string[];
  highlightedEdgeIds: string[];
}) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#11150f]">
            Agent / Graph summary
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            Graph data remains read-only. Highlighting comes from the selected
            claim evidence chain.
          </p>
        </div>
        <StatusPill tone="planned">{edges.length} edges</StatusPill>
      </div>

      <div className="mt-4 space-y-2">
        {agents.slice(0, 7).map((agent) => {
          const highlighted = highlightedAgentIds.includes(agent.id);
          return (
            <div
              key={agent.id}
              className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
                highlighted
                  ? "border-[#568262]/50 bg-[#eef5ee]"
                  : "border-black/8 bg-[#f7f8f4]"
              }`}
            >
              <div>
                <div className="text-sm font-semibold text-[#11150f]">
                  {agent.label}
                </div>
                <div className="text-xs text-[#7d8578]">{agent.agentType}</div>
              </div>
              <span className="text-xs font-semibold text-[#568262]">
                {agent.confidence}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        {edges.slice(0, 7).map((edge) => {
          const highlighted = highlightedEdgeIds.includes(edge.id);
          return (
            <div
              key={edge.id}
              className={`rounded-md border px-3 py-2 ${
                highlighted
                  ? "border-[#d49b4a]/45 bg-[#fff8ed]"
                  : "border-black/8 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#11150f]">
                  {edge.relationshipType}
                </span>
                <span className="text-xs font-semibold text-[#568262]">
                  {edge.confidence}%
                </span>
              </div>
              <code className="mt-1 block break-all text-[11px] text-[#7d8578]">
                {edge.id}
              </code>
            </div>
          );
        })}
      </div>

      <Link
        href="/app/new/graph"
        className="mt-4 inline-flex w-full justify-center rounded-md border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#11150f]"
      >
        Open read-only graph
      </Link>
    </section>
  );
}

function EvidenceList({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">
        {title}
      </div>
      <div className="mt-2 space-y-1">
        {values.map((value) => (
          <code key={value} className="block break-all text-xs text-white/54">
            {value}
          </code>
        ))}
      </div>
    </div>
  );
}

function EvidenceCount({ count }: { count: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">
        evidence count
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{count}</div>
    </div>
  );
}

function Snapshot({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {title}
      </div>
      <pre className="mt-2 max-h-52 overflow-auto rounded-md bg-[#f7f8f4] p-3 text-xs leading-5 text-[#62695d]">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
