"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { GroundedSimulationDebugPanel } from "@/components/grounded-social/grounded-simulation-debug-panel";
import { useLanguage } from "@/components/language-provider";
import { RuntimeCapabilityBanner } from "@/components/runtime-capability-banner";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { TimelineFeed } from "@/components/simulation/event-log";
import { StatusPill } from "@/components/status-pill";
import {
  Button,
  ButtonLink,
  CapabilityCard,
  DestinyWeightingBadge,
  DestinyWeightingCard,
  PathCard,
  RealityCard,
  StatusBadge,
  SurfaceCard,
  WarningPanel,
} from "@/components/ui-foundation";
import { buildClaimLedgerDraft } from "@/lib/claims/build";
import { applyFeedbackToNextRun } from "@/lib/calibration/apply-feedback-to-next-run";
import { loadCalibrationProfile } from "@/lib/calibration/calibration-engine";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { getRuntimeCapability } from "@/lib/runtime-capability/get-runtime-capability";
import {
  blockSimulationRunDraft,
  buildSimulationRunDraft,
  queueSimulationRunDraft,
} from "@/lib/runs/build";
import type { SafetyDecision } from "@/lib/safety/safety-types";
import { verifySafety } from "@/lib/safety/safety-verifier";
import type { SafetySnapshot } from "@/lib/simulation/simulation-types";
import type { AgentEcologyDraft } from "@/types/agent-profile";
import type { DestinyClimateDraft, DestinyProfileDraft } from "@/types/destiny";
import type {
  DestinyPersonModifier,
  GroundedSimulationPathEvent,
  GroundedSocialSimulationDraft,
} from "@/types/grounded-social-simulation";
import type { RealityIntakeDraft } from "@/types/reality-intake";
import type {
  RuntimeCapabilityMode,
  RuntimeCapabilityState,
} from "@/types/runtime-capability";
import type { SeedContextDraft } from "@/types/seed-context";
import type {
  SimulationBranchId,
  SimulationEventDraft,
  SimulationRunDraft,
} from "@/types/simulation-run";

type Locale = "en" | "zh";

const simulationStages = [
  {
    id: "reading_real_situation",
  },
  {
    id: "extracting_reality_nodes",
  },
  {
    id: "retrieving_external_sources",
  },
  {
    id: "building_grounded_social_model",
  },
  {
    id: "applying_destiny_weighting",
  },
  {
    id: "simulating_possible_paths",
  },
  {
    id: "preparing_key_findings",
  },
] as const;

type StageId = (typeof simulationStages)[number]["id"];
type StageStatus =
  | "completed"
  | "running"
  | "skipped"
  | "unavailable"
  | "fallback"
  | "failed"
  | "waiting";

