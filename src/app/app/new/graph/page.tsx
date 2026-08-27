"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button, ButtonLink, EmptyState, SurfaceCard } from "@/components/ui-foundation";
import { FormalGraphController, runFormalGraphUiAction, type FormalGraphEdge, type FormalGraphState } from "@/lib/graph/formal-graph-client";

export default function GraphPage() {
  const [controller] = useState(() => new FormalGraphController({ fetcher: (input, init) => fetch(input, init), newId: () => crypto.randomUUID() }));
  const [state, setState] = useState<FormalGraphState>(controller.state);
  const sync = () => setState({ ...controller.state });
  const run = (work: () => Promise<boolean | void>) => runFormalGraphUiAction(work, sync);

  useEffect(() => {
    void controller.recover().then(() => setState({ ...controller.state }));
  }, [controller]);

  if (state.phase === "loading") return <AppShell><Loading /></AppShell>;
  return <AppShell><main className="mx-auto max-w-6xl py-6 sm:py-10">
    <a href="#graph-ledger" className="sr-only rounded bg-[#11150f] px-4 py-3 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to relationship ledger</a>
    <Header />
    {state.phase === "unauthenticated" ? <EmptyState className="mt-8" tone="warning" title="Sign in to recover your saved Graph" description="This page reads only the relationship snapshot saved to your account." action={<ButtonLink href="/login" className="!w-auto px-4 py-3">Go to login</ButtonLink>} /> : null}
    {state.phase === "no_seed" ? <EmptyState className="mt-8" title="No submitted scenario yet" description="Submit a formal scenario in intake before opening the relationship ledger." action={<ButtonLink href="/app/new/intake" className="!w-auto px-4 py-3">Go to intake</ButtonLink>} /> : null}
    {state.phase === "no_agents" ? <EmptyState className="mt-8" title="No saved Agent snapshot" description="The Graph is generated only from the latest eligible immutable Agent snapshot." action={<ButtonLink href="/app/new/agents" className="!w-auto px-4 py-3">Review Agents</ButtonLink>} /> : null}
    {state.phase === "failure" ? <EmptyState className="mt-8" tone="warning" title="Saved Graph ledger could not be recovered" description={state.notice ?? "Please try again."} action={<Button onClick={() => void run(() => controller.recover())} className="!w-auto px-4 py-3">Reload Graph ledger</Button>} /> : null}
    {state.phase === "downgraded" ? <Downgraded state={state} reload={() => void run(() => controller.recover())} /> : null}
    {state.phase === "blocked" ? <Blocked state={state} reload={() => void run(() => controller.recover())} /> : null}
    {state.phase === "ready" ? <Ledger state={state} controller={controller} run={run} /> : null}
  </main></AppShell>;
}

function Header() {
  return <header className="border-b border-black/10 pb-6"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Step 4 · Relation Graph</p><h1 className="mt-2 font-[var(--font-display)] text-4xl leading-tight text-[#11150f] sm:text-5xl">Inspect the saved relationship evidence.</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">This is a read-only evidence ledger. The server derives relationship weights from the saved Agent snapshot; this page cannot edit people, nodes, edges, weights, or lock state.</p><ButtonLink href="/app/new/agents" variant="ghost" className="!w-auto mt-4 px-4 py-3">Back to Agents</ButtonLink></header>;
}
function Loading() { return <div className="mx-auto max-w-6xl py-10"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Recovering account ledger</p><p className="mt-2 text-sm text-[#62695d]">Loading the latest submitted scenario, immutable Agent snapshot, and saved Graph.</p></div>; }

