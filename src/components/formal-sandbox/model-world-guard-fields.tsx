import type { SafeDigitalLifeContext } from "@/lib/formal-sandbox/model-context";
import type { DraftAction, RevisionDraft } from "./model-rule-draft-operations";
import { modelRuleControls } from "./complete-model-action-fields";

export function ModelWorldGuardFields({ action, index, context, rules, onChange }: { action: DraftAction; index: number; context: SafeDigitalLifeContext; rules: RevisionDraft; onChange: (patch: Partial<DraftAction>) => void }) {
  const guard = action.guard;
  const label = `行动 ${index + 1}`;
  const variable = guard?.kind === "environment_equals" ? context.variables?.find(item => item.key === guard.variableKey) : undefined;
  const values = variable ? [...new Set([variable.value, ...rules.actions.flatMap(item => item.pathKey === action.pathKey && item.operation.actionType === "update_external_variable" && item.operation.variableKey === variable.key ? [item.operation.value] : [])])] : [];
  return <div className="min-w-0 space-y-3">
    <p className="max-w-prose text-sm leading-6">行动须同时满足原模拟周期或前置行动，以及这里的条件。条件只读取该路径当时的模拟状态，不表示现实会发生，也不推断他人的想法。</p>
    <label className="block">{label} 条件类型<select className={modelRuleControls} value={guard?.kind ?? ""} onChange={event => onChange({ guard: event.target.value === "resource_balance" ? { kind: "resource_balance", resourceKey: "", operator: "lte", value: NaN } : event.target.value === "environment_equals" ? { kind: "environment_equals", variableKey: "", value: "" } : undefined })}><option value="">不附加条件</option><option value="resource_balance">资源余额达到阈值</option><option value="environment_equals">环境值等于已声明条件</option></select></label>
    {guard?.kind === "resource_balance" ? <>
      <label className="block">{label} 条件资源<select className={modelRuleControls} value={guard.resourceKey} onChange={event => onChange({ guard: { ...guard, resourceKey: event.target.value } })}><option value="">请主动选择资源</option>{context.resources.map(item => <option key={item.key} value={item.key}>{item.label} · {item.minimum}–{item.maximum} {item.unit}</option>)}</select></label>
      <label className="block">{label} 条件比较<select className={modelRuleControls} value={guard.operator} onChange={event => onChange({ guard: { ...guard, operator: event.target.value as "lte" | "gte" } })}><option value="lte">余额小于或等于</option><option value="gte">余额大于或等于</option></select></label>
      <label className="block">{label} 条件阈值<input className={modelRuleControls} type="number" step="any" value={Number.isFinite(guard.value) ? guard.value : ""} onChange={event => onChange({ guard: { ...guard, value: event.target.value === "" ? NaN : Number(event.target.value) } })} /></label>
    </> : null}
    {guard?.kind === "environment_equals" ? <>
      <label className="block">{label} 条件环境项目<select className={modelRuleControls} value={guard.variableKey} onChange={event => onChange({ guard: { ...guard, variableKey: event.target.value, value: "" } })}><option value="">请主动选择环境项目</option>{context.variables?.map(item => <option key={item.key} value={item.key}>{item.label} · 初始值：{item.value}</option>)}</select></label>
      <label className="block">{label} 条件环境值<select className={modelRuleControls} value={guard.value} onChange={event => onChange({ guard: { ...guard, value: event.target.value } })}><option value="">请主动选择已声明值</option>{values.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <p className="text-sm leading-6">只可选择冻结初始值，或本路径明确配置的环境替代值；替代值须由实际模拟事件产生后才可能满足。</p>
    </> : null}
  </div>;
}
