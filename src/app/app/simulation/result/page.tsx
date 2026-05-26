"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { GraphSummaryCards } from "@/components/graph/graph-summary-cards";
import { RelationGraph } from "@/components/graph/relation-graph";
import { ClaimCard } from "@/components/report/claim-card";
import { EvidenceDrawer } from "@/components/report/evidence-drawer";
import { ReportSummary } from "@/components/report/report-summary";
import { StrategyOptions } from "@/components/report/strategy-options";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import {
  AgentRefsView,
  ConfidenceExplanation,
  EdgeDeltaView,
  EvidenceRefsView,
  RelationEdgeRefsView,
  TimelineFeed,
} from "@/components/simulation/event-log";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { buildClaimLedgerDraft } from "@/lib/claims/build";
import {
  buildCalibrationProfile,
  saveCalibrationProfile,
} from "@/lib/calibration/calibration-engine";
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
import type { CalibrationProfile } from "@/lib/calibration/calibration-types";
import type { ClaimDraft, ClaimLedgerDraft } from "@/types/claim";
import type {
  FeedbackCorrectionConfidence,
  FeedbackFieldCorrection,
  FeedbackLedgerDraft,
  FeedbackRating,
  FeedbackTargetType,
} from "@/types/feedback";
import type { RelationEdgeDraft } from "@/types/relation-edge";
import type { ReportBranchComparison } from "@/types/report";

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

const agentCorrectionFields = [
  "role",
  "relationshipToUser",
  "motivation.primaryGoal",
  "motivation.fear",
  "motivation.avoidancePattern",
  "resources.authority",
  "resources.information",
  "resources.socialCapital",
  "resources.emotionalLeverage",
  "behaviorPolicy.actionSpeed",
  "behaviorPolicy.initiative",
  "behaviorPolicy.cooperationBias",
  "behaviorPolicy.communicationStyle",
  "state.stress",
  "state.trustInUser",
  "state.hostilityToUser",
  "state.currentIntention",
  "traits",
  "constraints",
  "missingFields",
];

const relationCorrectionFields = [
  "relationshipType",
  "weights.trust",
  "weights.hostility",
  "weights.dependency",
  "weights.attraction",
  "weights.competition",
  "weights.informationGap",
  "weights.resourceControl",
  "weights.emotionalDebt",
  "trend.volatility",
  "trend.trustDelta3Ticks",
  "trend.hostilityDelta3Ticks",
];

const correctionFieldLabels: Record<string, string> = {
  role: "Role / 角色",
  relationshipToUser: "Relationship to user / 与用户关系",
  "motivation.primaryGoal": "Primary goal / 主要目标",
  "motivation.fear": "Concern or fear / 主要顾虑",
  "motivation.avoidancePattern": "Avoidance pattern / 回避模式",
  "resources.authority": "Authority resource / 权限资源",
  "resources.information": "Information resource / 信息资源",
  "resources.socialCapital": "Social capital / 社交资源",
  "resources.emotionalLeverage": "Emotional leverage / 情绪影响力",
  "behaviorPolicy.actionSpeed": "Action speed / 行动速度",
  "behaviorPolicy.initiative": "Initiative / 主动性",
  "behaviorPolicy.cooperationBias": "Cooperation bias / 合作倾向",
  "behaviorPolicy.communicationStyle": "Communication style / 沟通风格",
  "state.stress": "Stress state / 压力状态",
  "state.trustInUser": "Trust in user / 对用户信任",
  "state.hostilityToUser": "Hostility to user / 对用户冲突压力",
  "state.currentIntention": "Current intention label / 当前意图标签",
  traits: "Traits / 特征",
  constraints: "Constraints / 约束",
  missingFields: "Missing fields / 缺失信息",
  relationshipType: "Relationship type / 关系类型",
  "weights.trust": "Trust weight / 信任权重",
  "weights.hostility": "Hostility weight / 冲突压力权重",
  "weights.dependency": "Dependency weight / 依赖权重",
  "weights.attraction": "Attraction weight / 吸引权重",
  "weights.competition": "Competition weight / 竞争权重",
  "weights.informationGap": "Information gap weight / 信息差权重",
  "weights.resourceControl": "Resource control weight / 资源控制权重",
  "weights.emotionalDebt": "Emotional debt weight / 情绪债务权重",
  "trend.volatility": "Volatility trend / 波动性趋势",
  "trend.trustDelta3Ticks": "Trust trend / 信任趋势",
  "trend.hostilityDelta3Ticks": "Hostility trend / 冲突压力趋势",
};