function Downgraded({ state, reload }: { state: FormalGraphState; reload: () => void }) {
  return <div className="mt-8 space-y-6"><EmptyState tone="warning" title="Graph generation is unavailable in conservative mode" description="The saved Agent snapshot is downgraded. It contains no NPC inference or relationship edges, so no Graph can be generated or locked." action={<div className="flex flex-wrap gap-3"><Button onClick={reload} variant="secondary" className="!w-auto px-4 py-3">Reload saved ledger</Button><ButtonLink href="/app/new/people" className="!w-auto px-4 py-3">Review People</ButtonLink></div>} />{state.notice ? <Notice notice={state.notice} reload={reload} /> : null}</div>;
}
function Blocked({ state, reload }: { state: FormalGraphState; reload: () => void }) {
  return <div className="mt-8 space-y-6"><EmptyState tone="warning" title="Graph generation is blocked" description={state.notice ?? "The saved safety boundary did not permit Graph generation. No Graph snapshot was written."} action={<div className="flex flex-wrap gap-3"><Button onClick={reload} variant="secondary" className="!w-auto px-4 py-3">Reload saved ledger</Button><ButtonLink href="/app/new/people" className="!w-auto px-4 py-3">Return to People</ButtonLink></div>} />{state.graph && state.edges.length ? <section aria-label="Preserved read-only Graph"><div className="border border-[#d49b4a]/30 bg-[#fff8ed] p-4 text-sm leading-6 text-[#7c5524]"><strong>Previous Graph preserved:</strong> the blocked request performed no write. This saved read-only snapshot remains visible and unchanged.</div><div className="mt-6"><GraphLedger state={state} /></div></section> : null}</div>;
}

