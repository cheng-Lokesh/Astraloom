"use client";

import { useReducer, useRef, useState } from "react";

import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { createFormalSandboxClient, type FormalSandboxResultProjection } from "@/lib/formal-sandbox/client";
import type { ResultRequestState } from "@/lib/formal-sandbox/result-request-gate";
import { actionLabel } from "@/components/formal-sandbox/digital-life-rules-editor";
import { FrozenSymbolicResult } from "./frozen-symbolic-result";
import { OutcomeObservations } from "@/components/formal-sandbox/outcome-observations";

type Rating = "useful" | "mixed" | "off";
export type FeedbackState = { rating: Rating | null; comment: string; message: string; saved: boolean };
export const initialFeedbackState: FeedbackState = { rating: null, comment: "", message: "", saved: false };
export type FeedbackAction =
  | { type: "comment_changed"; comment: string }
  | { type: "save_started" }
  | { type: "save_succeeded"; rating: Rating }
  | { type: "save_failed" };

export function feedbackReducer(state: FeedbackState, action: FeedbackAction): FeedbackState {
  if (action.type === "comment_changed") return { ...state, comment: action.comment };
  if (action.type === "save_started") return { ...state, message: "", saved: false };
  if (action.type === "save_succeeded") return { ...state, rating: action.rating, message: "Feedback saved as input for a later Run.", saved: true };
  return { ...state, message: "Feedback was not saved. Your selection and note are still here.", saved: false };
}

export type FeedbackTargetType = "claim" | "agent" | "relation_edge";
export type TargetedRating = "accurate" | "partly_right" | "off" | "unclear" | "not_happened_yet";
export type FeedbackTarget = { targetType: FeedbackTargetType; targetKey: string; targetLabel: string };
export type TargetedFeedbackState = { rating: TargetedRating | null; comment: string; message: string; saved: boolean };
export const initialTargetedFeedbackState: TargetedFeedbackState = { rating: null, comment: "", message: "", saved: false };
export type TargetedFeedbackAction =
  | { type: "target_changed" }
  | { type: "rating_changed"; rating: TargetedRating }
  | { type: "comment_changed"; comment: string }
  | { type: "save_started" }
  | { type: "save_succeeded" }
  | { type: "save_failed" };

export function targetedFeedbackReducer(state: TargetedFeedbackState, action: TargetedFeedbackAction): TargetedFeedbackState {
  if (action.type === "target_changed") return initialTargetedFeedbackState;
  if (action.type === "rating_changed") return { ...state, rating: action.rating, message: "", saved: false };
  if (action.type === "comment_changed") return { ...state, comment: action.comment, message: "", saved: false };
  if (action.type === "save_started") return { ...state, message: "" };
  if (action.type === "save_succeeded") return { ...state, message: "已保存为后续模拟参考，本次结果不变。 · Saved for a later Run; this result stays unchanged.", saved: true };
  return { ...state, message: "未能保存。你的选择和说明还在。 · Could not save; your selection and note are still here.", saved: false };
}

const targetedRatings: Record<FeedbackTargetType, Array<{ value: TargetedRating; label: string }>> = {
  claim: [
    { value: "accurate", label: "准确 · Accurate" },
    { value: "partly_right", label: "部分准确 · Partly right" },
    { value: "off", label: "不准确 · Off" },
    { value: "unclear", label: "不清楚 · Unclear" },
    { value: "not_happened_yet", label: "尚未发生 · Not happened yet" },
  ],
  agent: [
    { value: "accurate", label: "符合 · Accurate" },
    { value: "partly_right", label: "部分符合 · Partly right" },
    { value: "off", label: "不符合 · Off" },
    { value: "unclear", label: "不清楚 · Unclear" },
  ],
  relation_edge: [
    { value: "accurate", label: "符合 · Accurate" },
    { value: "partly_right", label: "部分符合 · Partly right" },
    { value: "off", label: "不符合 · Off" },
    { value: "unclear", label: "不清楚 · Unclear" },
  ],
};

