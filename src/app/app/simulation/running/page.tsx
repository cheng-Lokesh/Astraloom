"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { GroundedSimulationDebugPanel } from "@/components/grounded-social/grounded-simulation-debug-panel";
import { useLanguage } from "@/components/language-provider";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { TimelineFeed } from "@/components/simulation/event-log";
import { StatusPill } from "@/components/status-pill";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { buildClaimLedgerDraft } from "@/lib/claims/build";
import { applyFeedbackToNextRun } from "@/lib/calibration/apply-feedback-to-next-run";
import { loadCalibrationProfile } from "@/lib/calibration/calibration-engine";
import { getRepositories } from "@/lib/repositories/repository-provider";
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
import type { DestinySituationFusionDraft } from "@/types/destiny-fusion";
import type { SeedContextDraft } from "@/types/seed-context";
import type {
  SimulationBranchId,
  SimulationEventDraft,
  SimulationRunDraft,
} from "@/types/simulation-run";

type Locale = "en" | "zh";

const simulationStages = [
  {
    id: "reading_destiny_climate",
  },
  {
    id: "understanding_current_situation",
  },
  {
    id: "mapping_key_pressure",
  },
  {
    id: "simulating_key_interactions",
  },
  {
    id: "comparing_possible_paths",
  },
  {
    id: "preparing_key_findings",
  },
] as const;

type StageId = (typeof simulationStages)[number]["id"];

