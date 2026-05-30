"use client";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { LocalSandboxSnapshot } from "@/components/local-sandbox-snapshot";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { ButtonLink, SurfaceCard } from "@/components/ui-foundation";

const dashboardCopy = {
  en: {
    status: "Destiny-situation sandbox",
    title:
      "Astraloom combines destiny climate, real-world situation, and dynamic path simulation.",
    intro:
      "Start with basic birth context and one current question. The main path stays simple: start, clarify only if needed, watch the sandbox run, then inspect findings and evidence replay.",
    start: "Start my destiny sandbox",
    sample: "Try complete sample",
    previewTitle: "Current local preview",
    previewNotes: [
      "No production backend writes are needed for this first-run loop.",
      "Advanced pages remain available for structure review, situation models, map details, events, findings, and feedback.",
      "Safety checks can stop blocked scenarios before runnable data is saved.",
    ],
    simpleFlowTitle: "Simple main flow",
    simpleFlowBody:
      "This is the user-facing path. People, agent, and graph pages are available for inspection, but they are not required dashboard steps.",
    mainPath: "Main path",
    step: "Step",
    advancedTitle: "Advanced detail pages",
    advancedBody:
      "Use these only when you want to inspect or audit the structure behind a run.",
    optional: "Optional",
    advanced: "Advanced",
    mainFlow: [
      {
        title: "Start",
        body: "Enter birth context and one current question.",
        href: "/app/start",
        label: "Start my destiny sandbox",
      },
      {
        title: "Clarify",
        body: "Answer up to three short questions only when the sandbox needs essential context.",
        href: "/app/start/clarify",
        label: "Open clarification",
      },
      {
        title: "Run",
        body: "Watch the destiny climate, real situation, and path simulation become events.",
        href: "/app/simulation/running",
        label: "Run sandbox",
      },
      {
        title: "Result",
        body: "Review integrated findings, evidence replay, and calibration prompts.",
        href: "/app/simulation/result",
        label: "Open result",
      },
    ],
    advancedPages: [
      {
        title: "Advanced structure review",
        body: "Inspect extracted people and roles when you want to audit the situation model.",
        href: "/app/new/people",
        label: "People details",
      },
      {
        title: "Situation model details",
        body: "Review user core, parallel selves, and NPC agent drafts with source confidence.",
        href: "/app/new/agents",
        label: "Agent details",
      },
      {
        title: "Situation map details",
        body: "Inspect the read-only relation map and evidence refs behind the sandbox.",
        href: "/app/new/graph",
        label: "Map details",
      },
    ],
    tracks: [
      [
        "Track A",
        "Concrete crossroads",
        "Use for a 30 or 90 day decision where the next move, timing, and relationship pressure are close.",
      ],
      [
        "Track B",
        "Long-horizon climate",
        "Use for a 1, 3, or 5 year theme view where signals unfold slowly and exact daily outcomes would be misleading.",
      ],
    ],
  },
  zh: {
    status: "命理-处境沙盘",
    title: "Astraloom 把命理气候、现实处境和动态路径推演放在同一个证据链里。",
    intro:
      "从基础出生信息和一个当前问题开始。主流程保持简单：开始、必要时追问、运行沙盘，然后查看发现和证据回放。",
    start: "开始我的命理沙盘",
    sample: "试用完整示例",
    previewTitle: "当前本地预览",
    previewNotes: [
      "首轮本地链路不需要写入生产后端。",
      "高级页面仍可用于检查结构、处境模型、关系图、事件、发现和反馈。",
      "安全检查可以在保存可运行数据前停止阻断场景。",
    ],
    simpleFlowTitle: "简单主流程",
    simpleFlowBody:
      "这是面向用户的路径。人物、Agent 和关系图页面可用于检查，但不是仪表盘上的必经步骤。",
    mainPath: "主路径",
    step: "步骤",
    advancedTitle: "高级详情页",
    advancedBody: "只有在你想检查或审计某次推演背后的结构时才需要使用这些页面。",
    optional: "可选",
    advanced: "高级",
    mainFlow: [
      {
        title: "开始",
        body: "输入出生背景和一个当前问题。",
        href: "/app/start",
        label: "开始我的命理沙盘",
      },
      {
        title: "追问",
        body: "只有沙盘缺少必要上下文时，才回答最多三个短问题。",
        href: "/app/start/clarify",
        label: "打开追问",
      },
      {
        title: "运行",
        body: "观察命理气候、现实处境和路径推演如何变成事件。",
        href: "/app/simulation/running",
        label: "运行沙盘",
      },
      {
        title: "结果",
        body: "查看综合发现、证据回放和校准提示。",
        href: "/app/simulation/result",
        label: "打开结果",
      },
    ],
    advancedPages: [
      {
        title: "高级结构检查",
        body: "当你想审计处境模型时，检查提取出的人物和角色。",
        href: "/app/new/people",
        label: "人物详情",
      },
      {
        title: "处境模型详情",
        body: "查看用户核心、平行自我和 NPC Agent 草稿及来源置信度。",
        href: "/app/new/agents",
        label: "Agent 详情",
      },
      {
        title: "处境地图详情",
        body: "检查沙盘背后的只读关系图和证据引用。",
        href: "/app/new/graph",
        label: "地图详情",
      },
    ],
    tracks: [
      [
        "路径 A",
        "具体十字路口",
        "适合 30 或 90 天内的决策，下一步动作、时机和关系压力都比较近。",
      ],
      [
        "路径 B",
        "长期气候",
        "适合 1、3 或 5 年的主题观察，信号缓慢展开，精确日常结果会误导判断。",
      ],
    ],
  },
} as const;

