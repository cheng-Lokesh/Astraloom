"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui-foundation";
import { digitalLifeRulesSchema, type DigitalLifeRules } from "@/lib/digital-life/model";
import type { SafeDigitalLifeContext } from "@/lib/formal-sandbox/model-context";

export type EditorContext = Pick<SafeDigitalLifeContext, "graphSnapshotId" | "agentSnapshotId" | "profileRevision" | "agents" | "relationships"> & { resources: Array<Pick<SafeDigitalLifeContext["resources"][number], "key" | "label" | "available" | "minimum" | "unit">> };
type Action = DigitalLifeRules["actions"][number];
type Strategy = DigitalLifeRules["strategies"][number];
export type EditorDraft = {
  pathKey: string; actorKey: string; operation: Action["operation"]["actionType"];
  when: "at_tick" | "after_rule"; tickIndex: number; previousKey: string;
  targetKey: string; relationKey: string; resourceKey: string; text: string;
  amount: string; status: "planned" | "active" | "fulfilled" | "cancelled";
  evidenceSummary: string; confirmed: boolean; strategyLabel: string;
};
export const emptyEditorDraft: EditorDraft = { pathKey: "main", actorKey: "", operation: "request_information", when: "at_tick", tickIndex: 0, previousKey: "", targetKey: "", relationKey: "", resourceKey: "", text: "", amount: "", status: "planned", evidenceSummary: "", confirmed: false, strategyLabel: "" };
const actionLabels = { request_information: "询问信息", update_commitment: "更新本人承诺", update_relation_signal: "条件回应假设", allocate_resource: "投入已有资源" };
export const actionLabel = (type: Action["operation"]["actionType"]) => actionLabels[type];

export function buildEditorRules(context: EditorContext, horizon: 30 | 90, actions: Action[], strategies: Strategy[], draft: EditorDraft): { ok: true; rules: DigitalLifeRules } | { ok: false; message: string } {
  const fail = (message = "请检查人物、触发条件、来源说明，并明确确认模拟假设。") => ({ ok: false as const, message });
  const actor = context.agents.find(item => item.key === draft.actorKey);
  const activeSelf = draft.pathKey === "main" ? context.agents.find(item => item.role === "user_core")?.key : draft.pathKey;
  if (!draft.confirmed || !actor || !activeSelf || (draft.pathKey !== "main" && !context.agents.some(item => item.key === draft.pathKey && item.role === "user_variant"))) return fail();
  if (actions.filter(item => item.pathKey === draft.pathKey).length >= (horizon === 30 ? 3 : 6) || (draft.when === "at_tick" && (draft.tickIndex < 0 || draft.tickIndex >= (horizon === 30 ? 3 : 6)))) return fail("本路径已达到规则上限，或模拟周期超出当前时间窗口。");
  const prior = actions.find(item => item.key === draft.previousKey && item.pathKey === draft.pathKey);
  if (draft.when === "after_rule" && !prior) return fail("请先添加本路径中的前置行动。");
  const thirdParty = actor.role === "npc" || actor.role === "group";
  if (!thirdParty && actor.key !== activeSelf) return fail();
  if (thirdParty && (draft.operation !== "update_relation_signal" || draft.when !== "after_rule" || prior?.operation.actionType !== "request_information" || prior.operation.targetPersonKey !== actor.key)) return fail("第三方回应必须由本路径中向该人物询问信息的行动触发，并由你明确确认。");
  const nextNumber = Math.max(0, ...actions.map(item => Number(item.key.slice(5)))) + 1;
  let operation: Action["operation"];
  if (draft.operation === "request_information") {
    const target = context.agents.find(item => item.key === draft.targetKey && (item.role === "npc" || item.role === "group"));
    const core = context.agents.find(item => item.role === "user_core")?.key;
    if (!target || !context.relationships.some(item => [item.fromPersonKey, item.toPersonKey].includes(core ?? "") && [item.fromPersonKey, item.toPersonKey].includes(target.key))) return fail("请选择锁定关系图中与本人相连的关键人物。");
    operation = { actionType: draft.operation, targetPersonKey: draft.targetKey, question: draft.text };
  } else if (draft.operation === "update_commitment") operation = { actionType: draft.operation, commitmentKey: `commitment-${nextNumber}`, label: draft.text, status: draft.status };
  else if (draft.operation === "update_relation_signal") {
    const relation = context.relationships.find(item => item.key === draft.relationKey);
    const core = context.agents.find(item => item.role === "user_core")?.key;
    if (!thirdParty || !relation || ![relation.fromPersonKey, relation.toPersonKey].includes(actor.key) || ![relation.fromPersonKey, relation.toPersonKey].includes(core ?? "")) return fail();
    operation = { actionType: draft.operation, relationKey: relation.key, signal: draft.status === "fulfilled" ? "positive" : draft.status === "cancelled" ? "negative" : "neutral" };
  } else {
    const resource = context.resources.find(item => item.key === draft.resourceKey);
    if (!resource || Number(draft.amount) > resource.available - resource.minimum) return fail("投入量不能超过该资源扣除最低保留后的余额。");
    operation = { actionType: draft.operation, resourceKey: resource.key, amount: Number(draft.amount) };
  }
  const nextStrategies = draft.pathKey === "main" || strategies.some(item => item.participantKey === draft.pathKey) ? strategies : [...strategies, { participantKey: draft.pathKey, label: draft.strategyLabel, confirmedForSimulation: true as const, evidenceSummary: draft.evidenceSummary }];
  const parsed = digitalLifeRulesSchema.safeParse({ version: "digital-life-rules-v1", graphSnapshotId: context.graphSnapshotId, agentSnapshotId: context.agentSnapshotId, profileRevision: context.profileRevision, strategies: nextStrategies, actions: [...actions, { key: `rule-${nextNumber}`, pathKey: draft.pathKey, actorKey: draft.actorKey, when: draft.when === "at_tick" ? { kind: "at_tick", tickIndex: draft.tickIndex } : { kind: "after_rule", ruleKey: draft.previousKey }, operation, classification: "assumption", confirmedForSimulation: true, evidenceSummary: draft.evidenceSummary }] });
  return parsed.success ? { ok: true, rules: parsed.data } : fail("请填写简短、安全的行动与来源说明；不能填写链接、私人联系方式或确定性判断。");
}

