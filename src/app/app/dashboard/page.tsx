"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { getRuntimeCapability } from "@/lib/runtime-capability/get-runtime-capability";
import type { RealityIntakeDraft } from "@/types/reality-intake";
import type { RuntimeCapabilityState } from "@/types/runtime-capability";

type Locale = "en" | "zh";

const copy = {
  en: {
    title: "What do you want to understand?",
    body: "Type one real situation. Astraloom keeps the interface simple while the analysis engine separates facts, people, pressure, possible paths, and source limits.",
    placeholder:
      "For example: I am hesitating about whether to leave my current job. My manager is vague, but the new opportunity is not stable either. I want to know what to watch in the next month.",
    start: "Start analysis",
    sample: "Sample",
    continue: "Continue",
    empty: "Write one thing you want to see more clearly first.",
    short: "Add a little more context: what happened, who is involved, and what choice you are facing.",
    chips: ["Work choice", "Relationship", "Cooperation risk", "Family pressure", "I feel stuck"],
    system: "System Readiness",
    systemSub: "User-facing mode",
    source: "Source coverage",
    intake: "Reality intake",
    search: "External search",
    fallback: "Fallback visibility",
    safety: "Safety downgrade",
    mapTitle: "Situation Relation Map",
    mapSub: "Behind the chat, the system builds a live structure without asking you to operate it.",
    climate: "Timing lens",
    central: "Your situation",
    activeModules: "Active Modules",
    eventLedger: "Event Ledger",
    command: "Start from one message",
    commandSub: "Describe the situation naturally. Materials can be added later.",
    inputLabel: "CASE SIGNAL",
    inputMeta: "Reality first. Sources and uncertainty stay visible.",
    presetLabel: "Presets",
    shortcut: "Ctrl / Cmd + Enter",
    readySignal: "Ready to read",
    attach: "Add material",
    pathTitle: "Path Stream",
    pathSub: "The result focuses on observable signals, not fixed predictions.",
    sourceBacked: "source-backed",
    notSourceBacked: "source-limited",
    details: "Details",
    recent: "Recent",
    recentCases: "Recent cases",
    active: "ACTIVE",
    limited: "LIMITED",
    offline: "OFFLINE",
    visible: "VISIBLE",
    ready: "READY",
    realtime: "REAL-TIME",
    dialReady: "ready",
    centralNode: "CENTRAL NODE",
    running: "RUNNING",
    standby: "STANDBY",
    caseLabel: "Case",
    nodeLabels: ["Career", "Family", "Partner", "Resources", "Risk"],
    evidenceLabel: "Evidence",
    modules: [
      ["Reality Signal Reader", "People, pressure, choices"],
      ["Path Comparator", "Several possible next moves"],
      ["Evidence Boundary", "Source and fallback labels"],
      ["Timing Lens", "Optional destiny weighting"],
    ],
    events: [
      ["Situation captured", "waiting"],
      ["Sources checked", "visible"],
      ["Uncertainty preserved", "active"],
      ["Next signals prepared", "queued"],
    ],
  },
  zh: {
    title: "你现在最想看清什么事？",
    body: "只要写下一段真实情况。Astraloom 会在后台拆出现实事实、相关人物、压力、可能路径和来源边界。",
    placeholder:
      "例如：我最近在犹豫要不要离开现在的工作。主管态度变得模糊，但外部机会也还不稳定。我想知道接下来一个月应该观察什么、怎么行动。",
    start: "开始分析",
    sample: "样例",
    continue: "继续",
    empty: "先写一件你想看清的事。",
    short: "再多写一点会更好：发生了什么、涉及谁、你在犹豫什么。",
    chips: ["工作选择", "关系困扰", "合作风险", "家庭压力", "说不清但很卡"],
    system: "系统准备度",
    systemSub: "用户可用状态",
    source: "来源覆盖",
    intake: "现实信息读取",
    search: "外部来源搜索",
    fallback: "降级可见",
    safety: "安全降级",
    mapTitle: "处境关系图",
    mapSub: "你只需要输入一段话，后台会自动建立结构，不需要你操作复杂面板。",
    climate: "时间节奏",
    central: "你的情况",
    activeModules: "运行模块",
    eventLedger: "事件账本",
    command: "从一句话开始",
    commandSub: "自然描述就行。截图、聊天摘要或材料可以稍后再补。",
    inputLabel: "案例信号",
    inputMeta: "现实优先。来源状态和不确定性始终保留。",
    presetLabel: "预设",
    shortcut: "Ctrl / Cmd + Enter",
    readySignal: "准备读取",
    attach: "添加材料",
    pathTitle: "路径流",
    pathSub: "结果会聚焦下一步可观察信号，而不是确定预言。",
    sourceBacked: "有来源支撑",
    notSourceBacked: "来源有限",
    details: "细节",
    recent: "最近",
    recentCases: "最近分析",
    active: "可用",
    limited: "受限",
    offline: "离线",
    visible: "可见",
    ready: "就绪",
    realtime: "实时",
    dialReady: "就绪",
    centralNode: "中心节点",
    running: "运行中",
    standby: "待命",
    caseLabel: "案例",
    nodeLabels: ["职业", "家庭", "伙伴", "资源", "风险"],
    evidenceLabel: "依据",
    modules: [
      ["现实信号读取", "人物、压力、选择"],
      ["路径对比", "几种可能下一步"],
      ["依据边界", "来源和降级标记"],
      ["时间镜头", "可选命理调权"],
    ],
    events: [
      ["情况已准备接收", "等待"],
      ["来源状态会显示", "可见"],
      ["不确定性会保留", "运行中"],
      ["下一步信号待生成", "排队"],
    ],
  },
} as const;