function Ledger({ state, controller, run }: { state: FormalGraphState; controller: FormalGraphController; run: (work: () => Promise<boolean | void>) => Promise<boolean> }) {
  const graph = state.graph;
  const locked = graph?.graph_locked === true;
  return <section id="graph-ledger" className="mt-8 space-y-8">
    <section className="grid gap-5 border-b border-black/10 pb-6 lg:grid-cols-[minmax(0,1fr)_340px]"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Submitted scenario</p><p className="mt-1 text-sm font-semibold text-[#11150f]">Latest submitted scenario recovered</p><p className="mt-1 max-w-2xl text-sm leading-6 text-[#62695d]">Only a saved immutable Agent snapshot can be used. Scenario text, trace bodies, and request keys are never shown here.</p></div><SurfaceCard emphasis="dark" className="p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/60">Eligible Agents</p><p className="mt-2 text-3xl font-semibold text-white">{state.agents.length}</p><p className="mt-1 text-sm leading-6 text-white/65">{state.agents.filter((agent) => agent.agent_type === "npc").length} confirmed-person Agent{state.agents.filter((agent) => agent.agent_type === "npc").length === 1 ? "" : "s"} support this Graph.</p></SurfaceCard></section>
    {state.notice ? <Notice notice={state.notice} reload={() => void run(() => controller.recover())} /> : null}
    {!graph ? <EmptyState tone="accent" title="No Graph snapshot has been saved" description="Generate one server-controlled, read-only Graph from this eligible Agent snapshot. The request contains only the saved scenario selector and a new idempotency key." action={<Button loading={state.pendingGeneration} disabled={!controller.canGenerate} onClick={() => void run(() => controller.generate())} className="!w-auto px-4 py-3" loadingLabel="Generating saved Graph">Generate read-only Graph</Button>} /> : <GraphLedger state={state} />}
    {graph && !locked ? <SurfaceCard emphasis="dark" className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/60">Snapshot review</p><h2 className="mt-1 text-lg font-semibold text-white">Lock this complete Graph deliberately.</h2><p className="mt-1 max-w-xl text-sm leading-6 text-white/65">Locking is irreversible for this saved snapshot. To change relationships later, update upstream facts and create a new Graph through the controlled server flow.</p></div><div className="flex shrink-0 flex-wrap gap-3"><Button variant="ghostOnDark" loading={state.pendingGeneration} disabled={!controller.canGenerate} onClick={() => void run(() => controller.generate())} className="!w-auto px-4 py-3" loadingLabel="Generating saved Graph">Generate new version</Button><Button variant="onDark" loading={state.pendingLock} disabled={!controller.canLock} onClick={() => void run(() => controller.lock())} className="!w-auto px-4 py-3" loadingLabel="Locking Graph">Lock Graph snapshot</Button></div></SurfaceCard> : null}
    {locked ? <SurfaceCard emphasis="dark" className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/60">Frozen simulation input</p><h2 className="mt-1 text-lg font-semibold text-white">This Graph snapshot is locked.</h2><p className="mt-1 max-w-xl text-sm leading-6 text-white/65">Its server-derived edges stay readable but cannot be edited or unlocked from this page.</p></div><ButtonLink href="/app/new/people" variant="ghostOnDark" className="!w-auto shrink-0 px-4 py-3">Update upstream facts</ButtonLink></SurfaceCard> : null}
  </section>;
}

function GraphLedger({ state }: { state: FormalGraphState }) {
  const graph = state.graph;
  if (!graph) return null;
  const lockedAt = graph.locked_at ? new Date(graph.locked_at).toLocaleString() : null;
  return <section><div className="flex flex-col gap-3 border-b border-black/10 pb-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Read-only Graph snapshot</p><h2 className="mt-1 text-2xl font-semibold text-[#11150f]">Server-derived relationship ledger</h2><p className="mt-1 text-sm leading-6 text-[#62695d]">Every displayed weight and evidence reference is the safe server projection. No relationship editing controls exist.</p></div><div className="flex flex-wrap gap-2"><StatusPill tone={graph.graph_locked ? "locked" : "planned"}>{graph.graph_locked ? "Locked" : "Review required"}</StatusPill><StatusPill tone="ready">{graph.safety_level}</StatusPill></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Agents" value={state.agents.length} /><Metric label="Relation edges" value={state.edges.length} /><Metric label="Evidence refs" value={state.edges.reduce((sum, edge) => sum + edge.evidence_refs.length, 0)} /></div>{lockedAt ? <p className="mt-4 text-sm text-[#62695d]">Locked at {lockedAt}</p> : null}<div className="mt-5 grid gap-4 lg:grid-cols-2">{state.edges.map((edge) => <EdgeCard key={edge.id} edge={edge} state={state} />)}</div></section>;
}
function EdgeCard({ edge, state }: { edge: FormalGraphEdge; state: FormalGraphState }) {
  const from = state.agents.find((agent) => agent.id === edge.from_agent_id)?.display_name ?? "Saved Agent";
  const to = state.agents.find((agent) => agent.id === edge.to_agent_id)?.display_name ?? "Saved Agent";
  return <SurfaceCard className="min-w-0 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">{edge.relationship_type} relation</p><h3 className="mt-1 break-words text-xl font-semibold text-[#11150f]">{from} <span className="text-[#7d8578]">→</span> {to}</h3></div><StatusPill tone="ready">{edge.confidence}% confidence</StatusPill></div><dl className="mt-5 grid gap-3 border-t border-black/10 pt-4 sm:grid-cols-2">{Object.entries(edge.weights).map(([name, value]) => <div key={name}><dt className="text-xs font-semibold uppercase tracking-[.12em] text-[#7d8578]">{name.replaceAll("_", " ")}</dt><dd className="mt-1 text-lg font-semibold text-[#3f483d]">{value}</dd></div>)}</dl><div className="mt-4 border-t border-black/10 pt-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Evidence references</p><div className="mt-2 flex flex-wrap gap-2">{edge.evidence_refs.map((reference) => <span key={reference} className="max-w-full break-all rounded border border-black/10 bg-[#f7f8f4] px-2.5 py-1 text-xs text-[#3f483d]">{reference}</span>)}</div></div></SurfaceCard>;
}
function Metric({ label, value }: { label: string; value: number }) { return <div className="border border-black/10 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#7d8578]">{label}</p><p className="mt-2 text-2xl font-semibold text-[#11150f]">{value}</p></div>; }
function Notice({ notice, reload }: { notice: string; reload: () => void }) { const canReload = notice.includes("Reload the Graph ledger") || notice.includes("no longer available") || notice.includes("already locked"); return <div role="status" className="flex flex-col gap-3 border border-[#d49b4a]/30 bg-[#fff8ed] p-4 text-sm leading-6 text-[#7c5524] sm:flex-row sm:items-center sm:justify-between"><p>{notice}</p>{canReload ? <Button variant="ghost" onClick={reload} className="!w-auto shrink-0 px-3 py-2">Reload Graph ledger</Button> : null}</div>; }