const runningCopy = {
  en: {
    heroTitle: "Analyzing your situation",
    heroBody:
      "Astraloom is reading what happened, separating the people and pressures involved, and comparing a few possible next paths.",
    startRun: "Start analysis",
    rerun: "Run again",
    reset: "Clear and rebuild",
    running: "Unfolding",
    complete: "Ready",
    waiting: "Ready to unfold",
    openingResult: "The analysis is ready. Opening your key findings.",
    runMessage:
      "Astraloom is turning your situation, optional timing lens, and possible choices into readable next-step signals.",
    rebuildMessage: "Astraloom is rebuilding the analysis from your latest inputs.",
    resetMessage: "The current analysis view has been cleared.",
    saveFailed: "The analysis could not be saved. Please try again.",
    prepareFailed:
      "The analysis could not prepare enough usable movement. Please return to the start page and try again.",
    noDataTitle: "There is not enough information to analyze yet.",
    noDataBody:
      "Please return to the start page and describe the situation first.",
    backToStart: "Start a new analysis",
    safetyTitle: "This analysis is paused for safety",
    backToSetup: "Back to start",
    controlTitle: "Analysis controls",
    controlBody:
      "Start when you are ready. The main view will show progress first, then the paths and signals worth watching.",
    climateTitle: "Destiny climate",
    climateFallback:
      "No saved destiny climate was found. Astraloom will lean more on the current situation text in this run.",
    situationTitle: "Current situation",
    windowLabel: "Window",
    focusLabel: "Focus",
    pressureTitle: "Key pressure map",
    pressureBody:
      "Astraloom is matching symbolic climate with people, roles, and pressure points without treating any outcome as certain.",
    noPressure:
      "No detailed pressure map is available yet. The analysis can still start from your current situation.",
    processTitle: "Analysis progress",
    processBody:
      "Each step stays visible so you can see what finished, what was skipped, and where a fallback was used.",
    pathTitle: "Possible paths",
    pathBody:
      "The same situation is compared through several path lenses so pressure shifts are easier to notice.",
    noMovement: "No movement yet",
    interactionTitle: "What changed during analysis",
    interactionBody:
      "Each card shows the situation shift, who is involved, and which signal became easier to observe.",
    runToGenerate: "Start unfolding to generate dynamic event cards.",
    technicalTitle: "Technical details",
    technicalBody:
      "Internal run data is kept here for review without taking over the main experience.",
    resultReady: "View key findings",
    resultWaiting: "Finish unfolding first",
    viewResult: "View results",
    modeLabel: "Current mode",
    sourceBacked: "source-backed",
    notSourceBacked: "not source-backed",
    deepSeekStatus: "DeepSeek Reality Intake",
    externalStatus: "External reality search",
    participated: "active",
    notParticipated: "not active",
    incompleteGrounding: "Not a full grounded simulation yet.",
    realityOverviewTitle: "Reality model overview",
    realityOverviewBody:
      "A compact view of the real-world nodes, pressures, sources, and missing information behind this analysis.",
    realityNodes: "Reality Nodes",
    realityPressures: "Reality Pressures",
    externalSources: "External Sources",
    missingInfo: "Missing Info",
    moreDetails: "More details",
    noItems: "No items recorded yet.",
    destinyWeightingTitle: "Destiny weighting",
    destinyWeightingBoundary:
      "Destiny only weights user response tendencies. It does not create real-world facts.",
    pathComparisonTitle: "Path comparison",
    pathComparisonBody:
      "Each path shows how user action, reality reaction, pressure, information, opportunity, and confidence may move.",
    pathFields: {
      userAction: "User action",
      realityReaction: "Reality reaction",
      pressure: "Pressure change",
      information: "Information change",
      opportunity: "Opportunity change",
      destiny: "Destiny weighting",
      confidence: "Confidence",
    },
    stageStatus: {
      completed: "completed",
      running: "running",
      skipped: "skipped",
      unavailable: "unavailable",
      fallback: "fallback",
      failed: "failed",
      waiting: "waiting",
    },
    stages: {
      reading_real_situation: {
        label: "Read the situation",
        detail:
          "Reading your question, materials, time window, people, limits, and options.",
      },
      extracting_reality_nodes: {
        label: "Find people and pressures",
        detail:
          "Using AI intake when available to extract people, organizations, resources, opportunities, and constraints.",
      },
      retrieving_external_sources: {
        label: "Check external sources",
        detail:
          "Attaching external reality sources only when search is enabled and returns usable material.",
      },
      building_grounded_social_model: {
        label: "Organize the situation map",
        detail:
          "Turning reality nodes and pressures into a compact social model for path simulation.",
      },
      applying_destiny_weighting: {
        label: "Add timing lens",
        detail:
          "Using destiny climate only to weight user response tendencies and timing sensitivity.",
      },
      simulating_possible_paths: {
        label: "Compare possible paths",
        detail:
          "Comparing how several paths may change pressure, clarity, boundaries, and available opportunities.",
      },
      preparing_key_findings: {
        label: "Prepare key findings",
        detail:
          "Turning the analysis into readable findings for the result page.",
      },
    },
    branches: {
      baseline: {
        title: "Current inertia path",
        detail: "What may unfold if the current pattern keeps moving as it is.",
      },
      cautious_self: {
        title: "Cautious observation path",
        detail: "What may unfold if you slow down and wait for clearer signals.",
      },
      decisive_self: {
        title: "Active push path",
        detail: "What may unfold if you move more directly and test the pressure.",
      },
      boundary_adjustment: {
        title: "Boundary adjustment path",
        detail: "What may unfold if you set clearer limits or a firmer time box.",
      },
    },
    eventLabels: {
      branchTick: "Sandbox moment",
      initial: "Initial situation forms",
      confidence: "signal strength",
      happened: "What happened",
      involved: "Who was involved",
      destiny: "Destiny climate influence",
      pressure: "Real pressure change",
      information: "Information gap change",
      resource: "Resource pressure change",
      clue: "Generated clue",
    },
  },
  zh: {
    heroTitle: "正在分析你这件事",
    heroBody:
      "Astraloom 会先读懂你描述的现实情况，再拆出相关的人、压力、选择和接下来值得观察的信号。",
    startRun: "开始分析",
    rerun: "重新推演",
    reset: "清空并重建",
    running: "正在展开",
    complete: "已生成",
    waiting: "等待展开",
    openingResult: "分析已经完成，正在打开关键发现。",
    runMessage: "Astraloom 正在把你的情况、可选时间参考和几种可能选择整理成可读信号。",
    rebuildMessage: "Astraloom 正在根据最新输入重新分析。",
    resetMessage: "当前分析视图已清空。",
    saveFailed: "分析保存失败，请再试一次。",
    prepareFailed: "这次分析没有生成足够可用的变化，请回到开始页重新试一次。",
    noDataTitle: "还没有足够信息可以分析。",
    noDataBody: "请先回到开始页，简单描述你想看清的事。",
    backToStart: "回到开始页",
    safetyTitle: "这次分析因安全原因暂停",
    backToSetup: "回到开始页",
    controlTitle: "分析控制",
    controlBody: "准备好后开始。主视图会先显示进度，再显示路径和你接下来该观察的信号。",
    climateTitle: "命理气候",
    climateFallback: "还没有保存的命理气候。本次分析会更多依赖现实局势来展开。",
    situationTitle: "当前局势",
    windowLabel: "观察窗口",
    focusLabel: "关注点",
    pressureTitle: "关键压力映射",
    pressureBody:
      "Astraloom 会把象征性的命理气候与人物、角色和压力点放在一起观察，但不会把任何结果说成确定。",
    noPressure: "还没有详细压力映射。分析仍然可以从你描述的当前局势开始。",
    processTitle: "分析进度",
    processBody: "每一步都会显示真实状态：完成、跳过、降级或失败，不会假装已经完成。",
    pathTitle: "可能路径",
    pathBody: "同一个局势会从几种路径角度展开，帮助你看见压力如何变化。",
    noMovement: "还没有展开",
    interactionTitle: "分析中出现的变化",
    interactionBody:
      "每张卡片会显示局势怎样变化、涉及谁，以及哪类信号变得更值得观察。",
    runToGenerate: "开始分析后，会生成关键变化卡片。",
    technicalTitle: "技术细节",
    technicalBody: "内部运行数据仍保留在这里，方便检查，但不会占据主阅读体验。",
    resultReady: "查看关键发现",
    resultWaiting: "请先完成分析",
    viewResult: "查看结果",
    modeLabel: "当前模式",
    sourceBacked: "有现实来源支撑",
    notSourceBacked: "缺少现实来源支撑",
    deepSeekStatus: "DeepSeek 现实信息摄取",
    externalStatus: "外部现实搜索",
    participated: "已参与",
    notParticipated: "未参与",
    incompleteGrounding: "当前不是完整现实推演。",
    realityOverviewTitle: "现实模型概览",
    realityOverviewBody: "简洁查看本次分析背后的现实节点、现实压力、外部来源和缺失信息。",
    realityNodes: "现实节点",
    realityPressures: "现实压力",
    externalSources: "外部来源",
    missingInfo: "缺失信息",
    moreDetails: "更多细节",
    noItems: "暂无记录。",
    destinyWeightingTitle: "命理调权",
    destinyWeightingBoundary: "命理只影响用户反应倾向，不生成现实事实。",
    pathComparisonTitle: "路径对比",
    pathComparisonBody: "每条路径展示用户动作、现实反应、压力、信息、机会和置信度如何变化。",
    pathFields: {
      userAction: "用户动作",
      realityReaction: "现实反应",
      pressure: "压力变化",
      information: "信息变化",
      opportunity: "机会变化",
      destiny: "命理调权",
      confidence: "置信度",
    },
    stageStatus: {
      completed: "完成",
      running: "进行中",
      skipped: "跳过",
      unavailable: "不可用",
      fallback: "降级",
      failed: "失败",
      waiting: "等待",
    },
    stages: {
      reading_real_situation: {
        label: "读懂现在发生了什么",
        detail: "读取你的问题、材料、时间窗口、相关人物、限制和选择项。",
      },
      extracting_reality_nodes: {
        label: "找出相关人和压力",
        detail: "在可用时用 AI Intake 抽取人物、组织、资源、机会和限制。",
      },
      retrieving_external_sources: {
        label: "尝试补充外部来源",
        detail: "只有在外部搜索启用并返回可用材料时，才会附加外部现实来源。",
      },
      building_grounded_social_model: {
        label: "整理局势关系",
        detail: "把现实节点和压力转成可用于路径推演的简洁社会模型。",
      },
      applying_destiny_weighting: {
        label: "加入时间节奏参考",
        detail: "命理只用于调节用户反应倾向和时间敏感度。",
      },
      simulating_possible_paths: {
        label: "比较几种可能路径",
        detail: "比较几条路径可能如何改变压力、清晰度、边界和机会。",
      },
      preparing_key_findings: {
        label: "整理重点发现",
        detail: "把展开过程整理成结果页可以阅读的关键发现。",
      },
    },
    branches: {
      baseline: {
        title: "当前惯性路径",
        detail: "如果当前模式继续延续，事情可能如何展开。",
      },
      cautious_self: {
        title: "谨慎观察路径",
        detail: "如果你放慢节奏、等待更清楚的信号，事情可能如何展开。",
      },
      decisive_self: {
        title: "主动推进路径",
        detail: "如果你更直接地推进并测试压力，事情可能如何展开。",
      },
      boundary_adjustment: {
        title: "边界调整路径",
        detail: "如果你设定更清楚的边界或时间框，事情可能如何展开。",
      },
    },
    eventLabels: {
      branchTick: "沙盘片段",
      initial: "初始局势成形",
      confidence: "信号强度",
      happened: "发生了什么",
      involved: "涉及谁",
      destiny: "命理气候如何影响",
      pressure: "现实压力如何变化",
      information: "信息差如何变化",
      resource: "资源压力如何变化",
      clue: "生成了什么线索",
    },
  },
} as const;

const branchNames: SimulationBranchId[] = [
  "baseline",
  "cautious_self",
  "decisive_self",
  "boundary_adjustment",
];

const branchMeta: Record<
  SimulationBranchId,
  { title: string; detail: string; classes: string }
> = {
  baseline: {
    title: "Current inertia path",
    detail: "Shows how pressure may move if the current pattern continues without a strong self-variant tilt.",
    classes: "border-black/8 bg-[#f7f8f4]",
  },
  cautious_self: {
    title: "Cautious observation path",
    detail: "Models slower movement, more observation, and extra sensitivity to missing information.",
    classes: "border-[#5b7f9b]/30 bg-[#eef3f7]",
  },
  decisive_self: {
    title: "Active push path",
    detail: "Models more direct movement and tests whether information gaps or resource pressure ease or rise.",
    classes: "border-[#c4824a]/30 bg-[#fdf5ed]",
  },
  boundary_adjustment: {
    title: "Boundary adjustment path",
    detail:
      "Models setting a clearer time box, boundary, or alternative option so the situation shifts from passive waiting to controlled choice.",
    classes: "border-[#568262]/30 bg-[#eef5ee]",
  },
};

