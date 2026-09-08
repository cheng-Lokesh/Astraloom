"use client";

import { useMemo, useReducer, useState } from "react";

import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { createFormalSandboxClient, type FormalSandboxResultProjection } from "@/lib/formal-sandbox/client";
import type { ResultRequestState } from "@/lib/formal-sandbox/result-request-gate";

type Rating = "useful" | "mixed" | "off";
export type FeedbackState = { rating: Rating | null; comment: string; message: string };
export const initialFeedbackState: FeedbackState = { rating: null, comment: "", message: "" };
export type FeedbackAction =
  | { type: "comment_changed"; comment: string }
  | { type: "save_started" }
  | { type: "save_succeeded"; rating: Rating }
  | { type: "save_failed" };

export function feedbackReducer(state: FeedbackState, action: FeedbackAction): FeedbackState {
  if (action.type === "comment_changed") return { ...state, comment: action.comment };
  if (action.type === "save_started") return { ...state, message: "" };
  if (action.type === "save_succeeded") return { ...state, rating: action.rating, message: "Feedback saved as input for a later Run." };
  return { ...state, message: "Feedback was not saved. Your selection and note are still here." };
}

export function activateClaimFromKeyboard(key: string, claimKey: string, choose: (key: string) => void) {
  if (key !== "Enter" && key !== " ") return false;
  choose(claimKey);
  return true;
}

export function FeedbackPanel({ state, onCommentChange, onSave }: { state: FeedbackState; onCommentChange: (comment: string) => void; onSave: (rating: Rating) => void }) {
  return <SurfaceCard className="mt-8 p-5"><h2>Calibrate a later Run</h2><textarea value={state.comment} onChange={(event) => onCommentChange(event.target.value)} maxLength={2000} className="mt-3 min-h-24 w-full focus-visible:outline focus-visible:outline-2" placeholder="Optional short note" /> <div className="mt-3 flex gap-2">{(["useful", "mixed", "off"] as const).map((value) => <button key={value} type="button" onClick={() => onSave(value)} aria-pressed={state.rating === value} className="min-h-10 px-3 focus-visible:outline focus-visible:outline-2 active:scale-95 motion-reduce:transition-none">{value}</button>)}</div>{state.message ? <p role="status">{state.message}</p> : null}</SurfaceCard>;
}

export function EvidenceWorkbenchView({ projection, selectedClaimKey, onChooseClaim, feedbackState, onCommentChange, onSaveFeedback }: { projection: FormalSandboxResultProjection; selectedClaimKey: string | null; onChooseClaim: (key: string) => void; feedbackState: FeedbackState; onCommentChange: (comment: string) => void; onSaveFeedback: (rating: Rating) => void }) {
  const claim = projection.claims.find((item) => item.key === selectedClaimKey);
  const selectedKeys = new Set([...(claim?.supportingStepKeys ?? []), ...(claim?.participantKeys ?? []), ...(claim?.relationshipKeys ?? [])]);
  return <section id="main-content" className="mx-auto max-w-6xl overflow-x-hidden py-8 sm:py-14"><header><p>Evidence workbench</p><h1>A conditional map, backed by frozen inputs and simulated steps.</h1><p>User-provided facts, system assumptions, sandbox simulation, and conditional conclusions remain separate.</p></header><div className="mt-8 grid gap-6 md:grid-cols-2"><SurfaceCard className="p-4"><h2>User-provided facts</h2><p className="text-sm">Real-world evidence supplied by the user.</p>{projection.facts.map((item) => <p key={item.key} className="mt-2">{item.statement}</p>)}</SurfaceCard><SurfaceCard className="p-4"><h2>System assumptions</h2><p className="text-sm">Explicit assumptions, not verified facts.</p>{projection.assumptions.map((item) => <p key={item.key} className="mt-2">{item.statement}</p>)}</SurfaceCard></div><div className="mt-8 grid gap-6 lg:grid-cols-2"><div><h2>Conditional conclusions</h2>{projection.claims.map((item) => <button key={item.key} type="button" onClick={() => onChooseClaim(item.key)} onKeyDown={(event) => activateClaimFromKeyboard(event.key, item.key, onChooseClaim)} aria-pressed={selectedClaimKey === item.key} className="mt-3 block min-h-10 w-full p-4 text-left focus-visible:outline focus-visible:outline-2 active:scale-95 motion-reduce:transition-none"><strong>{item.statement}</strong><span>{item.uncertainty}</span></button>)}</div><div><h2>Direct supporting simulation steps</h2>{projection.steps.map((item) => <SurfaceCard key={item.key} className={selectedKeys.has(item.key) ? "mt-3 p-4 ring-2 ring-[var(--evidence-gold)]" : "mt-3 p-4"}><b>Step {item.order}</b><p>{item.label}. This is a simulation step, not a real-world event.</p></SurfaceCard>)}<h2 className="mt-6">Frozen participants and relations</h2>{projection.participants.map((item) => <p key={item.key} className={selectedKeys.has(item.key) ? "font-semibold text-[var(--evidence-gold)]" : ""}>{item.label} · {item.role}</p>)}{projection.relationships.map((item) => <p key={item.key} className={selectedKeys.has(item.key) ? "font-semibold text-[var(--evidence-gold)]" : ""}>{item.label}</p>)}</div></div><FeedbackPanel state={feedbackState} onCommentChange={onCommentChange} onSave={onSaveFeedback} /></section>;
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
