"use client";

import { useId } from "react";
import type { SafeDefaultPlanning } from "@/lib/formal-planning/projection";

const resourceStatus = {
  active: "预算已生效，仅用于受控模拟",
  explicit_rule: "未启用默认预算：保留你明确配置的行动规则",
  explicit_rate: "未启用默认预算：保留背景资料中明确的每周期投入量",
  no_budget_headroom: "未启用默认预算：可用投入空间不足，无法生成有效默认候选",
} as const;
const quantity = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 6 });

export function FrozenDefaultPlanningResult({ planning }: { planning?: SafeDefaultPlanning }) {
  const id = useId();
  const hypothesis = planning?.frozenHypothesis;
  return <section aria-labelledby={`${id}-title`} data-frozen-planning className="min-w-0 rounded-xl border border-white/10 p-4 sm:p-5">
    <h2 id={`${id}-title`} className="text-lg font-semibold">本次冻结的默认规划</h2>
    <p className="mt-2 max-w-prose text-sm leading-6 text-[var(--text-secondary)]">这里只读取本次运行事前冻结的授权与预算，不用当前资料改写历史。预算是模拟用量，不会支付真钱，也不是现实行动建议。</p>
    {!planning || planning.status === "not_recorded" ? <p className="mt-3 text-sm">旧运行未记录默认规划；不会补写预算或初始假设。</p> : <>
      <p className="mt-3 text-sm">{planning.status === "active" ? "本次存在已授权的默认资源规划。" : "本次默认资源规划未生效。"} 整次模拟预算上限按每条路径、每个样本分别累计；不是每周期都重新发放。</p>
      {planning.frozenAt ? <p className="mt-1 text-xs text-[var(--text-secondary)]">冻结于 {new Date(planning.frozenAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}（北京时间）</p> : null}
      {planning.resources.length ? <ul className="mt-4 space-y-3">{planning.resources.map(resource => <li key={resource.key} className="min-w-0 rounded-lg bg-white/5 p-3">
        <h3 className="break-words font-medium">{resource.label}</h3>
        <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-[var(--text-secondary)]">整次模拟预算上限</dt><dd>{quantity.format(resource.totalBudgetLimit)} {resource.unit}</dd></div>
          <div><dt className="text-[var(--text-secondary)]">中性候选用量 / 周期</dt><dd>{quantity.format(resource.neutralAmount)} {resource.unit}</dd></div>
          <div><dt className="text-[var(--text-secondary)]">事前可用量</dt><dd>{quantity.format(resource.initialAvailable)} {resource.unit}</dd></div>
          <div><dt className="text-[var(--text-secondary)]">最低保留量</dt><dd>{quantity.format(resource.minimum)} {resource.unit}</dd></div>
        </dl><p className="mt-2 text-sm">{resourceStatus[resource.status]}</p>
      </li>)}</ul> : <p className="mt-3 text-sm">本次未授权任何默认资源预算。</p>}
      <div className="mt-4 border-t border-white/10 pt-4">
        <h3 className="font-medium">独立的初始倾向假设（Hypothesis）</h3>
        <p className="mt-2 text-sm leading-6">{hypothesis?.status === "active" ? "本次已单独授权此假设。" : hypothesis?.status === "unavailable" ? "本次象征来源不可用，初始假设未生效。" : "本次初始假设关闭。"} 两项产品假设各最多减少 5%，合计上限 10%，仅影响首轮候选用量；不改写手写规则或世界初值。</p>
        {hypothesis ? <p className="mt-2 break-words text-xs text-[var(--text-secondary)]">版本：{hypothesis.version}。本次两项减少量 {quantity.format(hypothesis.cautionReduction * 100)}% + {quantity.format(hypothesis.rhythmReduction * 100)}%，合计 {quantity.format(hypothesis.reduction * 100)}%。</p> : null}
        <p className="mt-2 text-sm leading-6">这不是预测概率、科学权重或现实证据；关系影响尚未实现。</p>
      </div>
      <div className="mt-4 border-t border-white/10 pt-4"><h3 className="font-medium">候选与实际受控事件对照</h3>
        {planning.trace.length ? <ol className="mt-3 space-y-3">{planning.trace.map(trace => <li key={trace.key} className="min-w-0 rounded-lg bg-white/5 p-3 text-sm leading-6">
          <p className="break-words font-medium">{trace.pathKey === "main" ? "主路径" : `人物路径 ${trace.pathKey.slice(7)}`} · 周期 {trace.tickNumber} · {trace.resourceLabel}</p>
          <p>{trace.tickNumber === 1 ? "首轮候选用量" : "本周期候选用量"}：中性 {quantity.format(trace.neutralAmount)} → 候选 {quantity.format(trace.proposedAmount)} {trace.unit}{trace.priorApplied ? `（初始假设减少 ${quantity.format(trace.reduction * 100)}%）` : "（未应用初始假设）"}</p>
          <p>{trace.status === "selected" ? `已被模拟选中，实际受控事件投入 ${trace.actualAmount === null ? "未记录" : `${quantity.format(trace.actualAmount)} ${trace.unit}`}` : "未被模拟选中；没有对应的实际投入事件。"}</p>
          <p>所用条件假设：{trace.assumptionCategories.map(category => category === "formal_symbolic_initial_planning_v1" ? "独立初始倾向产品假设" : "本人确认的整次资源预算假设").join("、")}</p>
          <p className="text-[var(--text-secondary)]">{trace.evidenceSummary}</p>
        </li>)}</ol> : <p className="mt-2 text-sm">本次没有默认规划候选事件记录；不会据此推断实际投入。</p>}
      </div>
    </>}
  </section>;
}