const runtimeModeLabels: Record<RuntimeCapabilityMode, Record<Locale, string>> = {
  local_assumption: { en: "Local assumption", zh: "本地假设" },
  manual_reality: { en: "Manual reality", zh: "手动材料" },
  ai_reality_intake: { en: "AI intake", zh: "AI 现实抽取" },
  external_reality: { en: "External reality", zh: "外部现实" },
  full_grounded_reality: { en: "Full grounded reality", zh: "完整现实来源支撑" },
};

const runtimeModeBadgeVariant: Record<
  RuntimeCapabilityMode,
  React.ComponentProps<typeof StatusBadge>["variant"]
> = {
  local_assumption: "localAssumption",
  manual_reality: "warning",
  ai_reality_intake: "aiIntake",
  external_reality: "externalReality",
  full_grounded_reality: "fullGrounded",
};

function stageCopy(locale: Locale, id: StageId) {
  return runningCopy[locale].stages[id];
}

function branchCopy(locale: Locale, id: SimulationBranchId) {
  return runningCopy[locale].branches[id];
}

function statusTone(status: string) {
  if (status === "ready" || status === "queued") return "ready";
  if (status === "blocked" || status === "missing" || status === "failed") {
    return "blocked";
  }
  return "planned";
}

function eventTypeLabel(value: string) {
  return value.replaceAll("_", " ");
}

function branchDisplayLabel(
  branchId: SimulationBranchId | undefined,
  locale: Locale,
) {
  return branchCopy(locale, branchId ?? "baseline").title;
}

function agentName(
  agents: AgentEcologyDraft["agents"],
  id: string,
) {
  return agents.find((agent) => agent.id === id)?.label ?? id;
}

function eventParticipantText(
  event: SimulationEventDraft,
  agents: AgentEcologyDraft["agents"],
  locale: Locale,
) {
  const participantIds = Array.isArray(event.involvedAgentIds)
    ? event.involvedAgentIds
    : event.agentIds;

  return participantIds.map((id) => agentName(agents, id)).join(locale === "zh" ? "、" : " and ");
}

function firstClue(event: SimulationEventDraft) {
  return event.generatedClues?.[0] ?? event.action ?? event.summary;
}

function userFacingRunningText(value: string | undefined, locale: Locale) {
  if (!value) return "";

  if (locale === "en") return value;

  const cleaned = value
    .replace(/^Sample:\s*/i, "示例：")
    .replace(/situation map/gi, "局势地图")
    .replace(/relation graph/gi, "局势地图")
    .replace(/event logs?/gi, "沙盘事件")
    .replace(/agent parameters/gi, "角色参数")
    .replace(/\bagents?\b/gi, "角色模型")
    .replace(/evidence basis/gi, "依据")
    .replace(/resource pressure/gi, "资源压力")
    .replace(/information uncertainty/gi, "信息不确定")
    .replace(/information gap/gi, "信息差")
    .replace(/opportunity shift/gi, "机会变化")
    .replace(/boundary pressure/gi, "边界压力")
    .replace(/current climate rhythm/gi, "当前气候节奏")
    .replace(/current manager/gi, "当前负责人")
    .replace(/resource or authority pressure holder/gi, "资源或权限压力相关方")
    .replace(/\bsignal\b/gi, "信号")
    .replace(/\bstrong\b/gi, "强")
    .replace(/\brising\b/gi, "上升")
    .replace(/\beasing\b/gi, "缓和")
    .replace(/\bsteady\b/gi, "稳定")
    .replace(/\bobserve\b/gi, "观察")
    .replace(/事件日志/g, "沙盘事件")
    .replace(/关系图/g, "局势地图")
    .replace(
      "Use the early window to gather evidence and keep the question flexible.",
      "前期适合先收集证据，保持问题的弹性。",
    )
    .replace(
      "Use the later window to compare paths after the situation map has more signal.",
      "后期适合在局势信号更清楚后，再比较几条路径。",
    )
    .replace(/^early window$/i, "前期窗口")
    .replace(/^later window$/i, "后期窗口");

  const letters = cleaned.match(/[A-Za-z]/g)?.length ?? 0;
  const visible = cleaned.replace(/\s/g, "").length || 1;

  if (letters / visible > 0.7) {
    return "这个片段记录了一次关键互动或压力变化，具体依据可在结果页展开查看。";
  }

  return cleaned;
}

function eventDisplayTitle(event: SimulationEventDraft, locale: Locale) {
  const pathReplacements = runningCopy[locale].branches;
  const rawTitle = event.userFacingEventTitle ?? eventTypeLabel(event.eventType);
  if (
    event.eventType === "graph_freeze" ||
    rawTitle.toLowerCase().includes("graph freeze")
  ) {
    return `${branchDisplayLabel(event.branchId, locale)}: ${runningCopy[locale].eventLabels.initial}`;
  }

  return userFacingRunningText(rawTitle, locale)
    .replace("Baseline path:", `${pathReplacements.baseline.title}:`)
    .replace("Cautious self path:", `${pathReplacements.cautious_self.title}:`)
    .replace("Decisive self path:", `${pathReplacements.decisive_self.title}:`)
    .replace("Boundary adjustment path:", `${pathReplacements.boundary_adjustment.title}:`);
}

function realSituationSummary(seedContext: SeedContextDraft, locale: Locale) {
  const summary =
    seedContext.currentQuestionDescription ||
    seedContext.situationSummary ||
    seedContext.questionText;

  if (locale === "zh" && /^Sample:/i.test(summary)) {
    return "示例沙盘：一位用户正在比较高薪新机会与当前工作的长期发展，希望看清职业、关系压力和行动路径。";
  }

  return userFacingRunningText(summary, locale);
}

function userFacingTimeWindow(value: SeedContextDraft["timeWindow"], locale: Locale) {
  const labels = {
    en: {
      "30_days": "30 days",
      "90_days": "90 days",
      "1_year": "1 year",
      "3_years": "3 years",
      "5_years": "5 years",
    },
    zh: {
      "30_days": "30天",
      "90_days": "90天",
      "1_year": "1年",
      "3_years": "3年",
      "5_years": "5年",
    },
  } as const;

  return labels[locale][value];
}

function stageStatusFor({
  stageId,
  index,
  activeStageIndex,
  processState,
  capability,
  realityIntake,
  groundedSocialSimulation,
  generatedEventCount,
  claimPreviewCount,
}: {
  stageId: StageId;
  index: number;
  activeStageIndex: number;
  processState: "idle" | "running" | "complete" | "failed";
  capability: RuntimeCapabilityState;
  realityIntake?: RealityIntakeDraft | null;
  groundedSocialSimulation: GroundedSocialSimulationDraft | null;
  generatedEventCount: number;
  claimPreviewCount: number;
}): StageStatus {
  if (stageId === "extracting_reality_nodes") {
    if (realityIntake?.llmStatus?.fallback) return "fallback";
    if (realityIntake?.llmStatus?.succeeded) return "completed";
    if (realityIntake?.llmStatus?.enabled === false) return "unavailable";
    if (!capability.llmEnabled && !capability.llmAvailable) return "unavailable";
  }

  if (stageId === "retrieving_external_sources") {
    if (realityIntake?.realitySearchStatus?.fallback) return "fallback";
    if (capability.hasExternalRealitySources) return "completed";
    if (realityIntake?.realitySearchStatus?.enabled === false) return "skipped";
    if (!capability.realitySearchEnabled && !capability.realitySearchAvailable) {
      return "unavailable";
    }
  }

  if (stageId === "building_grounded_social_model" && groundedSocialSimulation) {
    return "completed";
  }

  if (stageId === "applying_destiny_weighting" && groundedSocialSimulation?.destinyPersonModifier) {
    return "completed";
  }

  if (stageId === "simulating_possible_paths" && generatedEventCount > 0) {
    return "completed";
  }

  if (stageId === "preparing_key_findings" && claimPreviewCount > 0) {
    return "completed";
  }

  if (processState === "failed" && index >= activeStageIndex) return "failed";
  if (processState === "complete") return "completed";
  if (processState === "running" && index === activeStageIndex) return "running";
  if (processState === "running" && index < activeStageIndex) return "completed";
  return "waiting";
}

