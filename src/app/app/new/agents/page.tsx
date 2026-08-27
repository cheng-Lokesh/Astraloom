"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button, ButtonLink, EmptyState, SurfaceCard } from "@/components/ui-foundation";
import { FormalAgentsController, runFormalAgentsUiAction, type FormalAgent, type FormalAgentsState } from "@/lib/agents/formal-agents-client";

function makeController() {
  return new FormalAgentsController({ fetcher: (input, init) => fetch(input, init), newId: () => crypto.randomUUID() });
}

function safetyTone(safety: FormalAgent["safety_level"]) {
  return safety === "safe" ? "ready" : safety === "caution" ? "caution" : "downgraded";
}

function safetyLabel(safety: FormalAgent["safety_level"]) {
  return safety === "safe" ? "Safety reviewed" : safety === "caution" ? "Conservative review" : "Conservative downgrade";
}

function agentLabel(type: FormalAgent["agent_type"]) {
  return type === "user_core" ? "User core" : type === "user_variant" ? "Parallel self" : "Confirmed-person agent";
}

export default function AgentsPage() {
  const [controller] = useState(makeController);
  const [state, setState] = useState<FormalAgentsState>(() => controller.state);
  const [includeParallelSelves, setIncludeParallelSelves] = useState(true);
  const sync = () => setState({ ...controller.state, people: [...controller.state.people], agents: [...controller.state.agents] });
  const run = (work: () => Promise<boolean | void>) => runFormalAgentsUiAction(work, sync);

  useEffect(() => {
    void controller.recover().then(() => {
      setState({ ...controller.state, people: [...controller.state.people], agents: [...controller.state.agents] });
    });
  }, [controller]);

  if (state.phase === "loading") return <AppShell><Loading /></AppShell>;
  return <AppShell><section aria-labelledby="agents-title" className="mx-auto max-w-6xl py-6 sm:py-10">
    <a href="#agent-ledger" className="sr-only rounded bg-[#11150f] px-4 py-3 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to saved Agent ledger</a>
    <Header />
    {state.phase === "unauthenticated" ? <EmptyState className="mt-8" tone="warning" title="Sign in to recover saved Agents" description="This ledger shows only immutable Agent snapshots saved to your account." action={<ButtonLink href="/login" className="!w-auto px-4 py-3">Go to login</ButtonLink>} /> : null}
    {state.phase === "no_seed" ? <EmptyState className="mt-8" title="No submitted scenario yet" description="Confirm a formal scenario in intake before generating Agents." action={<ButtonLink href="/app/new/intake" className="!w-auto px-4 py-3">Go to intake</ButtonLink>} /> : null}
    {state.phase === "failure" ? <EmptyState className="mt-8" tone="warning" title="Saved Agent ledger could not be recovered" description={state.notice ?? "Please try again."} action={<Button onClick={() => void run(() => controller.recover())} className="!w-auto px-4 py-3">Reload Agent ledger</Button>} /> : null}
    {state.phase === "blocked" ? <Blocked state={state} reload={() => void run(() => controller.recover())} /> : null}
    {state.phase === "ready" ? <Ledger state={state} includeParallelSelves={includeParallelSelves} setIncludeParallelSelves={setIncludeParallelSelves} controller={controller} run={run} /> : null}
  </section></AppShell>;
}

function Header() {
  return <header className="border-b border-black/10 pb-6"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Step 3 · Agent Profiles</p><h1 id="agents-title" className="mt-2 font-[var(--font-display)] text-4xl leading-tight text-[#11150f] sm:text-5xl">Inspect the saved agents behind your scenario.</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">Agent Profiles are immutable, evidence-bounded simulation inputs. They are not statements of fact about another person, and their saved fields cannot be edited here.</p><ButtonLink href="/app/new/people" variant="ghost" className="!w-auto mt-4 px-4 py-3">Back to People</ButtonLink></header>;
}

function Loading() {
  return <div className="mx-auto max-w-6xl py-10"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Recovering account ledger</p><p className="mt-2 text-sm text-[#62695d]">Loading the latest submitted scenario, confirmed People, and saved Agent snapshot.</p></div>;
}

function Blocked({ state, reload }: { state: FormalAgentsState; reload: () => void }) {
  const confirmedCount = state.people.filter((person) => person.status === "confirmed").length;
  const hasPreviousSnapshot = state.snapshot !== null && state.agents.length > 0;
  return <div className="mt-8 space-y-8"><EmptyState tone="warning" title="Agent generation is blocked" description={state.notice ?? "The saved safety boundary did not permit Agent generation. No snapshot was written."} action={<div className="flex flex-wrap gap-3"><Button onClick={reload} variant="secondary" className="!w-auto px-4 py-3">Reload saved ledger</Button><ButtonLink href="/app/new/people" className="!w-auto px-4 py-3">Return to People</ButtonLink></div>} />{hasPreviousSnapshot && state.snapshot ? <section aria-label="Preserved Agent snapshot"><div className="border border-[#d49b4a]/30 bg-[#fff8ed] p-4 text-sm leading-6 text-[#7c5524]"><strong>Previous version preserved:</strong> safety blocked this new request before any write. The immutable snapshot below remains saved, readable, and unchanged; Graph and further generation stay unavailable in this blocked state.</div><div className="mt-6"><SnapshotLedger snapshot={state.snapshot} agents={state.agents} confirmedCount={confirmedCount} /></div></section> : null}</div>;
}

