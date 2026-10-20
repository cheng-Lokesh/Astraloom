"use client";
import type { ReactNode } from "react";
import { Button } from "@/components/ui-foundation";
import { listRealityProfileEntries } from "@/lib/reality-profile/profile";
import type { LifeClimateB3Horizon, LifeClimateB3Rule } from "@/lib/life-climate/b3/contracts";
import type { B3Source } from "./http";
import { ruleNames, stageCount, stageName, type DeclaredResource, type Editor, type RuleKind } from "./model";

export const control = "mt-2 block min-h-11 w-full rounded-md border border-white/20 bg-[var(--bg-base)] px-3 py-2 text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-60";
export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-sm leading-6 text-[var(--text-secondary)]">{label}{children}</label>; }
export function RuleEditor({ editor, update, source, horizon, paths, rules, resources, add }: { editor: Editor; update(value: Editor): void; source: B3Source; horizon: LifeClimateB3Horizon; paths: { id: string; label: string }[]; rules: { path: string; rule: LifeClimateB3Rule }[]; resources: DeclaredResource[]; add(): void }) {
  const change = <K extends keyof Editor>(key: K, value: Editor[K]) => update({ ...editor, [key]: value });
  const entries = listRealityProfileEntries(source.view.profile);
  const select = (key: keyof Editor, label: string, options: { id: string; label: string }[]) => <Field label={label}><select aria-label={label} className={control} value={String(editor[key])} onChange={event => change(key, event.target.value as never)}><option value="">请选择</option>{options.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>;
  const text = (key: keyof Editor, label: string, number = false) => <Field label={label}><input aria-label={label} inputMode={number ? "decimal" : "text"} maxLength={number ? 26 : 240} className={control} value={String(editor[key])} onChange={event => change(key, event.target.value as never)} /></Field>;
  const resourceOptions = (type?: string) => resources.filter(item => !type || item.resourceType === type).map(item => ({ id: item.id, label: `${item.label}（${item.unit}）` }));
  const sourceOptions = entries.filter(item => editor.kind === "relocation" ? item.key.startsWith("lifeModelDomains.environment.") : editor.kind === "guarded_structure_transition" ? item.key.startsWith("lifeModelDomains.") : !item.key.startsWith("lifeModelDomains.")).map(item => ({ id: item.key, label: `${item.label}：${item.field.classification === "unknown" ? "明确未知" : item.field.value}` }));
  const usesState = ["scenario_change", "relocation", "guarded_structure_transition"].includes(editor.kind);
  const usesResource = ["recurring_resource_flow", "one_time_resource_change", "transition_readiness"].includes(editor.kind);
  const isOnce = ["one_time_resource_change", "relocation", "scenario_change", "guarded_structure_transition"].includes(editor.kind);
  return <section className="space-y-5 border-y border-white/15 py-6" aria-label="添加路径条件">
    <h3 className="text-xl font-semibold">添加一项明确条件</h3>
    <p className="max-w-prose text-sm leading-7 text-[var(--text-secondary)]">用表单设定自己的假设。数量留空表示未知；零也需要你明确填写。不会根据职业、收入、能力或此前 Run 自动补入数量。</p>
    <div className="grid gap-5 md:grid-cols-2">
      <Field label="条件类型"><select aria-label="条件类型" className={control} value={editor.kind} onChange={event => update({ ...editor, kind: event.target.value as RuleKind, stages: [1] })}>{Object.entries(ruleNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
      {select("path", "适用路径", [{ id: "common", label: "所有路径共同条件" }, ...paths])}
      {text("label", "这项条件的名称")}
    </div>
    <fieldset><legend className="text-sm">{isOnce ? "发生阶段（只选一次）" : "适用阶段"}</legend><div className="mt-2 flex flex-wrap gap-4">{Array.from({ length: stageCount(horizon) }, (_, i) => i + 1).map(index => <label key={index} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={editor.stages.includes(index)} onChange={event => change("stages", isOnce ? event.target.checked ? [index] : [] : event.target.checked ? [...editor.stages, index].sort() : editor.stages.filter(item => item !== index))} />{stageName(horizon, index)}</label>)}</div></fieldset>
    <div className="grid gap-5 md:grid-cols-2">
      {usesState && <>{select("source", "变化涉及的已保存资料", sourceOptions)}{text("value", "明确设定的新状态（留空为未知）")}</>}
      {usesResource && select("resource", "使用的资源", resourceOptions())}
      {["one_time_resource_change", "recurring_resource_flow"].includes(editor.kind) && <Field label="资源变化方向"><select aria-label="资源变化方向" className={control} value={editor.direction} onChange={event => change("direction", event.target.value as "credit" | "debit")}><option value="debit">消耗或支出</option><option value="credit">补给或积累（需自己明确填写）</option></select></Field>}
      {editor.kind === "one_time_resource_change" && text("amount", "一次变化数量", true)}
      {editor.kind === "recurring_resource_flow" && <><Field label="支出要求"><select aria-label="支出要求" className={control} value={editor.obligation} onChange={event => change("obligation", event.target.value as "required" | "optional")}><option value="required">必要义务，短缺必须显示</option><option value="optional">可选投入</option></select></Field>{editor.stages.map(index => <Field key={index} label={`${stageName(horizon, index)}的明确数量`}><input aria-label={`${stageName(horizon, index)}的明确数量`} inputMode="decimal" className={control} value={editor.amounts[index - 1]} onChange={event => change("amounts", editor.amounts.map((value, i) => i === index - 1 ? event.target.value : value))} /></Field>)}</>}
      {editor.kind === "investment_cycle" && <>{select("timeResource", "投入的时间资源", resourceOptions("time"))}{select("budgetResource", "投入的费用资源", resourceOptions("budget"))}{text("initial", "已完成投入数量（零也须填写）", true)}{text("time", `每${horizon === "1_year" ? "季度" : "年"}投入时间`, true)}{text("cost", `每${horizon === "1_year" ? "季度" : "年"}投入费用`, true)}</>}
      {editor.kind === "relocation" && <>{select("budgetResource", "支付迁居成本的预算", resourceOptions("budget"))}{text("cost", "迁居一次成本", true)}</>}
      {editor.kind === "transition_readiness" && <>{select("investment", "同一路径的学习投入", rules.filter(item => (item.path === editor.path || item.path === "common") && item.rule.kind === "investment_cycle").map(item => ({ id: item.rule.kind === "investment_cycle" ? item.rule.investmentId : "", label: item.rule.label })))}{select("timeResource", "学习投入的时间单位来源", resourceOptions("time"))}{text("investmentMinimum", "需要累计的投入数量", true)}{text("resourceMinimum", "同时需要保留的资源数量", true)}<Field label="核对的结构领域"><select aria-label="核对的结构领域" className={control} value={editor.domain} onChange={event => change("domain", event.target.value as "career" | "lifeStage")}><option value="career">职业结构</option><option value="lifeStage">人生阶段</option></select></Field></>}
    </div>
    <details className="border-t border-white/10 pt-4"><summary className="min-h-11 cursor-pointer text-sm font-semibold">阶段前提（结构变化必须设置）</summary><p className="my-3 text-sm leading-7 text-[var(--text-secondary)]">所有所选前提同时满足才执行。条件满足只表示模拟规则可执行，不代表录用、收入或现实结果。</p><div className="grid gap-5 md:grid-cols-2">{select("guardResource", "前提需要的资源", resourceOptions())}{text("guardAmount", "前提资源最低数量", true)}{select("guardSource", "前提背景资料", entries.map(item => ({ id: item.key, label: item.label })))}{text("guardValue", "前提背景状态")}{select("priorRule", "前提已执行条件", rules.filter(item => (item.path === editor.path || item.path === "common")).map(item => ({ id: item.rule.id, label: item.rule.label })))}</div></details>
    <Button type="button" variant="secondary" onClick={add}>添加这项条件</Button>
  </section>;
}
