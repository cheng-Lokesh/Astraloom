"use client";
import { useState } from "react";
import { Button } from "@/components/ui-foundation";
import { decimalInput, type DeclaredResource } from "./model";
import { control, Field } from "./rule-editor";
export function ResourceEditor({ resources, change }: { resources: DeclaredResource[]; change(value: DeclaredResource[]): void }) {
  const [draft, setDraft] = useState({ label: "", unit: "", type: "budget" as "budget" | "time" | "other", mode: "unknown" as "unknown" | "assumption", initial: "", minimum: "", maximum: "" });
  const [message, setMessage] = useState("");
  function add() {
    try {
      if (!draft.label.trim() || !draft.unit.trim()) throw new Error("请填写资源名称和单位。");
      const id = `res-${crypto.randomUUID().slice(0, 30)}`;
      const initialAssumption = draft.mode === "assumption" ? { id: `a-${crypto.randomUUID()}`, label: `${draft.label}的独立初始数量`, kind: "quantity" as const, value: decimalInput(draft.initial), unit: draft.unit.trim(), periodUnit: "once" as const, evidenceSummary: "本人明确声明的独立资源假设，不是自动复制已有资产" } : undefined;
      change([...resources, { id, label: draft.label.trim(), resourceType: draft.type, unit: draft.unit.trim(), minimum: decimalInput(draft.minimum), maximum: decimalInput(draft.maximum), initial: initialAssumption ? { kind: "assumption", assumptionId: initialAssumption.id } : { kind: "unknown" }, ...(initialAssumption ? { initialAssumption } : {}) }]);
      setDraft({ label: "", unit: "", type: "budget", mode: "unknown", initial: "", minimum: "", maximum: "" }); setMessage("已加入独立资源；仍须复核并确认，未知不会当作零。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "请核对资源。"); }
  }
  return <section className="space-y-4 border-t border-white/15 pt-6"><h2 className="text-2xl font-semibold">资源起点与明确边界</h2><p className="max-w-prose text-sm leading-7 text-[var(--text-secondary)]">每份已保存资源仅绑定一次。没有结构化资源时，可在本次对照声明独立数量假设或明确未知；不会自动补入余额、收入或可用时间。上下限请自己填写。</p>{resources.map(item => <p key={item.id} className="text-sm leading-7">{item.label}（{item.unit}）：{item.initial.kind === "profile_resource" ? "沿用原资料一份冻结存量" : item.initial.kind === "unknown" ? "明确未知，不是零" : `独立假设 ${item.initialAssumption?.value ?? "未知"}`}；下界 {item.minimum}，上界 {item.maximum}</p>)}<details><summary className="min-h-11 cursor-pointer font-semibold">声明独立资源</summary><div className="mt-3 grid gap-4 md:grid-cols-2">{([['label','独立资源名称'],['unit','独立资源单位'],['minimum','独立资源下界'],['maximum','独立资源上界']] as const).map(([key,label]) => <Field key={key} label={label}><input aria-label={label} className={control} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></Field>)}<Field label="独立资源类型"><select aria-label="独立资源类型" className={control} value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value as typeof draft.type })}><option value="budget">预算或储备</option><option value="time">时间</option><option value="other">其他明确资源</option></select></Field><Field label="初始数量来源"><select aria-label="初始数量来源" className={control} value={draft.mode} onChange={event => setDraft({ ...draft, mode: event.target.value as typeof draft.mode })}><option value="unknown">明确未知</option><option value="assumption">我单独声明一个数量假设</option></select></Field>{draft.mode === "assumption" && <Field label="独立资源初始数量"><input aria-label="独立资源初始数量" inputMode="decimal" className={control} value={draft.initial} onChange={event => setDraft({ ...draft, initial: event.target.value })} /></Field>}</div><Button className="mt-4" type="button" variant="secondary" onClick={add}>加入独立资源</Button><p className="mt-3 text-sm" role="status">{message}</p></details></section>;
}
