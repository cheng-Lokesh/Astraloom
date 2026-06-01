"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { RelationGraph } from "@/components/graph/relation-graph";
import { GroundedSimulationDebugPanel } from "@/components/grounded-social/grounded-simulation-debug-panel";
import { ReportSummary } from "@/components/report/report-summary";
import { useLanguage } from "@/components/language-provider";
import { RealityIntakeModeBanner } from "@/components/reality-intake-mode-banner";
import { RuntimeCapabilityBanner } from "@/components/runtime-capability-banner";
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
import type { DestinyClimateDraft, DestinyProfileDraft } from "@/types/destiny";
import type { DestinySituationFusionDraft } from "@/types/destiny-fusion";
import type {
  GroundedRealityNode,
  GroundedRealityPressure,
  GroundedSocialSimulationDraft,
} from "@/types/grounded-social-simulation";
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

type Locale = "en" | "zh";

const resultCopy = {
  zh: {
    noDataTitle: "\u6c99\u76d8\u8fd8\u6ca1\u6709\u751f\u6210\u7ed3\u679c",
    noDataBody: "\u8bf7\u5148\u56de\u5230\u5f00\u59cb\u9875\u751f\u6210\u4e00\u6b21\u6c99\u76d8\uff0c\u518d\u67e5\u770b\u8fd9\u6b21\u6c99\u76d8\u7684\u5173\u952e\u53d1\u73b0\u3002",
    startNew: "\u56de\u5230\u5f00\u59cb\u9875",
    running: "\u67e5\u770b\u6c99\u76d8\u5c55\u5f00\u8fc7\u7a0b",
    safetyTitle: "\u7ed3\u679c\u9875\u6682\u65f6\u65e0\u6cd5\u5c55\u793a",
    backToRunning: "\u56de\u5230\u6c99\u76d8\u5c55\u5f00\u8fc7\u7a0b",
    topTitle: "\u8fd9\u6b21\u6c99\u76d8\u6700\u503c\u5f97\u6ce8\u610f\u7684 3 \u4ef6\u4e8b",
    noFindings: "\u8fd9\u6b21\u6c99\u76d8\u8fd8\u6ca1\u6709\u5f62\u6210\u53ef\u5c55\u793a\u7684\u5173\u952e\u53d1\u73b0\u3002\u8bf7\u5148\u56de\u5230\u5f00\u59cb\u9875\u91cd\u65b0\u751f\u6210\u4e00\u6b21\u6c99\u76d8\u3002",
    findingLabel: "\u53d1\u73b0",
    whyImportant: "\u4e3a\u4ec0\u4e48\u91cd\u8981",
    confidence: "\u7f6e\u4fe1\u5ea6",
    riskSignal: "\u538b\u529b\u4fe1\u53f7",
    viewBasis: "\u67e5\u770b\u4f9d\u636e",
    sourceTags: {
      destiny: "\u547d\u7406\u6c14\u5019",
      real: "\u73b0\u5b9e\u7ebf\u7d22",
      dynamic: "\u52a8\u6001\u6c99\u76d8",
    },
    sections: {
      basis: "\u67e5\u770b\u4f9d\u636e",
      paths: "\u8def\u5f84\u5bf9\u6bd4",
      map: "\u5c40\u52bf\u5730\u56fe",
      events: "\u6c99\u76d8\u4e8b\u4ef6",
      improve: "\u6821\u51c6\u4e0b\u6b21\u6c99\u76d8",
      technical: "\u6280\u672f\u7ec6\u8282",
      advanced: "\u9ad8\u7ea7\u6821\u51c6",
    },
    saveResult: "\u4fdd\u5b58\u7ed3\u679c",
    rebuild: "\u91cd\u65b0\u751f\u6210\u53d1\u73b0",
    saved: "\u7ed3\u679c\u5df2\u4fdd\u5b58\u3002",
    rebuilt: "\u5df2\u6839\u636e\u5f53\u524d\u6c99\u76d8\u4e8b\u4ef6\u91cd\u65b0\u6574\u7406\u53d1\u73b0\u3002",
    saveFailed: "\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u518d\u8bd5\u4e00\u6b21\u3002",
    feedbackMissing: "\u8bf7\u5148\u9009\u62e9\u4e00\u6761\u53d1\u73b0\u6216\u6574\u4f53\u6c99\u76d8\uff0c\u518d\u4fdd\u5b58\u53cd\u9988\u3002",
    feedbackSaved:
      "\u53cd\u9988\u5df2\u4fdd\u5b58\u3002\u5b83\u53ea\u4f1a\u5e2e\u52a9\u4e0b\u6b21\u6c99\u76d8\u66f4\u8d34\u8fd1\u771f\u5b9e\u60c5\u51b5\uff0c\u4e0d\u4f1a\u6539\u5199\u8fd9\u6b21\u7ed3\u679c\u3002",
    feedbackIntro:
      "\u8fd9\u6b21\u5224\u65ad\u51c6\u4e0d\u51c6\uff1f\u4f60\u7684\u53cd\u9988\u4e0d\u4f1a\u6539\u5199\u8fd9\u6b21\u7ed3\u679c\uff0c\u53ea\u4f1a\u5e2e\u52a9\u4e0b\u6b21\u6c99\u76d8\u66f4\u8d34\u8fd1\u771f\u5b9e\u60c5\u51b5\u3002",
    notePlaceholder: "\u53ef\u4ee5\u7b80\u5355\u5199\u54ea\u91cc\u8d34\u8fd1\u3001\u54ea\u91cc\u4e0d\u8d34\u8fd1\u3002",
    saveFeedback: "\u4fdd\u5b58\u53cd\u9988",
    targetFinding: "\u5f53\u524d\u53d1\u73b0",
    targetOverall: "\u6574\u4f53\u6c99\u76d8",
    basisEmpty: "\u9009\u62e9\u4e00\u6761\u53d1\u73b0\u540e\uff0c\u8fd9\u91cc\u4f1a\u5c55\u793a\u5b83\u7684\u4f9d\u636e\u3002",
    destinyBasis: "\u547d\u7406\u6c14\u5019",
    realBasis: "\u73b0\u5b9e\u7ebf\u7d22",
    dynamicBasis: "\u52a8\u6001\u6c99\u76d8",
    relationSignals: "\u5173\u7cfb\u4fe1\u53f7",
    generatedClues: "\u751f\u6210\u7ebf\u7d22",
    pathComparisonEmpty: "\u8fd9\u6b21\u6c99\u76d8\u8fd8\u6ca1\u6709\u5f62\u6210\u8def\u5f84\u5bf9\u6bd4\u3002",
    situationMapEmpty: "\u8fd9\u6b21\u6c99\u76d8\u8fd8\u6ca1\u6709\u5f62\u6210\u5c40\u52bf\u5730\u56fe\u3002",
    sandboxEventsEmpty: "\u8fd9\u6b21\u6c99\u76d8\u8fd8\u6ca1\u6709\u53ef\u5c55\u793a\u7684\u6c99\u76d8\u4e8b\u4ef6\u3002",
    technicalNote:
      "\u4ee5\u4e0b\u5185\u5bb9\u4fdd\u7559\u7ed9\u7ed3\u6784\u67e5\u770b\u548c\u6392\u67e5\u4f7f\u7528\uff0c\u9ed8\u8ba4\u6298\u53e0\uff0c\u4e0d\u4f5c\u4e3a\u666e\u901a\u7528\u6237\u7684\u4e3b\u9605\u8bfb\u8def\u5f84\u3002",
    counts: {
      roles: "\u89d2\u8272\u6a21\u578b",
      relations: "\u5173\u7cfb\u4fe1\u53f7",
      events: "\u6c99\u76d8\u4e8b\u4ef6",
      findings: "\u53d1\u73b0",
      feedback: "\u53cd\u9988",
    },
    pathLabels: {
      inertia: "\u5f53\u524d\u60ef\u6027\u8def\u5f84",
      cautious: "\u8c28\u614e\u89c2\u5bdf\u8def\u5f84",
      active: "\u4e3b\u52a8\u63a8\u8fdb\u8def\u5f84",
      boundary: "\u8fb9\u754c\u8c03\u6574\u8def\u5f84",
    },
  },
  en: {
    noDataTitle: "This sandbox does not have a result yet",
    noDataBody:
      "Start a sandbox first, then come back to review the key findings from this run.",
    startNew: "Back to start",
    running: "View sandbox unfolding",
    safetyTitle: "Result view is paused for safety",
    backToRunning: "Back to sandbox unfolding",
    topTitle: "Top 3 findings from this sandbox",
    noFindings:
      "This sandbox has not produced displayable key findings yet. Start a new sandbox first.",
    findingLabel: "Finding",
    whyImportant: "Why it matters",
    confidence: "Confidence",
    riskSignal: "Pressure signal",
    viewBasis: "View basis",
    sourceTags: {
      destiny: "Destiny climate",
      real: "Real-world clues",
      dynamic: "Dynamic sandbox",
    },
    sections: {
      basis: "View basis",
      paths: "Path comparison",
      map: "Situation map",
      events: "Sandbox events",
      improve: "Improve next run",
      technical: "Technical details",
      advanced: "Advanced calibration",
    },
    saveResult: "Save result",
    rebuild: "Rebuild findings",
    saved: "Result saved.",
    rebuilt: "Findings rebuilt from the current sandbox events.",
    saveFailed: "Save failed. Please try again.",
    feedbackMissing:
      "Select a finding or the overall sandbox before saving feedback.",
    feedbackSaved:
      "Feedback saved. It only helps calibrate the next sandbox and does not rewrite this result.",
    feedbackIntro:
      "Was this useful? Your feedback will not rewrite this result. It only helps calibrate the next sandbox.",
    notePlaceholder: "Briefly note what felt accurate or off.",
    saveFeedback: "Save feedback",
    targetFinding: "Current finding",
    targetOverall: "Overall sandbox",
    basisEmpty: "Select a finding to view its basis here.",
    destinyBasis: "Destiny climate",
    realBasis: "Real-world clues",
    dynamicBasis: "Dynamic sandbox",
    relationSignals: "Relation signals",
    generatedClues: "Generated clues",
    pathComparisonEmpty: "No path comparison is available for this sandbox yet.",
    situationMapEmpty: "No situation map is available for this sandbox yet.",
    sandboxEventsEmpty: "No sandbox events are available for this run yet.",
    technicalNote:
      "The details below are kept for structure review and troubleshooting. They stay folded by default.",
    counts: {
      roles: "Role models",
      relations: "Relation signals",
      events: "Sandbox events",
      findings: "Findings",
      feedback: "Feedback",
    },
    pathLabels: {
      inertia: "Current inertia path",
      cautious: "Cautious observation path",
      active: "Active push path",
      boundary: "Boundary adjustment path",
    },
  },
};

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
  role: "Role",
  relationshipToUser: "Relationship to user",
  "motivation.primaryGoal": "Primary goal",
  "motivation.fear": "Concern or fear",
  "motivation.avoidancePattern": "Avoidance pattern",
  "resources.authority": "Authority resource",
  "resources.information": "Information resource",
  "resources.socialCapital": "Social capital",
  "resources.emotionalLeverage": "Emotional leverage",
  "behaviorPolicy.actionSpeed": "Action speed",
  "behaviorPolicy.initiative": "Initiative",
  "behaviorPolicy.cooperationBias": "Cooperation bias",
  "behaviorPolicy.communicationStyle": "Communication style",
  "state.stress": "Stress state",
  "state.trustInUser": "Trust in user",
  "state.hostilityToUser": "Conflict pressure toward user",
  "state.currentIntention": "Current intention label",
  traits: "Traits",
  constraints: "Constraints",
  missingFields: "Missing fields",
  relationshipType: "Relationship type",
  "weights.trust": "Trust weight",
  "weights.hostility": "Conflict pressure weight",
  "weights.dependency": "Dependency weight",
  "weights.attraction": "Attraction weight",
  "weights.competition": "Competition weight",
  "weights.informationGap": "Information gap weight",
  "weights.resourceControl": "Resource control weight",
  "weights.emotionalDebt": "Emotional debt weight",
  "trend.volatility": "Volatility trend",
  "trend.trustDelta3Ticks": "Trust trend",
  "trend.hostilityDelta3Ticks": "Conflict pressure trend",
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

