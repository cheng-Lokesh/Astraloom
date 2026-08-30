"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import type { SandboxOverview } from "@/lib/sandbox-overview/overview.server";

type LoadState = { phase: "loading" } | { phase: "error"; message: string } | { phase: "ready"; overview: SandboxOverview };

const actionCopy: Record<SandboxOverview["nextAction"]["kind"], string> = {
  sign_in: "登录后查看我的沙盘", start_intake: "从现实情况开始", review_people: "确认关键人物", build_agents: "建立数字分身", review_graph: "查看关系网络", start_run: "开始正式 Run", open_running: "打开进行中的 Run", open_latest_result: "打开最近完成的结果",
};

export default function DashboardPage() {
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  useEffect(() => {
    let active = true;
    void fetch("/api/sandbox-overview", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json().catch(() => null) as { ok?: boolean; error_code?: string; overview?: SandboxOverview } | null;
      if (!response.ok || !payload?.ok || !payload.overview) throw new Error(payload?.error_code ?? "unavailable");
      if (active) setState({ phase: "ready", overview: payload.overview });
    }).catch((error: unknown) => {
      if (active) setState({ phase: "error", message: error instanceof Error ? error.message : "unavailable" });
    });
    return () => { active = false; };
  }, []);

  return <AppShell><main id="main-content" className="mx-auto w-full max-w-6xl py-7 sm:py-12">
    {state.phase === "loading" ? <Loading /> : null}
    {state.phase === "error" ? <LoadError message={state.message} /> : null}
    {state.phase === "ready" ? <SandboxLedger overview={state.overview} /> : null}
  </main></AppShell>;
}

function Loading() {
  return <section aria-busy="true" aria-labelledby="sandbox-loading-title" className="border-y border-white/10 py-12"><p role="status" className="font-mono text-xs uppercase tracking-[.14em] text-[var(--evidence-gold)]">读取账户账本</p><h1 id="sandbox-loading-title" className="mt-4 text-3xl font-semibold text-[var(--text-primary)] sm:text-5xl">正在恢复我的沙盘</h1><div className="mt-8 grid gap-3 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse bg-white/[.035]" />)}</div></section>;
}

function LoadError({ message }: { message: string }) {
  return <section className="border-y border-[color-mix(in_oklab,var(--risk-red)_35%,transparent)] py-12"><p role="alert" className="font-mono text-xs uppercase tracking-[.14em] text-[var(--risk-red)]">无法读取账户状态</p><h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)] sm:text-5xl">未显示任何推断状态</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">服务器暂时无法确认你的个人数字生命链。请刷新页面，或稍后重试。状态代码：{message}</p></section>;
}