export default function DashboardPage() {
  const { locale } = useLanguage();
  const t = dashboardCopy[locale];

  return (
    <AppShell>
      <section className="mf-page-grid">
        <SurfaceCard emphasis="strong" className="p-7">
          <StatusPill tone="ready">{t.status}</StatusPill>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight text-[#11150f]">
            {t.title}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#62695d]">
            {t.intro}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/app/start" className="px-5 py-3">
              {t.start}
            </ButtonLink>
            <TrialSampleButton
              target="/app/simulation/result"
              className="mf-button mf-button-secondary px-5 py-3"
            >
              {t.sample}
            </TrialSampleButton>
          </div>
        </SurfaceCard>

        <aside className="space-y-4">
          <LocalSandboxSnapshot
            emptyAction={
              <div className="flex flex-wrap gap-2">
                <ButtonLink href="/app/start" className="px-4 py-2">
                  {t.start}
                </ButtonLink>
                <TrialSampleButton
                  target="/app/simulation/result"
                  className="mf-button mf-button-secondary px-4 py-2"
                >
                  {t.sample}
                </TrialSampleButton>
              </div>
            }
          />
          <section className="mf-panel-dark p-6">
            <h2 className="text-sm font-semibold text-[#b7e6c6]">
              {t.previewTitle}
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-white/66">
              {t.previewNotes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="mt-6">
        <div className="mf-section-header">
          <div>
            <h2 className="mf-section-title">{t.simpleFlowTitle}</h2>
            <p className="mf-section-copy">
              {t.simpleFlowBody}
            </p>
          </div>
          <StatusPill tone="planned">{t.mainPath}</StatusPill>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {t.mainFlow.map((step, index) => (
            <article key={`${step.title}-${index}`} className="mf-card p-5">
              <span className="text-xs font-semibold uppercase text-[#568262]">
                {t.step} {index + 1}
              </span>
              <h2 className="mt-3 text-base font-semibold text-[#11150f]">
                {step.title}
              </h2>
              <p className="mt-2 min-h-[72px] text-sm leading-6 text-[#62695d]">
                {step.body}
              </p>
              <ButtonLink href={step.href} className="mt-4 px-4 py-2">
                {step.label}
              </ButtonLink>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="mf-section-header">
          <div>
            <h2 className="mf-section-title">{t.advancedTitle}</h2>
            <p className="mf-section-copy">
              {t.advancedBody}
            </p>
          </div>
          <StatusPill tone="planned">{t.optional}</StatusPill>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {t.advancedPages.map((page) => (
            <article key={page.href} className="mf-card p-5">
              <span className="text-xs font-semibold uppercase text-[#568262]">
                {t.advanced}
              </span>
              <h2 className="mt-3 text-base font-semibold text-[#11150f]">
                {page.title}
              </h2>
              <p className="mt-2 min-h-[72px] text-sm leading-6 text-[#62695d]">
                {page.body}
              </p>
              <ButtonLink href={page.href} variant="secondary" className="mt-4 px-4 py-2">
                {page.label}
              </ButtonLink>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {t.tracks.map(([track, title, body]) => (
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
    </AppShell>
  );
}
