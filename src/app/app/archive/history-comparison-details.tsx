"use client";

import { useId, useState } from "react";
import { buildHistoryComparisonModel, type ComparisonCategory, type ComparisonSide } from "./history-comparison-model";
import type { FormalSandboxResultProjection as Projection } from "@/lib/formal-sandbox/client";

export const comparisonStatusLabels = { same: "相同内容", different: "差异", not_recorded: "一侧未记录", order_only: "仅顺序不同" };
function statusLabel(category: ComparisonCategory) {
  return category.status === "not_recorded" && !category.left.recorded && !category.right.recorded ? "两侧均未记录" : comparisonStatusLabels[category.status];
}
function OriginalValues({ side, name, category }: { side: ComparisonSide; name: string; category: string }) {
  return <section aria-label={`${category} · ${name}原值`} className="min-w-0">
    <h4 className="text-base font-semibold text-[var(--text-primary)]">{name}</h4>
    {!side.recorded ? <p className="mt-3 leading-7">{side.note}</p> : side.entries.length === 0 ? <p className="mt-3 leading-7">已记录此类快照，没有单独条目。</p> : null}
    {side.entries.length > 0 ? <ol className="mt-3 divide-y divide-white/10">{side.entries.map((item, index) => <li key={index} className="py-3"><p className="font-semibold text-[var(--text-primary)]">{item.title}</p>{item.lines.map((line, lineIndex) => <p key={lineIndex} className="mt-1 whitespace-pre-wrap break-words leading-7">{line}</p>)}</li>)}</ol> : null}
  </section>;
}
export function HistoryComparisonDetails({ left, right }: { left: Projection; right: Projection }) {
  const id = useId();
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const categories = buildHistoryComparisonModel(left, right);
  const shown = onlyDifferences ? categories.filter(item => item.status !== "same") : categories;
  return <section aria-label="分类差异摘要" className="mt-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-semibold text-[var(--text-primary)]">分类差异摘要</h3><label className="inline-flex min-h-11 cursor-pointer items-center gap-3 px-2 text-sm"><input className="h-5 w-5 accent-[var(--evidence-gold)]" type="checkbox" checked={onlyDifferences} onChange={event => setOnlyDifferences(event.target.checked)} />仅查看差异与未记录项</label></div>
    <p className="mt-2 max-w-[75ch] text-sm leading-7 text-[var(--text-secondary)]">比较的是完整记录内容；相同内容不表示相同现实实体。条目只改变排列时单独标记，重名条目逐项保留。</p>
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]" aria-label="分类计数">{Object.entries(comparisonStatusLabels).map(([status, label]) => <li key={status}>{label}：{categories.filter(item => item.status === status && (status !== "not_recorded" || item.left.recorded !== item.right.recorded)).length}</li>)}<li>两侧均未记录：{categories.filter(item => !item.left.recorded && !item.right.recorded).length}</li></ul>
    <nav className="mt-4 flex flex-wrap gap-2" aria-label="定位分类原值">{shown.map(category => <a key={category.id} href={`#${id}-${category.id}`} className="inline-flex min-h-11 items-center rounded border border-white/15 px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)]">{category.label} · {statusLabel(category)}</a>)}</nav>
    <div className="mt-5 divide-y divide-white/15">{shown.map(category => <details key={category.id} id={`${id}-${category.id}`} className="scroll-mt-6 py-4"><summary className="min-h-11 cursor-pointer rounded py-2 text-base text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)]"><span className="font-semibold">{category.label}</span><span className="ml-3 text-sm text-[var(--evidence-gold)]">{statusLabel(category)}</span><span className="ml-3 text-sm">查看左右原值</span></summary><p className="mb-4 mt-2 max-w-[75ch] text-sm leading-7 text-[var(--text-secondary)]">{category.boundary}</p><div className="grid min-w-0 gap-6 text-sm text-[var(--text-secondary)] lg:grid-cols-2"><OriginalValues side={category.left} name="左侧 Run" category={category.label} /><OriginalValues side={category.right} name="右侧 Run" category={category.label} /></div></details>)}</div>
    {shown.length === 0 ? <p role="status" className="mt-4 text-sm text-[var(--text-secondary)]">所有已记录分类内容相同，可取消筛选查看原值。</p> : null}
  </section>;
}
