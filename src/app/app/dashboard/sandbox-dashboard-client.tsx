"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { SandboxOverview } from "@/lib/sandbox-overview/overview.server";

type Load = { phase: "loading" } | { phase: "error"; message: string } | { phase: "ready"; overview: SandboxOverview };
const action: Record<SandboxOverview["nextAction"]["kind"], string> = {
  sign_in: "登录后查看我的沙盘", start_intake: "从现实情况开始", review_people: "确认关键人物", build_agents: "建立数字分身", review_graph: "查看关系网络", start_run: "开始正式 Run", start_next_run: "开始下一次 Run", open_running: "打开进行中的 Run", open_latest_result: "打开最近完成的结果",
};

export function SandboxDashboardClient() {
  const [load, setLoad] = useState<Load>({ phase: "loading" });
  useEffect(() => {
    let live = true;
    void fetch("/api/sandbox-overview", { cache: "no-store" }).then(async response => {
      const body = await response.json().catch(() => null) as { ok?: boolean; error_code?: string; overview?: SandboxOverview } | null;
      if (!response.ok || !body?.ok || !body.overview) throw new Error(body?.error_code ?? "unavailable");
      if (live) setLoad({ phase: "ready", overview: body.overview });
    }).catch((error: unknown) => { if (live) setLoad({ phase: "error", message: error instanceof Error ? error.message : "unavailable" }); });
    return () => { live = false; };
  }, []);
  if (load.phase === "loading") return <main id="main-content" className="mx-auto w-full max-w-6xl py-12"><p role="status" className="font-mono text-xs uppercase tracking-[.14em] text-[var(--evidence-gold)]">读取账户账本</p><div className="mt-6 h-28 animate-pulse bg-white/[.035]" /></main>;
  if (load.phase === "error") return <main id="main-content" className="mx-auto w-full max-w-6xl py-12"><p role="alert" className="font-mono text-xs uppercase tracking-[.14em] text-[var(--risk-red)]">无法读取账户状态</p><h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">未显示任何推断状态</h1><p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">请刷新页面，或稍后重试。状态代码：{load.message}</p></main>;
  return <SandboxLedger overview={load.overview} />;
}

