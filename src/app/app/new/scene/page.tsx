"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";

const sceneCopy = {
  en: {
    status: "New simulation setup",
    title: "Put one situation into a controlled sandbox.",
    intro:
      "Choose the run shape before intake. Astraloom will later convert your free-form situation into people, relation edges, four branch paths, event evidence, and findings.",
    tags: ["Evidence first", "Four paths", "Read-only graph"],
    selectedShape: "Selected shape",
    scenarioMetric: "Scenario",
    outputMetric: "Output",
    modeMetric: "Mode",
    outputValue: "Events + Findings",
    modeValue: "Local sandbox",
    chooseOne: "Choose one",
    bestFor: "Best for:",
    scenarioTitle: "Choose one scenario domain",
    scenarioBody:
      "Keep the run focused. Astraloom works best when one sandbox has one core relationship or decision question.",
    selected: "Selected",
    required: "Required",
    create: "Create sandbox",
    sample: "Open sample sandbox",
    sandboxBoundary:
      "This is a scenario sandbox: no chat thread, no fate claim, no professional advice, no editable CRM graph, and no mid-run story choices.",
    createsTitle: "What this will create",
    fullLoop: "Full loop",
    tracks: [
      {
        id: "track-a",
        title: "Track A",
        subtitle: "Concrete crossroads",
        horizon: "30 or 90 days",
        bestFor: "A decision with a near-term action boundary.",
        body: "Use this when you need to compare what may happen if you wait, communicate, proceed, or set a boundary.",
        output:
          "Branch ticks, Event Logs, risk windows, opportunity windows, and practical strategy options.",
        accent: "Near-term",
      },
      {
        id: "track-b",
        title: "Track B",
        subtitle: "Long-horizon climate",
        horizon: "1, 3, or 5 years",
        bestFor:
          "One theme domain where timing is broad and signals develop slowly.",
        body: "Use this when you need coarse trend windows instead of precise daily outcomes or deterministic life prediction.",
        output:
          "Coarser relationship climate signals, preparation windows, evidence gaps, and calibration prompts.",
        accent: "Long view",
      },
    ],
    scenarios: [
      {
        id: "career",
        title: "Career decision",
        copy: "Promotion timing, manager support, offer windows, resource control, or reputation tradeoffs.",
      },
      {
        id: "collaboration",
        title: "Collaboration tension",
        copy: "A project, friend, partner, or teammate where trust, credit, and boundaries may shift.",
      },
      {
        id: "family",
        title: "Family or partner boundary",
        copy: "A relationship pressure point where communication, dependency, and emotional debt matter.",
      },
      {
        id: "personal",
        title: "Personal direction",
        copy: "A focused life-direction question with important people and observable constraints.",
      },
    ],
    miniLoop: [
      "Seed Context",
      "Key People",
      "Agent Profiles",
      "Relation Graph",
      "Simulation Ticks",
      "Event Logs",
      "Claims + Feedback",
    ],
  },
  zh: {
    status: "新沙盘设置",
    title: "把一个真实处境放进可控沙盘。",
    intro:
      "先选择这次推演的形状。Astraloom 会把你的自由描述转成关键人物、关系边、四条路径、事件证据和发现。",
    tags: ["证据优先", "四条路径", "只读关系图"],
    selectedShape: "当前选择",
    scenarioMetric: "场景",
    outputMetric: "输出",
    modeMetric: "模式",
    outputValue: "事件 + 发现",
    modeValue: "本地沙盘",
    chooseOne: "请选择",
    bestFor: "适合：",
    scenarioTitle: "选择一个场景领域",
    scenarioBody:
      "保持一次沙盘聚焦。一个沙盘最好只围绕一个核心关系或决策问题。",
    selected: "已选择",
    required: "必选",
    create: "创建沙盘",
    sample: "打开示例沙盘",
    sandboxBoundary:
      "这是处境沙盘：不是聊天线程，不做宿命判断，不提供专业建议，不编辑 CRM 关系图，也不会让用户在推演中途选择剧情。",
    createsTitle: "接下来会生成",
    fullLoop: "完整链路",
    tracks: [
      {
        id: "track-a",
        title: "路径 A",
        subtitle: "具体十字路口",
        horizon: "30 或 90 天",
        bestFor: "有近期行动边界的决策。",
        body: "适合比较等待、沟通、推进或设置边界后，处境可能如何变化。",
        output: "分支 tick、事件日志、风险窗口、机会窗口和实用策略选项。",
        accent: "近期",
      },
      {
        id: "track-b",
        title: "路径 B",
        subtitle: "长期气候",
        horizon: "1、3 或 5 年",
        bestFor: "时间较宽、信号慢慢显现的主题领域。",
        body: "适合观察粗粒度趋势窗口，而不是给出精确日期或确定性人生预测。",
        output: "较粗的关系气候信号、准备窗口、证据缺口和校准提示。",
        accent: "长期",
      },
    ],
    scenarios: [
      {
        id: "career",
        title: "职业决策",
        copy: "晋升时机、上级支持、机会窗口、资源控制或声誉权衡。",
      },
      {
        id: "collaboration",
        title: "合作张力",
        copy: "项目、朋友、伴侣或队友之间的信任、功劳和边界变化。",
      },
      {
        id: "family",
        title: "家庭或伴侣边界",
        copy: "沟通、依赖和情绪债务都很重要的关系压力点。",
      },
      {
        id: "personal",
        title: "个人方向",
        copy: "带有重要人物和现实约束的人生方向问题。",
      },
    ],
    miniLoop: [
      "种子上下文",
      "关键人物",
      "Agent 画像",
      "关系图",
      "推演 Tick",
      "事件日志",
      "发现 + 反馈",
    ],
  },
} as const;