function stageTone(status: StageStatus) {
  if (status === "completed") return "ready";
  if (status === "failed" || status === "unavailable") return "blocked";
  return "planned";
}

function stageCardClass(status: StageStatus) {
  if (status === "completed") return "border-[#568262]/25 bg-[#eef5ee]";
  if (status === "running") return "border-[#d49b4a]/35 bg-[#fff8ed]";
  if (status === "fallback") return "border-[#d49b4a]/30 bg-[#fff8ed]";
  if (status === "failed" || status === "unavailable") return "border-red-200 bg-red-50";
  if (status === "skipped") return "border-black/8 bg-[#f7f8f4] opacity-75";
  return "border-black/8 bg-[#f7f8f4]";
}

function stageIndicator(status: StageStatus) {
  if (status === "completed") return "ok";
  if (status === "running") return "now";
  if (status === "fallback") return "fb";
  if (status === "skipped") return "skip";
  if (status === "unavailable") return "off";
  if (status === "failed") return "x";
  return "idle";
}


function claimCountForRun(run: SimulationRunDraft | null) {
  if (!run || run.events.length === 0) return 0;
  return buildClaimLedgerDraft(run.seedContextId, run).claims.length;
}

function buildDraftFromLocalState(repos: ReturnType<typeof getRepositories>) {
  const seedResult = repos.seedContexts.load();
  const seed = seedResult.ok ? seedResult.data : null;
  if (!seed) return null;

  const ecologyResult = repos.agentProfiles.load(seed.id);
  const graphResult = repos.relationGraphs.load(seed.id);
  const ecology = ecologyResult.ok ? ecologyResult.data : null;
  const graph = graphResult.ok ? graphResult.data : null;
  if (!ecology || !graph) return null;
  if (!graph.graphLocked) return null;
  const fusionResult = repos.destinyFusions.load(seed.id);
  const destinyFusion = fusionResult.ok ? fusionResult.data : null;
  const groundedResult = repos.groundedSocialSimulations.load(seed.id);
  const groundedSocialSimulation = groundedResult.ok ? groundedResult.data : null;

  const calibrated = applyFeedbackToNextRun({
    agentEcology: ecology,
    relationEdges: graph.edges,
    calibrationProfile: loadCalibrationProfile(seed.id),
  });

  return buildSimulationRunDraft(
    seed,
    calibrated.agentEcology,
    calibrated.relationEdges,
    undefined,
    undefined,
    destinyFusion,
    groundedSocialSimulation,
  );
}

function snapshotFromDecision(decision: SafetyDecision): SafetySnapshot {
  return {
    safetyLevel: decision.safetyLevel,
    flags: decision.flags,
    allowedActions: decision.allowedActions,
    blockedActions: decision.blockedActions,
    reportRestrictions: decision.reportRestrictions,
  };
}