const modeLabels: Record<RuntimeCapabilityState["currentMode"], Record<Locale, string>> = {
  local_assumption: { en: "Local assumption", zh: "本地假设" },
  manual_reality: { en: "Manual material", zh: "手动材料" },
  ai_reality_intake: { en: "AI intake", zh: "AI 读取" },
  external_reality: { en: "External source", zh: "外部来源" },
  full_grounded_reality: { en: "Full grounding", zh: "完整来源" },
};

function createDashboardState(repos: ReturnType<typeof getRepositories>) {
  const seedResult = repos.seedContexts.load();
  const seed = seedResult.ok ? seedResult.data : null;
  let realityIntake: RealityIntakeDraft | null = null;
  if (seed) {
    const result = repos.realityIntakes.load(seed.id);
    realityIntake = result.ok ? result.data : null;
  }

  return {
    hasLocalCase: Boolean(seed),
    capability: getRuntimeCapability({ realityIntake }),
  };
}

export default function DashboardPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const t = copy[locale];
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedChip, setSelectedChip] = useState("");
  const [repos] = useState(() => getRepositories());
  const [dashboardState, setDashboardState] = useState(() => ({
    hasLocalCase: false,
    capability: getRuntimeCapability({ realityIntake: null }),
  }));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setDashboardState(createDashboardState(repos));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [repos]);

  const capability = dashboardState.capability;
  const readiness = readinessScore(capability);

  function startAnalysis() {
    const trimmed = input.trim();
    if (!trimmed) {
      setMessage(t.empty);
      return;
    }
    if (trimmed.length < 20) {
      setMessage(t.short);
      return;
    }
    router.push(`/app/start?prompt=${encodeURIComponent(trimmed)}`);
  }

  function addMaterial() {
    const trimmed = input.trim();
    const prompt = trimmed ? `?prompt=${encodeURIComponent(trimmed)}` : "";
    router.push(`/app/start${prompt}`);
  }

  function applyChip(chip: string) {
    const examples: Record<string, string> = {
      工作选择:
        "我最近在考虑要不要换工作。现在的岗位稳定但没有成长，新机会看起来更有空间但也更不确定。我想知道接下来一个月应该观察哪些信号。",
      关系困扰:
        "我和一个重要的人最近沟通变少了，对方有时热情有时回避。我想看清这段关系是在缓和、拉远，还是需要我主动设边界。",
      合作风险:
        "我正在考虑一个合作机会，对方资源不错，但责任边界还不清楚。我想判断这件事值不值得继续推进，以及要先确认什么。",
      家庭压力:
        "家里最近对我的选择有很多意见，我想按自己的节奏走，但又不想把关系弄僵。我想看清怎么沟通比较稳。",
      说不清但很卡:
        "我最近觉得某件事一直卡住，心里有压力，但还说不清问题在哪里。我想先把当前局面梳理清楚，看看下一步该观察什么。",
    };
    setInput(examples[chip] ?? chip);
    setMessage("");
    setSelectedChip(chip);
  }

  return (
    <AppShell>
      <div className="dashboard-observatory mx-auto grid w-full max-w-[104rem] gap-3 overflow-hidden xl:h-[calc(100vh-7.25rem)] xl:grid-cols-[250px_minmax(0,1fr)_300px] 2xl:grid-cols-[290px_minmax(0,1fr)_330px]">
        <aside className="min-h-0 space-y-3 xl:grid xl:h-full xl:grid-rows-[minmax(0,1fr)_145px] xl:gap-3 xl:space-y-0">
          <GlassPanel className="min-h-0 overflow-hidden">
            <PanelHeader title={t.system} sub={t.systemSub} />
            <ReadinessDial value={readiness} label={t.dialReady} />
            <div className="mt-4 space-y-2">
              <ReadinessRow label={t.source} value={capability.canClaimGroundedSimulation ? "92%" : "54%"} tone={capability.canClaimGroundedSimulation ? "good" : "warn"} />
              <ReadinessRow label={t.intake} value={capability.llmAvailable ? t.active : t.limited} tone={capability.llmAvailable ? "good" : "warn"} />
              <ReadinessRow label={t.search} value={capability.realitySearchAvailable ? t.active : t.offline} tone={capability.realitySearchAvailable ? "good" : "warn"} />
              <ReadinessRow label={t.fallback} value={t.visible} tone="good" />
              <ReadinessRow label={t.safety} value={t.ready} tone="good" />
            </div>
          </GlassPanel>

          <GlassPanel className="hidden overflow-hidden xl:block">
            <PanelHeader title={t.recent} sub={t.recentCases} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[72, 58].map((value, index) => (
                <div key={value} className="rounded-md border border-[rgba(84,230,255,0.12)] bg-black/20 p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    {t.caseLabel} 0{index + 1}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-lg font-semibold text-[var(--text-primary)]">{value}%</span>
                    <span className="h-2 w-10 rounded-full bg-gradient-to-r from-[var(--destiny-violet)] to-[var(--signal-cyan)] opacity-80" />
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </aside>

        <main className="min-h-0">
          <GlassPanel className="relative h-[680px] overflow-hidden xl:h-full">
            <div className="relative z-20 flex items-start justify-between gap-3">
              <PanelHeader title={t.mapTitle} sub={t.mapSub} />
              <div className="flex items-center gap-2">
                <StatusChip tone={capability.canClaimGroundedSimulation ? "good" : "warn"}>
                  {capability.canClaimGroundedSimulation ? t.sourceBacked : t.notSourceBacked}
                </StatusChip>
                <StatusChip>{modeLabels[capability.currentMode][locale]}</StatusChip>
              </div>
            </div>

            <div className="home-command-layout relative z-10">
              <div className="home-command-focus">
                <div
                  data-testid="home-ai-composer"
                  className={`ai-composer w-full max-w-[780px] ${focused ? "ai-composer-focused" : ""}`}
                >
                  <div className="ai-composer-hero">
                    <div className="min-w-0">
                      <h1 className="ai-composer-title">{t.title}</h1>
                      <p className="ai-composer-subtitle">{t.body}</p>
                    </div>
                    <div className="ai-composer-status" aria-label={t.inputMeta}>
                      <span className="ai-status-dot" />
                      <span>{t.readySignal}</span>
                    </div>
                  </div>

                  <div className="ai-input-shell">
                    <textarea
                      value={input}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      onKeyDown={(event) => {
                        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                          event.preventDefault();
                          startAnalysis();
                        }
                      }}
                      onChange={(event) => {
                        setInput(event.target.value);
                        if (message) setMessage("");
                      }}
                      rows={3}
                      placeholder={t.placeholder}
                      className="ai-composer-input"
                    />

                    <div className="ai-composer-toolbar">
                      <div className="ai-toolbar-left">
                        <button
                          type="button"
                          onClick={addMaterial}
                          className="ai-tool-button"
                        >
                          <span>+</span>
                          {t.attach}
                        </button>
                        <TrialSampleButton
                          target="/app/simulation/result"
                          className="ai-tool-button"
                        >
                          {t.sample}
                        </TrialSampleButton>
                        {dashboardState.hasLocalCase ? (
                          <button
                            type="button"
                            onClick={() => router.push("/app/simulation/result")}
                            className="ai-tool-button"
                          >
                            {t.continue}
                          </button>
                        ) : null}
                      </div>
                      <div className="ai-toolbar-right">
                        <span className="hidden text-[11px] text-[var(--text-muted)] sm:inline">
                          {t.shortcut}
                        </span>
                        <button
                          type="button"
                          onClick={startAnalysis}
                          className="ai-send-button"
                          aria-label={t.start}
                        >
                          <span>↑</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="ai-composer-presets">
                    <span>{t.presetLabel}</span>
                    {t.chips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => applyChip(chip)}
                        className={`ai-preset-chip ${selectedChip === chip ? "ai-preset-chip-active" : ""}`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <div className="ai-composer-foot">
                    <span className={message ? "text-[var(--evidence-gold)]" : ""}>
                      {message || t.inputMeta}
                    </span>
                    <span>{Math.min(input.length, 999)} / 999</span>
                  </div>
                </div>
              </div>

              <div className="home-intelligence-strip">
                <div className="relative min-h-0 overflow-hidden rounded-lg border border-[rgba(84,230,255,0.14)] bg-black/20">
                  <RelationMap
                    title={t.central}
                    climate={t.climate}
                    nodeLabels={t.nodeLabels}
                    centralNodeLabel={t.centralNode}
                    evidenceLabel={t.evidenceLabel}
                    compact
                  />
                </div>
                <div className="home-path-card">
                  <PanelHeader title={t.pathTitle} sub={t.pathSub} />
                  <div className="mt-4 flex items-end gap-2">
                    {[42, 68, 52, 81, 61].map((height, index) => (
                      <span
                        key={height}
                        className="block w-full rounded-t border border-[rgba(84,230,255,0.12)] bg-gradient-to-t from-[rgba(84,230,255,0.06)] to-[rgba(84,230,255,0.45)]"
                        style={{ height: `${height}px`, opacity: 0.62 + index * 0.06 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>
        </main>

        <aside className="min-h-0 space-y-3 xl:grid xl:h-full xl:grid-rows-[300px_minmax(0,1fr)] xl:gap-3 xl:space-y-0">
          <GlassPanel className="overflow-hidden">
            <PanelHeader title={t.activeModules} sub={`${t.modules.length}/${t.modules.length}`} />
            <div className="mt-3 space-y-2">
              {t.modules.map(([title, body], index) => (
                <ModuleRow
                  key={title}
                  title={title}
                  body={body}
                  active={index < 4}
                  runningLabel={t.running}
                  standbyLabel={t.standby}
                />
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="overflow-hidden">
            <PanelHeader title={t.eventLedger} sub={t.realtime} />
            <div className="mt-3 space-y-2">
              {t.events.map(([title, state], index) => (
                <LedgerRow key={title} title={title} state={state} index={index} />
              ))}
            </div>
            <details className="mt-3 rounded border border-[rgba(84,230,255,0.12)] bg-black/20 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-[var(--signal-cyan)]">
                {t.details}
              </summary>
              <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                {capability.userFacingWarning}
              </p>
            </details>
          </GlassPanel>
        </aside>

      </div>
    </AppShell>
  );
}

function readinessScore(capability: RuntimeCapabilityState) {
  if (capability.canClaimGroundedSimulation) return 88;
  if (capability.llmAvailable) return 76;
  if (capability.hasManualRealitySources) return 72;
  return 64;
}

function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-[rgba(84,230,255,0.18)] bg-[rgba(5,11,22,0.78)] p-3 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}

function PanelHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.06em] text-[var(--text-primary)]">
          {title}
        </h2>
        {sub ? <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{sub}</p> : null}
      </div>
    </div>
  );
}

function StatusChip({ children, tone = "cyan" }: { children: React.ReactNode; tone?: "cyan" | "good" | "warn" }) {
  const toneClass =
    tone === "good"
      ? "border-[rgba(121,242,176,0.28)] text-[var(--verified-green)]"
      : tone === "warn"
        ? "border-[rgba(215,180,106,0.32)] text-[var(--evidence-gold)]"
        : "border-[rgba(84,230,255,0.22)] text-[var(--signal-cyan)]";
  return (
    <span className={`rounded border bg-black/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${toneClass}`}>
      {children}
    </span>
  );
}

function ReadinessDial({ value, label }: { value: number; label: string }) {
  return (
    <div className="mx-auto mt-4 grid h-36 w-36 place-items-center rounded-full border border-[rgba(84,230,255,0.12)] bg-black/20">
      <div
        className="grid h-28 w-28 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--verified-green) ${value * 3.6}deg, rgba(84,230,255,0.12) 0deg)`,
        }}
      >
        <div className="grid h-20 w-20 place-items-center rounded-full bg-[rgba(5,11,22,0.96)] text-center">
          <div>
            <p className="text-3xl font-semibold text-[var(--text-primary)]">{value}%</p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadinessRow({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-[rgba(84,230,255,0.12)] bg-white/[0.035] px-3 py-2">
      <span className="text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
      <span className={`text-[11px] font-semibold ${tone === "good" ? "text-[var(--verified-green)]" : "text-[var(--evidence-gold)]"}`}>
        {value}
      </span>
    </div>
  );
}

function RelationMap({
  title,
  climate,
  nodeLabels,
  centralNodeLabel,
  evidenceLabel,
  compact = false,
}: {
  title: string;
  climate: string;
  nodeLabels: readonly string[];
  centralNodeLabel: string;
  evidenceLabel: string;
  compact?: boolean;
}) {
  const nodes = [
    [nodeLabels[0] ?? "Career", "left-[16%] top-[34%]", "gold"],
    [nodeLabels[1] ?? "Family", "left-[22%] top-[62%]", "cyan"],
    [nodeLabels[2] ?? "Partner", "right-[24%] top-[34%]", "green"],
    [nodeLabels[3] ?? "Resources", "right-[26%] top-[62%]", "gold"],
    [nodeLabels[4] ?? "Risk", "right-[20%] bottom-[22%]", "red"],
  ] as const;

  return (
    <div className={`${compact ? "min-h-[210px]" : "min-h-[330px]"} relative h-full overflow-hidden`}>
      <div className="absolute inset-10 rounded-full border border-[rgba(84,230,255,0.08)]" />
      <div className="absolute left-1/2 top-1/2 h-[72%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(84,230,255,0.12)]" />
      <div className="absolute left-1/2 top-1/2 h-[54%] w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(150,120,255,0.18)] dashboard-orbit" />
      <div className="absolute left-[8%] right-[8%] top-1/2 h-px bg-gradient-to-r from-transparent via-[rgba(84,230,255,0.32)] to-transparent" />
      <div className="absolute bottom-[31%] left-[18%] right-[15%] h-px rotate-[-12deg] bg-gradient-to-r from-transparent via-[rgba(215,180,106,0.42)] to-transparent" />
      <div className="absolute left-[24%] right-[22%] top-[37%] h-px rotate-[16deg] bg-gradient-to-r from-transparent via-[rgba(84,230,255,0.28)] to-transparent" />

      <div className="absolute left-1/2 top-[12%] z-10 -translate-x-1/2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--destiny-violet)]">{climate}</p>
        <p className="text-4xl font-semibold text-[var(--text-primary)]">64%</p>
      </div>

      <div className="absolute left-1/2 top-1/2 z-20 w-36 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[rgba(84,230,255,0.32)] bg-[rgba(6,18,32,0.92)] p-3 text-center shadow-[0_0_42px_rgba(84,230,255,0.16)] 2xl:w-48 2xl:p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">{title}</p>
        <p className="mt-1 text-[11px] text-[var(--signal-cyan)]">{centralNodeLabel}</p>
      </div>

      {nodes.map(([label, position, tone]) => (
        <div key={label} className={`absolute z-20 ${position}`}>
          <div className={`map-node map-node-${tone}`}>
            <span />
          </div>
          <p className="mt-2 hidden text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-primary)] 2xl:block">{label}</p>
          <p className="hidden text-[10px] text-[var(--evidence-gold)] 2xl:block">{evidenceLabel} {tone === "red" ? "72" : "88"}%</p>
        </div>
      ))}

      {Array.from({ length: 34 }).map((_, index) => (
        <span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-[var(--signal-cyan)] opacity-50"
          style={{
            left: `${8 + ((index * 23) % 84)}%`,
            top: `${15 + ((index * 37) % 70)}%`,
            animationDelay: `${index * 80}ms`,
          }}
        />
      ))}
    </div>
  );
}

function ModuleRow({
  title,
  body,
  active,
  runningLabel,
  standbyLabel,
}: {
  title: string;
  body: string;
  active: boolean;
  runningLabel: string;
  standbyLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded border border-[rgba(84,230,255,0.1)] bg-white/[0.03] p-1.5">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded bg-[rgba(84,230,255,0.08)] text-[var(--signal-cyan)]">
        <span className="h-3 w-3 rounded-full border border-current" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="truncate text-[11px] text-[var(--text-secondary)]">{body}</p>
      </div>
      <span className={`text-[10px] font-semibold ${active ? "text-[var(--verified-green)]" : "text-[var(--evidence-gold)]"}`}>
        {active ? runningLabel : standbyLabel}
      </span>
    </div>
  );
}

function LedgerRow({ title, state, index }: { title: string; state: string; index: number }) {
  const tones = ["text-[var(--risk-red)]", "text-[var(--evidence-gold)]", "text-[var(--verified-green)]", "text-[var(--signal-cyan)]"];
  return (
    <div className="flex items-center gap-3 rounded border border-[rgba(84,230,255,0.1)] bg-black/20 p-2">
      <span className={`text-xs font-semibold ${tones[index % tones.length]}`}>0{index + 1}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{state}</p>
      </div>
    </div>
  );
}