function Ledger({ state, includeParallelSelves, setIncludeParallelSelves, controller, run }: { state: FormalAgentsState; includeParallelSelves: boolean; setIncludeParallelSelves: (value: boolean) => void; controller: FormalAgentsController; run: (work: () => Promise<boolean | void>) => Promise<boolean> }) {
  const confirmed = useMemo(() => state.people.filter((person) => person.status === "confirmed"), [state.people]);
  const snapshot = state.snapshot;
  const hasSnapshot = snapshot !== null && state.agents.length > 0;
  const graphReady = hasSnapshot && snapshot.safety_level !== "downgraded" && state.agents.some((agent) => agent.agent_type === "npc");
  const actionLabel = hasSnapshot ? "Generate a new immutable version" : "Generate immutable Agent snapshot";

  return <div id="agent-ledger" className="mt-8 space-y-8">
    <div className="grid gap-5 border-b border-black/10 pb-6 lg:grid-cols-[minmax(0,1fr)_340px]"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Submitted scenario</p><p className="mt-1 text-sm font-semibold text-[#11150f]">Latest submitted scenario recovered</p><p className="mt-1 max-w-2xl text-sm leading-6 text-[#62695d]">Scenario text stays private. The generation boundary receives only the submitted Seed selector and the formal confirmed-People ledger.</p></div><SurfaceCard emphasis="dark" className="p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/60">People evidence</p><p className="mt-2 text-3xl font-semibold text-white">{confirmed.length}</p><p className="mt-1 text-sm leading-6 text-white/65">confirmed People can enter a new generation. Candidates, merged, and deleted records cannot.</p></SurfaceCard></div>
    {state.notice ? <Notice notice={state.notice} reload={() => void run(() => controller.recover())} /> : null}
    {!confirmed.length ? <EmptyState tone="warning" title="Confirm at least one person before generating" description="No local or inferred People are substituted. Return to People to confirm the evidence that may enter this Agent snapshot." action={<ButtonLink href="/app/new/people" className="!w-auto px-4 py-3">Review People</ButtonLink>} /> : null}
    <GenerationPanel hasSnapshot={hasSnapshot} enabled={controller.canGenerate} includeParallelSelves={includeParallelSelves} setIncludeParallelSelves={setIncludeParallelSelves} pending={state.pendingGeneration} actionLabel={actionLabel} onGenerate={() => void run(() => controller.generate(includeParallelSelves))} />
    {hasSnapshot && snapshot ? <SnapshotLedger snapshot={snapshot} agents={state.agents} confirmedCount={confirmed.length} /> : <EmptyState tone="accent" title="No Agent snapshot has been saved" description="When you generate, the server writes one bounded, immutable snapshot. This page never constructs a local Agent draft." />}
    <SurfaceCard emphasis="dark" className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/60">Next step</p><h2 className="mt-1 text-lg font-semibold text-white">Relation Graph uses a saved Agent snapshot.</h2><p className="mt-1 max-w-xl text-sm leading-6 text-white/65">{graphReady ? "This snapshot contains confirmed-person Agents and is ready for the read-only Graph stage." : "Graph becomes available after a non-downgraded saved snapshot includes at least one confirmed-person Agent."}</p></div><ButtonLink href="/app/new/graph" variant={graphReady ? "onDark" : "ghostOnDark"} aria-disabled={!graphReady} onClick={(event) => { if (!graphReady) event.preventDefault(); }} className="!w-auto shrink-0 px-4 py-3">{graphReady ? "Continue to Graph" : "Graph not ready"}</ButtonLink></SurfaceCard>
  </div>;
}