export default function RunsPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = runningCopy[locale];
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
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
  const [destinyFusion] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.destinyFusions.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [groundedSocialSimulation] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.groundedSocialSimulations.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [run, setRun] = useState<SimulationRunDraft | null>(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.simulations.load(seed.id);
    return (result.ok ? result.data : null) ?? buildDraftFromLocalState(repos);
  });
  const [message, setMessage] = useState("");
  const [safetyDecision, setSafetyDecision] = useState<SafetyDecision | null>(
    () =>
      seedContext
        ? verifySafety({
            seedContext,
            agents: agentEcology?.agents,
            relationEdges: relationGraph?.edges,
            simulationRun: run,
          })
        : null,
  );
  const [processState, setProcessState] = useState<
    "idle" | "running" | "complete" | "failed"
  >("idle");
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [processRun, setProcessRun] = useState<SimulationRunDraft | null>(null);
  const [processError, setProcessError] = useState("");

  const visibleRun = processRun ?? run;
  const visibleEvents = useMemo(() => visibleRun?.events ?? [], [visibleRun]);
  const visibleTicks = useMemo(() => visibleRun?.ticks ?? [], [visibleRun]);
  const visibleGates = useMemo(() => visibleRun?.gates ?? [], [visibleRun]);
  const frozenAgentProfileIds = useMemo(
    () => visibleRun?.frozenAgentProfileIds ?? [],
    [visibleRun],
  );
  const frozenRelationEdgeIds = useMemo(
    () => visibleRun?.frozenRelationEdgeIds ?? [],
    [visibleRun],
  );
  const generatedEventCount = visibleEvents.length;
  const claimPreviewCount = useMemo(
    () => claimCountForRun(visibleRun),
    [visibleRun],
  );
  const canOpenResult =
    processState === "complete" ||
    (visibleRun?.status === "queued" &&
      generatedEventCount > 0 &&
      claimPreviewCount > 0);
  const gateChecklist = useMemo(
    () => [
      {
        id: "graph_locked",
        label: "Situation map ready",
        ready: relationGraph?.graphLocked === true,
        fix: "Lock the Situation Map snapshot before running.",
      },
      {
        id: "agents_ready",
        label: "People and role models ready",
        ready:
          (agentEcology?.agents.length ?? 0) > 0 &&
          (agentEcology?.agents.some((agent) => agent.agentType === "npc") ??
            false),
        fix: "Confirm Key People and save usable role models.",
      },
      {
        id: "safety_checked",
        label: "Safety checked",
        ready: safetyDecision?.safetyLevel !== "blocked",
        fix: "Revise the situation setup if SafetyVerifier blocks the run.",
      },
      {
        id: "events_generated",
        label: "Sandbox events recorded",
        ready: generatedEventCount > 0,
        fix: "Run the visible sandbox after the Situation Map is ready.",
      },
      {
        id: "claims_built",
        label: "Findings prepared from evidence",
        ready: claimPreviewCount > 0,
        fix: "Findings require saved sandbox events with situation-map evidence.",
      },
      {
        id: "report_ready",
        label: "Result ready",
        ready: canOpenResult,
        fix: "Finish the stage sequence before opening results.",
      },
    ],
    [
      agentEcology?.agents,
      canOpenResult,
      claimPreviewCount,
      generatedEventCount,
      relationGraph?.graphLocked,
      safetyDecision?.safetyLevel,
    ],
  );
  const branchEventCounts = useMemo(() => {
    const counts = new Map<SimulationBranchId, number>();
    branchNames.forEach((branchId) => counts.set(branchId, 0));
    visibleEvents.forEach((event) => {
      const branchId = event.branchId ?? "baseline";
      counts.set(branchId, (counts.get(branchId) ?? 0) + 1);
    });
    return counts;
  }, [visibleEvents]);
  const realityIntake = groundedSocialSimulation?.realityIntake ?? null;
  const runtimeCapability = useMemo(
    () => getRuntimeCapability({ realityIntake }),
    [realityIntake],
  );

  useEffect(() => {
    if (processState !== "complete") return;

      const routeTimer = window.setTimeout(() => {
        router.push("/app/simulation/result");
      }, 900);
      return () => window.clearTimeout(routeTimer);
  }, [processState, router]);

  useEffect(() => {
    if (processState !== "running" || !processRun || !seedContext) return;

    const timer = window.setTimeout(() => {
      const stage = simulationStages[activeStageIndex];

      if (stage.id === "simulating_possible_paths") {
        const result = repos.simulations.save(processRun);
        if (!result.ok) {
          setProcessState("failed");
          setProcessError(t.saveFailed);
          setMessage(t.saveFailed);
          return;
        }
      }

      if (stage.id === "preparing_key_findings") {
        const eventLogSaved = repos.simulations.load(seedContext.id);
        const savedRun = eventLogSaved.ok ? eventLogSaved.data : null;
        if (!savedRun || savedRun.events.length === 0) {
          setProcessState("failed");
          setProcessError(t.prepareFailed);
          return;
        }

        const ledger = buildClaimLedgerDraft(seedContext.id, savedRun);
        const result = repos.reports.save(ledger);
        if (!result.ok) {
          setProcessState("failed");
          setProcessError(t.saveFailed);
          setMessage(t.saveFailed);
          return;
        }
      }

      if (activeStageIndex === simulationStages.length - 1) {
        setProcessState("complete");
        setMessage(t.openingResult);
        return;
      }

      setActiveStageIndex((index) => index + 1);
    }, activeStageIndex < 4 ? 620 : 760);

    return () => window.clearTimeout(timer);
  }, [
    activeStageIndex,
    processRun,
    processState,
    repos,
    router,
    seedContext,
    t.openingResult,
    t.prepareFailed,
    t.saveFailed,
  ]);

  if (
    !seedContext ||
    !agentEcology ||
    !relationGraph ||
    !run ||
    !relationGraph.graphLocked ||
    !agentEcology.agents.some((agent) => agent.agentType === "npc") ||
    relationGraph.edges.length === 0
  ) {
    return (
      <AppShell>
        <SurfaceCard emphasis="strong" className="mx-auto max-w-3xl p-8">
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            {t.noDataTitle}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            {t.noDataBody}
          </p>
          <ButtonLink href="/app/start" className="mt-6 px-5 py-3">
            {t.backToStart}
          </ButtonLink>
        </SurfaceCard>
      </AppShell>
    );
  }

  if (safetyDecision?.safetyLevel === "blocked") {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl space-y-5">
          <SafetyDowngradeNotice decision={safetyDecision} title={t.safetyTitle} />
          <ButtonLink href="/app/start" className="px-5 py-3">
            {t.backToSetup}
          </ButtonLink>
        </section>
      </AppShell>
    );
  }

  function persist(nextRun: SimulationRunDraft, nextMessage: string) {
    const result = repos.simulations.save(nextRun);
    if (!result.ok) {
      setMessage(t.saveFailed);
      return;
    }
    setRun(nextRun);
    setMessage(nextMessage);
  }

  function runSafetyGate(nextRun: SimulationRunDraft) {
    if (!seedContext) return null;
    const decision = verifySafety({
      seedContext,
      agents: agentEcology?.agents,
      relationEdges: relationGraph?.edges,
      simulationRun: nextRun,
    });
    setSafetyDecision(decision);

    if (decision.safetyLevel === "blocked") {
      persist(blockSimulationRunDraft(nextRun), decision.userMessage);
      return null;
    }

    return decision;
  }

  function queueRun() {
    if (!run || !seedContext || !agentEcology || !relationGraph) return;
    setProcessError("");
    if (!relationGraph.graphLocked) {
      setMessage(t.noDataBody);
      return;
    }
    const decision = runSafetyGate(run);
    if (!decision) return;
    const calibrated = applyFeedbackToNextRun({
      agentEcology,
      relationEdges: relationGraph.edges,
      calibrationProfile: loadCalibrationProfile(seedContext.id),
    });
    const nextRun = buildSimulationRunDraft(
      seedContext,
      calibrated.agentEcology,
      calibrated.relationEdges,
      run.status,
      snapshotFromDecision(decision),
      destinyFusion,
      groundedSocialSimulation,
    );
    const queuedRun = queueSimulationRunDraft(nextRun);
    if (queuedRun.events.length === 0) {
      setProcessState("failed");
      setProcessError(t.prepareFailed);
      return;
    }
    setRun(queuedRun);
    setProcessRun(queuedRun);
    setActiveStageIndex(0);
    setProcessState("running");
    setMessage(t.runMessage);
  }

  function rebuild() {
    if (!seedContext || !agentEcology || !relationGraph) return;
    setProcessError("");
    if (!relationGraph.graphLocked) {
      setMessage(t.noDataBody);
      return;
    }
    const calibrated = applyFeedbackToNextRun({
      agentEcology,
      relationEdges: relationGraph.edges,
      calibrationProfile: loadCalibrationProfile(seedContext.id),
    });
    const nextRun = buildSimulationRunDraft(
      seedContext,
      calibrated.agentEcology,
      calibrated.relationEdges,
      undefined,
      undefined,
      destinyFusion,
      groundedSocialSimulation,
    );
    const decision = runSafetyGate(nextRun);
    if (!decision) return;
    const safeRun = buildSimulationRunDraft(
      seedContext,
      calibrated.agentEcology,
      calibrated.relationEdges,
      nextRun.status,
      snapshotFromDecision(decision),
      destinyFusion,
      groundedSocialSimulation,
    );
    const queuedRun = queueSimulationRunDraft(safeRun);
    if (queuedRun.events.length === 0) {
      setProcessState("failed");
      setProcessError(t.prepareFailed);
      return;
    }
    repos.simulations.clearDraft(seedContext.id);
    repos.reports.clearDraft(seedContext.id);
    setRun(queuedRun);
    setProcessRun(queuedRun);
    setActiveStageIndex(0);
    setProcessState("running");
    setMessage(t.rebuildMessage);
  }

  function reset() {
    if (!seedContext || !agentEcology || !relationGraph) return;
    repos.simulations.clearDraft(seedContext.id);
    const calibrated = applyFeedbackToNextRun({
      agentEcology,
      relationEdges: relationGraph.edges,
      calibrationProfile: loadCalibrationProfile(seedContext.id),
    });
    setRun(
      buildSimulationRunDraft(
        seedContext,
        calibrated.agentEcology,
        calibrated.relationEdges,
        undefined,
        undefined,
        destinyFusion,
        groundedSocialSimulation,
      ),
    );
    setProcessRun(null);
    setProcessState("idle");
    setActiveStageIndex(0);
    setProcessError("");
    setMessage(t.resetMessage);
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            {t.heroTitle}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            {t.heroBody}
          </p>
        </div>
        <StatusPill tone={statusTone(processState === "failed" ? "failed" : run.status)}>
          {processState === "running"
            ? t.running
            : processState === "complete"
              ? t.complete
            : t.waiting}
        </StatusPill>
      </div>

      <CapabilityCard className="mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#11150f]">
              {locale === "zh" ? "本次现实推演能力" : "Grounding status for this run"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              {runtimeCapability.canClaimGroundedSimulation
                ? locale === "zh"
                  ? "外部现实来源已参与，可以查看第一轮有现实来源支撑的沙盘。"
                  : "External reality sources participated, so this sandbox can be read as source-backed."
                : t.incompleteGrounding}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge variant={runtimeModeBadgeVariant[runtimeCapability.currentMode]}>
              {t.modeLabel}: {runtimeModeLabels[runtimeCapability.currentMode][locale]}
            </StatusBadge>
            <StatusBadge
              variant={
                runtimeCapability.canClaimGroundedSimulation
                  ? "sourceBacked"
                  : "localAssumption"
              }
            >
              {runtimeCapability.canClaimGroundedSimulation
                ? t.sourceBacked
                : t.notSourceBacked}
            </StatusBadge>
            <StatusBadge variant={runtimeCapability.llmAvailable ? "aiIntake" : "warning"}>
              {t.deepSeekStatus}:{" "}
              {runtimeCapability.llmAvailable ? t.participated : t.notParticipated}
            </StatusBadge>
            <StatusBadge
              variant={
                runtimeCapability.hasExternalRealitySources
                  ? "externalReality"
                  : "warning"
              }
            >
              {t.externalStatus}:{" "}
              {runtimeCapability.hasExternalRealitySources
                ? t.participated
                : t.notParticipated}
            </StatusBadge>
          </div>
        </div>
        {!runtimeCapability.canClaimGroundedSimulation ? (
          <WarningPanel className="mt-4 p-3">
            <p className="text-sm font-semibold text-[#7c5524]">
              {t.incompleteGrounding}
            </p>
          </WarningPanel>
        ) : null}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <RuntimeCapabilityBanner capability={runtimeCapability} />
          <ButtonLink
            href="/app/simulation/result"
            variant="primary"
            onClick={(event) => {
              if (!canOpenResult) event.preventDefault();
            }}
            className={`justify-center px-5 py-3 ${
              canOpenResult ? "" : "cursor-not-allowed opacity-45"
            }`}
          >
            {t.viewResult}
          </ButtonLink>
        </div>
      </CapabilityCard>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-6">
          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-[#11150f]">
                {t.controlTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#62695d]">
                {t.controlBody}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={queueRun}
                disabled={processState === "running"}
              >
                {t.startRun}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={rebuild}
                disabled={processState === "running"}
              >
                {t.rerun}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={reset}
                disabled={processState === "running"}
              >
                {t.reset}
              </Button>
            </div>
            {message ? (
              <p className="mt-4 text-sm leading-6 text-[#62695d]">{message}</p>
            ) : null}
            {safetyDecision && safetyDecision.safetyLevel !== "safe" ? (
              <div className="mt-5">
                <SafetyDowngradeNotice
                  decision={safetyDecision}
                  title={t.safetyTitle}
                />
              </div>
            ) : null}
            {processError ? (
              <NotReadyPanel
                title={t.noDataTitle}
                items={[processError]}
              />
            ) : null}
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.55fr)]">
            <DestinyClimatePanel
              profile={destinyProfile}
              climate={destinyClimate}
              locale={locale}
            />
            <RealSituationPanel seedContext={seedContext} locale={locale} />
          </section>

          <RealityModelOverviewPanel
            groundedSocialSimulation={groundedSocialSimulation}
            locale={locale}
          />

          <DestinyWeightingPanel
            modifier={groundedSocialSimulation?.destinyPersonModifier ?? null}
            locale={locale}
          />

          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#11150f]">
                  {t.processTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  {t.processBody}
                </p>
              </div>
              <StatusPill tone={processState === "failed" ? "blocked" : "planned"}>
                {generatedEventCount} {locale === "zh" ? "个片段" : "moments"}
              </StatusPill>
            </div>
            <div className="mt-5 space-y-3">
              {simulationStages.map((stage, index) => {
                const status = stageStatusFor({
                  stageId: stage.id,
                  index,
                  activeStageIndex,
                  processState,
                  capability: runtimeCapability,
                  realityIntake,
                  groundedSocialSimulation,
                  generatedEventCount,
                  claimPreviewCount,
                });
                const active = status === "running";
                const indicator = stageIndicator(status);
                const text = stageCopy(locale, stage.id);
                return (
                  <div
                    key={stage.id}
                    className={`overflow-hidden rounded-md border ${stageCardClass(status)}`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-8 w-10 place-items-center rounded-full border text-[10px] font-semibold ${
                              active
                                ? "animate-pulse border-[#d49b4a]/45 bg-white text-[#7c5524]"
                                : status === "completed"
                                  ? "border-[#568262]/25 bg-white text-[#2f5d3d]"
                                  : status === "failed" || status === "unavailable"
                                    ? "border-red-200 bg-white text-red-900"
                                    : status === "fallback"
                                      ? "border-[#d49b4a]/35 bg-white text-[#7c5524]"
                                      : "border-black/10 bg-white text-[#7d8578]"
                            }`}
                          >
                            {indicator}
                          </span>
                          <p className="text-sm font-semibold text-[#11150f]">
                            {text.label}
                          </p>
                        </div>
                        <StatusPill
                          tone={stageTone(status)}
                        >
                          {t.stageStatus[status]}
                        </StatusPill>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#62695d]">
                        {text.detail}
                      </p>
                    </div>
                    {active ? (
                      <div className="h-1 bg-[#f2dfbd]">
                        <div
                          className="h-full animate-stage-fill bg-[#d49b4a]"
                          style={
                            {
                              "--stage-duration":
                                activeStageIndex < 4 ? "620ms" : "760ms",
                            } as CSSProperties
                          }
                        />
                      </div>
                    ) : status === "completed" ? (
                      <div className="h-1 bg-[#568262]" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <PathComparisonPanel
            pathEvents={groundedSocialSimulation?.pathEvents ?? []}
            fallbackEvents={visibleEvents}
            branchEventCounts={branchEventCounts}
            locale={locale}
          />

          <InteractionPreviewPanel
            events={visibleEvents}
            agents={agentEcology.agents}
            locale={locale}
          />

          <GroundedSimulationDebugPanel
            groundedSocialSimulation={groundedSocialSimulation}
            locale={locale}
          />
        </main>

        <aside className="mf-panel-dark h-fit p-6">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            {locale === "zh" ? "本次分析" : "This analysis"}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label={locale === "zh" ? "角色" : "People"} value={frozenAgentProfileIds.length} />
            <Metric label={locale === "zh" ? "压力点" : "Pressure"} value={frozenRelationEdgeIds.length} />
            <Metric label={locale === "zh" ? "片段" : "Moments"} value={generatedEventCount} />
            <Metric label={locale === "zh" ? "路径" : "Paths"} value={branchNames.length} />
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-white">
                {locale === "zh" ? "你想看清的问题" : "Question"}
              </dt>
              <dd className="mt-1 leading-6 text-white/62">
                {seedContext.questionText}
              </dd>
            </div>
          </dl>
          <details className="mt-5 rounded-md border border-white/10 bg-white/[0.06] p-4">
            <summary className="cursor-pointer text-xs font-semibold text-white/42">
              {t.technicalTitle}
            </summary>
            <p className="mt-3 text-xs leading-5 text-white/50">
              {t.technicalBody}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Ticks" value={visibleRun?.tickCount ?? 0} />
              <Metric
                label={locale === "zh" ? "发现" : "Findings"}
                value={claimPreviewCount}
              />
            </div>
            <dl className="mt-4 space-y-3 text-xs">
              <div>
                <dt className="font-semibold text-white">traceId</dt>
                <dd className="mt-1 break-all font-mono leading-5 text-white/50">
                  {visibleRun?.traceId}
                </dd>
              </div>
            </dl>
            <div className="mt-4 space-y-2">
              {gateChecklist.map((gate) => (
                <div key={gate.id} className="rounded border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-white">
                      {gate.id}: {gate.label}
                    </span>
                    <StatusPill tone={gate.ready ? "ready" : "blocked"}>
                      {gate.ready ? "ready" : "fix needed"}
                    </StatusPill>
                  </div>
                  {!gate.ready ? (
                    <p className="mt-2 text-xs leading-5 text-white/50">
                      {gate.fix}
                    </p>
                  ) : null}
                </div>
              ))}
              {visibleGates.map((gate) => (
                <div
                  key={gate.id}
                  className="rounded-md border border-white/10 bg-white/[0.06] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-white">
                      {gate.id}
                    </span>
                    <StatusPill tone={statusTone(gate.status)}>
                      {gate.status}
                    </StatusPill>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/50">
                    {gate.detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <TimelineFeed
                ticks={visibleTicks}
                events={visibleEvents}
                agents={agentEcology.agents}
                edges={relationGraph.edges}
                title={locale === "zh" ? "依据事件回放" : "Evidence event replay"}
                description={
                  locale === "zh"
                    ? "保存的路径事件会保留给准确性调试查看。关键发现只会在依据关系存在后准备。"
                    : "Saved path events remain available for accuracy review. Findings are prepared only after evidence links exist."
                }
              />
            </div>
          </details>
          <ButtonLink
            href="/app/simulation/result"
            variant="ghostOnDark"
            onClick={(event) => {
              if (!canOpenResult) event.preventDefault();
            }}
            className={`mt-5 w-full px-4 py-3 ${
              canOpenResult ? "" : "cursor-not-allowed opacity-45"
            }`}
          >
            {canOpenResult
              ? t.resultReady
              : t.resultWaiting}
          </ButtonLink>
        </aside>
      </div>
    </AppShell>
  );
}

function DestinyClimatePanel({
  profile,
  climate,
  locale,
}: {
  profile: DestinyProfileDraft | null;
  climate: DestinyClimateDraft | null;
  locale: Locale;
}) {
  const t = runningCopy[locale];
  return (
    <section className="rounded-lg border border-[#568262]/20 bg-[#eef5ee] p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#11150f]">
            {t.climateTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            {userFacingRunningText(
              climate?.userFacingOverview ??
                profile?.userFacingSummary ??
                t.climateFallback,
              locale,
            )}
          </p>
        </div>
        <StatusPill tone={climate ? "ready" : "planned"}>
          {climate ? `${climate.confidence.score}%` : locale === "zh" ? "待读取" : "pending"}
        </StatusPill>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(climate?.coreTendencies ?? profile?.coreTendencies ?? [])
          .slice(0, 2)
          .map((item) => (
            <article
              key={item.id}
              className="rounded-md border border-[#568262]/15 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#11150f]">
                  {userFacingRunningText(item.label, locale)}
                </h3>
                {item.intensity ? (
                  <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#3f483d]">
                    {userFacingRunningText(item.intensity, locale)}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs leading-5 text-[#62695d]">
                  {userFacingRunningText(item.userFacingSummary, locale)}
              </p>
            </article>
          ))}
        {(climate?.panels ?? []).slice(0, 4).map((panel) => (
          <article
            key={panel.id}
            className="rounded-md border border-[#568262]/15 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#11150f]">
                {userFacingRunningText(panel.label, locale)}
              </h3>
              <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#3f483d]">
                {userFacingRunningText(panel.intensity, locale)} /{" "}
                {userFacingRunningText(panel.direction, locale)}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#62695d]">
                {userFacingRunningText(panel.userFacingSummary, locale)}
            </p>
          </article>
        ))}
      </div>
      {climate?.observationSignals?.length ? (
        <div className="mt-4 rounded-md border border-[#568262]/15 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
            {locale === "zh" ? "观察信号" : "observation signals"}
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {climate.observationSignals.slice(0, 2).map((signal) => (
              <p key={signal.id} className="text-xs leading-5 text-[#62695d]">
                <span className="font-semibold text-[#11150f]">
                  {userFacingRunningText(signal.label, locale)}:
                </span>{" "}
                {userFacingRunningText(signal.userFacingSummary, locale)}
              </p>
            ))}
          </div>
        </div>
      ) : null}
      {climate?.decisionRhythm.phases.length ? (
        <div className="mt-4 rounded-md border border-[#568262]/15 bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
             {locale === "zh" ? "节奏" : "decision rhythm"}:{" "}
             {userFacingRunningText(climate.decisionRhythm.overall, locale)}
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {climate.decisionRhythm.phases.map((phase) => (
              <p key={phase.label} className="text-xs leading-5 text-[#62695d]">
                <span className="font-semibold text-[#11150f]">
                  {userFacingRunningText(phase.label, locale)}:
                </span>{" "}
                {userFacingRunningText(phase.userFacingSummary, locale)}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RealSituationPanel({
  seedContext,
  locale,
}: {
  seedContext: SeedContextDraft;
  locale: Locale;
}) {
  const missingContextHint = seedContext.missingContextHints?.[0];
  const t = runningCopy[locale];

  return (
    <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <h2 className="text-base font-semibold text-[#11150f]">
        {t.situationTitle}
      </h2>
      <p className="mt-2 line-clamp-6 text-sm leading-6 text-[#62695d]">
        {realSituationSummary(seedContext, locale)}
      </p>
      <div className="mt-4 grid gap-2">
        <SituationRow
          label={t.windowLabel}
          value={userFacingTimeWindow(seedContext.timeWindow, locale)}
        />
        <SituationRow
          label={t.focusLabel}
          value={`${seedContext.contextQualityScore ?? 0}%`}
        />
      </div>
      {missingContextHint ? (
        <p className="mt-3 text-xs leading-5 text-[#7d8578]">
          {userFacingRunningText(missingContextHint, locale)}
        </p>
      ) : null}
    </section>
  );
}

function SituationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-black/8 bg-[#f7f8f4] px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
        {label}
      </span>
      <span className="text-xs font-semibold text-[#3f483d]">{value}</span>
    </div>
  );
}

function InteractionPreviewPanel({
  events,
  agents,
  locale,
}: {
  events: SimulationEventDraft[];
  agents: AgentEcologyDraft["agents"];
  locale: Locale;
}) {
  const previewEvents = events.slice(0, 6);
  const t = runningCopy[locale];

  return (
    <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#11150f]">
            {t.interactionTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            {t.interactionBody}
          </p>
        </div>
        <StatusPill tone={previewEvents.length ? "ready" : "planned"}>
          {previewEvents.length}
        </StatusPill>
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {previewEvents.map((event) => (
          <article
            key={event.id}
            className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
                  {branchDisplayLabel(event.branchId, locale)} / {t.eventLabels.branchTick} {event.tickIndex}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-[#11150f]">
                  {eventDisplayTitle(event, locale)}
                </h3>
              </div>
              <span className="rounded border border-black/8 bg-white px-2 py-1 text-xs font-semibold text-[#3f483d]">
                {event.confidence}% {t.eventLabels.confidence}
              </span>
            </div>
            <PreviewField
              label={t.eventLabels.happened}
              value={userFacingRunningText(event.summary, locale)}
            />
            <PreviewField
              label={t.eventLabels.involved}
              value={eventParticipantText(event, agents, locale)}
            />
            <PreviewField
              label={locale === "zh" ? "现实依据" : "Grounded reality"}
              value={userFacingRunningText(event.groundedRealitySummary, locale)}
            />
            <PreviewField
              label={locale === "zh" ? "命理调权" : "Destiny weighting"}
              value={userFacingRunningText(event.destinyModifierEffect, locale)}
            />
            <PreviewField
              label={t.eventLabels.destiny}
              value={userFacingRunningText(event.destinyInfluenceSummary, locale)}
            />
            <PreviewField
              label={t.eventLabels.pressure}
              value={userFacingRunningText(
                event.groundedPressureSummary ?? event.pressureDeltaSummary,
                locale,
              )}
            />
            <PreviewField
              label={t.eventLabels.information}
              value={userFacingRunningText(event.informationGapDeltaSummary, locale)}
            />
            <PreviewField
              label={t.eventLabels.resource}
              value={userFacingRunningText(event.resourcePressureDeltaSummary, locale)}
            />
            <PreviewField
              label={t.eventLabels.clue}
              value={userFacingRunningText(firstClue(event), locale)}
            />
          </article>
        ))}
        {!previewEvents.length ? (
          <p className="rounded-md border border-dashed border-black/12 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#7d8578]">
            {t.runToGenerate}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function PreviewField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) return null;

  return (
    <div className="mt-3 rounded border border-black/8 bg-white p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
        {label}
      </div>
      <p className="mt-1 text-xs leading-5 text-[#62695d]">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
      <div className="text-xs text-white/48">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function NotReadyPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-sm font-semibold text-amber-950">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function RealityModelOverviewPanel({
  groundedSocialSimulation,
  locale,
}: {
  groundedSocialSimulation: GroundedSocialSimulationDraft | null;
  locale: Locale;
}) {
  const t = runningCopy[locale];
  const realityIntake = groundedSocialSimulation?.realityIntake;
  const nodes = groundedSocialSimulation?.realityNodes ?? [];
  const pressures = groundedSocialSimulation?.realityPressures ?? [];
  const externalSources = realityIntake?.externalSources ?? [];
  const missingInfo = [
    ...(realityIntake?.missingExternalInfo ?? []),
    ...(groundedSocialSimulation?.keyUncertainties ?? []),
  ];

  return (
    <RealityCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#11150f]">
            {t.realityOverviewTitle}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#62695d]">
            {t.realityOverviewBody}
          </p>
        </div>
        <StatusBadge variant={externalSources.length ? "sourceBacked" : "localAssumption"}>
          {externalSources.length ? t.sourceBacked : t.notSourceBacked}
        </StatusBadge>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <OverviewListCard
          title={t.realityNodes}
          count={nodes.length}
          items={nodes.slice(0, 5).map((node) => `${node.label} / ${node.nodeType}`)}
          empty={t.noItems}
          details={
            nodes.length > 5
              ? nodes.slice(5).map((node) => `${node.label} / ${node.roleInSituation}`)
              : []
          }
          detailsLabel={t.moreDetails}
        />
        <OverviewListCard
          title={t.realityPressures}
          count={pressures.length}
          items={pressures.slice(0, 5).map((pressure) => pressure.explanation)}
          empty={t.noItems}
          details={pressures.slice(5).map((pressure) => pressure.explanation)}
          detailsLabel={t.moreDetails}
        />
        <OverviewListCard
          title={t.externalSources}
          count={externalSources.length}
          items={externalSources.slice(0, 5).map((source) => source.title)}
          empty={t.noItems}
          details={externalSources.slice(5).map((source) => source.summary)}
          detailsLabel={t.moreDetails}
        />
        <OverviewListCard
          title={t.missingInfo}
          count={missingInfo.length}
          items={missingInfo.slice(0, 5)}
          empty={t.noItems}
          details={missingInfo.slice(5)}
          detailsLabel={t.moreDetails}
        />
      </div>
    </RealityCard>
  );
}

function OverviewListCard({
  title,
  count,
  items,
  empty,
  details,
  detailsLabel,
}: {
  title: string;
  count: number;
  items: string[];
  empty: string;
  details: string[];
  detailsLabel: string;
}) {
  return (
    <article className="rounded-md border border-black/8 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#11150f]">{title}</h3>
        <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs font-semibold text-[#3f483d]">
          {count}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map((item) => (
            <p key={item} className="line-clamp-3 text-xs leading-5 text-[#62695d]">
              {item}
            </p>
          ))
        ) : (
          <p className="text-xs leading-5 text-[#7d8578]">{empty}</p>
        )}
      </div>
      {details.length ? (
        <details className="mt-3 rounded border border-black/8 bg-[#f7f8f4] p-3">
          <summary className="cursor-pointer text-xs font-semibold text-[#7d8578]">
            {detailsLabel}
          </summary>
          <div className="mt-2 space-y-2">
            {details.map((item) => (
              <p key={item} className="text-xs leading-5 text-[#62695d]">
                {item}
              </p>
            ))}
          </div>
        </details>
      ) : null}
    </article>
  );
}

function DestinyWeightingPanel({
  modifier,
  locale,
}: {
  modifier: DestinyPersonModifier | null;
  locale: Locale;
}) {
  const t = runningCopy[locale];
  const rows = modifier
    ? [
        ["decisionStyle", modifier.decisionStyle],
        ["stressResponse", modifier.stressResponse],
        ["opportunityResponse", modifier.opportunityResponse],
        ["boundaryStyle", modifier.boundaryStyle],
        ["timingSensitivity", modifier.timingSensitivity],
      ]
    : [];

  return (
    <DestinyWeightingCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-[#11150f]">
              {t.destinyWeightingTitle}
            </h2>
            <DestinyWeightingBadge>
              {locale === "zh" ? "调权层" : "weighting layer"}
            </DestinyWeightingBadge>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#62695d]">
            {t.destinyWeightingBoundary}
          </p>
        </div>
        {modifier ? (
          <StatusBadge variant="destiny">
            {modifier.confidence}% {locale === "zh" ? "置信度" : "confidence"}
          </StatusBadge>
        ) : null}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {rows.length ? (
          rows.map(([label, value]) => (
            <article key={label} className="rounded-md border border-[#568262]/15 bg-white p-4">
              <div className="text-[11px] font-semibold text-[#7d8578]">
                {label}
              </div>
              <p className="mt-2 text-xs leading-5 text-[#62695d]">
                {userFacingRunningText(value, locale)}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-black/12 bg-white p-4 text-sm leading-6 text-[#7d8578]">
            {t.noItems}
          </p>
        )}
      </div>
    </DestinyWeightingCard>
  );
}

function PathComparisonPanel({
  pathEvents,
  fallbackEvents,
  branchEventCounts,
  locale,
}: {
  pathEvents: GroundedSimulationPathEvent[];
  fallbackEvents: SimulationEventDraft[];
  branchEventCounts: Map<SimulationBranchId, number>;
  locale: Locale;
}) {
  const t = runningCopy[locale];
  const fields = t.pathFields;

  return (
    <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <h2 className="text-base font-semibold text-[#11150f]">
        {t.pathComparisonTitle}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#62695d]">
        {t.pathComparisonBody}
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-4">
        {branchNames.map((branchId) => {
          const branchText = branchCopy(locale, branchId);
          const meta = branchMeta[branchId];
          const pathEvent = pathEvents.find((event) => event.branchId === branchId);
          const fallbackEvent = fallbackEvents.find(
            (event) => (event.branchId ?? "baseline") === branchId,
          );
          return (
            <PathCard key={branchId} className={`p-4 ${meta.classes}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#11150f]">
                  {branchText.title}
                </h3>
                <StatusBadge variant="confidence">
                  {pathEvent?.confidence ?? fallbackEvent?.confidence ?? 0}%{" "}
                  {fields.confidence}
                </StatusBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#62695d]">
                {branchText.detail}
              </p>
              <div className="mt-4 space-y-2">
                {pathEvent ? (
                  <>
                    <PathField label={fields.userAction} value={pathEvent.userAction} locale={locale} />
                    <PathField
                      label={fields.realityReaction}
                      value={pathEvent.expectedRealityReaction}
                      locale={locale}
                    />
                    <PathField label={fields.pressure} value={pathEvent.pressureChange} locale={locale} />
                    <PathField
                      label={fields.information}
                      value={pathEvent.informationChange}
                      locale={locale}
                    />
                    <PathField
                      label={fields.opportunity}
                      value={pathEvent.opportunityChange}
                      locale={locale}
                    />
                    <PathField
                      label={fields.destiny}
                      value={pathEvent.destinyModifierEffect}
                      locale={locale}
                    />
                  </>
                ) : fallbackEvent ? (
                  <>
                    <PathField
                      label={fields.userAction}
                      value={fallbackEvent.action ?? fallbackEvent.summary}
                      locale={locale}
                    />
                    <PathField
                      label={fields.realityReaction}
                      value={fallbackEvent.groundedRealitySummary ?? fallbackEvent.interactionSummary}
                      locale={locale}
                    />
                    <PathField
                      label={fields.pressure}
                      value={fallbackEvent.groundedPressureSummary ?? fallbackEvent.pressureDeltaSummary}
                      locale={locale}
                    />
                    <PathField
                      label={fields.information}
                      value={fallbackEvent.informationGapDeltaSummary}
                      locale={locale}
                    />
                    <PathField
                      label={fields.opportunity}
                      value={firstClue(fallbackEvent)}
                      locale={locale}
                    />
                    <PathField
                      label={fields.destiny}
                      value={fallbackEvent.destinyModifierEffect}
                      locale={locale}
                    />
                  </>
                ) : (
                  <p className="rounded border border-dashed border-black/12 bg-white p-3 text-xs leading-5 text-[#7d8578]">
                    {t.noMovement}
                  </p>
                )}
              </div>
              <p className="mt-3 text-xs leading-5 text-[#7d8578]">
                {branchEventCounts.get(branchId) ?? 0}{" "}
                {locale === "zh" ? "个分析事件" : "analysis events"}
              </p>
            </PathCard>
          );
        })}
      </div>
    </section>
  );
}

function PathField({
  label,
  value,
  locale,
}: {
  label: string;
  value?: string;
  locale: Locale;
}) {
  if (!value) return null;

  return (
    <div className="rounded border border-black/8 bg-white p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
        {label}
      </div>
      <p className="mt-1 text-xs leading-5 text-[#62695d]">
        {userFacingRunningText(value, locale)}
      </p>
    </div>
  );
}