const targetedFeedbackTitles: Record<FeedbackTargetType, string> = {
  claim: "评价这条结论 · Feedback on this conclusion",
  agent: "评价人物判断 · Feedback on this participant",
  relation_edge: "评价关系判断 · Feedback on this relation",
};

export function TargetedFeedbackPanel({ targetType, targetLabel, state, onRatingChange, onCommentChange, onSave, saving }: {
  targetType: FeedbackTargetType;
  targetKey: string;
  targetLabel: string;
  state: TargetedFeedbackState;
  onRatingChange: (rating: TargetedRating) => void;
  onCommentChange: (comment: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return <SurfaceCard className="mt-4 p-4">
    <h3>{targetedFeedbackTitles[targetType]}</h3>
    <p className="mt-2 text-sm">{targetLabel}</p>
    <p className="mt-2 text-sm">意见只供后续模拟参考，不会更改本次结果。 · This is a signal for later Runs; it will not change this result.</p>
    <fieldset className="mt-4">
      <legend className="text-sm font-semibold">请选择最接近的评价 · Choose the closest response</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {targetedRatings[targetType].map((choice, index) => {
          const id = `target-feedback-${targetType}-choice-${index + 1}`;
          return <label key={choice.value} htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-2 px-3 focus-within:outline focus-within:outline-2">
            <input id={id} type="radio" name={`target-feedback-${targetType}`} value={choice.value} checked={state.rating === choice.value} onChange={() => onRatingChange(choice.value)} />
            <span>{choice.label}</span>
          </label>;
        })}
      </div>
    </fieldset>
    <label className="mt-4 block text-sm font-semibold">
      补充说明 · Optional note
      <textarea value={state.comment} onChange={(event) => onCommentChange(event.target.value)} maxLength={2000} className="mt-2 min-h-20 w-full p-3 font-normal focus-visible:outline focus-visible:outline-2" />
    </label>
    <button type="button" onClick={onSave} disabled={!state.rating || saving || state.saved} className="mt-4 min-h-11 px-4 focus-visible:outline focus-visible:outline-2 disabled:opacity-50">
      {saving ? "正在保存 · Saving" : "保存意见 · Save feedback"}
    </button>
    {state.message ? <p role="status" className="mt-3 text-sm">{state.message}</p> : null}
  </SurfaceCard>;
}

export function activateClaimFromKeyboard(key: string, claimKey: string, choose: (key: string) => void) {
  if (key !== "Enter" && key !== " ") return false;
  choose(claimKey);
  return true;
}

export function FeedbackPanel({ state, onCommentChange, onSave }: { state: FeedbackState; onCommentChange: (comment: string) => void; onSave: (rating: Rating) => void }) {
  return <SurfaceCard className="mt-8 p-5"><h2>Calibrate a later Run</h2><textarea value={state.comment} onChange={(event) => onCommentChange(event.target.value)} maxLength={2000} className="mt-3 min-h-24 w-full focus-visible:outline focus-visible:outline-2" placeholder="Optional short note" /> <div className="mt-3 flex gap-2">{(["useful", "mixed", "off"] as const).map((value) => <button key={value} type="button" onClick={() => onSave(value)} aria-pressed={state.rating === value} className="min-h-10 px-3 focus-visible:outline focus-visible:outline-2 active:scale-95 motion-reduce:transition-none">{value}</button>)}</div>{state.message ? <p role="status">{state.message}</p> : null}{state.saved ? <ButtonLink href="/app/dashboard" className="mt-5">回到 My Sandbox 查看下一步</ButtonLink> : null}</SurfaceCard>;
}

export function FrozenRealityProfileCard({ profile }: { profile: FormalSandboxResultProjection["realityProfile"] }) {
  const worldVariables = profile.worldVariables;
  return <SurfaceCard className="mt-8 p-5">
    <h2>本次运行冻结的 Reality Profile</h2>
    {profile.status === "frozen" ? <p className="mt-2 text-sm">Revision {profile.revision}</p> : <p className="mt-2 text-sm">此历史 Run 未记录 Reality Profile 快照。</p>}
    <div className="mt-5 grid gap-5 md:grid-cols-3">
      <section aria-labelledby="run-profile-facts"><h3 id="run-profile-facts">明确事实</h3>{profile.facts.length ? profile.facts.map((item) => <div key={item.key} className="mt-3"><p><strong>{item.label}：</strong>{item.statement}</p><p className="text-sm">依据：{item.evidenceSummary}</p></div>) : <p className="mt-2 text-sm">暂无已记录事实</p>}</section>
      <section aria-labelledby="run-profile-assumptions"><h3 id="run-profile-assumptions">明确假设</h3>{profile.assumptions.length ? profile.assumptions.map((item) => <div key={item.key} className="mt-3"><p><strong>{item.label}：</strong>{item.statement}</p><p className="text-sm">依据：{item.evidenceSummary}</p></div>) : <p className="mt-2 text-sm">暂无已记录假设</p>}</section>
      <section aria-labelledby="run-profile-unknowns"><h3 id="run-profile-unknowns">仍然未知</h3>{profile.unknowns.length ? profile.unknowns.map((item) => <p key={item.key} className="mt-2">{item.label}：明确未知</p>) : <p className="mt-2 text-sm">没有单独标记为未知的 Profile 项</p>}</section>
    </div>
    <div className="mt-6 grid gap-5 border-t border-white/10 pt-5 md:grid-cols-2">
      <section aria-labelledby="run-structured-resources"><h3 id="run-structured-resources">冻结的结构化资源</h3>{profile.structuredResources.length ? profile.structuredResources.map((item) => <div key={item.key} className="mt-3"><p><strong>{item.label}</strong> · {item.available} {item.unit} · {item.classification === "fact" ? "事实" : "模拟假设"}</p><p className="text-sm">区间 {item.minimum}–{item.maximum} {item.unit}{item.usePerTick === null ? " · 未设资源变化规则" : ` · 每次受控行动变化 ${item.usePerTick} ${item.unit}`}</p><p className="text-sm">依据：{item.evidenceSummary}</p></div>) : <p className="mt-2 text-sm">此 Run 没有冻结结构化资源输入。</p>}</section>
      <section aria-labelledby="run-structured-constraints"><h3 id="run-structured-constraints">冻结的时间限制</h3>{profile.structuredConstraints.length ? profile.structuredConstraints.map((item) => <div key={item.key} className="mt-3"><p><strong>{item.label}</strong> · {item.resourceLabel}</p><p className="text-sm">{new Date(item.rule.value).toLocaleString()} 之前 · {item.classification === "fact" ? "事实" : "模拟假设"}</p><p className="text-sm">依据：{item.evidenceSummary}</p></div>) : <p className="mt-2 text-sm">此 Run 没有冻结明确的时间限制。</p>}</section>
    </div>
    <section aria-labelledby="run-world-variables" className="mt-6 border-t border-white/10 pt-5"><h3 id="run-world-variables">进入本次模拟的压力与外部变量</h3>{worldVariables.length ? worldVariables.map((item) => <div key={item.key} className="mt-3"><p><strong>{item.label}：</strong>{item.value} · {item.classification === "fact" ? "事实" : "模拟假设"}</p><p className="text-sm">依据：{item.evidenceSummary}</p><p className="text-sm">{item.state === "static_without_explicit_rule" ? "未提供变化规则，保持静态" : "此历史 Run 未记录该变量是否进入 World，状态未记录"}</p></div>) : <p className="mt-2 text-sm">没有明确分类的压力或外部变量进入本次模拟。</p>}</section>
  </SurfaceCard>;
}

export function ResourceChangeCard({ changes }: { changes: FormalSandboxResultProjection["resourceChanges"] }) {
  const paths = [...new Set(changes.map((item) => item.pathKey))];
  return <SurfaceCard className="mt-8 p-5">
    <h2>结构化资源变化 · 模拟路径</h2>
    <p className="mt-2 text-sm leading-6">只展示由用户明确输入的资源；此处路径编号表示重复模拟的采样，不是独立策略。数值变化属于受控模拟，不代表现实中已经发生或必然发生。</p>
    {paths.length ? <div className="mt-4 grid gap-4 md:grid-cols-3">{paths.map((pathKey) => <section key={pathKey} className="border border-white/10 p-4"><h3 className="font-semibold">路径 {pathKey.slice("path-".length)}</h3>{changes.filter((item) => item.pathKey === pathKey).map((item) => <p key={item.key} className="mt-3 text-sm leading-6"><strong>{item.label}</strong><br />{item.before} → {item.after} {item.unit}<br /><span className="text-[var(--text-muted)]">最低保留 {item.minimum} · 上限 {item.maximum}</span></p>)}</section>)}</div> : <p className="mt-4 text-sm text-[var(--text-secondary)]">此历史 Run 没有可对比的结构化资源快照。</p>}
  </SurfaceCard>;
}

export function DigitalLifeModelCard({ model }: { model?: FormalSandboxResultProjection["digitalLifeModel"] }) {
  if (!model || model.status === "not_recorded") return <SurfaceCard className="mt-8 p-5"><h2>未记录数字生命规则</h2><p className="mt-2 text-sm leading-6">此历史运行没有冻结数字生命模型，不会用当前资料补写历史。</p><ButtonLink href="/app/reality-profile" variant="ghost" className="!w-auto mt-3">修改模型，供下一次运行使用</ButtonLink></SurfaceCard>;
  const labels = new Map(model.agents.map(agent => [agent.key, agent.label]));
  const classifications = { fact: "事实", assumption: "假设", unknown: "未知" } as const;
  const roles = { user_core: "本人", user_variant: "平行策略", npc: "关键人物", group: "群体" } as const;
  return <SurfaceCard className="mt-8 min-w-0 p-5">
    <h2>本次冻结的数字生命模型</h2><p className="mt-2 max-w-prose text-sm leading-6">背景记录说明模型的输入，并不自动成为因果规则。模拟行动和第三方条件回应均为已确认的假设。</p>
    <div className="mt-5 grid min-w-0 gap-5 md:grid-cols-3">{(["fact", "assumption", "unknown"] as const).map(classification => <section key={classification}><h3 className="font-semibold">{classifications[classification]} · {model.background.filter(item => item.classification === classification).length}</h3>{model.background.filter(item => item.classification === classification).map(item => <p key={item.key} className="mt-3 break-words text-sm leading-6"><strong>{item.label}</strong>：{classification === "unknown" ? "尚未提供" : item.value}<br /><span className="text-[var(--text-secondary)]">依据：{item.evidenceSummary}</span></p>)}</section>)}</div>
    <section className="mt-6 border-t border-white/15 pt-5"><h3 className="font-semibold">人物与策略定义</h3>{model.agents.map(agent => <p key={agent.key} className="mt-2 break-words text-sm leading-6">{agent.label} · {roles[agent.role]}{agent.role === "user_variant" ? agent.strategyStatus === "explicit" ? " · 已定义独立策略" : " · 尚未定义策略行为" : ""}<br /><span className="text-[var(--text-secondary)]">{agent.evidenceSummary}</span></p>)}</section>
    <section className="mt-6 border-t border-white/15 pt-5"><h3 className="font-semibold">确认的条件行动</h3>{model.rules.length ? model.rules.map((rule, index) => <div key={rule.key} className="mt-3 text-sm leading-6"><p>行动 {index + 1} · {labels.get(rule.actorKey) ?? "冻结人物"} · {actionLabel(rule.actionType)} · 模拟假设</p><p>{rule.when.kind === "at_tick" ? `第 ${rule.when.tickIndex + 1} 模拟周期` : `行动 ${model.rules.findIndex(item => item.key === (rule.when.kind === "after_rule" ? rule.when.ruleKey : "")) + 1} 之后`} · {rule.pathKey === "main" ? "本人主路径" : `${labels.get(rule.pathKey) ?? "平行策略"}的独立世界`}</p>{rule.operation.actionType === "request_information" ? <p>向{labels.get(rule.operation.targetPersonKey) ?? "关键人物"}询问：{rule.operation.question}</p> : rule.operation.actionType === "update_commitment" ? <p>承诺：{rule.operation.label}</p> : rule.operation.actionType === "allocate_resource" ? <p>投入量：{rule.operation.amount} · 资源依据见冻结资源</p> : <p>假设回应：{{ positive: "积极", neutral: "中性", negative: "消极" }[rule.operation.signal]}，不代表已知其真实想法。</p>}<p className="text-[var(--text-secondary)]">来源：{rule.evidenceSummary}</p></div>) : <p className="mt-3 text-sm">没有添加显式行动规则，不推断他人意图。</p>}</section>
    <ul className="mt-5 space-y-1 text-sm leading-6 text-[var(--text-secondary)]">{model.limitations.map(limit => <li key={limit}>{limit}</li>)}</ul><ButtonLink href="/app/reality-profile" variant="ghost" className="!w-auto mt-4">修正模型，供下一次运行使用</ButtonLink>
  </SurfaceCard>;
}

function RelationshipChangeLedger({ projection }: { projection: FormalSandboxResultProjection }) {
  const directions = { positive: "积极", neutral: "中性", negative: "消极" };
  return <section className="mt-5"><h3 className="font-semibold">受控关系回应变化</h3><p className="mt-2 text-sm leading-6">由你确认的条件回应假设产生，属于模拟变化；原始关系图与现实关系未被修改。</p>{projection.relationshipChanges?.length ? projection.relationshipChanges.map(change => <p key={change.key} className="mt-3 text-sm leading-6">{projection.relationships.find(item => item.key === change.relationshipKey)?.label ?? "冻结关系"} · {directions[change.before]} → {directions[change.after]}<br />依据：模拟步骤 {projection.steps.find(item => item.key === change.stepKey)?.order ?? "未记录"}</p>) : <p className="mt-2 text-sm text-[var(--text-secondary)]">没有记录关系回应变化。</p>}</section>;
}

export function StrategyPathsCard({ paths = [] }: { paths?: FormalSandboxResultProjection["strategyPaths"] }) {
  return <section className="mt-8">
    <h2>独立策略比较</h2>
    <p className="mt-2 max-w-prose text-sm leading-6">每个策略从同一冻结背景开始，使用自己的独立世界。策略结果不会合并；采样路径描述重复模拟，不是策略分支。</p>
    {paths.length ? paths.map((path, index) => <SurfaceCard key={path.key} className="mt-5 min-w-0 p-5">
      <h3 className="break-words text-lg font-semibold">策略 {index + 1} · {path.label}</h3>
      <p className="mt-2 text-sm">独立模拟 · 条件结论 · 仅供比较，不代表现实发生概率。</p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section><h4 className="font-semibold">本策略条件结论与依据</h4>{path.projection.claims.length ? path.projection.claims.map(claim => <div key={claim.key} className="mt-3 text-sm leading-6"><p>{claim.statement}</p><p className="text-[var(--text-secondary)]">{claim.uncertainty}</p><p>直接支持步骤：{claim.supportingStepKeys.map(key => path.projection.steps.find(step => step.key === key)?.order).filter(Boolean).join("、")}</p></div>) : <p className="mt-3 text-sm">没有已保存的条件结论。</p>}</section>
        <section><h4 className="font-semibold">本策略模拟步骤</h4>{path.projection.steps.length ? path.projection.steps.map(step => <p key={step.key} className="mt-3 text-sm leading-6">步骤 {step.order} · {step.label}<br /><span className="text-[var(--text-secondary)]">模拟事件，不是现实证据</span></p>) : <p className="mt-3 text-sm">没有已保存的模拟步骤。</p>}</section>
      </div>
      <section className="mt-5"><h4 className="font-semibold">本策略独立资源变化</h4>{path.projection.resourceChanges.length ? path.projection.resourceChanges.map(change => <p key={change.key} className="mt-3 text-sm leading-6">{change.label} · {change.before} → {change.after} {change.unit}<br /><span className="text-[var(--text-secondary)]">模拟变化 · 最低保留 {change.minimum} · 上限 {change.maximum}</span></p>) : <p className="mt-3 text-sm">没有已保存的结构化资源变化。</p>}</section>
      <RelationshipChangeLedger projection={path.projection} />
      <p className="mt-5 text-sm text-[var(--text-secondary)]">此策略的独立结论暂不支持条目反馈，主路径反馈不会用于替代它。</p>
    </SurfaceCard>) : <p className="mt-4 text-sm text-[var(--text-secondary)]">本次运行未设置独立策略。不会从人物名称自动生成策略。</p>}
  </section>;
}

export function EvidenceWorkbenchView({ projection, selectedClaimKey, onChooseClaim, feedbackState, onCommentChange, onSaveFeedback, targetFeedbackTarget, targetFeedbackState, targetFeedbackSaving, onChooseFeedbackTarget, onTargetRatingChange, onTargetCommentChange, onSaveTargetFeedback }: {
  projection: FormalSandboxResultProjection;
  selectedClaimKey: string | null;
  onChooseClaim: (key: string) => void;
  feedbackState: FeedbackState;
  onCommentChange: (comment: string) => void;
  onSaveFeedback: (rating: Rating) => void;
  targetFeedbackTarget: FeedbackTarget | null;
  targetFeedbackState: TargetedFeedbackState;
  targetFeedbackSaving: boolean;
  onChooseFeedbackTarget: (target: FeedbackTarget | null) => void;
  onTargetRatingChange: (rating: TargetedRating) => void;
  onTargetCommentChange: (comment: string) => void;
  onSaveTargetFeedback: () => void;
}) {
  const claim = projection.claims.find((item) => item.key === selectedClaimKey);
  const selectedKeys = new Set([...(claim?.supportingStepKeys ?? []), ...(claim?.participantKeys ?? []), ...(claim?.relationshipKeys ?? [])]);
  const feedbackIsOpen = (target: FeedbackTarget) => targetFeedbackTarget?.targetType === target.targetType && targetFeedbackTarget.targetKey === target.targetKey;
  const renderTargetFeedback = (target: FeedbackTarget) => feedbackIsOpen(target)
    ? <TargetedFeedbackPanel targetType={target.targetType} targetKey={target.targetKey} targetLabel={target.targetLabel} state={targetFeedbackState} onRatingChange={onTargetRatingChange} onCommentChange={onTargetCommentChange} onSave={onSaveTargetFeedback} saving={targetFeedbackSaving} />
    : null;
  const toggleTargetFeedback = (target: FeedbackTarget) => onChooseFeedbackTarget(feedbackIsOpen(target) ? null : target);

  return <section id="main-content" className="mx-auto max-w-6xl overflow-x-hidden py-8 sm:py-14">
    <header>
      <p>Evidence workbench</p>
      <h1>A conditional map, backed by frozen inputs and simulated steps.</h1>
      <p>User-provided facts, explicit assumptions, unknowns, sandbox simulation, and conditional conclusions remain separate.</p>
    </header>
    <FrozenRealityProfileCard profile={projection.realityProfile} />
    <DigitalLifeModelCard model={projection.digitalLifeModel} />
    <FrozenSymbolicResult lens={projection.symbolicLens} />
    <ResourceChangeCard changes={projection.resourceChanges} />
    <RelationshipChangeLedger projection={projection} />
    <StrategyPathsCard paths={projection.strategyPaths} />
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <SurfaceCard className="p-4"><h2>User-provided facts</h2><p className="text-sm">Reality evidence used by this Run, excluding the private Seed narrative.</p>{projection.facts.map((item) => <p key={item.key} className="mt-2">{item.statement}</p>)}</SurfaceCard>
      <SurfaceCard className="p-4"><h2>System assumptions</h2><p className="text-sm">Explicit simulation assumptions, not verified facts.</p>{projection.assumptions.map((item) => <p key={item.key} className="mt-2">{item.statement}</p>)}</SurfaceCard>
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div>
        <h2>Conditional conclusions</h2>
        {projection.claims.map((item) => {
          const target: FeedbackTarget = { targetType: "claim", targetKey: item.key, targetLabel: item.statement };
          return <SurfaceCard key={item.key} className="mt-3 p-4">
            <button type="button" onClick={() => onChooseClaim(item.key)} onKeyDown={(event) => activateClaimFromKeyboard(event.key, item.key, onChooseClaim)} aria-pressed={selectedClaimKey === item.key} className="block min-h-11 w-full text-left focus-visible:outline focus-visible:outline-2 active:scale-95 motion-reduce:transition-none">
              <strong className="block">{item.statement}</strong>
              <span className="mt-2 block">{item.uncertainty}</span>
            </button>
            <button type="button" onClick={() => toggleTargetFeedback(target)} aria-expanded={feedbackIsOpen(target)} className="mt-3 min-h-11 px-3 text-left focus-visible:outline focus-visible:outline-2">
              {feedbackIsOpen(target) ? "收起评价 · Close feedback" : "反馈这条结论 · Feedback on this conclusion"}
            </button>
            {renderTargetFeedback(target)}
          </SurfaceCard>;
        })}
      </div>
      <div>
        <h2>Direct supporting simulation steps</h2>
        {projection.steps.map((item) => <SurfaceCard key={item.key} className={selectedKeys.has(item.key) ? "mt-3 p-4 ring-2 ring-[var(--evidence-gold)]" : "mt-3 p-4"}><b>Step {item.order}</b><p>{item.label}. This is a simulation step, not a real-world event.</p></SurfaceCard>)}
        <h2 className="mt-6">Frozen participants and relations</h2>
        {projection.participants.map((item) => {
          const target: FeedbackTarget = { targetType: "agent", targetKey: item.key, targetLabel: item.label };
          return <div key={item.key} className="mt-3">
            <p className={selectedKeys.has(item.key) ? "font-semibold text-[var(--evidence-gold)]" : ""}>{item.label} · {item.role}</p>
            <button type="button" onClick={() => toggleTargetFeedback(target)} aria-expanded={feedbackIsOpen(target)} className="mt-1 min-h-11 px-2 text-left focus-visible:outline focus-visible:outline-2">{feedbackIsOpen(target) ? "收起人物评价 · Close" : "反馈人物判断 · Feedback on this participant"}</button>
            {renderTargetFeedback(target)}
          </div>;
        })}
        {projection.relationships.map((item) => {
          const target: FeedbackTarget = { targetType: "relation_edge", targetKey: item.key, targetLabel: item.label };
          return <div key={item.key} className="mt-3">
            <p className={selectedKeys.has(item.key) ? "font-semibold text-[var(--evidence-gold)]" : ""}>{item.label}</p>
            <button type="button" onClick={() => toggleTargetFeedback(target)} aria-expanded={feedbackIsOpen(target)} className="mt-1 min-h-11 px-2 text-left focus-visible:outline focus-visible:outline-2">{feedbackIsOpen(target) ? "收起关系评价 · Close" : "反馈关系判断 · Feedback on this relation"}</button>
            {renderTargetFeedback(target)}
          </div>;
        })}
      </div>
    </div>
    <FeedbackPanel state={feedbackState} onCommentChange={onCommentChange} onSave={onSaveFeedback} />
  </section>;
}

export function ResultWorkbench({ projection, runId }: { projection: FormalSandboxResultProjection; runId: string }) {
  const [selectedClaimKey, setSelectedClaimKey] = useState<string | null>(null);
  const [feedbackState, dispatch] = useReducer(feedbackReducer, initialFeedbackState);
  const [targetFeedbackTarget, setTargetFeedbackTarget] = useState<FeedbackTarget | null>(null);
  const [targetFeedbackState, dispatchTargetFeedback] = useReducer(targetedFeedbackReducer, initialTargetedFeedbackState);
  const [targetFeedbackSaving, setTargetFeedbackSaving] = useState(false);
  const targetSaveInFlight = useRef(false);
  const save = async (rating: Rating) => {
    dispatch({ type: "save_started" });
    try {
      const result = await createFormalSandboxClient().feedback(runId, { rating, comment: feedbackState.comment, idempotencyKey: crypto.randomUUID() });
      dispatch(result.ok ? { type: "save_succeeded", rating } : { type: "save_failed" });
    } catch {
      dispatch({ type: "save_failed" });
    }
  };
  const chooseFeedbackTarget = (target: FeedbackTarget | null) => {
    setTargetFeedbackTarget(target);
    dispatchTargetFeedback({ type: "target_changed" });
  };
  const saveTargetFeedback = async () => {
    if (!targetFeedbackTarget || !targetFeedbackState.rating || targetSaveInFlight.current) return;
    targetSaveInFlight.current = true;
    setTargetFeedbackSaving(true);
    dispatchTargetFeedback({ type: "save_started" });
    try {
      const result = await createFormalSandboxClient().feedback(runId, {
        targetType: targetFeedbackTarget.targetType,
        targetKey: targetFeedbackTarget.targetKey,
        rating: targetFeedbackState.rating,
        comment: targetFeedbackState.comment,
        idempotencyKey: crypto.randomUUID(),
      });
      dispatchTargetFeedback(result.ok ? { type: "save_succeeded" } : { type: "save_failed" });
    } catch {
      dispatchTargetFeedback({ type: "save_failed" });
    } finally {
      targetSaveInFlight.current = false;
      setTargetFeedbackSaving(false);
    }
  };
  return <><EvidenceWorkbenchView
    projection={projection}
    selectedClaimKey={selectedClaimKey}
    onChooseClaim={setSelectedClaimKey}
    feedbackState={feedbackState}
    onCommentChange={(comment) => dispatch({ type: "comment_changed", comment })}
    onSaveFeedback={(rating) => void save(rating)}
    targetFeedbackTarget={targetFeedbackTarget}
    targetFeedbackState={targetFeedbackState}
    targetFeedbackSaving={targetFeedbackSaving}
    onChooseFeedbackTarget={chooseFeedbackTarget}
    onTargetRatingChange={(rating) => dispatchTargetFeedback({ type: "rating_changed", rating })}
    onTargetCommentChange={(comment) => dispatchTargetFeedback({ type: "comment_changed", comment })}
    onSaveTargetFeedback={() => void saveTargetFeedback()}
  /><OutcomeObservations key={runId} runId={runId} /></>;
}

export function ResultLoading() { return <section className="mx-auto max-w-4xl py-12"><p role="status">Reading saved evidence</p></section>; }
export function ResultEmpty() { return <section className="mx-auto max-w-4xl py-12"><p role="alert">Choose a formal Run from History.</p><ButtonLink href="/app/archive" className="mt-5">Open History</ButtonLink></section>; }

export type ResultSurfaceState = ResultRequestState<FormalSandboxResultProjection> | { phase: "loading"; runId: null };
export function ResultSurface({ runId, state, onRetry }: { runId: string | null; state: ResultSurfaceState; onRetry: () => void }) {
  if (!runId) return <ResultEmpty />;
  if (state.runId !== runId || state.phase === "loading") return <ResultLoading />;
  if (state.phase === "error") return <section className="mx-auto max-w-4xl py-12"><p role="alert">{state.message}</p><Button onClick={onRetry} className="mt-5">Retry</Button></section>;
  return <ResultWorkbench projection={state.projection} runId={runId} />;
}