function correctionFieldLabel(field: string) {
  return correctionFieldLabels[field] ?? field.replaceAll(".", " -> ");
}

const correctionConfidenceOptions: {
  value: FeedbackCorrectionConfidence;
  label: string;
}[] = [
  { value: "low", label: "Low certainty" },
  { value: "medium", label: "Medium certainty" },
  { value: "high", label: "High certainty" },
];

type FeedbackTargetOption = {
  value: string;
  label: string;
  detail: string;
};

function truncateLabel(value: string, max = 82) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

function edgeLabel(edge: RelationEdgeDraft, agents: AgentProfileDraft[]) {
  const from = agents.find((agent) => agent.id === edge.fromAgentId)?.label;
  const to = agents.find((agent) => agent.id === edge.toAgentId)?.label;
  return `${from ?? edge.fromAgentId} -> ${to ?? edge.toAgentId}`;
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
  const [feedbackTargetId, setFeedbackTargetId] = useState("");
  const [feedbackRating, setFeedbackRating] =
    useState<FeedbackRating>("partly_right");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [agentCorrectionField, setAgentCorrectionField] = useState(
    agentCorrectionFields[0],
  );
  const [agentCorrectionValue, setAgentCorrectionValue] = useState("");
  const [agentCorrectionConfidence, setAgentCorrectionConfidence] =
    useState<FeedbackCorrectionConfidence>("medium");
  const [relationCorrectionField, setRelationCorrectionField] = useState(
    relationCorrectionFields[0],
  );
  const [relationCorrectionValue, setRelationCorrectionValue] = useState("");
  const [relationCorrectionConfidence, setRelationCorrectionConfidence] =
    useState<FeedbackCorrectionConfidence>("medium");
  const [message, setMessage] = useState("");
  const [paidMode, setPaidMode] = useState(false);

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
  const claims = (
    safetyDecision ? filterClaimsBySafety(rawClaims, safetyDecision) : rawClaims
  ).filter((claim) => claim.evidenceEventIds.length > 0);
  const selectedClaim = useMemo(
    () =>
      selectedClaimId
        ? claims.find((claim) => claim.id === selectedClaimId) ?? null
        : null,
    [claims, selectedClaimId],
  );
  const selectedEvent = useMemo(() => {
    const evidenceIds = selectedClaim?.evidenceEventIds ?? [];
    return (
      simulationRun?.events.find((event) => event.id === selectedEventId) ??
      simulationRun?.events.find((event) => evidenceIds.includes(event.id)) ??
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
  const fullDepthAllowed =
    safetyDecision?.safetyLevel !== "blocked" &&
    safetyDecision?.safetyLevel !== "downgraded";
  const paidReportVisible = paidMode && fullDepthAllowed;
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
  const feedbackTargetOptions = useMemo<FeedbackTargetOption[]>(() => {
    if (feedbackTarget === "claim") {
      return claims.map((claim) => ({
        value: claim.id,
        label: truncateLabel(claim.summary),
        detail: `${claim.riskLevel} risk / ${claim.evidenceEventIds.length} evidence events`,
      }));
    }

    if (feedbackTarget === "agent") {
      return (agentEcology?.agents ?? []).map((agent) => ({
        value: agent.id,
        label: agent.label,
        detail: `${agent.agentType} / confidence ${agent.confidence}%`,
      }));
    }

    if (feedbackTarget === "relation_edge") {
      const agents = agentEcology?.agents ?? [];
      return (relationGraph?.edges ?? []).map((edge) => ({
        value: edge.id,
        label: edgeLabel(edge, agents),
        detail: `${edge.relationshipType} / confidence ${edge.confidence}%`,
      }));
    }

    if (feedbackTarget === "strategy") {
      const options = paidReportVisible
        ? report?.paidReport.strategyOptions ?? []
        : [];
      return options.map((option) => ({
        value: option.id,
        label: option.title,
        detail: `${option.strategyType} / claim ${option.claimId}`,
      }));
    }

    return seedContext
      ? [
          {
            value: seedContext.id,
            label: "Overall run",
            detail: `${simulationRun?.events.length ?? 0} events / ${claims.length} evidence-backed claims`,
          },
        ]
      : [];
  }, [
    agentEcology,
    claims,
    feedbackTarget,
    paidReportVisible,
    relationGraph,
    report,
    seedContext,
    simulationRun,
  ]);
  const resolvedFeedbackTargetId =
    feedbackTargetId || feedbackTargetOptions[0]?.value || "";
  const calibrationProfile = useMemo(
    () => (feedbackLedger ? buildCalibrationProfile(feedbackLedger) : null),
    [feedbackLedger],
  );

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
    if (
      !seedContext ||
      !simulationRun ||
      !feedbackLedger ||
      !resolvedFeedbackTargetId
    ) {
      setMessage("Select a claim, agent, edge, or run target before saving feedback.");
      return;
    }
    const agentCorrection: FeedbackFieldCorrection | undefined =
      feedbackTarget === "agent" && agentCorrectionValue.trim()
        ? {
            field: agentCorrectionField,
            suggestedValue: agentCorrectionValue.trim(),
            confidence: agentCorrectionConfidence,
          }
        : undefined;
    const relationCorrection: FeedbackFieldCorrection | undefined =
      feedbackTarget === "relation_edge" && relationCorrectionValue.trim()
        ? {
            field: relationCorrectionField,
            suggestedValue: relationCorrectionValue.trim(),
            confidence: relationCorrectionConfidence,
          }
        : undefined;

    const entry = buildFeedbackDraft({
      seedContextId: seedContext.id,
      simulationRunId: simulationRun.id,
      targetType: feedbackTarget,
      targetId: resolvedFeedbackTargetId,
      rating: feedbackRating,
      note: feedbackNote,
      agentCorrection,
      relationCorrection,
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
    setAgentCorrectionValue("");
    setRelationCorrectionValue("");
    setMessage(
      "Feedback calibration saved locally for future runs only. Historical Event Logs, Claims, and Reports were not rewritten.",
    );
  }

  function changeFeedbackTarget(nextTarget: FeedbackTargetType) {
    setFeedbackTarget(nextTarget);
    setFeedbackTargetId("");
  }

  function selectClaim(claimId: string) {
    const nextClaim = claims.find((item) => item.id === claimId);
    setSelectedClaimId(claimId);
    setSelectedEventId(nextClaim?.evidenceEventIds[0] ?? "");
  }

  function selectEvent(eventId: string) {
    setSelectedEventId(eventId);
    if (
      selectedClaim &&
      !selectedClaim.evidenceEventIds.includes(eventId)
    ) {
      setSelectedClaimId("");
    }
  }

  function selectEdge(edgeId: string) {
    const event = simulationRun?.events.find((item) =>
      item.relationEdgeIds.includes(edgeId),
    );
    setSelectedEventId(event?.id ?? "");
    if (event && selectedClaim?.evidenceEventIds.includes(event.id)) {
      return;
    }
    setSelectedClaimId("");
  }

  if (!seedContext || !simulationRun || !ledger) {
    return (
      <AppShell>
        <SurfaceCard emphasis="strong" className="mx-auto max-w-3xl p-8">
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
            <TrialSampleButton className="mf-button mf-button-primary px-5 py-3">
              Load trial sample
            </TrialSampleButton>
            <ButtonLink href="/app/simulation/running" variant="secondary" className="px-5 py-3">
              Open Event Log
            </ButtonLink>
          </div>
        </SurfaceCard>
      </AppShell>
    );
  }

  if (safetyDecision?.safetyLevel === "blocked") {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl space-y-5">
          <SafetyDowngradeNotice
            decision={safetyDecision}
            title="Result Sandbox is paused for safety"
          />
          <ButtonLink
            href="/app/simulation/running"
            className="px-5 py-3"
          >
            Back to Event Log
          </ButtonLink>
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
          <Button
            type="button"
            onClick={saveLedger}
          >
            Save result
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={rebuildLedger}
          >
            Rebuild from events
          </Button>
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
                if (fullDepthAllowed) {
                  setPaidMode(true);
                }
              }}
              disabled={!fullDepthAllowed}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                paidReportVisible
                  ? "bg-[#11150f] text-white"
                  : "border border-black/10 bg-white text-[#11150f] disabled:cursor-not-allowed disabled:opacity-55"
              }`}
            >
              Local full depth
            </button>
          </div>
          <p className="mt-2 text-xs text-[#7d8578]">
            Local full depth shows more evidence and strategy detail - same
            claims, same confidence, same risk level.
          </p>
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <main className="space-y-4">
              {reportClaims.length ? (
                reportClaims.map((claim) => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    selected={selectedClaim?.id === claim.id}
                    onSelect={selectClaim}
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
              ) : (
                <LocalFullDepthBoundary
                  allowed={fullDepthAllowed}
                  onOpen={() => setPaidMode(true)}
                />
              )}
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
            <Metric label="Claims" value={report?.invariant.claimIds.length ?? claims.length} />
            <Metric label="Feedback" value={feedbackLedger?.feedback.length ?? 0} />
          </section>

          {relationGraph?.edges.length ? (
            <GraphSummaryCards
              edges={relationGraph.edges}
              agents={agentEcology?.agents ?? []}
              onSelectEdge={selectEdge}
            />
          ) : null}

          <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.55fr)]">
            <TimelineFeed
              ticks={simulationRun.ticks}
              events={simulationRun.events}
              agents={agentEcology?.agents ?? []}
              edges={relationGraph?.edges ?? []}
              highlightedEventIds={highlightedEventIds}
              selectedEventId={selectedEvent?.id ?? ""}
              onSelectEvent={selectEvent}
              title="Timeline Feed"
              description="Click an Event Log entry to inspect its agents, relation edges, confidence, evidence refs, and edge deltas."
            />
            <AgentGraphSummary
              agents={agentEcology?.agents ?? []}
              edges={relationGraph?.edges ?? []}
              highlightedAgentIds={highlightedAgentIds}
              highlightedEdgeIds={highlightedEdgeIds}
            />
          </section>

          {report?.paidReport.branchComparison.length ? (
            <BranchComparison
              items={report.paidReport.branchComparison}
              selectedClaimId={selectedClaim?.id ?? ""}
            />
          ) : null}

          {relationGraph?.edges.length ? (
            <details className="mt-6 rounded-lg border border-black/8 bg-white">
              <summary className="cursor-pointer p-5 text-sm font-semibold text-[#11150f]">
                Relation Graph snapshot ({relationGraph.edges.length} edges)
              </summary>
              <div className="border-t border-black/8 p-4">
                <RelationGraph
                  agents={agentEcology?.agents ?? []}
                  edges={relationGraph.edges}
                  selectedEdgeId={highlightedEdgeIds[0] ?? ""}
                  locked={relationGraph.graphLocked}
                  onSelectEdge={selectEdge}
                />
              </div>
            </details>
          ) : null}
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
                      {selectedEvent.eventType.replaceAll("_", " ")} / {selectedEvent.timeLabel}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#62695d]">
                      {selectedEvent.summary}
                    </p>
                  </div>
                  <StatusPill tone="planned">{selectedEvent.confidence}%</StatusPill>
                </div>
                <ConfidenceExplanation value={selectedEvent.confidence} />
                <AgentRefsView
                  agentIds={selectedEvent.involvedAgentIds}
                  agents={agentEcology?.agents ?? []}
                />
                <RelationEdgeRefsView
                  edgeIds={selectedEvent.relationEdgeIds}
                  edges={relationGraph?.edges ?? []}
                  agents={agentEcology?.agents ?? []}
                />
                <EdgeDeltaView event={selectedEvent} />
                <EvidenceRefsView refs={selectedEvent.evidence?.evidenceRefs ?? []} />
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
            targetId={resolvedFeedbackTargetId}
            targetOptions={feedbackTargetOptions}
            rating={feedbackRating}
            note={feedbackNote}
            ledger={feedbackLedger}
            agentCorrectionField={agentCorrectionField}
            agentCorrectionValue={agentCorrectionValue}
            agentCorrectionConfidence={agentCorrectionConfidence}
            relationCorrectionField={relationCorrectionField}
            relationCorrectionValue={relationCorrectionValue}
            relationCorrectionConfidence={relationCorrectionConfidence}
            onTargetChange={changeFeedbackTarget}
            onTargetIdChange={setFeedbackTargetId}
            onRatingChange={setFeedbackRating}
            onNoteChange={setFeedbackNote}
            onAgentCorrectionFieldChange={setAgentCorrectionField}
            onAgentCorrectionValueChange={setAgentCorrectionValue}
            onAgentCorrectionConfidenceChange={setAgentCorrectionConfidence}
            onRelationCorrectionFieldChange={setRelationCorrectionField}
            onRelationCorrectionValueChange={setRelationCorrectionValue}
            onRelationCorrectionConfidenceChange={setRelationCorrectionConfidence}
            onSave={saveFeedback}
          />

          <CalibrationSummary profile={calibrationProfile} />
        </aside>
      </section>
    </AppShell>
  );
}

function LocalFullDepthBoundary({
  allowed,
  onOpen,
}: {
  allowed: boolean;
  onOpen: () => void;
}) {
  return (
    <section className="rounded-lg border border-black/8 bg-[#f7f8f4] p-5">
      <h2 className="text-sm font-semibold text-[#11150f]">
        Local full-depth boundary
      </h2>
      <p className="mt-3 text-sm leading-7 text-[#62695d]">
        Full depth reveals the complete Event Log chain, branch comparison,
        relation deltas, and strategy options. It uses the same claim_id set and
        does not change confidence or risk level.
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={onOpen}
        disabled={!allowed}
        className="mt-4 w-full px-4 py-3"
      >
        Open local full depth
      </Button>
      {!allowed ? (
        <p className="mt-3 text-xs leading-5 text-[#7c5524]">
          Safety restrictions keep this report in preview depth.
        </p>
      ) : null}
    </section>
  );
}

function BranchComparison({
  items,
  selectedClaimId,
}: {
  items: ReportBranchComparison[];
  selectedClaimId: string;
}) {
  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#11150f]">
            Branch comparison
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            Branches start from the same locked graph and differ by self-policy
            strategy. Counts are evidence summaries, not stronger claims.
          </p>
        </div>
        <StatusPill tone="planned">{items.length} branches</StatusPill>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const selected = selectedClaimId
            ? item.claimIds.includes(selectedClaimId)
            : false;
          return (
            <article
              key={item.branchId}
              className={`rounded-md border p-4 ${
                selected
                  ? "border-[#568262]/45 bg-[#eef5ee]"
                  : "border-black/8 bg-[#f7f8f4]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#11150f]">
                  {item.label}
                </h3>
                <span className="text-xs font-semibold text-[#568262]">
                  {item.eventCount} events
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <BranchMetric label="claims" value={item.claimIds.length} />
                <BranchMetric label="risk" value={item.riskSignalCount} />
                <BranchMetric label="support" value={item.supportSignalCount} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BranchMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-black/8 bg-white p-2">
      <div className="text-[11px] uppercase text-[#7d8578]">{label}</div>
      <div className="mt-1 text-base font-semibold text-[#11150f]">{value}</div>
    </div>
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
  targetOptions,
  rating,
  note,
  ledger,
  agentCorrectionField,
  agentCorrectionValue,
  agentCorrectionConfidence,
  relationCorrectionField,
  relationCorrectionValue,
  relationCorrectionConfidence,
  onTargetChange,
  onTargetIdChange,
  onRatingChange,
  onNoteChange,
  onAgentCorrectionFieldChange,
  onAgentCorrectionValueChange,
  onAgentCorrectionConfidenceChange,
  onRelationCorrectionFieldChange,
  onRelationCorrectionValueChange,
  onRelationCorrectionConfidenceChange,
  onSave,
}: {
  target: FeedbackTargetType;
  targetId: string;
  targetOptions: FeedbackTargetOption[];
  rating: FeedbackRating;
  note: string;
  ledger: FeedbackLedgerDraft | null;
  agentCorrectionField: string;
  agentCorrectionValue: string;
  agentCorrectionConfidence: FeedbackCorrectionConfidence;
  relationCorrectionField: string;
  relationCorrectionValue: string;
  relationCorrectionConfidence: FeedbackCorrectionConfidence;
  onTargetChange: (target: FeedbackTargetType) => void;
  onTargetIdChange: (targetId: string) => void;
  onRatingChange: (rating: FeedbackRating) => void;
  onNoteChange: (note: string) => void;
  onAgentCorrectionFieldChange: (field: string) => void;
  onAgentCorrectionValueChange: (value: string) => void;
  onAgentCorrectionConfidenceChange: (
    confidence: FeedbackCorrectionConfidence,
  ) => void;
  onRelationCorrectionFieldChange: (field: string) => void;
  onRelationCorrectionValueChange: (value: string) => void;
  onRelationCorrectionConfidenceChange: (
    confidence: FeedbackCorrectionConfidence,
  ) => void;
  onSave: () => void;
}) {
  const targetHelp =
    target === "agent"
      ? "Use this when an Agent feels mismatched. Corrections become future-run calibration signals, not edits to the stored Agent."
      : target === "relation_edge"
        ? "Use this when the relation reading feels off. Corrections never edit historical edge weights."
        : target === "strategy"
          ? "Use this to mark whether a strategy option was useful for thinking or planning."
          : target === "overall"
            ? "Use this for the run as a whole."
            : "Use this to rate whether an evidence-backed claim felt aligned with the situation.";

  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#11150f]">
            Feedback calibration
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            Mark what felt right or wrong. Feedback affects future runs only and
            never rewrites Event Logs, Claims, Reports, or edge weights.
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
          <p className="mt-2 text-xs leading-5 text-[#7d8578]">{targetHelp}</p>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            evidence-linked item
          </label>
          {targetOptions.length ? (
            <select
              value={targetId}
              onChange={(event) => onTargetIdChange(event.target.value)}
              className="mt-2 w-full rounded-md border border-black/10 bg-[#f7f8f4] px-3 py-2 text-sm text-[#11150f]"
            >
              {targetOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              No item is available for this target yet. Open local full depth to
              give strategy feedback.
            </p>
          )}
          {targetId ? (
            <div className="mt-2 rounded bg-[#f7f8f4] px-3 py-2">
              <code className="block break-all text-xs text-[#7d8578]">
                {targetId}
              </code>
              <p className="mt-1 text-xs leading-5 text-[#62695d]">
                {targetOptions.find((item) => item.value === targetId)?.detail}
              </p>
            </div>
          ) : null}
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

        {target === "agent" ? (
          <CorrectionEditor
            title="Agent correction note"
            field={agentCorrectionField}
            fields={agentCorrectionFields}
            value={agentCorrectionValue}
            confidence={agentCorrectionConfidence}
            placeholder="Example: communication style should be more formal."
            onFieldChange={onAgentCorrectionFieldChange}
            onValueChange={onAgentCorrectionValueChange}
            onConfidenceChange={onAgentCorrectionConfidenceChange}
          />
        ) : null}

        {target === "relation_edge" ? (
          <CorrectionEditor
            title="Relation edge correction note"
            field={relationCorrectionField}
            fields={relationCorrectionFields}
            value={relationCorrectionValue}
            confidence={relationCorrectionConfidence}
            placeholder="Example: dependency felt too high; resource control mattered more."
            onFieldChange={onRelationCorrectionFieldChange}
            onValueChange={onRelationCorrectionValueChange}
            onConfidenceChange={onRelationCorrectionConfidenceChange}
          />
        ) : null}

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
                {entry.agentCorrection ? (
                  <CorrectionSummaryLine
                    label="agent correction"
                    correction={entry.agentCorrection}
                  />
                ) : null}
                {entry.relationCorrection ? (
                  <CorrectionSummaryLine
                    label="relation correction"
                    correction={entry.relationCorrection}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CorrectionEditor({
  title,
  field,
  fields,
  value,
  confidence,
  placeholder,
  onFieldChange,
  onValueChange,
  onConfidenceChange,
}: {
  title: string;
  field: string;
  fields: string[];
  value: string;
  confidence: FeedbackCorrectionConfidence;
  placeholder: string;
  onFieldChange: (field: string) => void;
  onValueChange: (value: string) => void;
  onConfidenceChange: (confidence: FeedbackCorrectionConfidence) => void;
}) {
  return (
    <div className="rounded-md border border-[#568262]/16 bg-[#eef5ee] p-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f5d3d]">
        {title}
      </h3>
      <div className="mt-3 grid gap-3">
        <select
          value={field}
          onChange={(event) => onFieldChange(event.target.value)}
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[#11150f]"
        >
          {fields.map((item) => (
            <option key={item} value={item}>
              {correctionFieldLabel(item)}
            </option>
          ))}
        </select>
        <textarea
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          maxLength={240}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-none rounded-md border border-black/10 bg-white px-3 py-2 text-sm leading-6 text-[#11150f] outline-none focus:border-[#568262]"
        />
        <div className="grid grid-cols-3 gap-2">
          {correctionConfidenceOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onConfidenceChange(item.value)}
              className={`rounded-md border px-2 py-2 text-xs font-semibold transition ${
                confidence === item.value
                  ? "border-[#568262]/50 bg-white text-[#2f5d3d]"
                  : "border-black/10 bg-[#f7f8f4] text-[#62695d]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#62695d]">
        This note becomes a calibration signal for the next run. It does not
        overwrite stored profile fields or relation weights.
      </p>
    </div>
  );
}

function CorrectionSummaryLine({
  label,
  correction,
}: {
  label: string;
  correction: FeedbackFieldCorrection;
}) {
  return (
    <p className="mt-2 rounded border border-black/8 bg-white px-2 py-1 text-xs leading-5 text-[#62695d]">
      {label}: {correction.field} {"->"} {correction.suggestedValue} (
      {correction.confidence})
    </p>
  );
}

function CalibrationSummary({ profile }: { profile: CalibrationProfile | null }) {
  if (!profile) {
    return (
      <section className="rounded-lg border border-black/8 bg-[#f7f8f4] p-5">
        <h2 className="text-sm font-semibold text-[#11150f]">
          Calibration summary
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#62695d]">
          Save feedback to build a local CalibrationProfile for future runs.
          Historical evidence remains unchanged.
        </p>
      </section>
    );
  }

  const sourceEntries = Object.entries(profile.sourceReliability);
  const strategyEntries = Object.entries(profile.strategyPreference);

  return (
    <section className="rounded-lg border border-black/8 bg-[#f7f8f4] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#11150f]">
            Calibration summary
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            This profile is applied only when preparing future runs. It does not
            mutate past Event Logs, Claims, Reports, or edge weights.
          </p>
        </div>
        <StatusPill tone={profile.signals.length ? "ready" : "planned"}>
          {profile.signals.length} signals
        </StatusPill>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <CalibrationMetric
          label="feedback"
          value={profile.calibrationSnapshot.feedbackCount}
        />
        <CalibrationMetric
          label="off marks"
          value={profile.calibrationSnapshot.offCount}
        />
        <CalibrationMetric
          label="agent notes"
          value={profile.calibrationSnapshot.agentCorrectionCount}
        />
        <CalibrationMetric
          label="edge notes"
          value={profile.calibrationSnapshot.relationCorrectionCount}
        />
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            source reliability
          </h3>
          <div className="mt-2 space-y-2">
            {sourceEntries.map(([source, value]) => (
              <CalibrationBar
                key={source}
                label={source.replaceAll("_", " ")}
                value={value}
                max={1.15}
              />
            ))}
          </div>
        </div>

        {strategyEntries.length ? (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
              strategy preference
            </h3>
            <div className="mt-2 space-y-2">
              {strategyEntries.map(([strategy, value]) => (
                <CalibrationBar
                  key={strategy}
                  label={strategy.replaceAll("_", " ")}
                  value={value ?? 1}
                  max={1.4}
                />
              ))}
            </div>
          </div>
        ) : null}

        <details className="rounded-md border border-black/8 bg-white p-3">
          <summary className="cursor-pointer text-xs font-semibold text-[#11150f]">
            Historical evidence invariant
          </summary>
          <ul className="mt-3 space-y-1 text-xs leading-5 text-[#62695d]">
            <li>Event Logs unchanged: {String(profile.historyInvariant.doesNotModifyEventLogs)}</li>
            <li>Claims unchanged: {String(profile.historyInvariant.doesNotModifyClaims)}</li>
            <li>Edge weights unchanged: {String(profile.historyInvariant.doesNotModifyEdgeWeights)}</li>
            <li>Feedback is not absolute fact: {String(profile.historyInvariant.feedbackIsNotAbsoluteFact)}</li>
          </ul>
        </details>
      </div>
    </section>
  );
}

function CalibrationMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-black/8 bg-white p-3">
      <div className="text-[11px] uppercase text-[#7d8578]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[#11150f]">{value}</div>
    </div>
  );
}

function CalibrationBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width = Math.max(8, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-[#62695d]">{label}</span>
        <span className="text-[#7d8578]">{value.toFixed(2)}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-black/8">
        <div
          className="h-full rounded-full bg-[#568262]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
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
