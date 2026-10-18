"use client";

import { useId, useState } from "react";
import { Select, SurfaceCard } from "@/components/ui-foundation";
import { actionLabel } from "@/components/formal-sandbox/digital-life-rules-editor";
import type { FormalSandboxResultProjection } from "@/lib/formal-sandbox/client";
import type { SafeSimulationTimeline } from "@/lib/formal-sandbox/timeline-contracts";

type PathProjection = Omit<FormalSandboxResultProjection, "strategyPaths">;
type Sample = SafeSimulationTimeline["samples"][number];
type TimelineEvent = NonNullable<Sample["ticks"][number]["event"]>;
const eventNames: Record<TimelineEvent["kind"], string> = {
  commitment: "本人行动", resource: "资源行动", relationship_response: "NPC 条件回应", environment: "环境条件变化", information_request: "询问信息",
};
const stateNames: Record<string, string> = { negative: "消极", neutral: "中性", positive: "积极", planned: "计划中", active: "进行中", fulfilled: "已完成", cancelled: "已取消", completed: "已完成", abandoned: "已放弃", available: "可用", unavailable: "不可用", awaiting_information: "等待信息", committed: "已作出承诺" };
const displayValue = (value: string | number | null, kind: TimelineEvent["changes"][number]["kind"]) => value === null ? "未记录" : typeof value === "string" && kind !== "environment" ? stateNames[value] ?? value : String(value);
const disclosureClass = "min-h-11 cursor-pointer py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

function EventEvidence({ event, sample, projection }: { event: TimelineEvent; sample: Sample; projection: PathProjection }) {
  const localEvents = sample.ticks.flatMap(tick => tick.event ? [tick.event] : []);
  const currentIndex = localEvents.findIndex(item => item.stepKey === event.stepKey);
  const priorEvents = localEvents.slice(0, currentIndex).filter(item => event.causes.priorStepKeys.includes(item.stepKey));
  const facts = projection.facts.filter(item => event.causes.factKeys.includes(item.key));
  const assumptions = projection.assumptions.filter(item => event.causes.assumptionKeys.includes(item.key));
  const rules = projection.digitalLifeModel?.rules.filter(item => (event.causes.ruleKeys ?? []).includes(item.key)) ?? [];
  const claims = projection.claims.filter(item => event.claimKeys.includes(item.key) && item.supportingStepKeys.includes(event.stepKey));
  return <div className="mt-3">
    <details>
      <summary className={disclosureClass}>为什么出现这一步</summary>
      <div className="pb-3 text-sm leading-7">
        <p>依据仅来自本次冻结输入与当前采样世界的模拟事件。</p>
        {priorEvents.length ? <div className="mt-3"><h4 className="font-semibold">之前的模拟原因</h4><ul className="mt-1 list-disc pl-5">{priorEvents.map(item => <li key={item.stepKey}>{item.label}</li>)}</ul></div> : null}
        {facts.length ? <div className="mt-3"><h4 className="font-semibold">Reality · 已提供的现实事实</h4>{facts.map(item => <p key={item.key}>{item.statement}</p>)}</div> : null}
        {assumptions.length ? <div className="mt-3"><h4 className="font-semibold">Hypothesis · 明确的模拟假设</h4>{assumptions.map(item => <p key={item.key}>{item.statement}</p>)}</div> : null}
        {rules.length ? <div className="mt-3"><h4 className="font-semibold">Hypothesis · 本人确认的模拟规则</h4><ul className="mt-1 space-y-3">{rules.map(rule => <li key={rule.key}><p className="font-semibold">{actionLabel(rule.actionType)}</p><p>{rule.evidenceSummary}</p>{rule.guardDescription ? <p>行动条件：{rule.guardDescription}</p> : null}</li>)}</ul></div> : null}
        {event.causes.unrecorded ? <p className="mt-3">部分原因未记录为可展示的依据，不用当前资料补写。</p> : null}
        {!priorEvents.length && !facts.length && !assumptions.length && !rules.length && !event.causes.unrecorded ? <p className="mt-3">未记录可展示的前因。</p> : null}
      </div>
    </details>
    {claims.length ? <details className="border-t border-[var(--mf-border)]">
      <summary className={disclosureClass}>查看相关条件结论</summary>
      <ul className="space-y-4 pb-3 text-sm leading-7">{claims.map(claim => {
        const supports = localEvents.filter(item => claim.supportingStepKeys.includes(item.stepKey));
        return <li key={claim.key}>
          <h4 className="font-semibold">{claim.statement}</h4><p>{claim.uncertainty}</p>
          <p className="mt-2">当前采样世界的直接支持：{supports.map(item => item.label).join("；")}</p>
          {claim.supportingStepKeys.some(key => !localEvents.some(item => item.stepKey === key)) ? <p>此结论还引用本路径其他采样世界的步骤；它们不属于当前时间线。</p> : null}
          <p className="mt-2 text-[var(--text-secondary)]">条件结论来自模拟，不代表现实中已经发生或一定发生。</p>
        </li>;
      })}</ul>
    </details> : null}
  </div>;
}

