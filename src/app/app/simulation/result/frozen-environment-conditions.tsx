"use client";

import type { FormalSandboxResultProjection } from "@/lib/formal-sandbox/client";

export function FrozenEnvironmentConditions({ projection }: { projection: FormalSandboxResultProjection }) {
  if (!projection.environmentConditions?.length) return null;
  return <section aria-label="本路径环境条件与真实触发记录" className="mt-5 min-w-0 border-t border-white/15 pt-5">
    <h3 className="font-semibold">环境条件假设与模拟变化</h3>
    <p className="mt-2 max-w-prose text-sm leading-6">以下是本路径冻结的模拟条件，不代表控制现实，也不修改现实档案。变化只依据实际触发的模拟事件；未触发、未选中或未到达时不补写实际值。</p>
    {projection.environmentConditions.map((condition, index) => <div key={condition.key} className="mt-4 min-w-0 break-words border-b border-white/10 pb-4 text-sm leading-6">
      <h4 className="font-medium">条件 {index + 1} · {condition.label}</h4>
      <p>初始值：{condition.initialValue} · {condition.initialClassification === "fact" ? "已记录事实" : "原假设"}</p>
      <p>假设的新条件：{condition.proposedValue} · 已确认的模拟假设</p>
      <ol className="mt-2 space-y-3">{condition.samples.map((sample, sampleIndex) => {
        const step = projection.steps.find(item => item.key === sample.stepKey);
        const selected = sample.state === "selected" && !!step && sample.actualValue !== null;
        const successors = selected ? sample.successorStepKeys.map(key => projection.steps.find(item => item.key === key)?.order).filter((order): order is number => order !== undefined) : [];
        return <li key={sample.key}><h5 className="font-medium">样本 {sampleIndex + 1}</h5>{selected ? <><p>模拟变化节点 · 步骤 {step.order}：{condition.initialValue} → {sample.actualValue}</p>{successors.length ? <p>后继模拟步骤：{successors.join("、")}</p> : <p>没有记录由此触发的后继步骤。</p>}</> : <p>{sample.state === "not_reached" ? "指定模拟周期未到达，没有环境变化事件。" : sample.state === "not_selected" ? "条件候选未被选中，没有环境变化事件。" : sample.state === "not_triggered" ? "前置条件未触发，没有环境变化事件。" : "缺少对应的模拟步骤或实际值，不展示变化节点。"}实际新值未记录。</p>}</li>;
      })}</ol>
    </div>)}
  </section>;
}