function pathLabelForLocale(value: string | undefined, locale: Locale) {
  const labels = resultCopy[locale].pathLabels;
  if (value === "cautious_self" || value === "Cautious self path") {
    return labels.cautious;
  }
  if (value === "decisive_self" || value === "Decisive self path") {
    return labels.active;
  }
  if (value === "boundary_adjustment" || value === "Boundary adjustment path") {
    return labels.boundary;
  }
  return labels.inertia;
}

function riskLabel(riskLevel: ClaimDraft["riskLevel"], locale: Locale) {
  if (locale === "zh") {
    if (riskLevel === "high") return "高压力";
    if (riskLevel === "medium") return "中等压力";
    return "低压力";
  }

  return `${riskLevel} pressure`;
}

function riskLanguage(riskLevel: ClaimDraft["riskLevel"], locale: Locale = "en") {
  if (locale === "zh") {
    if (riskLevel === "high") {
      return "这条压力在本次沙盘中较明显，行动前更需要先看依据。";
    }

    if (riskLevel === "medium") {
      return "这条压力值得关注，但还需要和现实线索一起判断。";
    }

    return "这条压力相对较轻，适合先作为观察信号。";
  }

  if (riskLevel === "high") {
    return "Pressure is elevated in this run; treat the window as sensitive and review the evidence before acting.";
  }

  if (riskLevel === "medium") {
    return "Pressure is noticeable but mixed; the useful move is to watch which signals repeat.";
  }

  return "Pressure is relatively light in this run; evidence still matters before drawing a strong conclusion.";
}

