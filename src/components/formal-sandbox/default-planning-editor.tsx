"use client";

import { useId } from "react";
import Link from "next/link";
import { defaultPlanningRequestSchema, type DefaultPlanningContext, type DefaultPlanningRequest } from "@/lib/formal-planning/contracts";

export type DefaultPlanningDraft = {
  resources: Record<string, { enabled: boolean; budget: string; confirmed: boolean }>;
  fusionEnabled: boolean;
  fusionConfirmed: boolean;
};
export function emptyPlanningDraft(): DefaultPlanningDraft {
  return { resources: {}, fusionEnabled: false, fusionConfirmed: false };
}
export function buildPlanningRequest(context: DefaultPlanningContext, draft: DefaultPlanningDraft): DefaultPlanningRequest | null {
  if (draft.fusionEnabled && (context.symbolicFusion.status !== "eligible" || !draft.fusionConfirmed)) return null;
  const selected = Object.entries(draft.resources).filter(([, item]) => item.enabled);
  if (selected.some(([key, item]) => !context.resources.some(resource => resource.resourceKey === key) || !item.confirmed || item.budget.trim() === "")) return null;
  const parsed = defaultPlanningRequestSchema.safeParse({ version: context.version, consentContext: context.consentContext,
    resources: selected.map(([resourceKey, item]) => ({ resourceKey, totalBudgetLimit: Number(item.budget), confirmedForSimulation: true })),
    fusion: draft.fusionEnabled ? { enabled: true, confirmedForSimulation: true } : { enabled: false, confirmedForSimulation: false },
  });
  return parsed.success ? parsed.data : null;
}

export function DefaultPlanningEditor({ context, draft, onChange, disabled, explicitRuleResourceKeys = [] }: {
  context: DefaultPlanningContext; draft: DefaultPlanningDraft; onChange: (draft: DefaultPlanningDraft) => void; disabled: boolean; explicitRuleResourceKeys?: string[];
}) {
  const id = useId();
  function updateResource(key: string, patch: Partial<DefaultPlanningDraft["resources"][string]>) {
    const current = draft.resources[key] ?? { enabled: false, budget: "", confirmed: false };
    onChange({ ...draft, resources: { ...draft.resources, [key]: { ...current, ...patch } } });
  }
  return <section className="min-w-0 border-t border-white/15 pt-5" aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`} className="text-lg font-semibold">可选：本次默认资源规划</h3>
    <p className="mt-2 max-w-prose text-sm leading-6 text-[var(--text-secondary)]">默认全部关闭，可以不授权任何资源。只有你明确确认的整次模拟预算才会生成中性候选；不支付真钱，不代表现实建议或承诺。</p>
    <p className="mt-2 text-sm leading-6">预算按每条路径、每个样本分别累计，并受可用量与最低保留量约束；不会每周期重新发放，也不会覆盖明确的行动规则或投入量。</p>
    {!context.resources.length ? <p className="mt-3 text-sm">当前没有可授权的资源。你仍可配置明确的条件行动。</p> : null}
    {context.resources.map((resource, index) => {
      const value = draft.resources[resource.resourceKey] ?? { enabled: false, budget: "", confirmed: false };
      const explicit = resource.explicitRulePresent || explicitRuleResourceKeys.includes(resource.resourceKey);
      const conflict = explicit ? "此资源已有明确行动规则；默认规划不覆盖该规则。" : resource.declaredRate !== null ? `此资源已有明确每周期投入量 ${resource.declaredRate} ${resource.unit}；默认规划不覆盖该投入量。` : resource.available <= resource.minimum ? "可用量未超过最低保留量，当前没有默认投入空间。" : null;
      return <div key={resource.resourceKey} className="mt-4 min-w-0 rounded-lg border border-white/10 p-3 sm:p-4">
        <label htmlFor={`${id}-resource-${index}`} className="flex min-h-11 items-start gap-3 py-2 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--evidence-gold)]"><input id={`${id}-resource-${index}`} type="checkbox" className="mt-1" checked={value.enabled} disabled={disabled || Boolean(conflict && !value.enabled)} onChange={event => updateResource(resource.resourceKey, { enabled: event.target.checked, confirmed: false })} /><span className="min-w-0 break-words">授权默认规划 · {resource.label}</span></label>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">单位：{resource.unit} · 可用量 {resource.available} · 最低保留量 {resource.minimum}</p>
        {conflict ? <p className="mt-2 text-sm leading-6">{conflict}{value.enabled ? " 已选预算会冻结为未生效，不改变原规则。" : ""}</p> : null}
        {value.enabled ? <>
          <label className="mt-3 block text-sm" htmlFor={`${id}-budget-${index}`}>整次模拟预算上限 · {resource.label}（{resource.unit}）<input id={`${id}-budget-${index}`} type="number" min="0.000001" max="1000000" step="any" inputMode="decimal" value={value.budget} disabled={disabled} onChange={event => updateResource(resource.resourceKey, { budget: event.target.value, confirmed: false })} className="mt-2 block min-h-11 w-full max-w-sm rounded-md border border-white/20 bg-[var(--bg-base)] px-3 text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)]" /></label>
          <label className="mt-3 flex min-h-11 items-start gap-3 py-2 text-sm leading-6 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--evidence-gold)]"><input type="checkbox" className="mt-1" checked={value.confirmed} disabled={disabled || !value.budget.trim() || !Number.isFinite(Number(value.budget)) || Number(value.budget) <= 0} onChange={event => updateResource(resource.resourceKey, { confirmed: event.target.checked })} /><span>我确认 {resource.label} 的上述预算仅用于本次整次模拟</span></label>
        </> : null}
      </div>;
    })}
    <div className="mt-5 border-t border-white/10 pt-4">
      <h4 className="font-medium">独立授权：初始倾向假设（Hypothesis）</h4>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">与资源预算分开，默认关闭。版本 symbolic-initial-planning-hypothesis-v1：两项产品假设各最多减少 5%，合计上限 10%，仅减少首轮中性候选用量；不改写手写规则、明确投入量或现实 / 世界初值。</p>
      <p className="mt-2 text-sm leading-6">不是预测概率、传统或科学权重、现实证据；关系影响尚未实现。</p>
      <label className="mt-3 flex min-h-11 items-start gap-3 py-2 text-sm leading-6 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--evidence-gold)]"><input type="checkbox" className="mt-1" checked={draft.fusionEnabled} disabled={disabled || context.symbolicFusion.status !== "eligible"} onChange={event => onChange({ ...draft, fusionEnabled: event.target.checked, fusionConfirmed: false })} /><span>启用本次独立初始倾向假设</span></label>
      {context.symbolicFusion.status !== "eligible" ? <p className="mt-2 text-sm leading-6">{context.symbolicFusion.status === "off" ? "尚未授权未来运行附加象征对照，此开关不可启用。" : "当前象征来源不可用、已撤回或已过期，此开关不可启用。"} 请先检查 <Link href="/app/symbolic-lens" className="underline underline-offset-4">象征对照设置</Link>，然后重新读取模型并确认预算。</p> : null}
      {draft.fusionEnabled ? <label className="mt-3 flex min-h-11 items-start gap-3 py-2 text-sm leading-6 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--evidence-gold)]"><input type="checkbox" className="mt-1" checked={draft.fusionConfirmed} disabled={disabled} onChange={event => onChange({ ...draft, fusionConfirmed: event.target.checked })} /><span>我单独确认本次仅将上述产品假设用于首轮候选用量</span></label> : null}
    </div>
  </section>;
}
