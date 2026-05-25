"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";

const steps = [
  {
    title: "1. 讲清楚一个局面",
    body: "输入一个具体问题、时间视界和行动边界。MVP 先聚焦单次关系/决策沙盘。",
    href: "/app/new/scene",
    label: "开始输入",
  },
  {
    title: "2. 确认关键人物",
    body: "用户可以确认、删除、合并或补充人物，但不能编辑关系边权。",
    href: "/app/new/people",
    label: "确认人物",
  },
  {
    title: "3. 查看 Agent 和图谱",
    body: "每个关键人物会成为 Agent Profile，关系会成为只读 Relation Edge。",
    href: "/app/new/agents",
    label: "进入 Agent",
  },
  {
    title: "4. 生成事件和证据结论",
    body: "本地 tick engine 会写 Event Log，Claim Builder 只读取 evidence_event_ids。",
    href: "/app/simulation/running",
    label: "运行事件",
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="rounded-lg border border-black/8 bg-white p-7 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="ready">MVP 可试用基本形态</StatusPill>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight tracking-[-0.03em] text-[#11150f]">
            把一个真实关系决策，装进 Agent、图谱、事件日志和证据链。
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#62695d]">
            当前版本是本地确定性试用版：不调用 LLM，不收费，不写后端。它优先验证产品形态是否符合白皮书：
            不是泛聊天或神秘化报告，而是可追踪的生活/关系沙盘。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <TrialSampleButton className="rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a3026]">
              立即载入试用样例
            </TrialSampleButton>
            <Link
              href="/app/new/scene"
              className="rounded-md border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#11150f] transition hover:border-[#11150f]"
            >
              从空白局面开始
            </Link>
          </div>
        </main>

        <aside className="h-fit rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            试用版边界
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-6 text-white/64">
            <p>免费预览只跑低成本本地规则，不做 NPC 深度扫描。</p>
            <p>证据结论必须引用 Event Log，不能自行发明更强判断。</p>
            <p>高风险场景后续进入安全降级，不用付费绕过。</p>
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <article
            key={step.href}
            className="rounded-lg border border-black/8 bg-white p-5 shadow-[0_16px_48px_rgba(17,21,15,0.05)]"
          >
            <h2 className="text-base font-semibold text-[#11150f]">
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              {step.body}
            </p>
            <Link
              href={step.href}
              className="mt-4 inline-flex rounded-md bg-[#11150f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a3026]"
            >
              {step.label}
            </Link>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