function confidenceLanguage(confidence: number, locale: Locale = "en") {
  if (locale === "zh") {
    if (confidence >= 80) {
      return "这条信号较稳定，但仍建议先看依据。";
    }

    if (confidence >= 55) {
      return "这是中等强度信号，适合继续观察。";
    }

    if (confidence >= 25) {
      return "这是较弱信号，适合当作待验证的问题。";
    }

    return "这条信号较弱，请只作为辅助参考。";
  }

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

function whyFindingMatters(
  claim: ClaimDraft,
  eventCount: number,
  locale: Locale = "en",
) {
  if (locale === "zh") {
    if (claim.claimType === "risk_window") {
      return `这条发现重要，是因为 ${eventCount} 个沙盘事件都指向同一类压力变化，适合优先查看依据再决定下一步。`;
    }

    if (claim.claimType === "opportunity_window") {
      return `这条发现重要，是因为 ${eventCount} 个沙盘事件显示这里可能出现可推进的窗口，但仍需要结合现实线索判断。`;
    }

    if (claim.claimType === "coordination_signal") {
      return `这条发现重要，是因为 ${eventCount} 个沙盘事件显示这里可能有可沟通、可观察或可借力的空间。`;
    }

    return `这条发现重要，是因为 ${eventCount} 个沙盘事件显示这里有值得继续观察的摩擦或变化。`;
  }

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

function findingDisplayTitle(
  finding: ClaimDraft,
  eventCount: number,
  locale: Locale,
) {
  if (locale === "en") return userFacingResultText(finding.summary, locale);

  if (finding.claimType === "risk_window") {
    return `${eventCount} 个沙盘事件提示：这里的压力正在升高`;
  }

  if (finding.claimType === "opportunity_window") {
    return `${eventCount} 个沙盘事件提示：这里可能出现推进窗口`;
  }

  if (finding.claimType === "coordination_signal") {
    return `${eventCount} 个沙盘事件提示：这里可能有可借力的空间`;
  }

  return `${eventCount} 个沙盘事件提示：这里值得继续观察`;
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

function userFacingResultText(value: string, locale: Locale) {
  const terms =
    locale === "zh"
      ? {
          claim: "发现",
          eventLog: "沙盘事件",
          agent: "角色模型",
          relationEdge: "关系信号",
          evidence: "依据",
        }
      : {
          claim: "finding",
          eventLog: "sandbox event",
          agent: "role model",
          relationEdge: "relation signal",
          evidence: "basis",
        };

  return value
    .replace(/\bclaims?\b/gi, terms.claim)
    .replace(/\bevent logs?\b/gi, terms.eventLog)
    .replace(/\bagents?\b/gi, terms.agent)
    .replace(/\brelation edges?\b/gi, terms.relationEdge)
    .replace(/\brelation edge\b/gi, terms.relationEdge)
    .replace(/\bevidence_event_ids\b/gi, terms.evidence)
    .replace(/\bevidence refs?\b/gi, terms.evidence);
}

export default function ReportsPage() {
  const { locale: languageLocale } = useLanguage();
  const locale: Locale = languageLocale === "zh" ? "zh" : "en";
  const copy = resultCopy[locale];
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
  const [groundedSocialSimulation] =
    useState<GroundedSocialSimulationDraft | null>(() => {
      const seedResult = repos.seedContexts.load();
      const seed = seedResult.ok ? seedResult.data : null;
      if (!seed) return null;
      const result = repos.groundedSocialSimulations.load(seed.id);
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
  const paidReportVisible = false;
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
      setMessage(copy.saveFailed);
      return;
    }
    setMessage(copy.saved);
  }

  function rebuildLedger() {
    if (!seedContext || !simulationRun) return;
    const nextLedger = buildClaimLedgerDraft(seedContext.id, simulationRun);
    const result = repos.reports.save(nextLedger);
    if (!result.ok) {
      setMessage(copy.saveFailed);
      return;
    }
    setLedger(nextLedger);
    setSelectedClaimId("");
    setSelectedEventId("");
    setMessage(copy.rebuilt);
  }

  function saveFeedback() {
    if (
      !seedContext ||
      !simulationRun ||
      !feedbackLedger ||
      !resolvedFeedbackTargetId
    ) {
      setMessage(copy.feedbackMissing);
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
      setMessage(copy.saveFailed);
      return;
    }
    setFeedbackLedger(nextLedger);
    saveCalibrationProfile(buildCalibrationProfile(nextLedger));
    setFeedbackNote("");
    setAgentCorrectionValue("");
    setRelationCorrectionValue("");
    setMessage(copy.feedbackSaved);
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
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            {copy.noDataTitle}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            {copy.noDataBody}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/app/start" className="px-5 py-3">
              {copy.startNew}
            </ButtonLink>
            <ButtonLink href="/app/simulation/running" variant="secondary" className="px-5 py-3">
              {copy.running}
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
            title={copy.safetyTitle}
          />
          <ButtonLink
            href="/app/simulation/running"
            className="px-5 py-3"
          >
            {copy.backToRunning}
          </ButtonLink>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {message ? (
        <p className="mb-5 rounded-md border border-[#568262]/20 bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3d]">
          {message}
        </p>
      ) : null}
      {safetyDecision && safetyDecision.safetyLevel !== "safe" ? (
        <div className="mb-5">
          <SafetyDowngradeNotice
            decision={safetyDecision}
            title={copy.safetyTitle}
          />
        </div>
      ) : null}

      <div className="mb-5">
        <RuntimeCapabilityBanner
          realityIntake={groundedSocialSimulation?.realityIntake}
        />
      </div>

      <div className="mb-5">
        <RealityIntakeModeBanner
          realityIntake={groundedSocialSimulation?.realityIntake}
          locale={locale}
        />
      </div>

      <TopFindingsSection
        findings={topFindings}
        selectedFindingId={activeFinding?.id ?? ""}
        destinyClimate={destinyClimate}
        evidenceEvents={activeFindingEvidenceEvents}
        simulationEvents={simulationRun.events}
        locale={locale}
        onSelectFinding={selectClaim}
      />

      <GroundedResultBasisInspectorPanel
        groundedSocialSimulation={groundedSocialSimulation}
        activeFinding={activeFinding}
        simulationEvents={simulationRun.events}
        locale={locale}
      />

      <section className="space-y-3">
        <ResultFold title={copy.sections.basis}>
          <EvidenceReplayPanel
            finding={activeFinding}
            destinyClimate={destinyClimate}
            destinyProfile={destinyProfile}
            destinyFusion={destinyFusion}
            groundedSocialSimulation={groundedSocialSimulation}
            seedContext={seedContext}
            agents={agentEcology?.agents ?? []}
            relationEdges={relationGraph?.edges ?? []}
            simulationEvents={simulationRun.events}
            branchComparison={report?.paidReport.branchComparison ?? []}
            locale={locale}
          />
        </ResultFold>

        <ResultFold title={copy.sections.paths}>
          {report?.paidReport.branchComparison.length ? (
            <BranchComparison
              items={report.paidReport.branchComparison}
              selectedClaimId={activeFinding?.id ?? ""}
              locale={locale}
            />
          ) : (
            <EmptyFoldMessage>{copy.pathComparisonEmpty}</EmptyFoldMessage>
          )}
        </ResultFold>

        <ResultFold title={copy.sections.map}>
          {relationGraph?.edges.length ? (
            <RelationGraph
              agents={agentEcology?.agents ?? []}
              edges={relationGraph.edges}
              selectedEdgeId={highlightedEdgeIds[0] ?? ""}
              locked={relationGraph.graphLocked}
              onSelectEdge={selectEdge}
            />
          ) : (
            <EmptyFoldMessage>{copy.situationMapEmpty}</EmptyFoldMessage>
          )}
        </ResultFold>

        <ResultFold title={copy.sections.events}>
          {simulationRun.events.length ? (
            <TimelineFeed
              ticks={simulationRun.ticks}
              events={simulationRun.events}
              agents={agentEcology?.agents ?? []}
              edges={relationGraph?.edges ?? []}
              highlightedEventIds={highlightedEventIds}
              selectedEventId={selectedEvent?.id ?? ""}
              onSelectEvent={selectEvent}
              title={copy.sections.events}
              description={
                locale === "zh"
                  ? "这里按时间展示动态沙盘中发生的互动、压力变化和生成线索。"
                  : "This lists the interactions, pressure changes, and generated clues from the dynamic sandbox."
              }
            />
          ) : (
            <EmptyFoldMessage>{copy.sandboxEventsEmpty}</EmptyFoldMessage>
          )}
        </ResultFold>

        <ResultFold title={copy.sections.improve}>
          <SimpleFeedbackPanel
            target={feedbackTarget}
            targetId={resolvedFeedbackTargetId}
            targetOptions={feedbackTargetOptions}
            rating={feedbackRating}
            note={feedbackNote}
            ledger={feedbackLedger}
            onTargetChange={changeFeedbackTarget}
            onTargetIdChange={setFeedbackTargetId}
            onRatingChange={setFeedbackRating}
            onNoteChange={setFeedbackNote}
            onSave={saveFeedback}
            locale={locale}
          />
          <details className="mt-4 rounded-md border border-black/8 bg-[#f7f8f4] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[#11150f]">
              {copy.sections.advanced}
            </summary>
            <div className="mt-4">
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
                onRelationCorrectionConfidenceChange={
                  setRelationCorrectionConfidence
                }
                onSave={saveFeedback}
              />
            </div>
          </details>
        </ResultFold>

        <ResultFold title={copy.sections.technical}>
          <p className="mb-4 text-sm leading-6 text-[#62695d]">
            {copy.technicalNote}
          </p>
          <div className="mb-5">
            <GroundedSimulationDebugPanel
              groundedSocialSimulation={groundedSocialSimulation}
              locale={locale}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            <Metric label={copy.counts.roles} value={agentEcology?.agents.length ?? simulationRun.agentIds.length} />
            <Metric label={copy.counts.relations} value={relationGraph?.edges.length ?? simulationRun.relationEdgeIds.length} />
            <Metric label={copy.counts.events} value={simulationRun.events.length} />
            <Metric label={copy.counts.findings} value={report?.invariant.claimIds.length ?? claims.length} />
            <Metric label={copy.counts.feedback} value={feedbackLedger?.feedback.length ?? 0} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" onClick={saveLedger}>
              {copy.saveResult}
            </Button>
            <Button type="button" variant="secondary" onClick={rebuildLedger}>
              {copy.rebuild}
            </Button>
          </div>
          <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-5">
              {report ? (
                <ReportSummary report={report} paidMode={paidReportVisible} />
              ) : null}
              <DestinySituationSummarySection
                destinyClimate={destinyClimate}
                destinyProfile={destinyProfile}
                destinyFusion={destinyFusion}
                seedContext={seedContext}
                agents={agentEcology?.agents ?? []}
                relationEdges={relationGraph?.edges ?? []}
                events={simulationRun.events}
              />
              <AgentGraphSummary
                agents={agentEcology?.agents ?? []}
                edges={relationGraph?.edges ?? []}
                highlightedAgentIds={highlightedAgentIds}
                highlightedEdgeIds={highlightedEdgeIds}
              />
              {selectedEvent ? (
                <section className="rounded-lg border border-black/8 bg-white p-5">
                  <h2 className="text-sm font-semibold text-[#11150f]">
                    {copy.sections.events}
                  </h2>
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
                </section>
              ) : null}
            </div>
            <div className="space-y-5">
              <CalibrationSummary profile={calibrationProfile} />
            </div>
          </div>
        </ResultFold>
      </section>
    </AppShell>
  );
}

function TopFindingsSection({
  findings,
  selectedFindingId,
  destinyClimate,
  evidenceEvents,
  simulationEvents,
  locale,
  onSelectFinding,
}: {
  findings: ClaimDraft[];
  selectedFindingId: string;
  destinyClimate: DestinyClimateDraft | null;
  evidenceEvents: ReportEvidenceEvent[];
  simulationEvents: SimulationEventDraft[];
  locale: Locale;
  onSelectFinding: (findingId: string) => void;
}) {
  const copy = resultCopy[locale];
  const selectedFinding =
    findings.find((finding) => finding.id === selectedFindingId) ??
    findings[0] ??
    null;

  return (
    <section className="mb-6 rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.02em] text-[#11150f] md:text-4xl">
        {copy.topTitle}
      </h1>

      {findings.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {findings.map((finding, index) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              index={index}
              selected={selectedFinding?.id === finding.id}
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
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          {copy.noFindings}
        </p>
      )}
    </section>
  );
}

function nodeSourceLabel(source: GroundedRealityNode["source"], locale: Locale) {
  if (locale === "en") return source;
  if (source === "user_input") return "用户输入";
  if (source === "manual_reality_source") return "手动现实材料";
  if (source === "inferred_from_user_context") return "现实语义推断";
  if (source === "sample_data") return "示例数据";
  return "未来外部数据";
}

function groundedListText(values: string[], locale: Locale) {
  if (!values.length) return locale === "zh" ? "未记录" : "None recorded";
  return values.join(locale === "zh" ? "、" : ", ");
}

function groundedNodeBasisText(node: GroundedRealityNode, locale: Locale) {
  if (locale === "zh") {
    return `${node.label}｜${node.nodeType}｜${nodeSourceLabel(node.source, locale)}｜${node.confidence}%：${node.roleInSituation}。控制资源：${groundedListText(node.resourcesControlled, locale)}。掌握信息：${groundedListText(node.informationHeld, locale)}。提供机会：${groundedListText(node.opportunitiesProvided, locale)}。制造约束：${groundedListText(node.constraintsCreated, locale)}。证据引用：${node.evidenceRefs.length} 条。`;
  }

  return `${node.label} | ${node.nodeType} | ${node.source} | ${node.confidence}%: ${node.roleInSituation}. Resources: ${groundedListText(node.resourcesControlled, locale)}. Information: ${groundedListText(node.informationHeld, locale)}. Opportunities: ${groundedListText(node.opportunitiesProvided, locale)}. Constraints: ${groundedListText(node.constraintsCreated, locale)}. Evidence refs: ${node.evidenceRefs.length}.`;
}

function groundedPressureBasisText(
  pressure: GroundedRealityPressure,
  nodeById: Map<string, GroundedRealityNode>,
  locale: Locale,
) {
  const source = nodeById.get(pressure.sourceNodeId)?.label ?? pressure.sourceNodeId;
  const target = nodeById.get(pressure.targetNodeId)?.label ?? pressure.targetNodeId;

  if (locale === "zh") {
    return `${pressure.pressureType}｜${source} → ${target}｜${pressure.confidence}%：${pressure.explanation}。证据引用：${pressure.evidenceRefs.length} 条。`;
  }

  return `${pressure.pressureType} | ${source} -> ${target} | ${pressure.confidence}%: ${pressure.explanation}. Evidence refs: ${pressure.evidenceRefs.length}.`;
}

function pathEventBasisText(
  pathEvent: GroundedSocialSimulationDraft["pathEvents"][number],
  linkedEvents: SimulationEventDraft[],
  locale: Locale,
) {
  const linked = linkedEvents
    .filter((event) => event.branchId === pathEvent.branchId)
    .slice(0, 3)
    .map((event) => `${event.id} / tick ${event.tickIndex}`)
    .join(", ");

  if (locale === "zh") {
    return `${pathEvent.branchId}｜${pathEvent.confidence}%：用户动作：${pathEvent.userAction}。现实事件：${pathEvent.expectedRealityReaction}。命理调权：${pathEvent.destinyModifierEffect}。压力：${pathEvent.pressureChange}。信息：${pathEvent.informationChange}。机会：${pathEvent.opportunityChange}。关联 SimulationEvent：${linked || "暂无直接关联事件"}。`;
  }

  return `${pathEvent.branchId} | ${pathEvent.confidence}%: User action: ${pathEvent.userAction}. Reality event: ${pathEvent.expectedRealityReaction}. Destiny weighting: ${pathEvent.destinyModifierEffect}. Pressure: ${pathEvent.pressureChange}. Information: ${pathEvent.informationChange}. Opportunity: ${pathEvent.opportunityChange}. Linked SimulationEvent: ${linked || "No directly linked event"}.`;
}

// Kept during the evidence-panel transition so older local snapshots remain easy to compare.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GroundedResultBasisPanel({
  groundedSocialSimulation,
  activeFinding,
  simulationEvents,
  locale,
}: {
  groundedSocialSimulation: GroundedSocialSimulationDraft | null;
  activeFinding: ClaimDraft | null;
  simulationEvents: SimulationEventDraft[];
  locale: Locale;
}) {
  const title =
    locale === "zh"
      ? "这次结果的依据被拆成四层"
      : "This result separates four basis layers";
  const findingEvents = activeFinding
    ? simulationEvents.filter((event) =>
        activeFinding.evidenceEventIds.includes(event.id),
      )
    : [];
  const groundedEvents = findingEvents.filter(
    (event) =>
      event.groundedRealitySummary ||
      event.groundedPressureSummary ||
      event.destinyModifierEffect,
  );

  if (!groundedSocialSimulation) {
    return (
      <section className="my-5 rounded-lg border border-dashed border-black/12 bg-white p-6">
        <h2 className="text-base font-semibold text-[#11150f]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#62695d]">
          {locale === "zh"
            ? "还没有保存的 GroundedSocialSimulationDraft；旧结果仍可查看，但无法快速区分现实依据、命理调权和路径演化。"
            : "No GroundedSocialSimulationDraft is saved yet. The legacy result still works, but reality basis, destiny weighting, and path evolution cannot be separated here."}
        </p>
      </section>
    );
  }

  const modifier = groundedSocialSimulation.destinyPersonModifier;

  return (
    <section className="my-5 rounded-lg border border-[#568262]/20 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#11150f]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#62695d]">
            {locale === "zh"
              ? "你可以快速检查每个发现到底来自现实、命理调权、路径事件，还是低置信的不确定信息。"
              : "Use this to inspect whether each finding comes from reality, destiny weighting, path events, or low-confidence uncertainty."}
          </p>
        </div>
        <StatusPill tone="ready">{groundedSocialSimulation.confidence}%</StatusPill>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <BasisColumn
          title={locale === "zh" ? "现实依据" : "Reality basis"}
          items={groundedSocialSimulation.realityNodes.slice(0, 5).map(
            (node) =>
              `${node.label} (${node.source}, ${node.confidence}%): ${node.roleInSituation}`,
          )}
          empty={locale === "zh" ? "暂无现实节点。" : "No reality nodes."}
        />
        <BasisColumn
          title={locale === "zh" ? "命理调权依据" : "Destiny weighting basis"}
          items={[
            `${locale === "zh" ? "决策风格" : "Decision style"}: ${modifier.decisionStyle}`,
            `${locale === "zh" ? "压力反应" : "Stress response"}: ${modifier.stressResponse}`,
            `${locale === "zh" ? "边界风格" : "Boundary style"}: ${modifier.boundaryStyle}`,
            `${locale === "zh" ? "时间敏感度" : "Timing sensitivity"}: ${modifier.timingSensitivity}`,
          ]}
          empty={locale === "zh" ? "暂无命理调权。" : "No destiny modifier."}
        />
        <BasisColumn
          title={locale === "zh" ? "路径演化依据" : "Path evolution basis"}
          items={(groundedEvents.length ? groundedEvents : findingEvents)
            .slice(0, 5)
            .map(
              (event) =>
                `${pathLabelForLocale(event.pathLabel ?? event.branchId, locale)}: ${
                  event.groundedRealitySummary ?? event.summary
                }`,
            )}
          empty={locale === "zh" ? "请选择一个有事件依据的发现。" : "Select a finding with event evidence."}
        />
        <BasisColumn
          title={locale === "zh" ? "不确定性" : "Uncertainty"}
          items={groundedSocialSimulation.keyUncertainties.concat(
            groundedSocialSimulation.destinyPersonModifier.uncertaintyNotes,
          )}
          empty={locale === "zh" ? "暂无关键不确定性。" : "No key uncertainty noted."}
        />
      </div>
    </section>
  );
}

function BasisColumn({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <section className="rounded-md border border-black/8 bg-[#f7f8f4] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {title}
      </h3>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map((item, index) => (
            <p key={`${item}-${index}`} className="rounded border border-black/8 bg-white p-3 text-xs leading-5 text-[#62695d]">
              {item}
            </p>
          ))
        ) : (
          <p className="text-xs leading-5 text-[#7d8578]">{empty}</p>
        )}
      </div>
    </section>
  );
}

