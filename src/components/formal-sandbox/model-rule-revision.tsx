"use client";

import { useId, useState } from "react";
import type { DigitalLifeRules } from "@/lib/digital-life/model";
import { digitalLifeRulesSchema } from "@/lib/digital-life/model";
import type { DigitalLifeRulesDraft, SafeDigitalLifeCorrectionContext } from "@/lib/formal-sandbox/correction-context";
import { actionLabel } from "./digital-life-rules-editor";

type RevisionDraft = Omit<DigitalLifeRulesDraft, "actions" | "strategies"> & {
  actions: Array<Omit<DigitalLifeRulesDraft["actions"][number], "confirmedForSimulation"> & { confirmedForSimulation: boolean }>;
  strategies: Array<Omit<DigitalLifeRulesDraft["strategies"][number], "confirmedForSimulation"> & { confirmedForSimulation: boolean }>;
};
export function confirmedRevision(draft: RevisionDraft): DigitalLifeRules | null {
  const parsed = digitalLifeRulesSchema.safeParse(draft);
  return parsed.success ? parsed.data : null;
}

export function ModelRuleRevision({ source, disabled, onChange }: { source: SafeDigitalLifeCorrectionContext; disabled: boolean; onChange: (rules: DigitalLifeRules | null) => void }) {
  const id = useId();
  const [draft, setDraft] = useState<RevisionDraft>(() => structuredClone(source.draftRules));
  const controls = "mt-1 block min-h-11 w-full min-w-0 rounded-md border border-white/20 bg-[var(--bg-base)] px-3 py-2 text-[var(--text-primary)]";
  function update(next: RevisionDraft) { setDraft(next); onChange(confirmedRevision(next)); }
  function action(index: number, patch: Partial<RevisionDraft["actions"][number]>) {
    const changed = new Set([draft.actions[index].key]);
    if (Object.keys(patch).some(key => key !== "confirmedForSimulation")) {
      for (const item of draft.actions) if (item.when.kind === "after_rule" && changed.has(item.when.ruleKey)) changed.add(item.key);
    }
    update({ ...draft, actions: draft.actions.map((item, ordinal) => ordinal === index ? { ...item, ...patch } : changed.has(item.key) ? { ...item, confirmedForSimulation: false } : item) });
  }
  return <section aria-label="修订原运行假设" className="min-w-0 space-y-5">
    <h3 className="text-lg font-semibold">修订这些假设并另跑</h3>
    <p className="max-w-prose text-sm leading-6">已载入原运行的本人、关键人物与策略规则。请逐项检查并重新确认。预算、象征假设与观察修正须独立授权；旧运行及其证据保持在历史中。</p>
    {!draft.actions.length ? <p role="status">原运行没有明确行动规则。可检查背景模型，再独立确认本次资源规划。</p> : null}
    <fieldset disabled={disabled} className="min-w-0 space-y-5"><legend className="sr-only">原运行假设草稿</legend>
      {draft.strategies.map((strategy, index) => <div key={strategy.participantKey} className="space-y-2 border-b border-white/15 pb-4">
        <label>策略名称<input className={controls} maxLength={240} value={strategy.label} onChange={event => update({ ...draft, strategies: draft.strategies.map((item, ordinal) => ordinal === index ? { ...item, label: event.target.value, confirmedForSimulation: false } : item) })} /></label>
        <p className="text-sm">{strategy.evidenceSummary} · 独立世界</p>
        <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5 shrink-0" checked={strategy.confirmedForSimulation} onChange={event => update({ ...draft, strategies: draft.strategies.map((item, ordinal) => ordinal === index ? { ...item, confirmedForSimulation: event.target.checked } : item) })} />我重新确认策略 {index + 1} 的模拟假设</label>
      </div>)}
      {draft.actions.map((item, index) => <div key={item.key} className="min-w-0 space-y-3 border-b border-white/15 pb-5">
        <h4 className="break-words font-medium">行动 {index + 1} · {source.modelContext.agents.find(agent => agent.key === item.actorKey)?.label} · {actionLabel(item.operation.actionType)}</h4>
        <p className="break-words text-sm">{item.pathKey === "main" ? "本人主路径" : draft.strategies.find(strategy => strategy.participantKey === item.pathKey)?.label} · 模拟假设</p>
        {item.when.kind === "at_tick" ? <label htmlFor={`${id}-tick-${index}`}>模拟周期<select id={`${id}-tick-${index}`} className={controls} value={item.when.tickIndex} onChange={event => action(index, { when: { kind: "at_tick", tickIndex: Number(event.target.value) }, confirmedForSimulation: false })}>{Array.from({ length: source.horizonDays === 30 ? 3 : 6 }, (_, tick) => <option key={tick} value={tick}>第 {tick + 1} 周期 · 非精确日期</option>)}</select></label> : <p className="text-sm">在行动 {draft.actions.findIndex(prior => prior.key === (item.when.kind === "after_rule" ? item.when.ruleKey : "")) + 1} 之后</p>}
        {item.operation.actionType === "request_information" ? <><p className="text-sm">询问对象：{source.modelContext.agents.find(agent => agent.key === (item.operation.actionType === "request_information" ? item.operation.targetPersonKey : ""))?.label}</p><label>要询问的问题<input className={controls} maxLength={240} value={item.operation.question} onChange={event => { if (item.operation.actionType === "request_information") action(index, { operation: { ...item.operation, question: event.target.value }, confirmedForSimulation: false }); }} /></label></> : null}
        {item.operation.actionType === "update_commitment" ? <><label>本人承诺内容<input className={controls} maxLength={240} value={item.operation.label} onChange={event => { if (item.operation.actionType === "update_commitment") action(index, { operation: { ...item.operation, label: event.target.value }, confirmedForSimulation: false }); }} /></label><label>承诺状态<select className={controls} value={item.operation.status} onChange={event => { if (item.operation.actionType === "update_commitment") action(index, { operation: { ...item.operation, status: event.target.value as "planned" | "active" | "fulfilled" | "cancelled" }, confirmedForSimulation: false }); }}>{[ ["planned", "计划"], ["active", "进行中"], ["fulfilled", "已履行"], ["cancelled", "取消"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></> : null}
        {item.operation.actionType === "update_relation_signal" ? <><p className="text-sm">只读关系：{source.modelContext.relationships.find(relation => relation.key === (item.operation.actionType === "update_relation_signal" ? item.operation.relationKey : ""))?.label}</p><label>假设的可见回应<select className={controls} value={item.operation.signal} onChange={event => { if (item.operation.actionType === "update_relation_signal") action(index, { operation: { ...item.operation, signal: event.target.value as "positive" | "neutral" | "negative" }, confirmedForSimulation: false }); }}><option value="positive">积极</option><option value="neutral">中性</option><option value="negative">消极</option></select><span className="block text-sm">这是条件回应假设，不代表其真实想法，也不修改原关系图。</span></label></> : null}
        {item.operation.actionType === "allocate_resource" ? <><p className="text-sm">原资源投入：{source.modelContext.resources.find(resource => resource.key === (item.operation.actionType === "allocate_resource" ? item.operation.resourceKey : ""))?.label} · {source.frozenRules.actions[index].operation.actionType === "allocate_resource" ? source.frozenRules.actions[index].operation.amount : ""}。资源与最低保留仍取自原模型。</p><label>修订投入量<input className={controls} type="number" min="0.001" max="1000000" step="any" value={item.operation.amount} onChange={event => { if (item.operation.actionType === "allocate_resource") action(index, { operation: { ...item.operation, amount: Number(event.target.value) }, confirmedForSimulation: false }); }} /></label></> : null}
        <label>来源与假设说明<input className={controls} maxLength={160} value={item.evidenceSummary} onChange={event => action(index, { evidenceSummary: event.target.value, confirmedForSimulation: false })} /></label>
        <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5 shrink-0" checked={item.confirmedForSimulation} onChange={event => action(index, { confirmedForSimulation: event.target.checked })} />我重新确认行动 {index + 1} 的模拟假设</label>
      </div>)}
    </fieldset>
    <p role="status" className="text-sm">{confirmedRevision(draft) ? "全部规则已重新确认，可以另开一次运行。" : "尚有未确认或无效的规则，请逐项检查。"}</p>
  </section>;
}
