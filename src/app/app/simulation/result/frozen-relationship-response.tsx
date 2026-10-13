"use client";

import { useId } from "react";
import type { SafeRelationshipResponse } from "@/lib/formal-planning/relationship-contracts";

const quantity = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 6 });
const directions = { negative: "消极模拟回应", neutral: "中性模拟回应", positive: "积极模拟回应" } as const;
const inactive = { explicit_rule: "回应调整未生效：保留你明确配置的行动规则。", explicit_rate: "回应调整未生效：保留背景资料中明确的每周期投入量。", no_budget_headroom: "回应调整未生效：可用投入空间不足。" } as const;

export function FrozenRelationshipResponseResult({ response }: { response?: SafeRelationshipResponse }) {
  const id = useId();
  if (!response) return null;
  return <section aria-labelledby={`${id}-title`} data-frozen-relationship-response className="mt-4 min-w-0 border-t border-white/10 pt-4">
    <h3 id={`${id}-title`} className="font-medium">模拟回应 → 我的后续投入</h3>
    <p className="mt-2 max-w-prose break-words text-sm leading-6">本次冻结组合：{response.selfLabel} → {response.npcLabel} · {response.relationLabel} · {directions[response.signal]}；本人资源：{response.resourceLabel}。</p>
    <p className="mt-2 max-w-prose text-sm leading-6 text-[var(--text-secondary)]">模拟回应不是对方真实态度；后续投入也是模拟事件，不是现实行动建议。这里只读事前冻结的条件假设（Hypothesis），不使用当前资料补写历史。</p>
    {response.status !== "active" ? <p className="mt-2 text-sm leading-6">{inactive[response.status]}原有明确规则与投入不受替代。</p> : <p className="mt-2 text-sm leading-6">消极回应事件后，后续投入候选按独立授权减少 5%，可选象征假设最多额外减少 5%；只到首次被选中为止。积极或中性回应不减少，不与初始倾向叠加。</p>}
    {response.samples.length ? <ol className="mt-3 divide-y divide-white/10">{response.samples.map((sample, index) => <li key={sample.key} className="min-w-0 py-3 text-sm leading-6">
      <h4 className="font-medium">样本 {index + 1} · {response.selfLabel}</h4>
      {sample.responseTickNumber !== null ? <p>第 {sample.responseTickNumber} 周期记录受控模拟回应。</p> : null}
      {sample.proposedAmount !== null ? <p>后续投入：中性 {quantity.format(sample.neutralAmount)} → 候选 {quantity.format(sample.proposedAmount)} {response.unit}{sample.appliedReduction !== null ? `（减少 ${quantity.format(sample.appliedReduction * 100)}%）` : ""}</p> : null}
      {sample.status === "selected" ? <p>第 {sample.allocationTickNumber} 周期已被选中，实际受控投入 {sample.actualAmount === null ? "未记录" : `${quantity.format(sample.actualAmount)} ${response.unit}`}。</p>
        : sample.status === "not_selected" ? <p>候选未被选中；没有对应的回应调整投入事件。</p>
          : sample.status === "not_triggered" ? <p>关系调整未触发；本样本的中性投入仍见默认规划事件对照。</p>
            : <p>回应调整未生效；请查看原有明确规则或投入记录，不补写实际用量。</p>}
      {sample.assumptionCategories.length ? <p className="text-[var(--text-secondary)]">所用条件假设：{sample.assumptionCategories.map(category => category === "formal_relationship_response_v1" ? "独立回应后的投入产品假设" : "本人确认的整次资源预算假设").join("、")}</p> : null}
    </li>)}</ol> : <p className="mt-2 text-sm leading-6">本次没有关系调整样本记录；不据此推断中性或明确规则的投入。</p>}
    <details className="mt-2 text-sm leading-6"><summary className="min-h-11 cursor-pointer py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)]">查看冻结假设与上限</summary>
      <p className="max-w-prose break-words text-[var(--text-secondary)]">版本：{response.version}。消极回应产品假设 5%，象征关系敏感假设{response.symbolicStatus === "active" ? `已独立授权，附加 ${quantity.format(response.symbolicAdditionalReduction * 100)}%` : "关闭，附加 0%"}；合计上限 10%。这不是预测概率、科学权重或现实证据。预算与最低保留量仍受本次原有受控规则约束。</p>
    </details>
  </section>;
}
