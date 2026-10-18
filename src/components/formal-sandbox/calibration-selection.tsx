"use client";

import { useId } from "react";
import Link from "next/link";
import type { FormalCalibrationContext } from "@/lib/formal-sandbox/outcomes/contracts";
import { outcomeValueLabel } from "./outcome-observations";

export function CalibrationSelection({ context, selectedKeys, confirmed, onChange, onConfirm, disabled }: { context: FormalCalibrationContext; selectedKeys: string[]; confirmed: boolean; onChange: (keys: string[]) => void; onConfirm: (value: boolean) => void; disabled: boolean }) {
  const id = useId();
  const eligibleSelection = selectedKeys.filter(key => context.corrections.some(item => item.key === key && item.status === "eligible"));
  const selected = context.corrections.filter(item => eligibleSelection.includes(item.key));
  const coherent = selected.length <= 6 && new Set(selected.map(item => item.ruleKey)).size === selected.length && new Set(selected.map(item => item.sourceRunId ?? "unrecorded")).size <= 1;
  const choose = (item: FormalCalibrationContext["corrections"][number]) => [...eligibleSelection.filter(key => {
    const old = context.corrections.find(value => value.key === key)!;
    return old.ruleKey !== item.ruleKey && old.sourceRunId === item.sourceRunId;
  }), item.key];
  return <section className="min-w-0 border-t border-white/15 pt-5">
    <h3 className="text-lg font-semibold">选择用于本次运行的观察修正</h3>
    <p className="mt-2 max-w-prose text-sm leading-6 text-[var(--text-secondary)]">默认不应用。修正仅把本人观察转为下一次运行的条件假设；原结果与旧模型保留，不代表现实发生概率已经得到改进。</p>
    <p className="mt-2 max-w-prose text-sm leading-6">没有另配行动时，本次沿用所选观察对应的原行动条件。若另配行动与这些条件不相符，请先取消修正选择或重新检查行动。</p>
    <p className="mt-2 text-sm">同一条行动规则只能采用一份观察；选择另一份会替换旧选择，并需要重新确认。最多选择六条，来源运行保持一致。</p>
    {!context.corrections.some(item => item.status === "eligible") ? <p className="mt-3 text-sm">暂无适用于当前模型的观察修正。可以继续配置新的条件行动。</p> : null}
    {context.corrections.map((item, index) => <div key={item.key} className="mt-4 text-sm leading-6"><label htmlFor={`${id}-${index}`} className="flex min-h-11 items-start gap-3 py-2 focus-within:outline focus-within:outline-2"><input id={`${id}-${index}`} type="checkbox" disabled={disabled || item.status !== "eligible" || !eligibleSelection.includes(item.key) && choose(item).length > 6} checked={eligibleSelection.includes(item.key)} className="mt-1" onChange={event => { onChange(event.target.checked ? choose(item) : eligibleSelection.filter(key => key !== item.key)); onConfirm(false); }} /><span><strong>{item.label}</strong><span className="block">绑定的已确认行动条件：{outcomeValueLabel(item.previousValue)} → {outcomeValueLabel(item.nextValue)}</span><span className="block text-[var(--text-secondary)]">本人观察依据：{item.evidenceSummary} · 条件版本 {item.version}{item.recordedAt ? ` · ${new Date(item.recordedAt).toLocaleString()}` : ""}</span></span></label>{item.sourceRunId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.sourceRunId) ? <Link href={`/app/simulation/result?run_id=${encodeURIComponent(item.sourceRunId)}#run-outcome-observations`} className="ml-7 inline-flex min-h-11 items-center underline underline-offset-4">回看来源运行的本人观察</Link> : null}{item.status === "incompatible" ? <p className="ml-7">不可应用：{item.reason ?? "绑定条件已过期或不适用于当前模型"}</p> : null}</div>)}
    {eligibleSelection.length ? <label className="mt-4 flex min-h-11 items-start gap-3 py-2 focus-within:outline focus-within:outline-2"><input type="checkbox" checked={confirmed && coherent && eligibleSelection.length === selectedKeys.length} disabled={disabled || !coherent} className="mt-1" onChange={event => onConfirm(event.target.checked)} /><span>我确认将所选本人观察修正作为本次运行的条件假设</span></label> : null}
  </section>;
}
