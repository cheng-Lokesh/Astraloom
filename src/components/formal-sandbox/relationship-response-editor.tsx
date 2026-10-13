"use client";

import { useId } from "react";
import Link from "next/link";
import type { DigitalLifeRules } from "@/lib/digital-life/model";
import type { SafeDigitalLifeContext } from "@/lib/formal-sandbox/model-context";
import type { DefaultPlanningContext } from "@/lib/formal-planning/contracts";
import { relationshipResponseRequestSchema, type RelationshipResponseRequest } from "@/lib/formal-planning/relationship-contracts";
import type { DefaultPlanningDraft } from "./default-planning-editor";

export type RelationshipResponseDraft = { enabled: boolean; pairKey: string; resourceKey: string; confirmed: boolean; symbolicEnabled: boolean; symbolicConfirmed: boolean };
export const emptyRelationshipResponseDraft = (): RelationshipResponseDraft => ({ enabled: false, pairKey: "", resourceKey: "", confirmed: false, symbolicEnabled: false, symbolicConfirmed: false });
type Pair = { key: string; label: string; requestRule: DigitalLifeRules["actions"][number]; responseRule: DigitalLifeRules["actions"][number] };
const directions = { negative: "消极模拟回应", neutral: "中性模拟回应", positive: "积极模拟回应" } as const;

/** Only already-confirmed rules can supply the pair; no NPC action is generated here. */
export function listRelationshipResponsePairs(context: SafeDigitalLifeContext, rules: Pick<DigitalLifeRules, "actions" | "strategies">): Pair[] {
  const core = context.agents.find(item => item.role === "user_core");
  if (!core) return [];
  return rules.actions.flatMap((response, index) => {
    if (response.operation.actionType !== "update_relation_signal" || response.when.kind !== "after_rule" || !response.confirmedForSimulation) return [];
    const request = rules.actions.slice(0, index).find(item => item.key === (response.when.kind === "after_rule" ? response.when.ruleKey : ""));
    const npc = context.agents.find(item => item.key === response.actorKey && (item.role === "npc" || item.role === "group"));
    const self = response.pathKey === "main" ? core : context.agents.find(item => item.key === response.pathKey && item.role === "user_variant"
      && rules.strategies.some(strategy => strategy.participantKey === item.key && strategy.confirmedForSimulation));
    const relation = context.relationships.find(item => item.key === (response.operation.actionType === "update_relation_signal" ? response.operation.relationKey : ""));
    if (!npc || !self || !request || !request.confirmedForSimulation || request.pathKey !== response.pathKey || request.actorKey !== self.key
      || request.operation.actionType !== "request_information" || request.operation.targetPersonKey !== npc.key || !relation
      || ![relation.fromPersonKey, relation.toPersonKey].includes(core.key) || ![relation.fromPersonKey, relation.toPersonKey].includes(npc.key)) return [];
    return [{ key: `${response.pathKey}:${request.key}:${response.key}`, label: `${self.label} → ${npc.label}：${directions[response.operation.signal]}`, requestRule: request, responseRule: response }];
  });
}

export function buildRelationshipResponseRequest(context: SafeDigitalLifeContext, rules: Pick<DigitalLifeRules, "actions" | "strategies">,
  planning: DefaultPlanningContext, budgets: DefaultPlanningDraft, draft: RelationshipResponseDraft): RelationshipResponseRequest | null | undefined {
  if (!draft.enabled) return undefined;
  const pair = listRelationshipResponsePairs(context, rules).find(item => item.key === draft.pairKey);
  const budget = budgets.resources[draft.resourceKey];
  if (!pair || !draft.confirmed || !planning.resources.some(item => item.resourceKey === draft.resourceKey) || !budget?.enabled || !budget.confirmed
    || !budget.budget.trim() || !Number.isFinite(Number(budget.budget)) || Number(budget.budget) <= 0
    || (draft.symbolicEnabled && (planning.symbolicFusion.status !== "eligible" || !draft.symbolicConfirmed))) return null;
  const result = relationshipResponseRequestSchema.safeParse({ version: "formal-relationship-response-hypothesis-v1", pathKey: pair.responseRule.pathKey,
    resourceKey: draft.resourceKey, confirmedForSimulation: true, requestRule: pair.requestRule, responseRule: pair.responseRule,
    symbolicSensitivity: draft.symbolicEnabled ? { enabled: true, confirmedForSimulation: true } : { enabled: false, confirmedForSimulation: false } });
  return result.success ? result.data : null;
}

