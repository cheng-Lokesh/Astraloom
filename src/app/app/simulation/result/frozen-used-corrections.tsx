"use client";

import Link from "next/link";
import { SurfaceCard } from "@/components/ui-foundation";
import { outcomeValueLabel } from "@/components/formal-sandbox/outcome-observations";
import { safeUsedCorrectionsSchema, type SafeUsedCorrections } from "@/lib/formal-sandbox/outcomes/used-corrections-contracts";

type Step = { key: string; order: number; label: string };
export function FrozenUsedCorrections({ receipt, steps }: { receipt?: SafeUsedCorrections; steps: Step[] }) {
  const parsed = safeUsedCorrectionsSchema.safeParse(receipt);
  const frozen = parsed.success ? parsed.data : undefined;
  return <div role="region" aria-label="本次已采用的观察修正"><SurfaceCard className="mt-6 min-w-0 p-5">
    <h2 className="text-xl font-semibold">本次已采用的观察修正</h2>
    <p className="mt-2 max-w-prose text-sm leading-6 text-[var(--text-secondary)]">这里保留本次开始时明确选择的条件假设。采用修正与实际执行分开核对；它不说明现实结果改善，也不把模拟频率变成现实概率。</p>
    {!frozen ? <p className="mt-3 text-sm">此历史运行未记录可核对的采用回执，不从当前观察补写。</p> : frozen.status === "source_unavailable" ? <p className="mt-3 text-sm">已选择修正，但来源暂不可核对；不能据此展示采用详情。</p> : frozen.status === "none_recorded" ? <p className="mt-3 text-sm">本次未采用观察修正。</p> : <ol className="mt-4 divide-y divide-white/15">{frozen.items.map(item => <li key={item.key} className="min-w-0 break-words py-4 text-sm leading-6">
      <h3 className="font-semibold">{item.label}</h3><p className="mt-1">原条件：{outcomeValueLabel(item.previousValue)} → 本次条件：{outcomeValueLabel(item.nextValue)}</p><p className="mt-1">本人观察依据：{item.evidenceSummary}</p><p className="text-[var(--text-secondary)]">观察记录时间：{new Date(item.recordedAt).toLocaleString()}</p>
      <Link href={`/app/simulation/result?run_id=${encodeURIComponent(item.sourceRunId)}#run-outcome-observations`} className="inline-flex min-h-11 items-center underline underline-offset-4">回看来源运行与本人观察</Link>
      <ol className="mt-2 space-y-3">{item.samples.map((sample, index) => {
        const supporting = sample.stepKeys.map(key => steps.find(step => step.key === key));
        const executed = sample.status === "executed" && supporting.length > 0 && supporting.every(Boolean);
        return <li key={sample.sampleKey}><h4 className="font-medium">重复样本 {index + 1}</h4>{executed ? <><p>本样本实际执行了该条件行动。</p>{supporting.map(step => <p key={step!.key}>支持步骤 {step!.order}：{step!.label} · 模拟事件</p>)}</> : <p>{sample.status === "not_executed" ? "本样本未执行该条件行动；采用修正不等于已经执行。" : "对应执行步骤未完整记录，暂不展示执行结论。"}</p>}</li>;
      })}</ol>
    </li>)}</ol>}
  </SurfaceCard></div>;
}
