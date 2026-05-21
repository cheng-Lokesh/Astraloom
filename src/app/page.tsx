"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { isSupabaseConfigured } from "@/lib/env";

const homeCopy = {
  en: {
    stage: "Stage 0/1",
    supabaseReady: "Supabase configured",
    supabaseBlocked: "Supabase needs env",
    title:
      "Build the MiroFish MVP as a controlled AI life simulation workspace.",
    body: "This first scaffold only contains the application shell, login entry, environment contract, and empty operator workspace. Agent generation, graph simulation, payment, and reports stay out of scope until the foundation is verified.",
    openWorkspace: "Open workspace",
    testLogin: "Test login shell",
    rulesTitle: "Non-negotiable build rules",
    buildRules: [
      "Agent ecology first: users, parallel selves, and NPCs are modeled as individuals.",
      "Read-only relationship graph for MVP; no manual edge-weight editing.",
      "Free daily climate stays low-cost; no background deep NPC scans.",
      "SafetyVerifier cannot be bypassed by payment status.",
    ],
  },
  zh: {
    stage: "第 0/1 阶段",
    supabaseReady: "Supabase 已配置",
    supabaseBlocked: "Supabase 待配置",
    title: "把 MiroFish MVP 搭成可控的 AI 生命沙盘工作台。",
    body: "当前只完成应用外壳、登录入口、环境变量约定和空工作台。Agent 生成、关系图谱、支付和报告暂不进入本阶段，先把基础产品验证稳定。",
    openWorkspace: "打开工作台",
    testLogin: "检查登录外壳",
    rulesTitle: "不可突破的开发规则",
    buildRules: [
      "个体生态优先：用户、平行自我和 NPC 都要作为独立个体建模。",
      "MVP 关系图谱只读，不做手动边权编辑。",
      "免费每日气象必须低成本，不做后台 NPC 深度扫描。",
      "SafetyVerifier 不能被付费状态绕过。",
    ],
  },
};

export default function Home() {
  const configured = isSupabaseConfigured();
  const { locale } = useLanguage();
  const copy = homeCopy[locale];

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <StatusPill tone="ready">{copy.stage}</StatusPill>
            <StatusPill tone={configured ? "ready" : "blocked"}>
              {configured ? copy.supabaseReady : copy.supabaseBlocked}
            </StatusPill>
          </div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-slate-950">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            {copy.body}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {copy.openWorkspace}
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.testLogin}
            </Link>
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {copy.rulesTitle}
          </h2>
          <div className="mt-5 space-y-3">
            {copy.buildRules.map((rule) => (
              <div
                key={rule}
                className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"
              >
                {rule}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
