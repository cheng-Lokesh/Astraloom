"use client";

import { useState } from "react";
import Link from "next/link";
import { ConfidenceIndicator } from "@/components/astraloom/ConfidenceIndicator";
import { ObservatoryShell } from "@/components/astraloom/ObservatoryShell";

const archives = [
  { id: "career-90", title: "90 天职业十字路口：留任与新机会", track: "Track A", horizon: "90 天", scenario: "职场博弈 / 组织权力", createdAt: "2026-09-08 21:00", confidence: 78, risk: "L2", calibrated: false, claims: 2, agents: 5 },
  { id: "intimacy-30", title: "30 天边界重塑与沟通循环", track: "Track A", horizon: "30 天", scenario: "亲密关系 / 回避循环", createdAt: "2026-08-15 14:30", confidence: 86, risk: "L1", calibrated: true, claims: 3, agents: 4 },
  { id: "climate-3y", title: "3 年职业身份重构与资源承压气候", track: "Track B", horizon: "3 年", scenario: "人生阶段气候", createdAt: "2026-07-01 10:15", confidence: 65, risk: "L2", calibrated: true, claims: 4, agents: 7 },
];

export default function HistoryPage() {
  const [filter, setFilter] = useState<"all" | "Track A" | "Track B">("all");
  const visible = archives.filter((item) => filter === "all" || item.track === filter);
  return <ObservatoryShell title="沙盘归档 (History)"><div className="space-y-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="font-mono text-[11px] uppercase tracking-widest text-amber-400">Immutable run ledger</p><h1 className="mt-2 text-2xl font-bold">历史沙盘归档</h1><p className="mt-2 text-sm text-slate-400">保留当时冻结的假设、人物、关系、事件与 Claim，不用后续校准改写历史。</p></div><div className="flex gap-2">{(["all", "Track A", "Track B"] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-10 rounded-lg border px-3 text-xs active:scale-95 ${filter === value ? "border-amber-500 bg-amber-950/30 text-amber-300" : "border-slate-800 text-slate-400"}`}>{value === "all" ? "全部" : value}</button>)}</div></div><div className="space-y-3">{visible.map((item) => <article key={item.id} className="rounded-2xl border border-observatory-subtle bg-observatory-surface p-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><div className="flex flex-wrap gap-2 font-mono text-[10px] text-slate-400"><span>{item.track} · {item.horizon}</span><span className="rounded border border-slate-700 px-1.5 py-0.5">风险 {item.risk}</span>{item.calibrated && <span className="rounded border border-emerald-800/60 px-1.5 py-0.5 text-emerald-300">已校准</span>}</div><h2 className="mt-2 text-base font-semibold">{item.title}</h2><p className="mt-1 text-xs text-slate-500">{item.scenario} · {item.agents} 位智能体 · {item.claims} 条 Claim · {item.createdAt}</p></div><div className="flex items-center gap-3"><ConfidenceIndicator score={item.confidence} compact /><Link href="/simulation/result" className="min-h-10 rounded-lg border border-slate-700 bg-slate-800 px-3 py-3 text-xs text-slate-200 active:scale-95">打开沙盘 →</Link></div></div></article>)}</div></div></ObservatoryShell>;
}