export function RelationshipResponseEditor({ context, rules, planning, budgets, draft, onChange, disabled = false }: {
  context: SafeDigitalLifeContext; rules: Pick<DigitalLifeRules, "actions" | "strategies">; planning: DefaultPlanningContext; budgets: DefaultPlanningDraft;
  draft: RelationshipResponseDraft; onChange: (draft: RelationshipResponseDraft) => void; disabled?: boolean;
}) {
  const id = useId();
  const pairs = listRelationshipResponsePairs(context, rules);
  const selected = pairs.find(item => item.key === draft.pairKey);
  const resources = planning.resources.filter(item => budgets.resources[item.resourceKey]?.enabled && budgets.resources[item.resourceKey]?.confirmed);
  const resource = planning.resources.find(item => item.resourceKey === draft.resourceKey);
  const conflict = resource && (resource.explicitRulePresent || rules.actions.some(item => item.operation.actionType === "allocate_resource" && item.operation.resourceKey === resource.resourceKey)
    ? "该资源已有明确行动规则，回应调整将未生效，不会覆盖它。" : resource.declaredRate !== null ? "该资源已有明确每周期投入量，回应调整将未生效，不会覆盖它。"
      : resource.available <= resource.minimum ? "该资源没有可用投入空间，回应调整将未生效。" : null);
  const control = "mt-2 block min-h-11 w-full rounded-md border border-white/20 bg-[var(--bg-base)] px-3 text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)]";
  function update(patch: Partial<RelationshipResponseDraft>) { onChange({ ...draft, ...patch, confirmed: false }); }
  return <fieldset className="min-w-0 border-t border-white/15 pt-5" disabled={disabled}>
    <legend className="px-0 pt-5 text-lg font-semibold">模拟回应 → 我的后续投入</legend>
    <p className="mt-2 max-w-prose text-sm leading-6 text-[var(--text-secondary)]">可选，默认关闭。只引用你已经确认的询问与对方条件回应；这是模拟假设，不是对方真实态度。</p>
    <label className="mt-3 flex min-h-11 items-start gap-3 py-2 text-sm leading-6 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--evidence-gold)]"><input type="checkbox" className="mt-1" checked={draft.enabled} disabled={!pairs.length && !draft.enabled} onChange={event => update({ enabled: event.target.checked })} /><span>启用本次模拟回应后的投入调整</span></label>
    {!pairs.length ? <p className="mt-2 text-sm leading-6">还没有可选的已确认组合。请在<Link href="#formal-action-rules" className="underline underline-offset-4">上方行动规则</Link>先添加本人的“询问信息”，再让同路径关键人物添加“条件回应假设”，触发方式选择这次询问，并分别确认。不会自动补写对方回应。</p> : null}
    {draft.enabled ? <>
      <label className="mt-3 block text-sm" htmlFor={`${id}-pair`}>已确认的询问与模拟回应<select id={`${id}-pair`} className={control} value={draft.pairKey} onChange={event => update({ pairKey: event.target.value })}><option value="">请选择已确认组合</option>{pairs.map(pair => <option key={pair.key} value={pair.key}>{pair.label}</option>)}</select></label>
      <label className="mt-3 block text-sm" htmlFor={`${id}-resource`}>我的后续投入资源<select id={`${id}-resource`} className={control} value={draft.resourceKey} onChange={event => update({ resourceKey: event.target.value })}><option value="">请选择已确认整次预算的资源</option>{resources.map(item => <option key={item.resourceKey} value={item.resourceKey}>{item.label}（{item.unit}）</option>)}</select></label>
      {!resources.length ? <p className="mt-2 text-sm leading-6">请先在默认资源规划中选择资源、填写整次预算上限，并单独确认预算；回应调整不能代替预算授权。</p> : null}
      {conflict ? <p role="status" className="mt-2 text-sm leading-6">{conflict}你可以取消本项选择或关闭回应调整。</p> : null}
      <p className="mt-3 text-sm leading-6">只有已选组合的消极回应实际产生受控模拟事件后，后续投入候选才减少 5%，到首次被选中为止；未选中不算实际投入。积极或中性回应不减少，不与首轮初始倾向叠加，合计上限 10%。</p>
      <label className="mt-3 flex min-h-11 items-start gap-3 py-2 text-sm leading-6 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--evidence-gold)]"><input type="checkbox" className="mt-1" checked={draft.symbolicEnabled} disabled={planning.symbolicFusion.status !== "eligible"} onChange={event => update({ symbolicEnabled: event.target.checked, symbolicConfirmed: false })} /><span>独立启用象征关系敏感假设（最多额外减少 5%）</span></label>
      {planning.symbolicFusion.status !== "eligible" ? <p className="mt-2 text-sm leading-6">当前象征来源不可用；回应调整仍可单独使用。可检查<Link href="/app/symbolic-lens" className="underline underline-offset-4">象征对照设置</Link>后重新读取来源。</p> : null}
      {draft.symbolicEnabled ? <label className="mt-2 flex min-h-11 items-start gap-3 py-2 text-sm leading-6"><input type="checkbox" className="mt-1" checked={draft.symbolicConfirmed} onChange={event => update({ symbolicConfirmed: event.target.checked })} /><span>我单独确认象征假设仅调整本次消极模拟回应后的候选投入</span></label> : null}
      <label className="mt-3 flex min-h-11 items-start gap-3 py-2 text-sm leading-6 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--evidence-gold)]"><input type="checkbox" className="mt-1" checked={draft.confirmed} disabled={!selected || !resource || !resources.some(item => item.resourceKey === draft.resourceKey) || (draft.symbolicEnabled && !draft.symbolicConfirmed)} onChange={event => onChange({ ...draft, confirmed: event.target.checked })} /><span>我确认此模拟回应组合与本人资源的后续投入调整</span></label>
    </> : null}
    <details className="mt-3 text-sm leading-6"><summary className="min-h-11 cursor-pointer py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)]">查看假设边界与参数</summary><p className="max-w-prose text-[var(--text-secondary)]">版本 formal-relationship-response-hypothesis-v1。5% 与可选附加 5% 是有界产品规划假设，不是科学权重、预测概率或现实证据；候选必须经过原有受控选择，未选中就没有实际投入。预算按每条路径、每个样本分别累计，最低保留量不变。</p></details>
  </fieldset>;
}