const runningCopy = {
  en: {
    heroTitle: "Your sandbox is unfolding",
    heroBody:
      "Astraloom is combining your destiny climate, real situation, and possible paths into one dynamic sandbox.",
    startRun: "Start unfolding",
    rerun: "Run again",
    reset: "Clear and rebuild",
    running: "Unfolding",
    complete: "Ready",
    waiting: "Ready to unfold",
    openingResult: "The sandbox is ready. Opening your key findings.",
    runMessage:
      "Astraloom is placing your destiny climate, real situation, and possible paths into motion.",
    rebuildMessage: "Astraloom is rebuilding the sandbox from your latest inputs.",
    resetMessage: "The current sandbox view has been cleared.",
    saveFailed: "The sandbox could not be saved. Please try again.",
    prepareFailed:
      "The sandbox could not prepare enough usable movement. Please return to the start page and generate it again.",
    noDataTitle: "The sandbox does not have enough runnable data yet.",
    noDataBody:
      "The sandbox does not have enough runnable data yet. Please start a new sandbox first.",
    backToStart: "Start a new sandbox",
    safetyTitle: "This sandbox is paused for safety",
    backToSetup: "Back to start",
    controlTitle: "Dynamic sandbox",
    controlBody:
      "Start the unfolding process and watch climate, pressure, interactions, and paths separate into readable signals.",
    climateTitle: "Destiny climate",
    climateFallback:
      "No saved destiny climate was found. Astraloom will lean more on the real situation in this run.",
    situationTitle: "Current situation",
    windowLabel: "Window",
    focusLabel: "Focus",
    pressureTitle: "Key pressure map",
    pressureBody:
      "Astraloom is matching symbolic climate with people, roles, and pressure points without treating any outcome as certain.",
    noPressure:
      "No detailed pressure map is available yet. The sandbox can still unfold from your current situation.",
    processTitle: "Sandbox unfolding",
    processBody:
      "The process moves from destiny climate and real pressure into interactions, path comparison, and key findings.",
    pathTitle: "Possible paths",
    pathBody:
      "The same situation is compared through several path lenses so pressure shifts are easier to notice.",
    noMovement: "No movement yet",
    interactionTitle: "Dynamic event cards",
    interactionBody:
      "Each card shows what happened, who was involved, how climate and real pressure moved, and what clue appeared.",
    runToGenerate: "Start unfolding to generate dynamic event cards.",
    technicalTitle: "Technical details",
    technicalBody:
      "Internal run data is kept here for review without taking over the main sandbox experience.",
    resultReady: "View key findings",
    resultWaiting: "Finish unfolding first",
    stageStatus: {
      blocked: "blocked",
      done: "done",
      active: "now",
      waiting: "waiting",
    },
    stages: {
      reading_destiny_climate: {
        label: "Reading destiny climate",
        detail:
          "Bringing birth context and current climate into the sandbox as symbolic background.",
      },
      understanding_current_situation: {
        label: "Understanding your current situation",
        detail:
          "Reading the question, recent context, people, and pressure you described.",
      },
      mapping_key_pressure: {
        label: "Mapping key pressure",
        detail:
          "Finding where timing, information, relationships, and resources may pull against each other.",
      },
      simulating_key_interactions: {
        label: "Simulating key interactions",
        detail:
          "Letting the main interactions move forward inside the sandbox.",
      },
      comparing_possible_paths: {
        label: "Comparing possible paths",
        detail:
          "Comparing how several paths may change pressure, clarity, and available resources.",
      },
      preparing_key_findings: {
        label: "Preparing key findings",
        detail:
          "Turning the unfolding sandbox into readable findings for the result page.",
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
    heroTitle: "你的沙盘正在展开",
    heroBody:
      "Astraloom 正在把你的命理气候、现实局势和几种可能路径放进同一个动态沙盘中。",
    startRun: "开始展开沙盘",
    rerun: "重新推演",
    reset: "清空并重建",
    running: "正在展开",
    complete: "已生成",
    waiting: "等待展开",
    openingResult: "沙盘已经展开完成，正在打开关键发现。",
    runMessage: "Astraloom 正在把命理气候、现实局势和可能路径放进沙盘中。",
    rebuildMessage: "Astraloom 正在根据最新输入重新展开沙盘。",
    resetMessage: "当前沙盘视图已清空。",
    saveFailed: "沙盘保存失败，请再试一次。",
    prepareFailed: "沙盘没有生成足够可用的变化，请回到开始页重新生成一次。",
    noDataTitle: "沙盘还缺少可运行的数据。",
    noDataBody: "沙盘还缺少可运行的数据。请先回到开始页生成一次沙盘。",
    backToStart: "回到开始页",
    safetyTitle: "这个沙盘因安全原因暂停",
    backToSetup: "回到开始页",
    controlTitle: "动态沙盘",
    controlBody: "开始展开后，你会看到命理气候、现实压力、关键互动和路径分化逐步浮现。",
    climateTitle: "命理气候",
    climateFallback: "还没有保存的命理气候。本次沙盘会更多依赖现实局势来展开。",
    situationTitle: "当前局势",
    windowLabel: "观察窗口",
    focusLabel: "关注点",
    pressureTitle: "关键压力映射",
    pressureBody:
      "Astraloom 会把象征性的命理气候与人物、角色和压力点放在一起观察，但不会把任何结果说成确定。",
    noPressure: "还没有详细压力映射。沙盘仍然可以从你描述的当前局势开始展开。",
    processTitle: "沙盘展开过程",
    processBody: "沙盘会从命理气候和现实压力开始，逐步进入互动、路径比较和关键发现。",
    pathTitle: "可能路径",
    pathBody: "同一个局势会从几种路径角度展开，帮助你看见压力如何变化。",
    noMovement: "还没有展开",
    interactionTitle: "动态事件卡片",
    interactionBody:
      "每张卡片会显示发生了什么、涉及谁、命理气候与现实压力如何变化，以及出现了什么线索。",
    runToGenerate: "开始展开沙盘后，会生成动态事件卡片。",
    technicalTitle: "技术细节",
    technicalBody: "内部运行数据仍保留在这里，方便检查，但不会占据主沙盘体验。",
    resultReady: "查看关键发现",
    resultWaiting: "请先完成沙盘展开",
    stageStatus: {
      blocked: "暂停",
      done: "完成",
      active: "正在进行",
      waiting: "等待",
    },
    stages: {
      reading_destiny_climate: {
        label: "读取命理气候",
        detail: "把出生背景和当前气候放入沙盘，作为象征性的背景信息。",
      },
      understanding_current_situation: {
        label: "理解当前局势",
        detail: "读取你描述的问题、近期背景、相关人物和现实压力。",
      },
      mapping_key_pressure: {
        label: "映射关键压力",
        detail: "观察时机、信息、关系和资源可能在哪里互相拉扯。",
      },
      simulating_key_interactions: {
        label: "模拟关键互动",
        detail: "让主要互动在沙盘中向前推进。",
      },
      comparing_possible_paths: {
        label: "比较可能路径",
        detail: "比较几种路径可能如何改变压力、清晰度和可用资源。",
      },
      preparing_key_findings: {
        label: "生成关键发现",
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

      if (stage.id === "simulating_key_interactions") {
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

          <FusionMappingPanel fusion={destinyFusion} locale={locale} />

          <GroundedSimulationDebugPanel
            groundedSocialSimulation={groundedSocialSimulation}
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
                const completed =
                  processState === "complete" ||
                  (processState === "running" && index < activeStageIndex);
                const active =
                  processState === "running" && index === activeStageIndex;
                const blocked = processState === "failed" && index >= activeStageIndex;
                const indicator = blocked ? "x" : completed ? "ok" : active ? "now" : "idle";
                const text = stageCopy(locale, stage.id);
                return (
                  <div
                    key={stage.id}
                    className={`overflow-hidden rounded-md border ${
                      completed
                        ? "border-[#568262]/25 bg-[#eef5ee]"
                        : active
                          ? "border-[#d49b4a]/35 bg-[#fff8ed]"
                          : blocked
                            ? "border-red-200 bg-red-50"
                            : "border-black/8 bg-[#f7f8f4]"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-8 w-10 place-items-center rounded-full border text-[10px] font-semibold ${
                              active
                                ? "animate-pulse border-[#d49b4a]/45 bg-white text-[#7c5524]"
                                : completed
                                  ? "border-[#568262]/25 bg-white text-[#2f5d3d]"
                                  : blocked
                                    ? "border-red-200 bg-white text-red-900"
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
                          tone={
                            blocked ? "blocked" : completed ? "ready" : "planned"
                          }
                        >
                          {blocked
                            ? t.stageStatus.blocked
                            : completed
                              ? t.stageStatus.done
                              : active
                                ? t.stageStatus.active
                                : t.stageStatus.waiting}
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
                    ) : completed ? (
                      <div className="h-1 bg-[#568262]" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <h2 className="text-base font-semibold text-[#11150f]">
              {t.pathTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              {t.pathBody}
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-4">
              {branchNames.map((branchId) => {
                const branchEvents =
                  visibleEvents.filter(
                    (event) => (event.branchId ?? "baseline") === branchId,
                  ) ?? [];
                const meta = branchMeta[branchId];
                const branchText = branchCopy(locale, branchId);
                return (
                  <article
                    key={branchId}
                    className={`rounded-md border p-4 ${meta.classes}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-[#11150f]">
                        {branchText.title}
                      </h3>
                      <StatusPill tone="planned">
                        {branchEventCounts.get(branchId) ?? 0}
                      </StatusPill>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#62695d]">
                      {branchText.detail}
                    </p>
                    <div className="mt-3 space-y-2">
                      {branchEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="rounded border border-black/8 bg-white p-3"
                        >
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
                            {event.timeLabel}
                          </div>
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#62695d]">
                            {event.interactionSummary ?? event.summary}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-[#7d8578]">
                            {event.informationGapDeltaSummary ??
                              t.noMovement}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <InteractionPreviewPanel
            events={visibleEvents}
            agents={agentEcology.agents}
            locale={locale}
          />
        </main>

        <aside className="mf-panel-dark h-fit p-6">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            {locale === "zh" ? "本次沙盘" : "This sandbox"}
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
              <Metric label="Claims" value={claimPreviewCount} />
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
                title="Event Log evidence"
                description="Saved Event Logs stay available for audit. Findings are prepared only after these events exist and preserve evidence_event_ids."
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

function FusionMappingPanel({
  fusion,
  locale,
}: {
  fusion: DestinySituationFusionDraft | null;
  locale: Locale;
}) {
  const t = runningCopy[locale];
  return (
    <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#11150f]">
            {t.pressureTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">
            {t.pressureBody}
          </p>
        </div>
        <StatusPill tone={fusion?.mappings.length ? "ready" : "planned"}>
          {fusion?.mappings.length ?? 0}
        </StatusPill>
      </div>
      {fusion?.localWarnings?.length ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          {userFacingRunningText(fusion.localWarnings[0], locale)}
        </p>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(fusion?.mappings ?? []).slice(0, 6).map((mapping) => (
          <article
            key={mapping.id}
            className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
              {userFacingRunningText(mapping.themeLabel, locale)}
            </div>
            <h3 className="mt-2 text-sm font-semibold text-[#11150f]">
              {userFacingRunningText(mapping.personLabel, locale)}
            </h3>
            <p className="mt-1 text-xs font-semibold text-[#3f483d]">
              {userFacingRunningText(mapping.pressureRole, locale)}
            </p>
            <p className="mt-3 text-xs leading-5 text-[#62695d]">
              {userFacingRunningText(mapping.userFacingSummary, locale)}
            </p>
            {mapping.mappingExplanation ? (
              <p className="mt-2 text-xs leading-5 text-[#7d8578]">
                {userFacingRunningText(mapping.mappingExplanation.whyLinked, locale)}
              </p>
            ) : null}
            {mapping.interpretationNotes?.[0] ? (
              <p className="mt-2 rounded border border-black/8 bg-white px-2 py-1 text-xs leading-5 text-[#62695d]">
                {userFacingRunningText(mapping.interpretationNotes[0], locale)}
              </p>
            ) : null}
          </article>
        ))}
        {!fusion?.mappings.length ? (
          <p className="rounded-md border border-dashed border-black/12 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#7d8578]">
            {t.noPressure}
          </p>
        ) : null}
      </div>
    </section>
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