function GenerationPanel({ hasSnapshot, enabled, includeParallelSelves, setIncludeParallelSelves, pending, actionLabel, onGenerate }: { hasSnapshot: boolean; enabled: boolean; includeParallelSelves: boolean; setIncludeParallelSelves: (value: boolean) => void; pending: boolean; actionLabel: string; onGenerate: () => void }) {
  return <SurfaceCard className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Controlled generation</p><h2 className="mt-1 text-xl font-semibold text-[#11150f]">{hasSnapshot ? "Create a later snapshot deliberately" : "Create the first saved snapshot"}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#62695d]">Generation sends no profile text from this browser. A new request has one new idempotency key; conflicts are never retried automatically.</p></div><StatusPill tone={hasSnapshot ? "locked" : "planned"}>{hasSnapshot ? "Existing version locked" : "No version yet"}</StatusPill></div><label className="mt-5 flex min-h-11 items-start gap-3 rounded-md border border-black/10 bg-[#f7f8f4] p-4 text-sm leading-6 text-[#3f483d]"><input type="checkbox" checked={includeParallelSelves} disabled={!enabled || pending} onChange={(event) => setIncludeParallelSelves(event.target.checked)} className="mt-1 h-4 w-4 accent-[#568262]" /><span><span className="font-semibold text-[#11150f]">Include parallel self variants</span><br />This affects only the next server-generated version; it never edits an existing snapshot.</span></label><div className="mt-5 flex flex-wrap items-center gap-3"><Button loading={pending} disabled={!enabled} onClick={onGenerate} className="!w-auto px-4 py-3" loadingLabel="Generating saved snapshot">{actionLabel}</Button>{!enabled ? <p className="text-sm text-[#7c5524]">A confirmed saved person is required before this action is available.</p> : null}</div></SurfaceCard>;
}

function SnapshotLedger({ snapshot, agents, confirmedCount }: { snapshot: NonNullable<FormalAgentsState["snapshot"]>; agents: FormalAgent[]; confirmedCount: number }) {
  const npcs = agents.filter((agent) => agent.agent_type === "npc");
  const variants = agents.filter((agent) => agent.agent_type === "user_variant");
  return <section><div className="flex flex-col gap-3 border-b border-black/10 pb-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Immutable Agent version</p><h2 className="mt-1 text-2xl font-semibold text-[#11150f]">Server-controlled snapshot</h2><p className="mt-1 text-sm leading-6 text-[#62695d]">This is a frozen evidence ledger. There are no edit controls for its people, source, confidence, or evidence references.</p></div><div className="flex flex-wrap gap-2"><StatusPill tone={safetyTone(snapshot.safety_level)}>{safetyLabel(snapshot.safety_level)}</StatusPill><StatusPill tone="locked">Immutable</StatusPill></div></div>{snapshot.safety_level === "downgraded" ? <div className="mt-5 border border-[#d49b4a]/30 bg-[#fff8ed] p-4 text-sm leading-6 text-[#7c5524]"><strong>Conservative downgrade:</strong> this version contains only a user core and does not infer NPCs, hidden motives, relation edges, or Graph readiness.</div> : null}<div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Agents" value={agents.length} /><Metric label="Confirmed-person agents" value={`${npcs.length}/${confirmedCount}`} /><Metric label="Parallel selves" value={variants.length} /></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)}</div></section>;
}

function AgentCard({ agent }: { agent: FormalAgent }) {
  return <SurfaceCard className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">{agentLabel(agent.agent_type)}</p><h3 className="mt-1 break-words text-xl font-semibold text-[#11150f]">{agent.display_name}</h3><p className="mt-1 text-sm text-[#62695d]">{agent.relationship_to_user}</p></div><StatusPill tone={safetyTone(agent.safety_level)}>{agent.confidence}% confidence</StatusPill></div><dl className="mt-5 grid gap-3 border-t border-black/10 pt-4 text-sm sm:grid-cols-2"><Detail label="Source" value={agent.source === "confirmed_person_snapshot" ? "Confirmed People evidence" : "Conservative snapshot"} /><Detail label="Version" value={agent.version} /></dl><div className="mt-4 border-t border-black/10 pt-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Opaque evidence references</p><div className="mt-2 flex flex-wrap gap-2">{agent.evidence_refs.map((ref) => <span key={ref} className="max-w-full break-all rounded border border-black/10 bg-[#f7f8f4] px-2.5 py-1 text-xs text-[#3f483d]">{ref}</span>)}</div></div></SurfaceCard>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-[.12em] text-[#7d8578]">{label}</dt><dd className="mt-1 break-words text-[#3f483d]">{value}</dd></div>; }
function Metric({ label, value }: { label: string; value: number | string }) { return <div className="border border-black/10 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#7d8578]">{label}</p><p className="mt-2 text-2xl font-semibold text-[#11150f]">{value}</p></div>; }
function Notice({ notice, reload }: { notice: string; reload: () => void }) { const canReload = notice.includes("Reload the Agent ledger") || notice.includes("no longer available"); return <div role="status" className="flex flex-col gap-3 border border-[#d49b4a]/30 bg-[#fff8ed] p-4 text-sm leading-6 text-[#7c5524] sm:flex-row sm:items-center sm:justify-between"><p>{notice}</p>{canReload ? <Button variant="ghost" onClick={reload} className="!w-auto shrink-0 px-3 py-2">Reload Agent ledger</Button> : null}</div>; }