export function SandboxLedger({ overview }: { overview: SandboxOverview }) {
  const done = overview.latestCompletedRun;
  return <main id="main-content" className="mx-auto w-full max-w-6xl overflow-x-hidden py-7 sm:py-12"><section className="space-y-10">
    <header className="border-b border-white/10 pb-9"><p className="font-mono text-xs uppercase tracking-[.16em] text-[var(--evidence-gold)]"><span lang="en">My Sandbox</span> / 我的沙盘</p><h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.14] text-[var(--text-primary)] sm:text-6xl">你的个人数字生命，先从已保存的事实开始。</h1><p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--text-secondary)]">这里只显示账户中已保存的正式链。没有权威模型支持的内容会明确保留为“尚未建模”。</p></header>
    <section aria-labelledby="chain-title"><Header id="chain-title" eyebrow="已保存的正式链" title="我的数字分身与关系网络" /><dl className="divide-y divide-white/10"><Row label="正式 Reality / Seed" value={overview.seed.state === "submitted" ? "已提交" : "尚未开始"} detail="Reality Profile / World State 尚未建模" tone={overview.seed.state === "submitted" ? "verified" : "muted"} /><Row label="关键人物" value={`${overview.people.confirmedCount}`} detail="已确认人物" tone={overview.people.confirmedCount ? "verified" : "muted"} /><Row label="数字分身" value={`${overview.agents.immutableCount}`} detail="不可变 Agent" tone={overview.agents.immutableCount ? "verified" : "muted"} /><Row label="关系网络" value={overview.graph.exists ? (overview.graph.locked ? "已锁定" : "待审阅") : "尚未建立"} detail={overview.graph.exists ? `${overview.graph.edgeCount} 条关系边` : "没有从演示数据补全"} tone={overview.graph.locked ? "verified" : overview.graph.exists ? "gold" : "muted"} /></dl><div className="mt-7 grid gap-8 md:grid-cols-2"><SummaryList title="当前人物" empty="当前链尚无可显示人物" items={overview.people.items.map(item => ({ key: item.key, primary: item.label, secondary: `${item.key} · ${item.relationship}` }))} /><SummaryList title="当前关系" empty="当前链尚无可显示关系" items={overview.relations.items.map(item => ({ key: item.key, primary: item.label, secondary: `${item.fromPersonKey} → ${item.toPersonKey}` }))} /></div></section>
    <section aria-labelledby="runs-title" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]"><div><Header id="runs-title" eyebrow="运行与记录" title="沙盘的当前位置" /><dl className="divide-y divide-white/10"><Row label="运行中" value={overview.running.exists ? "有进行中的 Run" : "暂无"} detail={overview.running.exists ? "状态由服务端确认" : ""} tone={overview.running.exists ? "gold" : "muted"} /><Row label="最近完成" value={done ? "已完成" : "暂无已完成 Run"} detail={done ? new Date(done.completedAt).toLocaleString() : ""} tone={done ? "verified" : "muted"} /><Row label="历史" value={`${overview.history.count}`} detail="账户中的正式 Run" tone={overview.history.count ? "verified" : "muted"} /><Row label="最近反馈" value={overview.feedback.exists ? "已有反馈" : "暂无反馈"} detail="反馈只影响新的 Run" tone={overview.feedback.exists ? "verified" : "muted"} /></dl></div><aside className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><p className="font-mono text-[11px] uppercase tracking-[.14em] text-[var(--evidence-gold)]">唯一下一步</p><p className="mt-3 text-lg font-semibold leading-7 text-[var(--text-primary)]">{action[overview.nextAction.kind]}</p><p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">每次只给出与当前服务端链一致的一个动作。</p><Action overview={overview} /></aside></section>
    <section aria-labelledby="not-modeled-title" className="border-y border-white/10 py-7"><p className="font-mono text-[11px] uppercase tracking-[.14em] text-[var(--text-muted)]">模型边界</p><h2 id="not-modeled-title" className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">尚未建模</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{["Reality Profile / World State", "人生气候", "资源", "约束"].map(label => <div key={label} className="border-t border-white/10 pt-3"><p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">当前数据库没有权威字段</p></div>)}</div></section>
  </section></main>;
}

function SummaryList({ title, empty, items }: { title: string; empty: string; items: Array<{ key: string; primary: string; secondary: string }> }) { return <section aria-label={title} className="border-t border-white/10 pt-4"><h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>{items.length ? <ul className="mt-3 divide-y divide-white/10">{items.map(item => <li key={item.key} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"><span className="text-sm text-[var(--text-primary)]">{item.primary}</span><span className="font-mono text-xs text-[var(--text-muted)]">{item.secondary}</span></li>)}</ul> : <p className="mt-3 text-sm text-[var(--text-muted)]">{empty}</p>}</section>; }
function Header({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) { return <div className="border-b border-white/10 pb-4"><p className="font-mono text-[11px] uppercase tracking-[.14em] text-[var(--text-muted)]">{eyebrow}</p><h2 id={id} className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{title}</h2></div>; }
function Action({ overview }: { overview: SandboxOverview }) { return <Link href={overview.nextAction.href} className="mt-5 inline-flex min-h-10 items-center justify-center rounded border border-white/15 px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)]">{action[overview.nextAction.kind]}</Link>; }
function Row({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "verified" | "gold" | "muted" }) { const color = tone === "verified" ? "text-[var(--verified-green)]" : tone === "gold" ? "text-[var(--evidence-gold)]" : "text-[var(--text-secondary)]"; return <div className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><dt className="text-sm font-semibold text-[var(--text-primary)]">{label}<span className="mt-1 block text-xs font-normal leading-5 text-[var(--text-muted)]">{detail}</span></dt><dd className={`font-mono text-sm tabular-nums ${color}`}>{value}</dd></div>; }