function GroundedResultBasisInspectorPanel({
  groundedSocialSimulation,
  activeFinding,
  simulationEvents,
  locale,
}: {
  groundedSocialSimulation: GroundedSocialSimulationDraft | null;
  activeFinding: ClaimDraft | null;
  simulationEvents: SimulationEventDraft[];
  locale: Locale;
}) {
  const title =
    locale === "zh"
      ? "这次结果的依据被拆成四层"
      : "This result separates four basis layers";
  const findingEvents = activeFinding
    ? simulationEvents.filter((event) =>
        activeFinding.evidenceEventIds.includes(event.id),
      )
    : [];

  if (!groundedSocialSimulation) {
    return (
      <section className="my-5 rounded-lg border border-dashed border-black/12 bg-white p-6">
        <h2 className="text-base font-semibold text-[#11150f]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#62695d]">
          {locale === "zh"
            ? "还没有保存的 GroundedSocialSimulationDraft；旧结果仍可查看，但无法快速区分现实依据、命理调权和路径演化。"
            : "No GroundedSocialSimulationDraft is saved yet. The legacy result still works, but reality basis, destiny weighting, and path evolution cannot be separated here."}
        </p>
      </section>
    );
  }

  const modifier = groundedSocialSimulation.destinyPersonModifier;
  const nodeById = new Map(
    groundedSocialSimulation.realityNodes.map((node) => [node.id, node] as const),
  );
  const findingNodeIds = new Set(
    findingEvents.flatMap((event) => event.groundedRealityNodeIds ?? []),
  );
  const findingNodes = groundedSocialSimulation.realityNodes.filter((node) =>
    findingNodeIds.has(node.id),
  );
  const realityNodes = findingNodes.length
    ? findingNodes
    : groundedSocialSimulation.realityNodes;
  const realityNodeIds = new Set(realityNodes.map((node) => node.id));
  const realityPressures = groundedSocialSimulation.realityPressures.filter(
    (pressure) =>
      !findingNodes.length ||
      realityNodeIds.has(pressure.sourceNodeId) ||
      realityNodeIds.has(pressure.targetNodeId),
  );
  const linkedPathEvents = groundedSocialSimulation.pathEvents.filter(
    (pathEvent) =>
      !findingEvents.length ||
      findingEvents.some((event) => event.branchId === pathEvent.branchId),
  );
  const lowConfidenceNotes = groundedSocialSimulation.pathEvents
    .filter((event) => event.confidence < 55)
    .map((event) =>
      locale === "zh"
        ? `${event.branchId} 路径置信度较低：${event.confidence}%`
        : `${event.branchId} path has low confidence: ${event.confidence}%`,
    );

  return (
    <section className="my-5 rounded-lg border border-[#568262]/20 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#11150f]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#62695d]">
            {locale === "zh"
              ? "你可以快速检查每个发现到底来自现实依据、命理调权、路径事件，还是低置信的不确定信息。"
              : "Use this to inspect whether each finding comes from reality, destiny weighting, path events, or low-confidence uncertainty."}
          </p>
        </div>
        <StatusPill tone="ready">{groundedSocialSimulation.confidence}%</StatusPill>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <BasisColumn
          title={
            locale === "zh"
              ? "现实依据：节点、压力、证据"
              : "Reality basis: nodes, pressures, evidence"
          }
          items={[
            ...realityNodes.map((node) => groundedNodeBasisText(node, locale)),
            ...realityPressures.map((pressure) =>
              groundedPressureBasisText(pressure, nodeById, locale),
            ),
            ...Array.from(
              new Set(realityNodes.flatMap((node) => node.evidenceRefs)),
            ).map((ref) =>
              locale === "zh" ? `现实 evidenceRef：${ref}` : `Reality evidenceRef: ${ref}`,
            ),
          ]}
          empty={locale === "zh" ? "暂无现实依据。" : "No reality basis."}
        />
        <BasisColumn
          title={
            locale === "zh"
              ? "命理调权依据：只影响用户反应"
              : "Destiny weighting basis: user reaction only"
          }
          items={[
            locale === "zh"
              ? "命理气候可能影响你的反应方式、时间敏感度和边界风格；它不创造现实人物、现实事实或现实结果。"
              : "Destiny climate may affect your reaction style, timing sensitivity, and boundary posture. It does not create real people, real facts, or real outcomes.",
            `${locale === "zh" ? "决策风格" : "Decision style"}: ${modifier.decisionStyle}`,
            `${locale === "zh" ? "压力反应" : "Stress response"}: ${modifier.stressResponse}`,
            `${locale === "zh" ? "机会响应" : "Opportunity response"}: ${modifier.opportunityResponse}`,
            `${locale === "zh" ? "资源压力反应" : "Resource pressure response"}: ${modifier.resourcePressureResponse}`,
            `${locale === "zh" ? "关系压力反应" : "Relationship pressure response"}: ${modifier.relationshipPressureResponse}`,
            `${locale === "zh" ? "边界风格" : "Boundary style"}: ${modifier.boundaryStyle}`,
            `${locale === "zh" ? "时间敏感度" : "Timing sensitivity"}: ${modifier.timingSensitivity}`,
            ...modifier.uncertaintyNotes.map((note) =>
              locale === "zh" ? `命理不确定性：${note}` : `Destiny uncertainty: ${note}`,
            ),
          ]}
          empty={locale === "zh" ? "暂无命理调权。" : "No destiny modifier."}
        />
        <BasisColumn
          title={
            locale === "zh"
              ? "路径演化依据：Grounded path + SimulationEvent"
              : "Path evolution basis: grounded path + SimulationEvent"
          }
          items={linkedPathEvents.map((pathEvent) =>
            pathEventBasisText(
              pathEvent,
              findingEvents.length ? findingEvents : simulationEvents,
              locale,
            ),
          )}
          empty={
            locale === "zh"
              ? "请选择一个有事件依据的发现。"
              : "Select a finding with event evidence."
          }
        />
        <BasisColumn
          title={
            locale === "zh"
              ? "不确定性：低置信和可观察信号"
              : "Uncertainty: low confidence and observable signals"
          }
          items={[
            ...groundedSocialSimulation.keyUncertainties,
            ...groundedSocialSimulation.destinyPersonModifier.uncertaintyNotes,
            ...lowConfidenceNotes,
            ...groundedSocialSimulation.observableSignals.map((signal) =>
              locale === "zh" ? `可观察信号：${signal}` : `Observable signal: ${signal}`,
            ),
          ]}
          empty={locale === "zh" ? "暂无关键不确定性。" : "No key uncertainty noted."}
        />
      </div>
    </section>
  );
}