function SampleTimeline({ sample, projection }: { sample: Sample; projection: PathProjection }) {
  return <ol className="mt-5 divide-y divide-[var(--mf-border)]">
    {sample.ticks.map(tick => <li key={tick.tickIndex} className="min-w-0 py-5 first:pt-0">
      <h3 className="text-base font-semibold">模拟周期 {tick.tickIndex + 1}</h3>
      {tick.status === "not_reached" ? <p className="mt-2 text-sm leading-7">未到达此模拟周期。本次模拟已结束，此处没有执行事件或状态数值。</p> : <>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{tick.occurredAt ? <>模拟时间：<time dateTime={tick.occurredAt}>{new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", dateStyle: "medium", timeStyle: "short" }).format(new Date(tick.occurredAt))}</time>（北京时间）</> : "模拟时间未记录"}</p>
        {tick.event ? <>
          <p className="mt-3 text-sm font-semibold">{eventNames[tick.event.kind]} · {tick.event.label}</p>
          <p className="mt-1 text-sm leading-7">参与者：{projection.participants.filter(item => tick.event!.participantKeys.includes(item.key)).map(item => item.label).join("、") || "未记录"}</p>
          {tick.event.relationshipKeys.length ? <p className="mt-1 text-sm leading-7">涉及关系：{projection.relationships.filter(item => tick.event!.relationshipKeys.includes(item.key)).map(item => item.label).join("、") || "未记录"}</p> : null}
          {tick.event.changes.length ? <ul className="mt-3 space-y-1 text-sm leading-7">{tick.event.changes.map((change, index) => <li key={index}>{change.label}：{displayValue(change.before, change.kind)} → {displayValue(change.after, change.kind)}{change.unit ? ` ${change.unit}` : ""}</li>)}</ul> : <p className="mt-3 text-sm">本步骤未记录可展示的状态变化。</p>}
          <EventEvidence event={tick.event} sample={sample} projection={projection} />
        </> : <p className="mt-3 text-sm leading-7">本周期未选中行动，没有产生可引用的模拟事件。</p>}
      </>}
    </li>)}
  </ol>;
}

function PathTimeline({ projection, isMain }: { projection: PathProjection; isMain: boolean }) {
  const [sampleKey, setSampleKey] = useState(projection.timeline?.samples[0]?.key ?? "");
  const samples = projection.timeline?.samples ?? [];
  const sample = samples.find(item => item.key === sampleKey) ?? samples[0];
  if (!projection.timeline) return <p className="mt-5 text-sm leading-7">此历史运行未记录逐周期时间线。下方原有模拟步骤仍可阅读；不会用当前资料补写历史。</p>;
  return <>
    <label className="mt-4 block max-w-sm text-sm font-semibold">采样世界
      <Select aria-label="采样世界" className="mt-2 max-w-full focus-visible:outline focus-visible:outline-2" value={sample?.key ?? ""} onChange={event => setSampleKey(event.target.value)}>{samples.map((item, index) => <option key={item.key} value={item.key}>采样世界 {index + 1}</option>)}</Select>
    </label>
    <p className="mt-3 text-sm leading-7" role="status">当前只展示采样世界 {samples.indexOf(sample) + 1}；采样代表重复模拟，不是独立策略，也不是现实发生概率。</p>
    {sample ? <SampleTimeline key={sample.key} sample={sample} projection={projection} /> : <p className="mt-5 text-sm">未记录可展示的采样世界。</p>}
    {isMain ? <a href="#run-outcome-observations" className="mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2">记录现实后来发生了什么</a> : <p className="mt-3 text-sm text-[var(--text-secondary)]">此策略的条件结论独立阅读；主路径反馈不会代替本策略反馈。</p>}
  </>;
}

export function LifeTimeline({ projection }: { projection: FormalSandboxResultProjection }) {
  const titleId = useId();
  const [pathKey, setPathKey] = useState("main");
  const paths = [{ key: "main", label: "本人主路径", projection }, ...(projection.strategyPaths ?? []).map((path, index) => ({ ...path, label: `策略 ${index + 1} · ${path.label}` }))];
  const selectedPath = paths.find(path => path.key === pathKey) ?? paths[0];
  return <section aria-labelledby={titleId} className="mt-8 min-w-0">
    <SurfaceCard className="min-w-0 break-words p-4 sm:p-6" padded={false}>
      <h2 id={titleId} className="text-xl font-semibold">数字生命时间线</h2>
      <p className="mt-3 max-w-prose text-sm leading-7">按本次实际执行的模拟周期，查看行动、条件回应与状态变化。模拟时间属于沙盘，不是现实事件日期或预测承诺。</p>
      <p className="mt-2 max-w-prose text-sm leading-7 text-[var(--text-secondary)]">现实输入、明确假设与模拟事件分别追溯；独立的象征对照不作为事件依据。</p>
      <label className="mt-5 block max-w-sm text-sm font-semibold">模拟路径
        <Select aria-label="模拟路径" className="mt-2 max-w-full focus-visible:outline focus-visible:outline-2" value={selectedPath.key} onChange={event => setPathKey(event.target.value)}>{paths.map(path => <option key={path.key} value={path.key}>{path.label}</option>)}</Select>
      </label>
      <PathTimeline key={selectedPath.key} projection={selectedPath.projection} isMain={selectedPath.key === "main"} />
    </SurfaceCard>
  </section>;
}
