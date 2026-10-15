"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui-foundation";
import { applyModelReconciliation } from "@/lib/digital-life/model-reconciliation";
import { actionLabel } from "./digital-life-rules-editor";
import { modelRuleControls } from "./complete-model-action-fields";
import { previewDraftRemoval } from "./model-rule-draft-operations";

export type ReconciliationPlan = Omit<Parameters<typeof applyModelReconciliation>[0], "resolutions">;
type Resolutions = Parameters<typeof applyModelReconciliation>[0]["resolutions"];
type Applied = Extract<ReturnType<typeof applyModelReconciliation>, { ok: true }>;

export function ModelReconciliationPanel({ plan, disabled, onApply, onCancel }: { plan: ReconciliationPlan; disabled: boolean; onApply: (result: Applied) => void; onCancel: () => void }) {
  const id = useId();
  const [resolutions, setResolutions] = useState<Resolutions>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [removal, setRemoval] = useState<string | null>(null);
  const rules = plan.reconciliation.sourceRules;
  const current = plan.preparedSourceContext.modelContext;
  const result = applyModelReconciliation({ ...plan, resolutions });
  const field = (key: string, resolution: Resolutions[string] | undefined) => setResolutions(previous => {
    const next = { ...previous }; if (resolution) next[key] = resolution; else delete next[key]; return next;
  });
  const removed = new Set(Object.entries(resolutions).filter(([, resolution]) => resolution.kind === "remove").map(([key]) => key));
  const remainingActions = rules.actions.filter(action => !removed.has(action.key));
  const effectiveRules = { ...rules, actions: remainingActions, strategies: rules.strategies.filter(strategy => remainingActions.some(action => action.pathKey === strategy.participantKey && action.actorKey === strategy.participantKey)) };
  const preview = removal ? previewDraftRemoval(effectiveRules, { kind: "action", key: removal }) : null;
  return <section role="region" aria-labelledby={`${id}-title`} className="min-w-0 space-y-5 border-t border-white/15 pt-5">
    <h3 id={`${id}-title`} className="text-lg font-semibold">核对当前资料并延续模型</h3>
    <p className="max-w-prose text-sm leading-6">现实资料已更新。原模型保留只读，请为每条资源和环境规则主动选择当前资料中的项目；同名项目也不会自动对应。未受影响的文字、依赖与独立策略将保留，全部运行授权重新确认。</p>
    <p className="max-w-prose text-sm leading-6">旧承诺的背景关联不能自动延续。解除关联只保留你写下的承诺文字，不猜测原背景内容。应用核对结果不会保存或开始运行。</p>
    <fieldset disabled={disabled} className="min-w-0 space-y-5"><legend className="sr-only">逐条核对模型规则</legend>
      {rules.actions.map((action, index) => {
        const requirement = plan.reconciliation.requirements.find(item => item.ruleKey === action.key);
        const resolution = resolutions[action.key];
        if (removed.has(action.key)) return <p key={action.key} className="text-sm">行动 {index + 1} · {actionLabel(action.operation.actionType)} · 已列入移除；原已保存模型尚未更改。</p>;
        return <div key={action.key} className="min-w-0 space-y-3 border-b border-white/15 pb-5">
          <h4 className="break-words font-medium">行动 {index + 1} · {actionLabel(action.operation.actionType)} · {action.pathKey === "main" ? "本人主路径" : rules.strategies.find(strategy => strategy.participantKey === action.pathKey)?.label}</h4>
          {requirement?.previousLabel ? <p className="text-sm">旧项目：{requirement.previousLabel}</p> : null}
          {action.operation.actionType === "allocate_resource" && requirement?.kind === "resource" ? <>
            <p className="text-sm">原投入：{action.operation.amount}。请按当前可投入余额核对数量。</p>
            <label className="block">行动 {index + 1} 当前资源<select className={modelRuleControls} value={resolution?.kind === "resource" ? resolution.resourceKey : ""} onChange={event => field(action.key, { kind: "resource", resourceKey: event.target.value, amount: Number(amounts[action.key] ?? (action.operation.actionType === "allocate_resource" ? action.operation.amount : "")) })}><option value="">请主动选择当前资源</option>{current.resources.map(resource => <option key={resource.key} value={resource.key}>{resource.label} · 可投入 {resource.available - resource.minimum} {resource.unit}</option>)}</select></label>
            <label className="block">行动 {index + 1} 核对投入量<input className={modelRuleControls} type="number" min="0.001" step="any" value={amounts[action.key] ?? action.operation.amount} onChange={event => { const value = event.target.value; setAmounts(previous => ({ ...previous, [action.key]: value })); field(action.key, { kind: "resource", resourceKey: resolution?.kind === "resource" ? resolution.resourceKey : "", amount: value === "" ? NaN : Number(value) }); }} /></label>
          </> : null}
          {action.operation.actionType === "update_external_variable" && requirement?.kind === "variable" ? <>
            <p className="text-sm">原假设的新条件：{action.operation.value}。新条件须与当前项目的初始值不同。</p>
            <label className="block">行动 {index + 1} 当前环境条件<select className={modelRuleControls} value={resolution?.kind === "variable" ? resolution.variableKey : ""} onChange={event => field(action.key, { kind: "variable", variableKey: event.target.value, value: resolution?.kind === "variable" ? resolution.value : action.operation.actionType === "update_external_variable" ? action.operation.value : "" })}><option value="">请主动选择当前压力或外部变量</option>{current.variables.map(variable => <option key={variable.key} value={variable.key}>{variable.label} · 当前值：{variable.value}</option>)}</select></label>
            <label className="block">行动 {index + 1} 核对新条件<input className={modelRuleControls} maxLength={240} value={resolution?.kind === "variable" ? resolution.value : action.operation.value} onChange={event => field(action.key, { kind: "variable", variableKey: resolution?.kind === "variable" ? resolution.variableKey : "", value: event.target.value })} /></label>
          </> : null}
          {action.operation.actionType === "update_commitment" ? <p className="break-words text-sm">保留承诺：{action.operation.label}</p> : null}
          {requirement?.kind === "detach_profile_entry" ? <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5 shrink-0" checked={resolution?.kind === "detach_profile_entry"} onChange={event => field(action.key, event.target.checked ? { kind: "detach_profile_entry" } : undefined)} />解除行动 {index + 1} 的旧背景关联</label> : null}
          {!requirement ? <p className="text-sm text-[var(--text-secondary)]">规则文字和依赖保留；应用后仍需重新确认。</p> : null}
          <Button variant="ghostOnDark" className="!w-auto px-3 py-2" disabled={disabled} onClick={() => setRemoval(action.key)} aria-label={`核对时删除行动 ${index + 1} 并查看后继影响`}>删除此规则并查看影响</Button>
        </div>;
      })}
      {preview ? <section aria-label="核对规则删除影响" className="min-w-0 space-y-3 border border-white/20 p-4"><h4 className="font-medium">确认从新草稿移除</h4><p className="text-sm">以下规则及后继依赖会从待核对草稿移除，历史与原已保存模型保持原样。</p><ul className="space-y-2 text-sm">{preview.actionKeys.map(key => <li key={key}>行动 {rules.actions.findIndex(action => action.key === key) + 1} · {actionLabel(rules.actions.find(action => action.key === key)!.operation.actionType)}</li>)}{preview.strategyKeys.map(key => <li key={key}>策略：{rules.strategies.find(strategy => strategy.participantKey === key)?.label}</li>)}</ul><div className="flex flex-wrap gap-3"><Button variant="ghostOnDark" className="!w-auto px-3 py-2" disabled={disabled} onClick={() => setRemoval(null)}>取消此次移除</Button><Button variant="onDark" className="!w-auto px-3 py-2" disabled={disabled} onClick={() => { setResolutions(previous => ({ ...previous, ...Object.fromEntries(preview.actionKeys.map(key => [key, { kind: "remove" as const }])) })); setRemoval(null); }}>确认移除列出的规则</Button></div></section> : null}
      <p role="status" className="text-sm leading-6">{result.ok ? "所有项目已核对，可以应用到当前草稿。" : "请完成逐条选择与解除关联，并核对投入余额、新条件和依赖。空值或不适用的条件不能保存或运行。"}</p>
      <div className="flex flex-wrap gap-3"><Button variant="onDark" className="!w-auto px-4 py-3" disabled={disabled || !result.ok || Boolean(removal)} onClick={() => { if (result.ok) onApply(result); }}>应用核对结果到当前草稿</Button><Button variant="ghostOnDark" className="!w-auto px-4 py-3" disabled={disabled} onClick={onCancel}>取消本次核对</Button></div>
    </fieldset>
  </section>;
}
