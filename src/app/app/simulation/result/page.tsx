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
import { SampleSandboxBanner } from "@/components/sample-sandbox-banner";
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
import { isCompleteDestinySampleSeed } from "@/lib/trial/sample-workspace";
import type { AgentProfileDraft } from "@/types/agent-profile";
import type { CalibrationProfile } from "@/lib/calibration/calibration-types";
import type { ClaimDraft, ClaimLedgerDraft } from "@/types/claim";
import type { DestinyClimateDraft, DestinyProfileDraft } from "@/types/destiny";
import type { DestinySituationFusionDraft } from "@/types/destiny-fusion";
import type {
  FeedbackCorrectionConfidence,
  FeedbackFieldCorrection,
  FeedbackLedgerDraft,
  FeedbackRating,
  FeedbackTargetType,
} from "@/types/feedback";
import type { RelationEdgeDraft } from "@/types/relation-edge";
import type {
  ReportBranchComparison,
  ReportEvidenceEvent,
} from "@/types/report";
import type { SeedContextDraft } from "@/types/seed-context";
import type { SimulationEventDraft } from "@/types/simulation-run";

const emptyClaims: ClaimDraft[] = [];

const feedbackTargets: { value: FeedbackTargetType; label: string }[] = [
  { value: "claim", label: "Selected finding" },
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

function agentName(agents: AgentProfileDraft[], id: string) {
  return agents.find((agent) => agent.id === id)?.label ?? id;
}

function relationName(
  edges: RelationEdgeDraft[],
  agents: AgentProfileDraft[],
  id: string,
) {
  const edge = edges.find((item) => item.id === id);
  if (!edge) return id;

  return `${agentName(agents, edge.fromAgentId)} -> ${agentName(
    agents,
    edge.toAgentId,
  )} / ${edge.relationshipType}`;
}

function pathLabel(value: string | undefined) {
  if (value === "cautious_self" || value === "Cautious self path") {
    return "Cautious observation path";
  }
  if (value === "decisive_self" || value === "Decisive self path") {
    return "Active push path";
  }
  if (value === "boundary_adjustment" || value === "Boundary adjustment path") {
    return "Boundary adjustment path";
  }
  return "Current inertia path";
}

function riskLanguage(riskLevel: ClaimDraft["riskLevel"]) {
  if (riskLevel === "high") {
    return "Pressure is elevated in this run; treat the window as sensitive and review the evidence before acting.";
  }

  if (riskLevel === "medium") {
    return "Pressure is noticeable but mixed; the useful move is to watch which signals repeat.";
  }

  return "Pressure is relatively light in this run; evidence still matters before drawing a strong conclusion.";
}

function confidenceLanguage(confidence: number) {
  if (confidence >= 80) {
    return "Strong sandbox signal, still not a certain outcome.";
  }

  if (confidence >= 55) {
    return "Moderate signal with enough evidence to inspect.";
  }

  if (confidence >= 25) {
    return "Low-confidence signal; useful mainly as a question to test.";
  }

  return "Weak signal; keep this finding provisional.";
}

function whyFindingMatters(claim: ClaimDraft, eventCount: number) {
  const evidenceLabel = `${eventCount} sandbox event${
    eventCount === 1 ? "" : "s"
  }`;

  if (claim.claimType === "risk_window") {
    return `This matters because the same pressure pattern appears across ${evidenceLabel}. It marks a window where information gaps, resource pressure, or relation friction may shape the path.`;
  }

  if (claim.claimType === "opportunity_window") {
    return `This matters because ${evidenceLabel} point toward a usable opening. The finding is not a promise; it shows where timing and evidence may support a cleaner next move.`;
  }

  if (claim.claimType === "coordination_signal") {
    return `This matters because ${evidenceLabel} show where coordination or support may be available. It helps separate workable contact from noisier pressure.`;
  }

  return `This matters because ${evidenceLabel} show friction that is visible but not yet strong enough for heavier wording. The useful part is knowing what to inspect next.`;
}

function topRealWorldClues(seedContext: SeedContextDraft) {
  return [
    seedContext.currentQuestionDescription,
    seedContext.situationSummary,
    seedContext.recentEventsText ?? seedContext.recentEvents,
    seedContext.decisionOptionsText ?? seedContext.decisionOptions,
    seedContext.keyPeopleText,
  ].filter((value): value is string => Boolean(value?.trim())).slice(0, 4);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function findingClimateThemes(
  destinyClimate: DestinyClimateDraft | null,
  rawFindingEvents: SimulationEventDraft[],
) {
  const eventThemeIds = new Set(
    rawFindingEvents.flatMap((event) => event.fusionThemeIds ?? []),
  );
  const activeThemes = destinyClimate?.activeThemes ?? [];
  const matchedThemes = activeThemes.filter(
    (theme) => eventThemeIds.has(theme.id) || eventThemeIds.has(theme.label),
  );
  const themes = matchedThemes.length ? matchedThemes : activeThemes.slice(0, 3);

  return themes.slice(0, 4).map((theme) => {
    const score = typeof theme.score === "number" ? ` / score ${theme.score}` : "";
    return `${theme.label} (${theme.polarity}${score}): ${theme.userFacingSummary}`;
  });
}

function relevantInterpretationNotes(
  destinyClimate: DestinyClimateDraft | null,
  destinyProfile: DestinyProfileDraft | null,
) {
  return uniqueStrings([
    ...(destinyClimate?.observationSignals ?? []).map(
      (item) => `${item.label}: ${item.userFacingSummary}`,
    ),
    ...(destinyClimate?.pressureThemes ?? []).map(
      (item) => `${item.label}: ${item.userFacingSummary}`,
    ),
    ...(destinyProfile?.coreTendencies ?? []).map(
      (item) => `${item.label}: ${item.userFacingSummary}`,
    ),
    ...(destinyProfile?.cautionNotes ?? []).map(
      (item) => `${item.label}: ${item.userFacingSummary}`,
    ),
  ]).slice(0, 5);
}

function destinyConfidenceNotes(destinyProfile: DestinyProfileDraft | null) {
  if (!destinyProfile) return [];

  const missingFields = destinyProfile.confidence.missingFields.map((field) =>
    field.replaceAll(/([A-Z])/g, " $1").toLowerCase(),
  );
  return uniqueStrings([
    `Destiny mode: ${destinyProfile.mode}. Confidence remains ${destinyProfile.confidence.score}%; this replay does not raise it.`,
    missingFields.length
      ? `Missing birth info: ${missingFields.join(", ")}.`
      : "Birth info fields required by the current local mode were available.",
    ...(destinyProfile.localWarnings ?? []),
    destinyProfile.destinyCalculationConfidence?.precisionLevel
      ? `Calculation precision: ${destinyProfile.destinyCalculationConfidence.precisionLevel}.`
      : "",
  ]);
}

function decisionTopic(seedContext: SeedContextDraft) {
  return (
    seedContext.currentQuestionDescription?.trim() ||
    seedContext.questionText.trim() ||
    seedContext.situationSummary.trim()
  );
}

function sandboxPathLabel(event: SimulationEventDraft) {
  return pathLabel(event.pathLabel ?? event.branchId);
}

function sourceTagsForFinding(
  finding: ClaimDraft,
  events: SimulationEventDraft[],
  hasDestinyClimate: boolean,
) {
  const tags = new Set<string>();
  events
    .filter((event) => finding.evidenceEventIds.includes(event.id))
    .flatMap((event) => event.sourceTags ?? [])
    .forEach((tag) => tags.add(tag));

  if (hasDestinyClimate) tags.add("destiny climate");
  tags.add("real situation");
  tags.add("integrated simulation");

  return Array.from(tags);
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
  const [destinyProfile] = useState<DestinyProfileDraft | null>(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.destinyProfiles.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [destinyClimate] = useState<DestinyClimateDraft | null>(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.destinyClimates.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [destinyFusion] = useState<DestinySituationFusionDraft | null>(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.destinyFusions.load(seed.id);
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
  const topFindings = report
    ? report.paidReport.fullClaims.slice(0, 3)
    : claims.slice(0, 3);
  const activeFinding = selectedClaim ?? topFindings[0] ?? null;
  const activeFindingEvidenceEvents = report?.paidReport.fullEventChain ?? [];

  const highlightedAgentIds = useMemo(
    () => activeFinding?.relatedAgentIds ?? [],
    [activeFinding],
  );
  const highlightedEdgeIds = useMemo(
    () => activeFinding?.relatedRelationEdgeIds ?? [],
    [activeFinding],
  );
  const highlightedEventIds = useMemo(
    () => activeFinding?.evidenceEventIds ?? [],
    [activeFinding],
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
        detail: `${option.strategyType} / finding ${option.claimId}`,
      }));
    }

    return seedContext
      ? [
          {
            value: seedContext.id,
            label: "Overall run",
            detail: `${simulationRun?.events.length ?? 0} events / ${claims.length} evidence-backed findings`,
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
  const resolvedFeedbackTarget =
    feedbackTargetOptions.find((option) => option.value === feedbackTargetId) ??
    feedbackTargetOptions[0];
  const resolvedFeedbackTargetId = resolvedFeedbackTarget?.value ?? "";
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
    setMessage("Result Sandbox saved. Findings remain tied to evidence_event_ids.");
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
    setMessage("Rebuilt findings from the current sandbox events.");
  }

  function saveFeedback() {
    if (
      !seedContext ||
      !simulationRun ||
      !feedbackLedger ||
      !resolvedFeedbackTargetId
    ) {
      setMessage("Select a finding, agent, edge, or run target before saving feedback.");
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
      "Improve-next-run feedback saved locally for future runs only. Historical sandbox events, Findings, and results were not rewritten.",
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
            Generate a local run with sandbox events first.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            Result Sandbox only reads frozen Agents, Relation Edges, Simulation
            ticks, sandbox events, and Findings. Without event evidence, no finding is
            shown.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <TrialSampleButton className="mf-button mf-button-primary px-5 py-3">
              Try a complete destiny sandbox sample
            </TrialSampleButton>
            <ButtonLink href="/app/simulation/running" variant="secondary" className="px-5 py-3">
              Open sandbox events
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
            Back to sandbox events
          </ButtonLink>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {isCompleteDestinySampleSeed(seedContext.id) ? (
        <SampleSandboxBanner showReplay />
      ) : null}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone="ready">Result sandbox</StatusPill>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Your destiny-situation sandbox is ready.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            Findings connect destiny climate, real-world clues, people,
            relation changes, and sandbox events. They are inspectable signals,
            not certainty statements.
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
            title="Result safety restrictions"
          />
        </div>
      ) : null}

      <TopFindingsSection
        findings={topFindings}
        selectedFindingId={activeFinding?.id ?? ""}
        destinyClimate={destinyClimate}
        destinyProfile={destinyProfile}
        destinyFusion={destinyFusion}
        seedContext={seedContext}
        agents={agentEcology?.agents ?? []}
        relationEdges={relationGraph?.edges ?? []}
        evidenceEvents={activeFindingEvidenceEvents}
        simulationEvents={simulationRun.events}
        branchComparison={report?.paidReport.branchComparison ?? []}
        onSelectFinding={selectClaim}
      />

      <DestinySituationSummarySection
        destinyClimate={destinyClimate}
        destinyProfile={destinyProfile}
        destinyFusion={destinyFusion}
        seedContext={seedContext}
        agents={agentEcology?.agents ?? []}
        relationEdges={relationGraph?.edges ?? []}
        events={simulationRun.events}
      />

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
            findings, same confidence, same risk level.
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
                  No evidence-backed Finding is available. Items without
                  evidence_event_ids are hidden by the result engine.
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
            <Metric label="Findings" value={report?.invariant.claimIds.length ?? claims.length} />
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
              title="Sandbox event replay"
              description="Click a sandbox event to inspect involved people, situation map edges, confidence, evidence basis, and pressure changes."
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
                Situation map snapshot ({relationGraph.edges.length} edges)
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
              Evidence replay
            </h2>
            {selectedClaim ? (
              <div className="mt-5 space-y-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">
                    selected finding
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
                Select a finding card to inspect evidence.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-5">
            <h2 className="text-sm font-semibold text-[#11150f]">
              Sandbox event detail
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
                <EdgeDeltaView
                  event={selectedEvent}
                  edges={relationGraph?.edges ?? []}
                  agents={agentEcology?.agents ?? []}
                />
                <EvidenceRefsView refs={selectedEvent.evidence?.evidenceRefs ?? []} />
                <EventDebugStateDisclosure event={selectedEvent} />
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

function TopFindingsSection({
  findings,
  selectedFindingId,
  destinyClimate,
  destinyProfile,
  destinyFusion,
  seedContext,
  agents,
  relationEdges,
  evidenceEvents,
  simulationEvents,
  branchComparison,
  onSelectFinding,
}: {
  findings: ClaimDraft[];
  selectedFindingId: string;
  destinyClimate: DestinyClimateDraft | null;
  destinyProfile: DestinyProfileDraft | null;
  destinyFusion: DestinySituationFusionDraft | null;
  seedContext: SeedContextDraft;
  agents: AgentProfileDraft[];
  relationEdges: RelationEdgeDraft[];
  evidenceEvents: ReportEvidenceEvent[];
  simulationEvents: SimulationEventDraft[];
  branchComparison: ReportBranchComparison[];
  onSelectFinding: (findingId: string) => void;
}) {
  const selectedFinding =
    findings.find((finding) => finding.id === selectedFindingId) ??
    findings[0] ??
    null;

  return (
    <section className="mb-6 rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            integrated result
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#11150f]">
            Top findings from this destiny sandbox
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#62695d]">
            These are the first three evidence-backed findings from the existing
            stored finding ledger. Source tags show which layers contributed to
            the replayable basis.
          </p>
        </div>
        <StatusPill tone={findings.length ? "ready" : "planned"}>
          {findings.length} findings
        </StatusPill>
      </div>

      {!destinyClimate || !destinyFusion ? (
        <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          This run used mostly real-situation evidence because destiny context
          was incomplete.
        </p>
      ) : null}

      {findings.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {findings.map((finding, index) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              index={index}
              selected={selectedFinding?.id === finding.id}
              destinyClimate={destinyClimate}
              sourceTags={sourceTagsForFinding(
                finding,
                simulationEvents,
                Boolean(destinyClimate),
              )}
              eventCount={
                evidenceEvents.filter((event) =>
                  event.claimIds.includes(finding.id),
                ).length || finding.evidenceEventIds.length
              }
              onSelect={onSelectFinding}
            />
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          No evidence-backed Finding is available. Items without
          evidence_event_ids stay hidden.
        </p>
      )}

      <EvidenceReplayPanel
        finding={selectedFinding}
        destinyClimate={destinyClimate}
        destinyProfile={destinyProfile}
        destinyFusion={destinyFusion}
        seedContext={seedContext}
        agents={agents}
        relationEdges={relationEdges}
        evidenceEvents={evidenceEvents}
        simulationEvents={simulationEvents}
        branchComparison={branchComparison}
      />
    </section>
  );
}

function FindingCard({
  finding,
  index,
  selected,
  destinyClimate,
  sourceTags,
  eventCount,
  onSelect,
}: {
  finding: ClaimDraft;
  index: number;
  selected: boolean;
  destinyClimate: DestinyClimateDraft | null;
  sourceTags: string[];
  eventCount: number;
  onSelect: (findingId: string) => void;
}) {
  return (
    <article
      className={`rounded-lg border p-5 transition ${
        selected
          ? "border-[#568262]/50 bg-[#eef5ee]"
          : "border-black/8 bg-[#f7f8f4]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[#3f483d]">
          Finding {index + 1}
        </span>
        <span className="text-xs font-semibold text-[#7d8578]">
          stored id {finding.id}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <SourceTag
          label="Destiny climate"
          active={sourceTags.includes("destiny climate") && Boolean(destinyClimate)}
        />
        <SourceTag
          label="Real situation"
          active={sourceTags.includes("real situation")}
        />
        <SourceTag
          label="Integrated simulation"
          active={sourceTags.includes("integrated simulation")}
        />
      </div>

      <h3 className="mt-4 text-base font-semibold leading-7 text-[#11150f]">
        {finding.summary}
      </h3>

      <div className="mt-4 space-y-3">
        <FindingMeta
          label="why it matters"
          value={whyFindingMatters(finding, eventCount)}
        />
        <FindingMeta
          label="pressure / risk"
          value={`${finding.riskLevel} pressure. ${riskLanguage(
            finding.riskLevel,
          )}`}
        />
        <FindingMeta
          label="confidence"
          value={`${finding.confidence}% confidence. ${confidenceLanguage(
            finding.confidence,
          )}`}
        />
      </div>

      <button
        type="button"
        onClick={() => onSelect(finding.id)}
        className="mt-5 w-full rounded-md border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#11150f] hover:border-[#568262]/30"
      >
        View basis
      </button>
    </article>
  );
}

function SourceTag({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`rounded-md border px-2 py-1 text-xs font-semibold ${
        active
          ? "border-[#568262]/25 bg-white text-[#2f5d3d]"
          : "border-dashed border-black/15 bg-white/60 text-[#7d8578]"
      }`}
    >
      {label}
    </span>
  );
}

function FindingMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </div>
      <p className="mt-1 text-sm leading-6 text-[#62695d]">{value}</p>
    </div>
  );
}

function EvidenceReplayPanel({
  finding,
  destinyClimate,
  destinyProfile,
  destinyFusion,
  seedContext,
  agents,
  relationEdges,
  evidenceEvents,
  simulationEvents,
  branchComparison,
}: {
  finding: ClaimDraft | null;
  destinyClimate: DestinyClimateDraft | null;
  destinyProfile: DestinyProfileDraft | null;
  destinyFusion: DestinySituationFusionDraft | null;
  seedContext: SeedContextDraft;
  agents: AgentProfileDraft[];
  relationEdges: RelationEdgeDraft[];
  evidenceEvents: ReportEvidenceEvent[];
  simulationEvents: SimulationEventDraft[];
  branchComparison: ReportBranchComparison[];
}) {
  if (!finding) {
    return (
      <div className="mt-5 rounded-md border border-dashed border-black/16 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#62695d]">
        Evidence Replay appears after the sandbox has at least one
        evidence-backed Finding.
      </div>
    );
  }

  const findingEvents = evidenceEvents.filter((event) =>
    event.claimIds.includes(finding.id),
  );
  const rawFindingEvents = simulationEvents.filter((event) =>
    finding.evidenceEventIds.includes(event.id),
  );
  const fallbackEvents = finding.evidenceEventIds.map((eventId) => ({
    id: eventId,
    label: eventId,
  }));
  const people = finding.relatedAgentIds.map((id) => agentName(agents, id));
  const relations = finding.relatedRelationEdgeIds.map((id) =>
    relationName(relationEdges, agents, id),
  );
  const destinySkipped =
    destinyProfile?.mode === "skipped" || destinyClimate?.mode === "skipped";
  const climateThemes = findingClimateThemes(destinyClimate, rawFindingEvents);
  const interpretationNotes = relevantInterpretationNotes(
    destinyClimate,
    destinyProfile,
  );
  const confidenceNotes = destinyConfidenceNotes(destinyProfile);
  const generatedClues = uniqueStrings(
    rawFindingEvents.flatMap((event) => event.generatedClues ?? []),
  );
  const relatedFusionMappings =
    destinyFusion?.mappings
      .filter((mapping) =>
        rawFindingEvents.some((event) =>
          event.fusionThemeIds?.includes(mapping.themeId),
        ),
      )
      .concat(
        rawFindingEvents.some((event) => event.fusionThemeIds?.length)
          ? []
          : destinyFusion.mappings.slice(0, 2),
      )
      .slice(0, 4) ?? [];
  const branchItems = branchComparison.filter((branch) =>
    branch.claimIds.includes(finding.id),
  );

  return (
    <details
      className="mt-5 rounded-lg border border-black/8 bg-[#fbfcf8] p-5"
      open
    >
      <summary className="cursor-pointer text-sm font-semibold text-[#11150f]">
        Evidence Replay for selected Finding
      </summary>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ReplayBlock title="Destiny basis">
          {destinySkipped ? (
            <p>
              This finding used real-situation and sandbox evidence; destiny
              basis was skipped.
            </p>
          ) : destinyClimate || destinyProfile ? (
            <div className="space-y-3">
              <ReplaySubhead>Mode and confidence</ReplaySubhead>
              <ReplayList
                values={confidenceNotes}
                empty="No destiny confidence note is available."
              />
              {destinyClimate?.userFacingOverview ? (
                <p>{destinyClimate.userFacingOverview}</p>
              ) : null}
              <ReplaySubhead>Key climate themes</ReplaySubhead>
              <ReplayList
                values={climateThemes}
                empty="No key climate themes were attached to this Finding."
              />
              <ReplaySubhead>Relevant interpretation notes</ReplaySubhead>
              <ReplayList
                values={interpretationNotes}
                empty="No interpretation notes were attached to this Finding."
              />
            </div>
          ) : (
            <p>
              Destiny basis is not available for this run, so the replay relies
              on real-situation clues and sandbox events.
            </p>
          )}
        </ReplayBlock>

        <ReplayBlock title="Real situation basis">
          <ReplaySubhead>Decision topic</ReplaySubhead>
          <ReplayList
            values={[decisionTopic(seedContext)]}
            empty="No decision topic was captured."
          />
          <ReplaySubhead>User free-form situation</ReplaySubhead>
          <ReplayList
            values={topRealWorldClues(seedContext)}
            empty="No free-form situation was captured."
          />
          <ReplaySubhead>Extracted people</ReplaySubhead>
          <ReplayList
            values={people}
            empty="No involved people were attached to this Finding."
          />
          <ReplaySubhead>Real-world clues</ReplaySubhead>
          <ReplayList
            values={uniqueStrings([
              seedContext.recentEventsText ?? seedContext.recentEvents ?? "",
              seedContext.worries ?? "",
              seedContext.decisionOptionsText ?? seedContext.decisionOptions ?? "",
              seedContext.desiredOutputText ?? seedContext.desiredOutput ?? "",
            ])}
            empty="No additional real-world clues were captured."
          />
        </ReplayBlock>

        <ReplayBlock title="Dynamic sandbox basis">
          {rawFindingEvents.length ? (
            <div className="space-y-4">
              {rawFindingEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-md border border-black/8 bg-white p-3"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
                    {sandboxPathLabel(event)} / Tick {event.tickIndex} /{" "}
                    {event.timeLabel}
                  </div>
                  <ReplayList
                    values={uniqueStrings([
                      `Sandbox event: ${event.userFacingEventTitle ?? event.summary}`,
                      event.destinyInfluenceSummary
                        ? `Destiny influence: ${event.destinyInfluenceSummary}`
                        : "",
                      event.interactionSummary
                        ? `Interaction: ${event.interactionSummary}`
                        : "",
                      event.pressureDeltaSummary
                        ? `Pressure delta: ${event.pressureDeltaSummary}`
                        : "",
                      ...(event.generatedClues ?? []).map(
                        (clue) => `Generated clue: ${clue}`,
                      ),
                    ])}
                    empty="No sandbox event summary was attached."
                  />
                  <code
                    className="mt-2 block break-all text-xs text-[#7d8578]"
                    data-no-localize
                  >
                    {event.id}
                  </code>
                </div>
              ))}
            </div>
          ) : (
            <ReplayList values={fallbackEvents.map((event) => event.label)} />
          )}
        </ReplayBlock>

        <ReplayBlock title="Relation changes">
          <ReplayList
            values={relations}
            empty="No relation changes were attached."
          />
          {rawFindingEvents.length ? (
            <div className="mt-3 space-y-2">
              {rawFindingEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
                    {sandboxPathLabel(event)} / Tick {event.tickIndex}
                  </p>
                  <EdgeDeltaView
                    event={event}
                    edges={relationEdges}
                    agents={agents}
                    compact
                  />
                </div>
              ))}
            </div>
          ) : findingEvents.length ? (
            <div className="mt-3 space-y-2">
              {findingEvents.slice(0, 3).map((event) => (
                <pre
                  key={event.id}
                  className="max-h-36 overflow-auto rounded bg-white p-3 text-xs leading-5 text-[#62695d]"
                >
                  {JSON.stringify(event.edgeWeightDeltas, null, 2)}
                </pre>
              ))}
            </div>
          ) : null}
        </ReplayBlock>

        <ReplayBlock title="Path divergence">
          {branchItems.length ? (
            <div className="space-y-2">
              {branchItems.map((branch) => (
                <div
                  key={branch.branchId}
                  className="rounded-md border border-black/8 bg-white p-3"
                >
                  <div className="text-sm font-semibold text-[#11150f]">
                    {branch.label}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#62695d]">
                    {branch.eventCount} events, {branch.riskSignalCount} risk
                    signals, {branch.supportSignalCount} support signals.
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>
              No branch-specific divergence is attached to this Finding yet.
            </p>
          )}
        </ReplayBlock>

        <ReplayBlock title="Generated clues">
          <ReplayList
            values={generatedClues}
            empty="No generated clues were attached to these sandbox events."
          />
        </ReplayBlock>

        <ReplayBlock title="Destiny-situation mappings">
          {relatedFusionMappings.length ? (
            <div className="space-y-2">
              {relatedFusionMappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="rounded border border-black/8 bg-white px-3 py-2"
                >
                  <div className="font-semibold text-[#11150f]">
                    {mapping.themeLabel} {"->"} {mapping.personLabel}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#62695d]">
                    {mapping.pressureRole}. {mapping.userFacingSummary}
                  </p>
                  {mapping.mappingExplanation ? (
                    <p className="mt-2 text-xs leading-5 text-[#7d8578]">
                      Why linked: {mapping.mappingExplanation.whyLinked}
                    </p>
                  ) : null}
                  {mapping.interpretationNotes?.[0] ? (
                    <p className="mt-2 rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs leading-5 text-[#62695d]">
                      {mapping.interpretationNotes[0]}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p>No destiny-situation mapping was attached to this Finding.</p>
          )}
        </ReplayBlock>
      </div>
    </details>
  );
}

function ReplaySubhead({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d8578] first:mt-0">
      {children}
    </div>
  );
}

function ReplayBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-black/8 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#62695d]">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function ReplayList({
  values,
  empty = "No replay item is available.",
}: {
  values: string[];
  empty?: string;
}) {
  if (!values.length) {
    return <p>{empty}</p>;
  }

  return (
    <ul className="space-y-2">
      {values.map((value) => (
        <li
          key={value}
          className="rounded border border-black/8 bg-white px-3 py-2"
        >
          {value}
        </li>
      ))}
    </ul>
  );
}

function DestinySituationSummarySection({
  destinyClimate,
  destinyProfile,
  destinyFusion,
  seedContext,
  agents,
  relationEdges,
  events,
}: {
  destinyClimate: DestinyClimateDraft | null;
  destinyProfile: DestinyProfileDraft | null;
  destinyFusion: DestinySituationFusionDraft | null;
  seedContext: SeedContextDraft;
  agents: AgentProfileDraft[];
  relationEdges: RelationEdgeDraft[];
  events: SimulationEventDraft[];
}) {
  const strongestPanels = destinyClimate?.panels.slice(0, 3) ?? [];
  const climateInterpretation = destinyClimate?.coreTendencies?.slice(0, 2) ?? [];
  const profileInterpretation = destinyProfile?.coreTendencies?.slice(0, 2) ?? [];
  const pressureThemes =
    destinyClimate?.pressureThemes?.slice(0, 2) ??
    destinyProfile?.pressureThemes?.slice(0, 2) ??
    [];
  const topAgents = agents
    .filter((agent) =>
      events.some((event) => event.involvedAgentIds.includes(agent.id)),
    )
    .slice(0, 4);
  const topEdges = relationEdges
    .filter((edge) =>
      events.some((event) => event.relationEdgeIds.includes(edge.id)),
    )
    .slice(0, 4);

  return (
    <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)]">
      <section className="rounded-lg border border-black/8 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
              destiny climate
            </p>
            <h2 className="mt-2 text-base font-semibold text-[#11150f]">
              Destiny climate summary
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#62695d]">
              {destinyClimate?.userFacingOverview ??
                "This run used mostly real-situation evidence because destiny context was incomplete."}
            </p>
          </div>
          <StatusPill tone={destinyClimate ? "planned" : "blocked"}>
            {destinyClimate?.mode ?? "low confidence"}
          </StatusPill>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[...climateInterpretation, ...profileInterpretation]
            .slice(0, 3)
            .map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-black/8 bg-[#f7f8f4] p-3"
              >
                <div className="text-sm font-semibold text-[#11150f]">
                  {item.label}
                </div>
                <p className="mt-1 text-xs leading-5 text-[#62695d]">
                  {item.intensity ?? "directional"}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#62695d]">
                  {item.userFacingSummary}
                </p>
              </div>
            ))}
          {strongestPanels.map((panel) => (
            <div
              key={panel.id}
              className="rounded-md border border-black/8 bg-[#f7f8f4] p-3"
            >
              <div className="text-sm font-semibold text-[#11150f]">
                {panel.label}
              </div>
              <p className="mt-1 text-xs leading-5 text-[#62695d]">
                {panel.intensity} / {panel.direction}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#62695d]">
                {panel.userFacingSummary}
              </p>
            </div>
          ))}
        </div>

        {pressureThemes.length ? (
          <div className="mt-4 rounded-md border border-black/8 bg-[#fbfcf8] p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
              pressure themes to observe
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {pressureThemes.map((theme) => (
                <p key={theme.id} className="text-xs leading-5 text-[#62695d]">
                  <span className="font-semibold text-[#11150f]">
                    {theme.label}:
                  </span>{" "}
                  {theme.userFacingSummary}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {destinyProfile ? (
          <p className="mt-4 rounded-md border border-black/8 bg-[#fbfcf8] p-3 text-xs leading-5 text-[#62695d]">
            Profile basis: {destinyProfile.userFacingSummary} This remains
            symbolic context and does not override real-world evidence.
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-black/8 bg-[#f7f8f4] p-5">
        <h2 className="mt-2 text-base font-semibold text-[#11150f]">
          Destiny themes mapped to real people
        </h2>
        <p className="mt-2 text-sm leading-7 text-[#62695d]">
          The sandbox maps climate themes onto the current question, involved
          people, situation map edges, and sandbox events. This is a basis summary, not a
          new Finding.
        </p>

        <div className="mt-4 space-y-3">
          {destinyFusion?.mappings.slice(0, 4).map((mapping) => (
            <FusionRow
              key={mapping.id}
              label={`${mapping.themeLabel} -> ${mapping.personLabel}`}
              value={`${mapping.pressureRole}. ${mapping.mappingExplanation?.whyLinked ?? mapping.userFacingSummary}`}
            />
          ))}
          <FusionRow
            label="current question"
            value={
              seedContext.currentQuestionDescription ||
              seedContext.questionText ||
              seedContext.situationSummary
            }
          />
          <FusionRow
            label="people in pressure map"
            value={
              topAgents.map((agent) => agent.label).join(", ") ||
              "No people attached yet."
            }
          />
          <FusionRow
            label="relations in motion"
            value={
              topEdges.map((edge) => relationName(relationEdges, agents, edge.id)).join("; ") ||
              "No relation edge movement attached yet."
            }
          />
          <FusionRow
            label="events read"
            value={`${events.length} sandbox events inspected across the current run.`}
          />
        </div>
      </section>
    </section>
  );
}

function FusionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-black/8 bg-white p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </div>
      <p className="mt-1 text-sm leading-6 text-[#62695d]">{value}</p>
    </div>
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
        Full depth reveals the complete sandbox event chain, path divergence,
        relation deltas, and strategy options. It uses the same stored finding id set and
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
            Path divergence
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            Paths start from the same locked situation map and differ by self-policy
            strategy. Counts are evidence summaries, not stronger findings.
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
                  {pathLabel(item.branchId)}
                </h3>
                <span className="text-xs font-semibold text-[#568262]">
                  {item.eventCount} events
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <BranchMetric label="findings" value={item.claimIds.length} />
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
  const selectedTarget =
    targetOptions.find((item) => item.value === targetId) ?? targetOptions[0];
  const resolvedTargetId = selectedTarget?.value ?? "";
  const targetHelp =
    target === "agent"
      ? "Use this when an Agent feels mismatched. Corrections become future-run improvement signals, not edits to the stored Agent."
      : target === "relation_edge"
        ? "Use this when the relation reading feels off. Corrections never edit historical edge weights."
        : target === "strategy"
          ? "Use this to mark whether a strategy option was useful for thinking or planning."
          : target === "overall"
            ? "Use this for the run as a whole."
            : "Use this to rate whether an evidence-backed finding felt aligned with the situation.";

  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#11150f]">
            Improve next run
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            Mark what felt right or wrong. Feedback affects future runs only and
            never rewrites sandbox events, Findings, results, or edge weights.
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
              value={resolvedTargetId}
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
          {resolvedTargetId ? (
            <div className="mt-2 rounded bg-[#f7f8f4] px-3 py-2">
              <code
                className="block break-all text-xs text-[#7d8578]"
                data-no-localize
              >
                {resolvedTargetId}
              </code>
              <p className="mt-1 text-xs leading-5 text-[#62695d]">
                {selectedTarget?.detail}
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
          disabled={!resolvedTargetId}
          className="w-full rounded-md bg-[#11150f] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9aa096]"
        >
          Save improve-next-run feedback
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
                <code
                  className="mt-2 block break-all text-[11px] text-[#7d8578]"
                  data-no-localize
                >
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
        This note becomes an improve-next-run signal. It does not
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
          Improve next run summary
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#62695d]">
          Save feedback to build local guidance for future runs.
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
            Improve next run summary
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            This profile is applied only when preparing future runs. It does not
            mutate past sandbox events, Findings, results, or edge weights.
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
            <li>Sandbox events unchanged: {String(profile.historyInvariant.doesNotModifyEventLogs)}</li>
            <li>Findings unchanged: {String(profile.historyInvariant.doesNotModifyClaims)}</li>
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
            Agent / Situation map summary
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            Situation map data remains read-only. Highlighting comes from the selected
            finding evidence chain.
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
              <code
                className="mt-1 block break-all text-[11px] text-[#7d8578]"
                data-no-localize
              >
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
          <code
            key={value}
            className="block break-all text-xs text-white/54"
            data-no-localize
          >
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

function EventDebugStateDisclosure({
  event,
}: {
  event: {
    beforeState: unknown;
    afterState: unknown;
    edgeWeightDeltas: unknown;
  };
}) {
  return (
    <details className="rounded-md border border-dashed border-black/12 bg-[#f7f8f4] p-3">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        Debug state data
      </summary>
      <div className="mt-3 space-y-3">
        <Snapshot title="before state" value={event.beforeState} />
        <Snapshot title="after state" value={event.afterState} />
        <Snapshot title="edge weight deltas" value={event.edgeWeightDeltas} />
      </div>
    </details>
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
