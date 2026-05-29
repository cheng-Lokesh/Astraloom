"use client";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { LocalSandboxSnapshot } from "@/components/local-sandbox-snapshot";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { BRAND_NAME } from "@/lib/brand";

const copy = {
  en: {
    status: "Personal scenario sandbox",
    title:
      "Turn one real-life situation into agents, a graph, events, and evidence-backed options.",
    body: `${BRAND_NAME} helps you load a relationship or decision scenario into a small simulation sandbox. You confirm the cast, review the read-only relationship graph, run local ticks, and inspect claims only when they trace back to Event Logs.`,
    create: "Create sandbox",
    sample: "Open sample sandbox",
    sampleShort: "Open sample",
    boundaryTitle: "Product boundary",
    loopTitle: "The full sandbox loop",
    loopBody:
      "Every important output should be traceable from your context to people, agents, graph edges, events, claims, and calibration.",
    stepsLabel: "7 steps",
    boundaries: [
      "Not a chatbot-first interface.",
      "Not fortune-telling or fate language.",
      "Not therapy or professional advice.",
      "Not mind reading about other people.",
      "Not a CRM or editable relationship database.",
      "Not an RPG with mid-run story choices.",
    ],
    loopSteps: [
      ["Seed Context", "Describe one real situation, one question, one time window."],
      ["Key People", "Confirm who matters before any agent or graph exists."],
      ["Agent Profiles", "Turn people into bounded simulation models with sources."],
      ["Relation Graph", "Inspect read-only edges, confidence, and evidence refs."],
      ["Simulation Ticks", "Freeze the graph and run deterministic branch steps."],
      ["Event Logs", "Record what changed, when, why, and on which edge."],
      ["Claims + Feedback", "Review evidence-backed claims and calibrate the next run."],
    ],
    proofPoints: [
      [
        "Agents",
        "People become bounded digital agents with visible source evidence and confidence.",
      ],
      [
        "Read-only graph",
        "Relationships become inspectable edges; users never tune trust or conflict weights directly.",
      ],
      [
        "Event evidence",
        "A claim can appear only after the simulation has Event Log support.",
      ],
    ],
    trackCards: [
      [
        "Track A",
        "Concrete crossroads",
        "30 or 90 days for a focused decision, communication choice, boundary, or timing question.",
      ],
      [
        "Track B",
        "Long-horizon climate",
        "1, 3, or 5 years for one theme domain with coarse trend windows and preparation signals.",
      ],
    ],
  },
  zh: {
    status: "个人处境沙盘",
    title: "把一个真实处境转化为 Agent、关系图、事件和有证据支撑的选项。",
    body: `${BRAND_NAME} 会把一段关系或决策处境装入小型推演沙盘。你先确认关键人物，查看只读关系图，运行本地推演，并且只在 Claim 能追溯到事件日志时才查看结论。`,
    create: "创建沙盘",
    sample: "打开示例沙盘",
    sampleShort: "打开示例",
    boundaryTitle: "产品边界",
    loopTitle: "完整沙盘闭环",
    loopBody:
      "每个重要输出都应该能从你的上下文追溯到人物、Agent、关系边、事件、Claim 和校准反馈。",
    stepsLabel: "7 个步骤",
    boundaries: [
      "不是以聊天为核心的界面。",
      "不是算命或确定命运的表达。",
      "不是治疗或专业建议。",
      "不读心、不断言他人真实想法。",
      "不是 CRM 或可编辑关系数据库。",
      "不是推演中途持续做选择的 RPG。",
    ],
    loopSteps: [
      ["种子上下文", "描述一个真实处境、一个问题和一个时间窗口。"],
      ["关键人物", "在生成 Agent 或关系图之前，先确认真正相关的人。"],
      ["Agent 画像", "把人物转成带来源证据和置信度的有限模拟模型。"],
      ["关系图", "查看只读关系边、置信度和证据引用。"],
      ["推演 Tick", "冻结关系图后运行确定性的分支步骤。"],
      ["事件日志", "记录发生了什么、何时发生、为什么发生，以及影响了哪条边。"],
      ["Claim 与反馈", "查看证据支撑的 Claim，并校准下一次推演。"],
    ],
    proofPoints: [
      ["Agents", "人物会变成有限的数字 Agent，并带有可见来源证据和置信度。"],
      ["只读关系图", "关系会变成可检查的边；用户不能直接调节信任、冲突等权重。"],
      ["事件证据", "只有推演事件日志提供支撑之后，Claim 才能出现。"],
    ],
    trackCards: [
      ["Track A", "具体十字路口", "用于 30 或 90 天内的聚焦决策、沟通选择、边界或时机问题。"],
      ["Track B", "长期气候", "用于 1、3 或 5 年的单一主题视角，以粗粒度趋势和准备信号为主。"],
    ],
  },
} as const;

export default function Home() {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <SurfaceCard emphasis="strong" className="p-7">
          <StatusPill tone="ready">{t.status}</StatusPill>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight text-[#11150f]">
            {t.title}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#62695d]">
            {t.body}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/app/new/scene" className="px-5 py-3">
              {t.create}
            </ButtonLink>
            <TrialSampleButton className="mf-button mf-button-secondary px-5 py-3">
              {t.sample}
            </TrialSampleButton>
          </div>
        </SurfaceCard>

        <aside className="space-y-4">
          <LocalSandboxSnapshot
            emptyAction={
              <div className="flex flex-wrap gap-2">
                <ButtonLink href="/app/new/scene" className="px-4 py-2">
                  {t.create}
                </ButtonLink>
                <TrialSampleButton className="mf-button mf-button-secondary px-4 py-2">
                  {t.sampleShort}
                </TrialSampleButton>
              </div>
            }
          />
          <section className="mf-panel-dark p-6">
            <h2 className="text-sm font-semibold text-[#b7e6c6]">
              {t.boundaryTitle}
            </h2>
            <div className="mt-4 grid gap-2">
              {t.boundaries.map((item) => (
                <p
                  key={item}
                  className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm leading-6 text-white/70"
                >
                  {item}
                </p>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="mt-6 mf-card p-5">
        <div className="mf-section-header">
          <div>
              <h2 className="mf-section-title">{t.loopTitle}</h2>
              <p className="mf-section-copy">
              {t.loopBody}
            </p>
          </div>
          <StatusPill tone="planned">{t.stepsLabel}</StatusPill>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {t.loopSteps.map(([title, body], index) => (
            <article
              key={title}
              className="rounded-md border border-black/8 bg-[#f7f8f4] p-4"
            >
              <span className="text-xs font-semibold text-[#568262]">
                {index + 1}
              </span>
              <h3 className="mt-2 text-sm font-semibold text-[#11150f]">
                {title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-[#62695d]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {t.trackCards.map(([track, title, body]) => (
          <article key={track} className="mf-card p-5">
            <span className="text-xs font-semibold uppercase text-[#568262]">
              {track}
            </span>
            <h2 className="mt-2 text-base font-semibold text-[#11150f]">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">{body}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {t.proofPoints.map(([title, body]) => (
          <article key={title} className="mf-card p-5">
            <h2 className="text-sm font-semibold text-[#11150f]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">{body}</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
