"use client";

import { useState } from "react";
import Link from "next/link";
import { ObservatoryShell } from "@/components/astraloom/ObservatoryShell";

type OutcomeLabel = "hit" | "partial_hit" | "miss" | "user_changed_path" | "external_shock";
const pendingClaims = [
  { claimId: "claim_01", claimText: "中段观察窗口内，上级控制行为在多数样本分支中增强。", timeWindowText: "Tick 2 观察窗口", evidenceRefs: ["evt_101", "edge_delta_01"] },
  { claimId: "claim_02", claimText: "若未提前建立资源缓冲，亲密关系可能在后段成为主要约束。", timeWindowText: "Tick 3 观察窗口", evidenceRefs: ["reality_02"] },
];
const labels: { id: OutcomeLabel; label: string }[] = [{ id: "hit", label: "基本发生" }, { id: "partial_hit", label: "部分发生" }, { id: "miss", label: "未发生" }, { id: "user_changed_path", label: "我改变了路径" }, { id: "external_shock", label: "出现外部冲击" }];

export default function CalibrationPage() {
  const [reviews, setReviews] = useState<Record<string, { label?: OutcomeLabel; notes: string }>>({ claim_01: { notes: "" }, claim_02: { notes: "" } });
  const [submitted, setSubmitted] = useState(false);
  function update(id: string, patch: Partial<{ label: OutcomeLabel; notes: string }>) { setReviews((current) => ({ ...current, [id]: { ...current[id], ...patch } })); }
  return <ObservatoryShell title="现实校准 (Calibration)"><div className="mx-auto max-w-3xl space-y-6"><div><Link href="/" className="text-xs text-slate-400 hover:text-slate-200">← 控制台</Link><p className="mt-5 font-mono text-[11px] uppercase tracking-widest text-amber-400">Outcome evidence, not rewritten history</p><h1 className="mt-2 text-2xl font-bold">用现实结果校准下一次沙盘</h1><p className="mt-2 text-sm leading-relaxed text-slate-400">反馈会作为新的现实观察记录，只影响后续置信度与策略偏好，不修改历史事件、Claim 或关系边。</p></div>{submitted ? <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/20 p-6"><h2 className="font-semibold text-emerald-300">校准记录已保存在本次界面会话</h2><p className="mt-2 text-sm text-slate-400">这是前端演示状态，正式账户数据仍由 `/app` 服务器链路负责持久化。</p></div> : <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }} className="space-y-4">{pendingClaims.map((claim) => <fieldset key={claim.claimId} className="space-y-4 rounded-2xl border border-observatory-subtle bg-observatory-surface p-5"><legend className="sr-only">校准 {claim.claimId}</legend><div><p className="font-mono text-[10px] text-slate-500">{claim.timeWindowText} · 证据 {claim.evidenceRefs.join(", ")}</p><h2 className="mt-2 text-sm font-semibold leading-relaxed text-slate-100">{claim.claimText}</h2></div><div className="flex flex-wrap gap-2">{labels.map((item) => <button key={item.id} type="button" onClick={() => update(claim.claimId, { label: item.id })} className={`min-h-10 rounded-lg border px-3 text-xs active:scale-95 ${reviews[claim.claimId]?.label === item.id ? "border-amber-500 bg-amber-950/30 text-amber-300" : "border-slate-800 bg-slate-900 text-slate-400"}`}>{item.label}</button>)}</div><label className="block space-y-2 text-xs text-slate-300"><span>补充你确认的现实事实，可留空</span><textarea rows={3} value={reviews[claim.claimId]?.notes ?? ""} onChange={(event) => update(claim.claimId, { notes: event.target.value })} className="observatory-input resize-y" placeholder="避免填写不必要的身份信息，只记录与结果判断直接相关的事实。" /></label></fieldset>)}<button type="submit" disabled={pendingClaims.some((claim) => !reviews[claim.claimId]?.label)} className="min-h-11 w-full rounded-lg bg-amber-500 text-sm font-semibold text-slate-950 active:scale-[0.99] disabled:opacity-40">提交现实校准</button></form>}</div></ObservatoryShell>;
}
