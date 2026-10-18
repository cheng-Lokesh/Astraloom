"use client";

import { useState } from "react";
import { Button } from "@/components/ui-foundation";
import { applyModelReconciliation } from "@/lib/digital-life/model-reconciliation";
import type { DigitalLifeModelDraft, ModelReconciliation, PreparedModelDraftSource } from "@/lib/digital-life/model-draft";
import { modelRuleControls } from "./complete-model-action-fields";
import { actionLabel } from "./digital-life-rules-editor";
import { previewDraftRemoval } from "./model-rule-draft-operations";

type Plan = { draft: DigitalLifeModelDraft; reconciliation: Extract<ModelReconciliation, { version: "digital-life-model-reconciliation-v2" }>; preparedSourceContext: PreparedModelDraftSource };
type Resolution = { kind: "resource"; resourceKey: string; amount: number } | { kind: "resource"; resourceKey: string; operator: "lte" | "gte"; value: number } | { kind: "variable"; variableKey: string; value: string } | { kind: "detach_profile_entry" };
type Applied = Extract<ReturnType<typeof applyModelReconciliation>, { ok: true }>;

export function ModelGuardReconciliationPanel({ plan, disabled, onApply, onCancel }: { plan: Plan; disabled: boolean; onApply: (result: Applied) => void; onCancel: () => void }) {
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [removedRuleKeys, setRemovedRuleKeys] = useState<string[]>([]);
  const [removal, setRemoval] = useState<string | null>(null);
  const rules = plan.reconciliation.sourceRules;
  const context = plan.preparedSourceContext.modelContext;
  const remaining = rules.actions.filter(action => !removedRuleKeys.includes(action.key));
  const effective = { ...rules, actions: remaining, strategies: rules.strategies.filter(strategy => remaining.some(action => action.pathKey === strategy.participantKey && action.actorKey === strategy.participantKey)) };
  const preview = removal ? previewDraftRemoval(effective, { kind: "action", key: removal }) : null;
  const result = applyModelReconciliation({ ...plan, resolutions, removedRuleKeys });
  const field = (key: string, value: Resolution | undefined) => setResolutions(previous => { const next = { ...previous }; if (value) next[key] = value; else delete next[key]; return next; });
  return <section role="region" aria-label="核对当前资料并延续模型" className="min-w-0 space-y-5 border-t border-white/15 pt-5">
    <h3 className="text-lg font-semibold">核对当前资料并延续模型</h3>
    <p className="max-w-prose text-sm leading-6">行动本身使用的项目与附加条件使用的项目须分别主动选择，即使它们以前同名或位于同一位置。应用只调整当前草稿，保存并重新读取后仍须逐项确认。</p>
    <fieldset disabled={disabled} className="min-w-0 space-y-5"><legend className="sr-only">分别核对行动与条件</legend>
      {rules.actions.map((action, index) => <div key={action.key} className="min-w-0 space-y-3 border-b border-white/15 pb-5">
        <h4 className="font-medium">行动 {index + 1} · {actionLabel(action.operation.actionType)}</h4>
        {removedRuleKeys.includes(action.key) ? <p>已列入移除；原已保存模型尚未更改。</p> : <>
          {plan.reconciliation.requirements.filter(requirement => requirement.ruleKey === action.key).map(requirement => {
            const key = requirement.requirementKey;
            const value = resolutions[key];
            const guard = requirement.role === "guard";
            const label = `行动 ${index + 1} ${guard ? "附加条件" : "行动内容"}`;
            const originalNumber = guard && action.guard?.kind === "resource_balance" ? action.guard.value : !guard && action.operation.actionType === "allocate_resource" ? action.operation.amount : NaN;
            const numeric = value?.kind === "resource" ? "amount" in value ? value.amount : value.value : originalNumber;
            const variableValue = value?.kind === "variable" ? value.value : guard && action.guard?.kind === "environment_equals" ? action.guard.value : !guard && action.operation.actionType === "update_external_variable" ? action.operation.value : "";
            return <div key={key} className="min-w-0 space-y-3">
              <p className="text-sm font-medium">{guard ? "核对附加条件" : "核对行动内容"}{requirement.previousLabel ? ` · 旧项目：${requirement.previousLabel}` : ""}</p>
              {requirement.kind === "resource" ? <>
                <label className="block">{label}当前资源<select className={modelRuleControls} value={value?.kind === "resource" ? value.resourceKey : ""} onChange={event => field(key, guard ? { kind: "resource", resourceKey: event.target.value, operator: value?.kind === "resource" && "operator" in value ? value.operator : action.guard?.kind === "resource_balance" ? action.guard.operator : "lte", value: numeric } : { kind: "resource", resourceKey: event.target.value, amount: numeric })}><option value="">请主动选择当前资源</option>{context.resources.map(resource => <option key={resource.key} value={resource.key}>{resource.label} · 区间 {resource.minimum}–{resource.maximum} {resource.unit} · 可投入 {resource.available - resource.minimum}</option>)}</select></label>
                {guard ? <label className="block">{label}比较<select className={modelRuleControls} value={value?.kind === "resource" && "operator" in value ? value.operator : action.guard?.kind === "resource_balance" ? action.guard.operator : "lte"} onChange={event => field(key, { kind: "resource", resourceKey: value?.kind === "resource" ? value.resourceKey : "", operator: event.target.value as "lte" | "gte", value: numeric })}><option value="lte">余额小于或等于</option><option value="gte">余额大于或等于</option></select></label> : null}
                <label className="block">{label}{guard ? "核对阈值" : "核对投入量"}<input className={modelRuleControls} type="number" step="any" value={Number.isFinite(numeric) ? numeric : ""} onChange={event => { const number = event.target.value === "" ? NaN : Number(event.target.value); field(key, guard ? { kind: "resource", resourceKey: value?.kind === "resource" ? value.resourceKey : "", operator: value?.kind === "resource" && "operator" in value ? value.operator : action.guard?.kind === "resource_balance" ? action.guard.operator : "lte", value: number } : { kind: "resource", resourceKey: value?.kind === "resource" ? value.resourceKey : "", amount: number }); }} /></label>
              </> : requirement.kind === "variable" ? <>
                <label className="block">{label}当前环境条件<select className={modelRuleControls} value={value?.kind === "variable" ? value.variableKey : ""} onChange={event => field(key, { kind: "variable", variableKey: event.target.value, value: variableValue })}><option value="">请主动选择当前环境项目</option>{context.variables.map(variable => <option key={variable.key} value={variable.key}>{variable.label} · 初始值：{variable.value}</option>)}</select></label>
                <label className="block">{label}{guard ? "核对相等值" : "核对新条件"}<input className={modelRuleControls} maxLength={240} value={variableValue} onChange={event => field(key, { kind: "variable", variableKey: value?.kind === "variable" ? value.variableKey : "", value: event.target.value })} /></label>
                <p className="text-sm">{guard ? "相等条件只能使用当前初始值或本路径明确声明的替代值。" : "环境替代值须与当前初始值不同。"}</p>
              </> : <label className="flex min-h-11 items-center gap-3"><input className="h-5 w-5" type="checkbox" checked={value?.kind === "detach_profile_entry"} onChange={event => field(key, event.target.checked ? { kind: "detach_profile_entry" } : undefined)} />解除行动 {index + 1} 的旧背景关联</label>}
            </div>;
          })}
          {action.operation.actionType === "update_commitment" ? <p className="text-sm">保留承诺：{action.operation.label}</p> : null}
          <Button variant="ghostOnDark" className="!w-auto px-3 py-2" disabled={disabled} onClick={() => setRemoval(action.key)} aria-label={`核对时删除行动 ${index + 1} 并查看后继影响`}>删除此规则并查看影响</Button>
        </>}
      </div>)}
      {preview ? <section aria-label="核对规则删除影响" className="space-y-3 border border-white/20 p-4"><h4>确认从新草稿移除</h4><ul>{preview.actionKeys.map(key => <li key={key}>行动 {rules.actions.findIndex(action => action.key === key) + 1}</li>)}{preview.strategyKeys.map(key => <li key={key}>策略：{rules.strategies.find(strategy => strategy.participantKey === key)?.label}</li>)}</ul><div className="flex flex-wrap gap-3"><Button variant="ghostOnDark" disabled={disabled} onClick={() => setRemoval(null)}>取消此次移除</Button><Button variant="onDark" disabled={disabled} onClick={() => { const keys = [...new Set([...removedRuleKeys, ...preview.actionKeys])]; setRemovedRuleKeys(keys); setResolutions(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => !keys.some(ruleKey => key.startsWith(`${ruleKey}:`))))); setRemoval(null); }}>确认移除列出的规则</Button></div></section> : null}
      <p role="status" className="text-sm">{result.ok ? "所有行动与附加条件已分别核对。" : "请分别选择行动与附加条件的当前项目，并核对数量、阈值和环境值。"}</p>
      <div className="flex flex-wrap gap-3"><Button variant="onDark" disabled={disabled || !result.ok || Boolean(removal)} onClick={() => { if (result.ok) onApply(result); }}>应用核对结果到当前草稿</Button><Button variant="ghostOnDark" disabled={disabled} onClick={onCancel}>取消本次核对</Button></div>
    </fieldset>
  </section>;
}