function FindingCard({
  finding,
  index,
  selected,
  sourceTags,
  eventCount,
  onSelect,
  locale,
}: {
  finding: ClaimDraft;
  index: number;
  selected: boolean;
  sourceTags: string[];
  eventCount: number;
  onSelect: (findingId: string) => void;
  locale: Locale;
}) {
  const copy = resultCopy[locale];
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
          {copy.findingLabel} {index + 1}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <SourceTag
          label={copy.sourceTags.destiny}
          active={sourceTags.includes("destiny climate")}
        />
        <SourceTag
          label={copy.sourceTags.real}
          active={sourceTags.includes("real situation")}
        />
        <SourceTag
          label={copy.sourceTags.dynamic}
          active={sourceTags.includes("integrated simulation")}
        />
      </div>

      <h3 className="mt-4 text-base font-semibold leading-7 text-[#11150f]">
        {findingDisplayTitle(finding, eventCount, locale)}
      </h3>

      <div className="mt-4 space-y-3">
        <FindingMeta
          label={copy.whyImportant}
          value={whyFindingMatters(finding, eventCount, locale)}
        />
        <FindingMeta
          label={copy.riskSignal}
          value={
            locale === "zh"
              ? `${riskLabel(finding.riskLevel, locale)}。${riskLanguage(
                  finding.riskLevel,
                  locale,
                )}`
              : `${riskLabel(finding.riskLevel, locale)}. ${riskLanguage(
                  finding.riskLevel,
                )}`
          }
        />
        <FindingMeta
          label={copy.confidence}
          value={
            locale === "zh"
              ? `${finding.confidence}% 置信度。${confidenceLanguage(
                  finding.confidence,
                  locale,
                )}`
              : `${finding.confidence}% confidence. ${confidenceLanguage(
                  finding.confidence,
                )}`
          }
        />
      </div>

      <button
        type="button"
        onClick={() => onSelect(finding.id)}
        className="mt-5 w-full rounded-md border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#11150f] hover:border-[#568262]/30"
      >
        {copy.viewBasis}
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

function ResultFold({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="rounded-lg border border-black/8 bg-white shadow-[0_16px_48px_rgba(17,21,15,0.04)]"
    >
      <summary className="cursor-pointer px-5 py-4 text-base font-semibold text-[#11150f]">
        {title}
      </summary>
      <div className="border-t border-black/8 p-5">{children}</div>
    </details>
  );
}

function EmptyFoldMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-black/16 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#62695d]">
      {children}
    </p>
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
  groundedSocialSimulation,
  seedContext,
  agents,
  relationEdges,
  simulationEvents,
  branchComparison,
  locale,
}: {
  finding: ClaimDraft | null;
  destinyClimate: DestinyClimateDraft | null;
  destinyProfile: DestinyProfileDraft | null;
  destinyFusion: DestinySituationFusionDraft | null;
  groundedSocialSimulation: GroundedSocialSimulationDraft | null;
  seedContext: SeedContextDraft;
  agents: AgentProfileDraft[];
  relationEdges: RelationEdgeDraft[];
  simulationEvents: SimulationEventDraft[];
  branchComparison: ReportBranchComparison[];
  locale: Locale;
}) {
  const copy = resultCopy[locale];
  if (!finding) {
    return (
      <div className="rounded-md border border-dashed border-black/16 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#62695d]">
        {copy.basisEmpty}
      </div>
    );
  }

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
  const groundedNodesForFinding = groundedSocialSimulation?.realityNodes.filter(
    (node) =>
      rawFindingEvents.some((event) =>
        event.groundedRealityNodeIds?.includes(node.id),
      ),
  ) ?? [];
  const groundedUncertainties = [
    ...(groundedSocialSimulation?.keyUncertainties ?? []),
    ...(groundedSocialSimulation?.destinyPersonModifier.uncertaintyNotes ?? []),
  ];

  return (
      <div className="grid gap-4 lg:grid-cols-2">
        <ReplayBlock title={locale === "zh" ? "现实依据" : "Reality basis"}>
          <ReplayList
            values={groundedNodesForFinding.length
              ? groundedNodesForFinding.map(
                  (node) =>
                    `${node.label} (${node.source}, ${node.confidence}%): ${node.roleInSituation}`,
                )
              : topRealWorldClues(seedContext)}
            empty={
              locale === "zh"
                ? "没有可展示的现实依据。"
                : "No displayable reality basis is attached."
            }
          />
          <ReplaySubhead>
            {locale === "zh" ? "现实压力" : "Grounded pressures"}
          </ReplaySubhead>
          <ReplayList
            values={uniqueStrings(
              rawFindingEvents.map((event) => event.groundedPressureSummary ?? ""),
            )}
            empty={
              locale === "zh"
                ? "没有可展示的现实压力摘要。"
                : "No grounded pressure summary is attached."
            }
          />
        </ReplayBlock>

        <ReplayBlock title={locale === "zh" ? "命理调权依据" : "Destiny weighting basis"}>
          <ReplayList
            values={uniqueStrings([
              groundedSocialSimulation?.destinyPersonModifier.decisionStyle ?? "",
              groundedSocialSimulation?.destinyPersonModifier.stressResponse ?? "",
              groundedSocialSimulation?.destinyPersonModifier.opportunityResponse ?? "",
              groundedSocialSimulation?.destinyPersonModifier.boundaryStyle ?? "",
              groundedSocialSimulation?.destinyPersonModifier.timingSensitivity ?? "",
              ...rawFindingEvents.map((event) => event.destinyModifierEffect ?? ""),
            ])}
            empty={
              locale === "zh"
                ? "没有可展示的命理调权依据。"
                : "No destiny weighting basis is attached."
            }
          />
          <p className="mt-3 rounded border border-[#568262]/15 bg-white px-3 py-2 text-xs leading-5 text-[#62695d]">
            {locale === "zh"
              ? "命理气候只解释用户反应倾向和时间敏感度，不补齐现实事实。"
              : "Destiny climate only explains user reaction tendency and timing sensitivity. It does not fill real-world facts."}
          </p>
        </ReplayBlock>

        <ReplayBlock title={locale === "zh" ? "路径演化依据" : "Path evolution basis"}>
          <ReplayList
            values={uniqueStrings(
              rawFindingEvents.flatMap((event) => [
                event.groundedRealitySummary
                  ? `${pathLabelForLocale(event.pathLabel ?? event.branchId, locale)}: ${event.groundedRealitySummary}`
                  : "",
                event.groundedPressureSummary
                  ? `${locale === "zh" ? "压力变化" : "Pressure change"}: ${event.groundedPressureSummary}`
                  : "",
              ]),
            )}
            empty={
              locale === "zh"
                ? "没有可展示的路径演化依据。"
                : "No path evolution basis is attached."
            }
          />
        </ReplayBlock>

        <ReplayBlock title={locale === "zh" ? "不确定性" : "Uncertainty"}>
          <ReplayList
            values={groundedUncertainties}
            empty={
              locale === "zh"
                ? "没有记录关键不确定性。"
                : "No key uncertainty is recorded."
            }
          />
        </ReplayBlock>

        <ReplayBlock title={copy.destinyBasis}>
          {destinySkipped ? (
            <p>
              {locale === "zh"
                ? "这条发现主要来自现实线索和动态沙盘；本次已跳过命理。"
                : "This finding used real-world clues and sandbox evidence; destiny climate was skipped."}
            </p>
          ) : destinyClimate || destinyProfile ? (
            <div className="space-y-3">
              <ReplaySubhead>{copy.confidence}</ReplaySubhead>
              <ReplayList
                values={confidenceNotes}
                empty={
                  locale === "zh"
                    ? "没有可展示的命理置信度说明。"
                    : "No destiny confidence note is available."
                }
              />
              {destinyClimate?.userFacingOverview ? (
                <p>{destinyClimate.userFacingOverview}</p>
              ) : null}
              <ReplaySubhead>{copy.sourceTags.destiny}</ReplaySubhead>
              <ReplayList
                values={climateThemes}
                empty={
                  locale === "zh"
                    ? "这条发现没有关联到可展示的命理气候主题。"
                    : "No key climate themes were attached to this finding."
                }
              />
              <ReplaySubhead>
                {locale === "zh" ? "相关解读" : "Relevant notes"}
              </ReplaySubhead>
              <ReplayList
                values={interpretationNotes}
                empty={
                  locale === "zh"
                    ? "没有更多可展示的解读说明。"
                    : "No interpretation notes were attached to this finding."
                }
              />
            </div>
          ) : (
            <p>
              {locale === "zh"
                ? "本次没有可用的命理气候依据，因此主要参考现实线索和动态沙盘。"
                : "Destiny climate is not available for this run, so the basis relies on real-world clues and sandbox events."}
            </p>
          )}
        </ReplayBlock>

        <ReplayBlock title={copy.realBasis}>
          <ReplaySubhead>
            {locale === "zh" ? "当前问题" : "Current question"}
          </ReplaySubhead>
          <ReplayList
            values={[decisionTopic(seedContext)]}
            empty={
              locale === "zh"
                ? "没有记录当前问题。"
                : "No current question was captured."
            }
          />
          <ReplaySubhead>
            {locale === "zh" ? "你的描述" : "Your description"}
          </ReplaySubhead>
          <ReplayList
            values={topRealWorldClues(seedContext)}
            empty={
              locale === "zh"
                ? "没有记录更多现实描述。"
                : "No free-form situation was captured."
            }
          />
          <ReplaySubhead>
            {locale === "zh" ? "涉及的人" : "People involved"}
          </ReplaySubhead>
          <ReplayList
            values={people}
            empty={
              locale === "zh"
                ? "这条发现没有关联到具体人物。"
                : "No involved people were attached to this finding."
            }
          />
          <ReplaySubhead>{copy.sourceTags.real}</ReplaySubhead>
          <ReplayList
            values={uniqueStrings([
              seedContext.recentEventsText ?? seedContext.recentEvents ?? "",
              seedContext.worries ?? "",
              seedContext.decisionOptionsText ?? seedContext.decisionOptions ?? "",
              seedContext.desiredOutputText ?? seedContext.desiredOutput ?? "",
            ])}
            empty={
              locale === "zh"
                ? "没有更多现实线索。"
                : "No additional real-world clues were captured."
            }
          />
        </ReplayBlock>

        <ReplayBlock title={copy.dynamicBasis}>
          {rawFindingEvents.length ? (
            <div className="space-y-4">
              {rawFindingEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-md border border-black/8 bg-white p-3"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
                    {pathLabelForLocale(event.pathLabel ?? event.branchId, locale)} /{" "}
                    {event.timeLabel}
                  </div>
                  <ReplayList
                    values={uniqueStrings([
                      event.userFacingEventTitle ?? event.summary,
                      event.destinyInfluenceSummary
                        ? `${copy.sourceTags.destiny}: ${event.destinyInfluenceSummary}`
                        : "",
                      event.interactionSummary
                        ? `${locale === "zh" ? "互动" : "Interaction"}: ${event.interactionSummary}`
                        : "",
                      event.pressureDeltaSummary
                        ? `${locale === "zh" ? "压力变化" : "Pressure change"}: ${event.pressureDeltaSummary}`
                        : "",
                      ...(event.generatedClues ?? []).map(
                        (clue) => `${copy.generatedClues}: ${clue}`,
                      ),
                    ])}
                    empty={
                      locale === "zh"
                        ? "没有可展示的沙盘事件说明。"
                        : "No sandbox event summary was attached."
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <p>
              {locale === "zh"
                ? `已找到 ${fallbackEvents.length} 条依据，但没有可展示的沙盘事件详情。`
                : `${fallbackEvents.length} basis item(s) were found, but no displayable sandbox event details are available.`}
            </p>
          )}
        </ReplayBlock>

        <ReplayBlock title={copy.relationSignals}>
          <ReplayList
            values={relations}
            empty={
              locale === "zh"
                ? "这条发现没有关联到关系信号。"
                : "No relation signal was attached."
            }
          />
          {rawFindingEvents.length ? (
            <div className="mt-3 space-y-2">
              {rawFindingEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
                    {pathLabelForLocale(event.pathLabel ?? event.branchId, locale)}
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
          ) : null}
        </ReplayBlock>

        <ReplayBlock title={copy.sections.paths}>
          {branchItems.length ? (
            <div className="space-y-2">
              {branchItems.map((branch) => (
                <div
                  key={branch.branchId}
                  className="rounded-md border border-black/8 bg-white p-3"
                >
                  <div className="text-sm font-semibold text-[#11150f]">
                    {pathLabelForLocale(branch.branchId, locale)}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#62695d]">
                    {locale === "zh"
                      ? `${branch.eventCount} 个事件，${branch.riskSignalCount} 个压力信号，${branch.supportSignalCount} 个支持信号。`
                      : `${branch.eventCount} events, ${branch.riskSignalCount} pressure signals, ${branch.supportSignalCount} support signals.`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>
              {copy.pathComparisonEmpty}
            </p>
          )}
        </ReplayBlock>

        <ReplayBlock title={copy.generatedClues}>
          <ReplayList
            values={generatedClues}
            empty={
              locale === "zh"
                ? "这些沙盘事件没有生成更多线索。"
                : "No generated clues were attached to these sandbox events."
            }
          />
        </ReplayBlock>

        <ReplayBlock title={locale === "zh" ? "命理气候与现实局势的对应" : "Destiny-situation mapping"}>
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
                      {locale === "zh" ? "对应原因" : "Why linked"}:{" "}
                      {mapping.mappingExplanation.whyLinked}
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
            <p>
              {locale === "zh"
                ? "这条发现没有关联到命理气候与现实局势的对应。"
                : "No destiny-situation mapping was attached to this finding."}
            </p>
          )}
        </ReplayBlock>
      </div>
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
      {values.map((value, index) => (
        <li
          key={`${value}-${index}`}
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

function BranchComparison({
  items,
  selectedClaimId,
  locale,
}: {
  items: ReportBranchComparison[];
  selectedClaimId: string;
  locale: Locale;
}) {
  const copy = resultCopy[locale];
  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#11150f]">
            {copy.sections.paths}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            {locale === "zh"
              ? "这些路径从同一个局势出发，展示不同推进方式下压力和支持信号如何分化。"
              : "These paths start from the same situation and show how pressure and support signals may diverge."}
          </p>
        </div>
        <StatusPill tone="planned">
          {items.length} {locale === "zh" ? "条路径" : "paths"}
        </StatusPill>
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
                  {pathLabelForLocale(item.branchId, locale)}
                </h3>
                <span className="text-xs font-semibold text-[#568262]">
                  {item.eventCount} {locale === "zh" ? "个事件" : "events"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <BranchMetric label={copy.counts.findings} value={item.claimIds.length} />
                <BranchMetric label={locale === "zh" ? "压力" : "Pressure"} value={item.riskSignalCount} />
                <BranchMetric label={locale === "zh" ? "支持" : "Support"} value={item.supportSignalCount} />
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

function SimpleFeedbackPanel({
  target,
  targetId,
  targetOptions,
  rating,
  note,
  ledger,
  onTargetChange,
  onTargetIdChange,
  onRatingChange,
  onNoteChange,
  onSave,
  locale,
}: {
  target: FeedbackTargetType;
  targetId: string;
  targetOptions: FeedbackTargetOption[];
  rating: FeedbackRating;
  note: string;
  ledger: FeedbackLedgerDraft | null;
  onTargetChange: (target: FeedbackTargetType) => void;
  onTargetIdChange: (targetId: string) => void;
  onRatingChange: (rating: FeedbackRating) => void;
  onNoteChange: (note: string) => void;
  onSave: () => void;
  locale: Locale;
}) {
  const copy = resultCopy[locale];
  const visibleTargets: { value: FeedbackTargetType; label: string }[] = [
    { value: "claim", label: copy.targetFinding },
    { value: "overall", label: copy.targetOverall },
  ];
  const selectedTarget =
    targetOptions.find((item) => item.value === targetId) ?? targetOptions[0];
  const resolvedTargetId = selectedTarget?.value ?? "";
  const simpleRatings = feedbackRatings.filter((item) =>
    ["accurate", "partly_right", "off", "useful", "not_useful", "unclear"].includes(
      item.value,
    ),
  );

  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#11150f]">
            {copy.sections.improve}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#62695d]">
            {copy.feedbackIntro}
          </p>
        </div>
        <StatusPill tone={ledger?.feedback.length ? "ready" : "planned"}>
          {ledger?.feedback.length ?? 0}
        </StatusPill>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            {locale === "zh" ? "反馈对象" : "Feedback for"}
          </label>
          <select
            value={target === "overall" ? "overall" : "claim"}
            onChange={(event) =>
              onTargetChange(event.target.value as FeedbackTargetType)
            }
            className="mt-2 w-full rounded-md border border-black/10 bg-[#f7f8f4] px-3 py-2 text-sm text-[#11150f]"
          >
            {visibleTargets.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {target === "claim" ? (
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
              {copy.findingLabel}
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
              <EmptyFoldMessage>{copy.noFindings}</EmptyFoldMessage>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {simpleRatings.map((item) => (
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

      <textarea
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        maxLength={280}
        rows={3}
        placeholder={copy.notePlaceholder}
        className="mt-4 w-full resize-none rounded-md border border-black/10 bg-[#f7f8f4] px-3 py-2 text-sm leading-6 text-[#11150f] outline-none focus:border-[#568262]"
      />

      <button
        type="button"
        onClick={onSave}
        disabled={!resolvedTargetId}
        className="mt-4 rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9aa096]"
      >
        {copy.saveFeedback}
      </button>
    </section>
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
