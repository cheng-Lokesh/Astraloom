"use client";

import { useMemo, useReducer, useState } from "react";

import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { createFormalSandboxClient, type FormalSandboxResultProjection } from "@/lib/formal-sandbox/client";
import type { ResultRequestState } from "@/lib/formal-sandbox/result-request-gate";

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

export function activateClaimFromKeyboard(key: string, claimKey: string, choose: (key: string) => void) {
  if (key !== "Enter" && key !== " ") return false;
  choose(claimKey);
  return true;
}

export function FeedbackPanel({ state, onCommentChange, onSave }: { state: FeedbackState; onCommentChange: (comment: string) => void; onSave: (rating: Rating) => void }) {
  return <SurfaceCard className="mt-8 p-5"><h2>Calibrate a later Run</h2><textarea value={state.comment} onChange={(event) => onCommentChange(event.target.value)} maxLength={2000} className="mt-3 min-h-24 w-full focus-visible:outline focus-visible:outline-2" placeholder="Optional short note" /> <div className="mt-3 flex gap-2">{(["useful", "mixed", "off"] as const).map((value) => <button key={value} type="button" onClick={() => onSave(value)} aria-pressed={state.rating === value} className="min-h-10 px-3 focus-visible:outline focus-visible:outline-2 active:scale-95 motion-reduce:transition-none">{value}</button>)}</div>{state.message ? <p role="status">{state.message}</p> : null}{state.saved ? <ButtonLink href="/app/dashboard" className="mt-5">回到 My Sandbox 查看下一步</ButtonLink> : null}</SurfaceCard>;
}

export function FrozenRealityProfileCard({ profile }: { profile: FormalSandboxResultProjection["realityProfile"] }) {
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
  </SurfaceCard>;
}

export function ResourceChangeCard({ changes }: { changes: FormalSandboxResultProjection["resourceChanges"] }) {
  const paths = [...new Set(changes.map((item) => item.pathKey))];
  return <SurfaceCard className="mt-8 p-5">
    <h2>结构化资源变化 · 模拟路径</h2>
    <p className="mt-2 text-sm leading-6">只展示由用户明确输入的资源；数值变化属于受控模拟，不代表现实中已经发生或必然发生。</p>
    {paths.length ? <div className="mt-4 grid gap-4 md:grid-cols-3">{paths.map((pathKey) => <section key={pathKey} className="border border-white/10 p-4"><h3 className="font-semibold">路径 {pathKey.slice("path-".length)}</h3>{changes.filter((item) => item.pathKey === pathKey).map((item) => <p key={item.key} className="mt-3 text-sm leading-6"><strong>{item.label}</strong><br />{item.before} → {item.after} {item.unit}<br /><span className="text-[var(--text-muted)]">最低保留 {item.minimum} · 上限 {item.maximum}</span></p>)}</section>)}</div> : <p className="mt-4 text-sm text-[var(--text-secondary)]">此历史 Run 没有可对比的结构化资源快照。</p>}
  </SurfaceCard>;
}

export function EvidenceWorkbenchView({ projection, selectedClaimKey, onChooseClaim, feedbackState, onCommentChange, onSaveFeedback }: { projection: FormalSandboxResultProjection; selectedClaimKey: string | null; onChooseClaim: (key: string) => void; feedbackState: FeedbackState; onCommentChange: (comment: string) => void; onSaveFeedback: (rating: Rating) => void }) {
  const claim = projection.claims.find((item) => item.key === selectedClaimKey);
  const selectedKeys = new Set([...(claim?.supportingStepKeys ?? []), ...(claim?.participantKeys ?? []), ...(claim?.relationshipKeys ?? [])]);
  return <section id="main-content" className="mx-auto max-w-6xl overflow-x-hidden py-8 sm:py-14"><header><p>Evidence workbench</p><h1>A conditional map, backed by frozen inputs and simulated steps.</h1><p>User-provided facts, explicit assumptions, unknowns, sandbox simulation, and conditional conclusions remain separate.</p></header><FrozenRealityProfileCard profile={projection.realityProfile} /><ResourceChangeCard changes={projection.resourceChanges} /><div className="mt-8 grid gap-6 md:grid-cols-2"><SurfaceCard className="p-4"><h2>User-provided facts</h2><p className="text-sm">Reality evidence used by this Run, excluding the private Seed narrative.</p>{projection.facts.map((item) => <p key={item.key} className="mt-2">{item.statement}</p>)}</SurfaceCard><SurfaceCard className="p-4"><h2>System assumptions</h2><p className="text-sm">Explicit simulation assumptions, not verified facts.</p>{projection.assumptions.map((item) => <p key={item.key} className="mt-2">{item.statement}</p>)}</SurfaceCard></div><div className="mt-8 grid gap-6 lg:grid-cols-2"><div><h2>Conditional conclusions</h2>{projection.claims.map((item) => <button key={item.key} type="button" onClick={() => onChooseClaim(item.key)} onKeyDown={(event) => activateClaimFromKeyboard(event.key, item.key, onChooseClaim)} aria-pressed={selectedClaimKey === item.key} className="mt-3 block min-h-10 w-full p-4 text-left focus-visible:outline focus-visible:outline-2 active:scale-95 motion-reduce:transition-none"><strong>{item.statement}</strong><span>{item.uncertainty}</span></button>)}</div><div><h2>Direct supporting simulation steps</h2>{projection.steps.map((item) => <SurfaceCard key={item.key} className={selectedKeys.has(item.key) ? "mt-3 p-4 ring-2 ring-[var(--evidence-gold)]" : "mt-3 p-4"}><b>Step {item.order}</b><p>{item.label}. This is a simulation step, not a real-world event.</p></SurfaceCard>)}<h2 className="mt-6">Frozen participants and relations</h2>{projection.participants.map((item) => <p key={item.key} className={selectedKeys.has(item.key) ? "font-semibold text-[var(--evidence-gold)]" : ""}>{item.label} · {item.role}</p>)}{projection.relationships.map((item) => <p key={item.key} className={selectedKeys.has(item.key) ? "font-semibold text-[var(--evidence-gold)]" : ""}>{item.label}</p>)}</div></div><FeedbackPanel state={feedbackState} onCommentChange={onCommentChange} onSave={onSaveFeedback} /></section>;
}

export function ResultWorkbench({ projection, runId }: { projection: FormalSandboxResultProjection; runId: string }) {
  const [selectedClaimKey, setSelectedClaimKey] = useState<string | null>(null);
  const [feedbackState, dispatch] = useReducer(feedbackReducer, initialFeedbackState);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const save = async (rating: Rating) => {
    dispatch({ type: "save_started" });
    const result = await createFormalSandboxClient().feedback(runId, { rating, comment: feedbackState.comment, idempotencyKey });
    dispatch(result.ok ? { type: "save_succeeded", rating } : { type: "save_failed" });
  };
  return <EvidenceWorkbenchView projection={projection} selectedClaimKey={selectedClaimKey} onChooseClaim={setSelectedClaimKey} feedbackState={feedbackState} onCommentChange={(comment) => dispatch({ type: "comment_changed", comment })} onSaveFeedback={(rating) => void save(rating)} />;
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
