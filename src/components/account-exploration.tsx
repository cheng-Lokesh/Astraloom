"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { FormalRunStarter } from "@/components/formal-sandbox/run-starter";
import type { SandboxOverview } from "@/lib/sandbox-overview/overview.server";

type Mode = "people" | "agents" | "graph";
type View = {
  people: Array<{ label: string; relationship: string; kind: "user_core" | "user_variant" | "npc" }>;
  agents: Array<{ label: string; kind: "user_core" | "user_variant" | "npc"; confidence: string; missing: string }>;
  graph: { locked: boolean; edges: Array<{ from: string; to: string; relationship: string; confidence: string; strength: string; pressure: string; gap: string }> };
};

const kindLabel = { user_core: "本人", user_variant: "平行自我", npc: "NPC" };

export function AccountExploration({ mode, view, runningHref = null, runStarter = null }: { mode: Mode; view: View; runningHref?: string | null; runStarter?: React.ReactNode }) {
  const title = mode === "people" ? "当前链人物" : mode === "agents" ? "不可变 Agent 快照" : "Locked relationship ledger";
  return <section id="main-content" className="mx-auto max-w-6xl py-8 sm:py-14">
    <header className="border-b border-white/10 pb-7"><p className="font-mono text-[11px] uppercase tracking-[.16em] text-[var(--evidence-gold)]">My Sandbox / Account view</p><h1 className="mt-3 text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl">{title}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">只读取当前正式链的安全摘要。原始证据、内部标识和情境正文不进入此浏览视图。</p></header>
    {mode === "people" ? <div className="mt-7 space-y-3">{view.people.length ? view.people.map((person) => <article key={`${person.label}-${person.kind}`} className="border border-white/10 p-4"><p className="text-lg font-semibold text-[var(--text-primary)]">{person.label}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{kindLabel[person.kind]}，{person.relationship}</p></article>) : <Empty label="当前链尚无已确认人物" />}</div> : null}
    {mode === "agents" ? <div className="mt-7 grid gap-4 md:grid-cols-2">{view.agents.length ? view.agents.map((agent) => <article key={`${agent.label}-${agent.kind}`} className="border border-white/10 p-4"><p className="text-lg font-semibold text-[var(--text-primary)]">{agent.label}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{kindLabel[agent.kind]}</p><dl className="mt-4 grid gap-2 text-sm"><div><dt className="text-[var(--text-muted)]">置信</dt><dd>{agent.confidence}</dd></div><div><dt className="text-[var(--text-muted)]">缺失字段</dt><dd>{agent.missing}</dd></div></dl></article>) : <Empty label="当前链尚无不可变 Agent 快照" />}</div> : null}
    {mode === "graph" ? <div className="mt-7"><p className="text-sm text-[var(--text-secondary)]">{view.graph.locked ? "当前 Graph 已锁定，只读。" : "当前 Graph 尚未锁定，浏览模式不提供权重编辑。"}</p>{view.graph.edges.length ? <div className="mt-5 grid gap-4 md:grid-cols-2">{view.graph.edges.map((edge) => <article key={`${edge.from}-${edge.to}-${edge.relationship}`} className="border border-white/10 p-4"><h2 className="text-lg font-semibold text-[var(--text-primary)]">{edge.from} → {edge.to}</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">{edge.relationship}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-[var(--text-muted)]">置信</dt><dd>{edge.confidence}</dd></div><div><dt className="text-[var(--text-muted)]">强弱范围</dt><dd>{edge.strength}</dd></div><div><dt className="text-[var(--text-muted)]">压力</dt><dd>{edge.pressure}</dd></div><div><dt className="text-[var(--text-muted)]">信息缺口</dt><dd>{edge.gap}</dd></div></dl></article>)}</div> : <Empty label="当前锁定链尚无可展示关系" />}</div> : null}
    {runStarter ? <div className="mt-8 border-t border-white/15 pt-6">{runStarter}</div> : null}
    <footer className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6"><Link href="/app/new/intake" className="min-h-10 rounded border border-white/15 px-4 py-3 text-sm font-semibold active:scale-95">Start 中确认或补充</Link>{runningHref ? <Link href={runningHref} className="min-h-10 rounded border border-white/15 px-4 py-3 text-sm font-semibold active:scale-95">打开当前 Run</Link> : <span className="min-h-10 px-4 py-3 text-sm text-[var(--text-muted)]">No current Run</span>}</footer>
  </section>;
}

function Empty({ label }: { label: string }) { return <p className="mt-7 border border-dashed border-white/15 p-5 text-sm text-[var(--text-secondary)]">{label}</p>; }

export function AccountExplorationPage({ mode }: { mode: Mode }) {
  const [overview, setOverview] = useState<SandboxOverview | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { void fetch("/api/sandbox-overview", { cache: "no-store" }).then(async response => { const body = await response.json().catch(() => null); if (!response.ok || !body?.ok || !body?.overview) throw new Error("unavailable"); setOverview(body.overview); }).catch(() => setFailed(true)); }, []);
  if (failed) return <AppShell><section className="mx-auto max-w-6xl py-12"><p role="alert">无法读取当前账户链，未显示旧缓存或推断数据。</p></section></AppShell>;
  if (!overview) return <AppShell><section className="mx-auto max-w-6xl py-12"><p role="status">正在读取当前账户链</p></section></AppShell>;
  const labels = new Map(overview.people.items.map(person => [person.key, person.label]));
  const view: View = {
    people: overview.people.items,
    agents: overview.people.items.map(person => ({ label: person.label, kind: person.kind, confidence: "当前投影未建模", missing: "当前投影未建模" })),
    graph: { locked: overview.graph.locked, edges: overview.relations.items.map(edge => ({ from: labels.get(edge.fromPersonKey) ?? "当前参与者", to: labels.get(edge.toPersonKey) ?? "当前参与者", relationship: edge.label, confidence: "当前投影未建模", strength: "当前投影未建模", pressure: "当前投影未建模", gap: "当前投影未建模" })) },
  };
  return <AppShell><AccountExploration mode={mode} view={view} runningHref={overview.running.href} runStarter={mode === "graph" && overview.graph.locked ? <FormalRunStarter /> : null} /></AppShell>;
}
