import type { GuardObservations } from "@/lib/digital-life/guard-observations";
export type { GuardObservations } from "@/lib/digital-life/guard-observations";

export function FrozenWorldGuards({ observations, steps = [], ruleLabels = {}, conditionDescriptions = {}, temporary = false }: { observations?: GuardObservations; steps?: Array<{ key: string; order: number; label?: string }>; ruleLabels?: Record<string, string>; conditionDescriptions?: Record<string, string>; temporary?: boolean }) {
  if (!observations) return null;
  return <section aria-label="条件行动逐周期观察" className="mt-5 min-w-0 space-y-4 border-t border-white/15 pt-5">
    <h3 className="font-semibold">条件行动逐周期观察</h3>
    <p className="max-w-prose text-sm leading-6">每个样本使用自己的模拟状态。周期、条件判断与实际事件分别列出；这些是条件模拟记录，不是现实发生概率。未到达的周期没有状态数值，也不承诺之后继续等待或执行。</p>
    {observations.samples.map((sample, sampleIndex) => <section key={sample.key} aria-label={`条件观察样本 ${sampleIndex + 1}`} className="min-w-0 space-y-3">
      <h4 className="font-medium">样本 {sampleIndex + 1}</h4>
      {sample.ticks.map(tick => <div key={tick.tickIndex} className="min-w-0 border-b border-white/10 pb-3 text-sm leading-6">
        <p className="font-medium">模拟周期 {tick.tickIndex + 1}{tick.occurredAt ? ` · ${new Date(tick.occurredAt).toLocaleString("zh-CN")}` : " · 未到达"}</p>
        {tick.observations.map((item, index) => {
          const step = item.stepKey ? steps.find(step => step.key === item.stepKey) : undefined;
          const reached = item.schedule !== "not_reached";
          return <div key={`${item.ruleKey}-${index}`} className="mt-2 break-words">
            <p>{ruleLabels[item.ruleKey] ?? `条件行动 ${index + 1}`} · {{ due: "调度条件已满足", not_due: "尚未满足周期或前置行动", already_selected: "此前已执行", not_reached: "指定模拟周期未到达" }[item.schedule]}</p>
            <p>条件：{item.conditionDescription || conditionDescriptions[item.ruleKey]}</p>
            <p>附加条件：{item.guard === null ? "未判断" : item.guard ? "满足" : "不满足"} · {item.candidate === "selected" ? "候选已选中" : item.candidate === "not_selected" ? "候选未被选中" : item.candidate === "ineligible" ? "未进入候选" : "没有候选记录"}</p>
            {reached && item.before !== null && item.after !== null ? <p>{item.label}：{item.before} → {item.after}{item.unit ? ` ${item.unit}` : ""}</p> : null}
            {reached && item.candidate === "selected" && temporary ? <p>本次已选中模拟事件，但未形成完整保存的运行，没有正式步骤链接。</p> : reached && item.candidate === "selected" && step ? <p>实际事件依据：模拟步骤 {step.order}{step.label ? ` · ${step.label}` : ""}</p> : <p>没有对应的实际选中事件。</p>}
          </div>;
        })}
      </div>)}
    </section>)}
  </section>;
}