function SandboxLedger({ overview }: { overview: SandboxOverview }) {
  const complete = overview.latestCompletedRun;
  return <section className="space-y-10">
    <header className="grid gap-8 border-b border-white/10 pb-9 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end"><div><p className="font-mono text-xs uppercase tracking-[.16em] text-[var(--evidence-gold)]"><span lang="en">My Sandbox</span> / 我的沙盘</p><h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.14] text-[var(--text-primary)] sm:text-6xl"><span lang="zh">你的个人数字生命，先从已保存的事实开始。</span></h1><p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--text-secondary)]">这里仅显示账户中已保存的正式链。没有权威模型支持的内容会明确保留为“尚未建模”。</p></div><Link href={overview.nextAction.href} className="inline-flex min-h-10 items-center justify-center rounded bg-[var(--evidence-gold)] px-4 py-3 text-center text-sm font-semibold text-black transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)]">{actionCopy[overview.nextAction.kind]}</Link></header>

    <section aria-labelledby="chain-title"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4"><div><p className="font-mono text-[11px] uppercase tracking-[.14em] text-[var(--text-muted)]">已保存的正式链</p><h2 id="chain-title" className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">我的数字分身与关系网络</h2></div><p className="text-sm text-[var(--text-secondary)]">只读服务端投影</p></div><dl className="divide-y divide-white/10"><LedgerRow label="正式 Reality / Seed" value={overview.seed.state === "submitted" ? "已提交" : "尚未开始"} detail={overview.reality.state === "not_modeled" ? "Reality 细分状态尚未建模" : ""} tone={overview.seed.state === "submitted" ? "verified" : "muted"} /><LedgerRow label="关键人物" value={`${overview.people.confirmedCount}`} detail="已确认人物" tone={overview.people.confirmedCount > 0 ? "verified" : "muted"} /><LedgerRow label="数字分身" value={`${overview.agents.immutableCount}`} detail="不可变 Agent" tone={overview.agents.immutableCount > 0 ? "verified" : "muted"} /><LedgerRow label="关系网络" value={overview.graph.exists ? (overview.graph.locked ? "已锁定" : "待审阅") : "尚未建立"} detail={overview.graph.exists ? `${overview.graph.edgeCount} 条关系边` : "没有从演示数据补全"} tone={overview.graph.locked ? "verified" : overview.graph.exists ? "gold" : "muted"} /></dl></section>

    <section aria-labelledby="runs-title" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]"><div><div className="border-b border-white/10 pb-4"><p className="font-mono text-[11px] uppercase tracking-[.14em] text-[var(--text-muted)]">运行与记录</p><h2 id="runs-title" className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">沙盘的当前位置</h2></div><dl className="divide-y divide-white/10"><LedgerRow label="运行中" value={overview.running.exists ? "有进行中的 Run" : "暂无"} detail={overview.running.exists ? "状态由服务端确认" : ""} tone={overview.running.exists ? "gold" : "muted"} /><LedgerRow label="最近完成" value={complete ? "已完成" : "暂无已完成 Run"} detail={complete ? new Date(complete.completedAt).toLocaleString() : ""} tone={complete ? "verified" : "muted"} /><LedgerRow label="历史" value={`${overview.history.count}`} detail="账户中的正式 Run" tone={overview.history.count > 0 ? "verified" : "muted"} /><LedgerRow label="最近反馈" value={overview.feedback.exists ? "已有反馈" : "暂无反馈"} detail="反馈只影响新的 Run" tone={overview.feedback.exists ? "verified" : "muted"} /></dl></div><aside className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><p className="font-mono text-[11px] uppercase tracking-[.14em] text-[var(--evidence-gold)]">唯一下一步</p><p className="mt-3 text-lg font-semibold leading-7 text-[var(--text-primary)]">{actionCopy[overview.nextAction.kind]}</p><p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">每次只给出与当前服务端链一致的一个动作，不猜测未保存的进度。</p><Link href={overview.nextAction.href} className="mt-5 inline-flex min-h-10 items-center rounded border border-white/15 px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)]">继续</Link></aside></section>

    <section aria-labelledby="not-modeled-title" className="border-y border-white/10 py-7"><p className="font-mono text-[11px] uppercase tracking-[.14em] text-[var(--text-muted)]">模型边界</p><h2 id="not-modeled-title" className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">尚未建模</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{["人生气候", "资源", "限制", "下一变化节点"].map((label) => <div key={label} className="border-t border-white/10 pt-3"><p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">当前数据库没有权威字段</p></div>)}</div></section>
  </section>;
}

function LedgerRow({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "verified" | "gold" | "muted" }) {
  const color = tone === "verified" ? "text-[var(--verified-green)]" : tone === "gold" ? "text-[var(--evidence-gold)]" : "text-[var(--text-secondary)]";
  return <div className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><dt className="text-sm font-semibold text-[var(--text-primary)]">{label}<span className="mt-1 block text-xs font-normal leading-5 text-[var(--text-muted)]">{detail}</span></dt><dd className={`font-mono text-sm tabular-nums ${color}`}>{value}</dd></div>;
}