type TrackId = (typeof sceneCopy.en.tracks)[number]["id"];
type ScenarioId = (typeof sceneCopy.en.scenarios)[number]["id"];

export default function ScenePage() {
  const { locale } = useLanguage();
  const t = sceneCopy[locale];
  const tracks = t.tracks;
  const scenarios = t.scenarios;
  const [track, setTrack] = useState<TrackId>(tracks[0].id);
  const [scenario, setScenario] = useState<ScenarioId | "">("");
  const selectedTrack = useMemo(
    () => tracks.find((item) => item.id === track) ?? tracks[0],
    [track, tracks],
  );
  const selectedScenario = scenarios.find((item) => item.id === scenario);

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <SurfaceCard
          emphasis="strong"
          className="overflow-hidden border-black/10 p-0"
        >
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="p-6 sm:p-8">
              <StatusPill tone="planned">{t.status}</StatusPill>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] text-[#11150f] sm:text-5xl">
                {t.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#52594d]">
                {t.intro}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {t.tags.map((item) => (
                  <span
                    key={item}
                    className="rounded-md border border-[#568262]/20 bg-[#eef5ee] px-3 py-1.5 text-xs font-semibold text-[#2f5d3d]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-black/8 bg-[#11150f] p-6 text-white xl:border-l xl:border-t-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b7e6c6]">
                {t.selectedShape}
              </p>
              <h2 className="mt-4 text-2xl font-semibold">
                {selectedTrack.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/66">
                {selectedTrack.subtitle}. {selectedTrack.horizon}.
              </p>
              <div className="mt-6 space-y-3">
                <PreviewMetric
                  label={t.scenarioMetric}
                  value={selectedScenario?.title ?? t.chooseOne}
                />
                <PreviewMetric label={t.outputMetric} value={t.outputValue} />
                <PreviewMetric label={t.modeMetric} value={t.modeValue} />
              </div>
            </div>
          </div>

          <div className="border-t border-black/8 bg-white/56 p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
            {tracks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTrack(item.id)}
                className={`group rounded-lg border p-5 text-left transition ${
                  track === item.id
                    ? "border-[#568262]/50 bg-[#eef5ee] shadow-[0_16px_34px_rgba(86,130,98,0.12)]"
                    : "border-black/8 bg-white hover:-translate-y-0.5 hover:border-[#568262]/30 hover:shadow-[0_16px_34px_rgba(17,21,15,0.06)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-md bg-white/70 px-2.5 py-1 text-xs font-semibold text-[#568262]">
                    {item.accent}
                  </span>
                  <span
                    className={`h-3 w-3 rounded-full border ${
                      track === item.id
                        ? "border-[#568262] bg-[#568262]"
                        : "border-black/18 bg-white"
                    }`}
                  />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-[#11150f]">
                  {item.title}: {item.subtitle}
                </h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
                  {item.horizon}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#62695d]">
                  {item.body}
                </p>
                <p className="mt-4 rounded-md border border-black/8 bg-white/78 px-3 py-2 text-xs leading-5 text-[#3f483d]">
                  <span className="font-semibold">{t.bestFor} </span>
                  {item.bestFor}
                </p>
              </button>
            ))}
            </div>
          </div>

          <div className="border-t border-black/8 p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#11150f]">
                  {t.scenarioTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#62695d]">
                  {t.scenarioBody}
                </p>
              </div>
              <StatusPill tone={selectedScenario ? "ready" : "blocked"}>
                {selectedScenario ? t.selected : t.required}
              </StatusPill>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {scenarios.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScenario(item.id)}
                  className={`rounded-lg border p-4 text-left transition ${
                    scenario === item.id
                      ? "border-[#11150f] bg-[#11150f] text-white shadow-[0_14px_30px_rgba(17,21,15,0.16)]"
                      : "border-black/10 bg-white text-[#52594d] hover:-translate-y-0.5 hover:border-[#11150f] hover:shadow-[0_14px_30px_rgba(17,21,15,0.06)]"
                  }`}
                >
                  <span className="text-sm font-semibold">{item.title}</span>
                  <span
                    className={`mt-2 block text-xs leading-5 ${
                      scenario === item.id ? "text-white/68" : "text-[#62695d]"
                    }`}
                  >
                    {item.copy}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-black/8 bg-[#fbfcf8] p-5 sm:p-6">
            {selectedScenario ? (
              <ButtonLink href="/app/new/intake" className="px-5 py-3">
                {t.create}
              </ButtonLink>
            ) : (
              <Button disabled className="px-5 py-3">
                {t.create}
              </Button>
            )}
            <TrialSampleButton className="mf-button mf-button-secondary px-5 py-3">
              {t.sample}
            </TrialSampleButton>
          </div>
        </SurfaceCard>

        <aside className="space-y-4">
          <section className="mf-panel-dark p-6">
            <h2 className="text-sm font-semibold text-[#b7e6c6]">
              {selectedTrack.title}: {selectedTrack.subtitle}
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-white/68">
              <p>{selectedTrack.bestFor}</p>
              <p>{selectedTrack.output}</p>
              <p>{t.sandboxBoundary}</p>
            </div>
          </section>

          <section className="mf-card p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold text-[#11150f]">
                {t.createsTitle}
              </h2>
              <StatusPill tone="planned">{t.fullLoop}</StatusPill>
            </div>
            <div className="mt-4 grid gap-2">
              {t.miniLoop.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-md border border-black/8 bg-[#fbfcf8] px-3 py-2.5 transition hover:border-[#568262]/24 hover:bg-[#eef5ee]"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-white text-xs font-semibold text-[#568262]">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-[#3f483d]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </AppShell>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/44">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