export function removeEditorRule(actions: Action[], strategies: Strategy[], key: string) {
  const removed = new Set([key]);
  for (const action of actions) if (action.when.kind === "after_rule" && removed.has(action.when.ruleKey)) removed.add(action.key);
  const remaining = actions.filter(action => !removed.has(action.key));
  return { actions: remaining, strategies: strategies.filter(strategy => remaining.some(action => action.pathKey === strategy.participantKey && action.actorKey === strategy.participantKey)) };
}

export function DigitalLifeRulesEditor({ context, horizonDays, actions, strategies, onChange, disabled = false }: { context: EditorContext; horizonDays: 30 | 90; actions: Action[]; strategies: Strategy[]; onChange: (value: { actions: Action[]; strategies: Strategy[] }) => void; disabled?: boolean }) {
  const id = useId();
  const [draft, setDraft] = useState<EditorDraft>(emptyEditorDraft);
  const [message, setMessage] = useState("");
  const field = <K extends keyof EditorDraft>(key: K, value: EditorDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  const activeSelf = draft.pathKey === "main" ? context.agents.find(item => item.role === "user_core")?.key : draft.pathKey;
  const actors = context.agents.filter(item => item.key === activeSelf || item.role === "npc" || item.role === "group");
  const thirdParty = context.agents.some(item => item.key === draft.actorKey && (item.role === "npc" || item.role === "group"));
  const previous = actions.filter(item => item.pathKey === draft.pathKey && (!thirdParty || (item.operation.actionType === "request_information" && item.operation.targetPersonKey === draft.actorKey)));
  const controls = "mt-1 block min-h-11 w-full min-w-0 rounded-md border border-white/20 bg-[var(--bg-base)] px-3 py-2 text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-50";
  const add = () => {
    const result = buildEditorRules(context, horizonDays, actions, strategies, { ...draft, tickIndex: Math.min(draft.tickIndex, horizonDays === 30 ? 2 : 5) });
    if (!result.ok) { setMessage(result.message); return; }
    onChange({ actions: result.rules.actions, strategies: result.rules.strategies });
    setDraft(current => ({ ...emptyEditorDraft, pathKey: current.pathKey, actorKey: activeSelf ?? "" }));
    setMessage("规则已加入本次运行。只有点击开始后才会提交。");
  };
  return <section className="min-w-0 space-y-5 text-[var(--text-primary)]" aria-label="数字生命行动规则">
    <div><h3 className="text-lg font-semibold">本次运行的行动规则</h3><p className="mt-2 max-w-prose text-sm leading-6 text-[var(--text-secondary)]">可保持空白，不会自动推断他人意图。每条行动均为你确认的模拟假设，原关系图保持只读。每个策略使用独立世界，采样路径不等同于策略分支。</p><Link href="/app/reality-profile" className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline">修改背景事实、假设与未知项</Link></div>
    <fieldset disabled={disabled} className="space-y-4"><legend className="sr-only">添加一条明确行动</legend>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label htmlFor={`${id}-path`}>策略路径<select id={`${id}-path`} className={controls} value={draft.pathKey} onChange={event => { setDraft({ ...emptyEditorDraft, pathKey: event.target.value }); setMessage(""); }}><option value="main">本人主路径</option>{context.agents.filter(item => item.role === "user_variant").slice(0, 2).map(item => <option key={item.key} value={item.key}>{item.label} · 独立世界</option>)}</select></label>
        <label htmlFor={`${id}-actor`}>行动人物<select id={`${id}-actor`} className={controls} value={draft.actorKey} onChange={event => { const npc = context.agents.some(item => item.key === event.target.value && (item.role === "npc" || item.role === "group")); setDraft(current => ({ ...current, actorKey: event.target.value, operation: npc ? "update_relation_signal" : "request_information", when: npc ? "after_rule" : "at_tick", confirmed: false, previousKey: "" })); }}><option value="">请选择人物</option>{actors.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
        <label htmlFor={`${id}-operation`}>行动类型<select id={`${id}-operation`} className={controls} value={draft.operation} onChange={event => field("operation", event.target.value as EditorDraft["operation"])}>{(Object.keys(actionLabels) as Array<EditorDraft["operation"]>).filter(type => thirdParty ? type === "update_relation_signal" : type !== "update_relation_signal").map(type => <option key={type} value={type}>{actionLabels[type]}</option>)}</select></label>
        <label htmlFor={`${id}-when`}>触发条件<select id={`${id}-when`} className={controls} value={draft.when} onChange={event => field("when", event.target.value as EditorDraft["when"])}>{!thirdParty ? <option value="at_tick">在指定模拟周期</option> : null}<option value="after_rule">在本路径前置行动之后</option></select></label>
        {draft.when === "at_tick" ? <label htmlFor={`${id}-tick`}>模拟周期<select id={`${id}-tick`} className={controls} value={Math.min(draft.tickIndex, horizonDays === 30 ? 2 : 5)} onChange={event => field("tickIndex", Number(event.target.value))}>{Array.from({ length: horizonDays === 30 ? 3 : 6 }, (_, index) => <option key={index} value={index}>第 {index + 1} 周期 · 非精确日期</option>)}</select></label> : <label htmlFor={`${id}-prior`}>前置行动<select id={`${id}-prior`} className={controls} value={draft.previousKey} onChange={event => field("previousKey", event.target.value)}><option value="">{previous.length ? "请选择前置行动" : "请先添加向该人物询问信息的行动"}</option>{previous.map(item => <option key={item.key} value={item.key}>行动 {actions.indexOf(item) + 1} · {actionLabel(item.operation.actionType)}</option>)}</select></label>}
        {draft.operation === "request_information" ? <label htmlFor={`${id}-target`}>询问对象<select id={`${id}-target`} className={controls} value={draft.targetKey} onChange={event => field("targetKey", event.target.value)}><option value="">请选择关键人物</option>{context.agents.filter(item => item.role === "npc" || item.role === "group").map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label> : null}
        {draft.operation === "update_relation_signal" ? <><label htmlFor={`${id}-relation`}>已锁定关系<select id={`${id}-relation`} className={controls} value={draft.relationKey} onChange={event => field("relationKey", event.target.value)}><option value="">请选择只读关系</option>{context.relationships.filter(item => [item.fromPersonKey, item.toPersonKey].includes(draft.actorKey)).map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label><label htmlFor={`${id}-signal`}>假设的回应方向<select id={`${id}-signal`} className={controls} value={draft.status} onChange={event => field("status", event.target.value as EditorDraft["status"])}><option value="planned">中性</option><option value="fulfilled">积极</option><option value="cancelled">消极</option></select></label></> : null}
        {draft.operation === "allocate_resource" ? <><label htmlFor={`${id}-resource`}>已记录资源<select id={`${id}-resource`} className={controls} value={draft.resourceKey} onChange={event => field("resourceKey", event.target.value)}><option value="">{context.resources.length ? "请选择已有资源" : "先到背景资料添加明确资源"}</option>{context.resources.map(item => <option key={item.key} value={item.key}>{item.label} · 可投入 {item.available - item.minimum} {item.unit}</option>)}</select></label><label htmlFor={`${id}-amount`}>投入量<input id={`${id}-amount`} className={controls} type="number" min="0.001" step="any" value={draft.amount} onChange={event => field("amount", event.target.value)} /></label></> : null}
        {draft.operation === "update_commitment" ? <label htmlFor={`${id}-status`}>承诺状态<select id={`${id}-status`} className={controls} value={draft.status} onChange={event => field("status", event.target.value as EditorDraft["status"])}><option value="planned">计划</option><option value="active">进行中</option><option value="fulfilled">已履行</option><option value="cancelled">取消</option></select></label> : null}
      </div>
      {draft.pathKey !== "main" && !strategies.some(item => item.participantKey === draft.pathKey) ? <label className="block" htmlFor={`${id}-strategy`}>本策略名称<input id={`${id}-strategy`} className={controls} maxLength={240} value={draft.strategyLabel} onChange={event => field("strategyLabel", event.target.value)} /></label> : null}
      {draft.operation === "request_information" || draft.operation === "update_commitment" ? <label className="block" htmlFor={`${id}-text`}>{draft.operation === "request_information" ? "要询问的问题" : "本人承诺内容"}<input id={`${id}-text`} className={controls} maxLength={240} value={draft.text} onChange={event => field("text", event.target.value)} /></label> : null}
      <label className="block" htmlFor={`${id}-source`}>来源与假设说明<input id={`${id}-source`} className={controls} maxLength={160} value={draft.evidenceSummary} onChange={event => field("evidenceSummary", event.target.value)} /><span className="mt-1 block text-sm text-[var(--text-secondary)]">说明你为什么选择这个条件；不要填写私人联系方式或原始证据。第三方回应仅是假设，不代表其真实想法。</span></label>
      <label htmlFor={`${id}-confirm`} className="flex min-h-11 items-center gap-3"><input id={`${id}-confirm`} type="checkbox" className="h-5 w-5 shrink-0 accent-[var(--evidence-gold)] focus-visible:outline" checked={draft.confirmed} onChange={event => field("confirmed", event.target.checked)} />我确认这是用于本次运行的模拟假设</label>
      <Button variant="onDark" onClick={add} disabled={!draft.confirmed || disabled} className="!w-auto px-4 py-3">加入本次规则</Button>
    </fieldset>
    <p role="status" className="text-sm leading-6">{message}</p>
    {actions.length ? <ol className="space-y-3 border-t border-white/15 pt-4">{actions.map((item, index) => <li key={item.key} className="flex min-w-0 flex-wrap items-center justify-between gap-3"><p className="min-w-0 break-words text-sm">行动 {index + 1} · {context.agents.find(agent => agent.key === item.actorKey)?.label} · {actionLabel(item.operation.actionType)}<br /><span className="text-[var(--text-secondary)]">{item.when.kind === "at_tick" ? `第 ${item.when.tickIndex + 1} 模拟周期` : `行动 ${actions.findIndex(action => action.key === (item.when.kind === "after_rule" ? item.when.ruleKey : "")) + 1} 之后`} · {item.pathKey === "main" ? "本人主路径" : strategies.find(strategy => strategy.participantKey === item.pathKey)?.label} · 模拟假设</span></p><Button disabled={disabled} variant="ghostOnDark" onClick={() => onChange(removeEditorRule(actions, strategies, item.key))} className="!w-auto px-3 py-2" aria-label={`移除行动 ${index + 1} 及依赖它的后续规则`}>移除</Button></li>)}</ol> : <p className="text-sm text-[var(--text-secondary)]">尚未添加行动规则。背景未知项将保持未知。</p>}
  </section>;
}
