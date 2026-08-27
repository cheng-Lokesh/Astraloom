"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button, ButtonLink, EmptyState, SurfaceCard } from "@/components/ui-foundation";
import { FormalPeopleController, type FormalPeopleAction, type FormalPeopleState, type FormalPerson } from "@/lib/people/formal-people-client";

function makeController() {
  return new FormalPeopleController({
    fetcher: (input, init) => fetch(input, init),
    newId: () => crypto.randomUUID(),
  });
}

const archived = (person: FormalPerson) => person.status === "deleted" || person.status === "merged";
const review = (person: FormalPerson) => person.status === "candidate" || person.status === "needs_confirmation";
const statusTone = (status: FormalPerson["status"]) =>
  status === "confirmed" ? "ready" : archived({ status } as FormalPerson) ? "neutral" : "planned";
const statusLabel = (status: FormalPerson["status"]) => ({
  candidate: "Candidate", needs_confirmation: "Needs review", confirmed: "Confirmed", deleted: "Deleted", merged: "Merged",
})[status];

export default function PeoplePage() {
  const ref = useRef<FormalPeopleController | null>(null);
  if (!ref.current) ref.current = makeController();
  const controller = ref.current;
  const [state, setState] = useState<FormalPeopleState>(controller.state);
  const sync = () => setState({ ...controller.state, people: [...controller.state.people] });
  const run = async (work: () => Promise<void>) => { await work(); sync(); };

  useEffect(() => { void run(() => controller.recover()); /* controller is lifetime-stable */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.phase === "loading") return <AppShell><Loading /></AppShell>;

  return (
    <AppShell>
      <section aria-labelledby="people-title" className="mx-auto max-w-6xl py-6 sm:py-10">
        <a href="#people-ledger" className="sr-only rounded bg-[#11150f] px-4 py-3 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to saved people</a>
        <header className="border-b border-black/10 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Step 2 · Key People</p>
          <h1 id="people-title" className="mt-2 font-[var(--font-display)] text-4xl leading-tight text-[#11150f] sm:text-5xl">Review the people behind this decision.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#62695d]">Recovered from your submitted Seed and saved to this account. Review evidence and confidence before continuing to Agents.</p>
          <ButtonLink href="/app/new/intake" variant="ghost" className="!w-auto mt-4 px-4 py-3">Back to intake</ButtonLink>
        </header>
        {state.phase === "unauthenticated" ? <EmptyState className="mt-8" tone="warning" title="Sign in to recover saved people" description="This page shows only Key People saved to your account." action={<ButtonLink href="/login" className="!w-auto px-4 py-3">Go to login</ButtonLink>} /> : null}
        {state.phase === "no_seed" ? <EmptyState className="mt-8" title="No submitted scenario yet" description="Confirm a formal scenario in intake before extracting Key People." action={<ButtonLink href="/app/new/intake" className="!w-auto px-4 py-3">Go to intake</ButtonLink>} /> : null}
        {state.phase === "failure" ? <EmptyState className="mt-8" tone="warning" title="Saved people could not be recovered" description={state.notice ?? "Please try again."} action={<Button onClick={() => void run(() => controller.recover())} className="!w-auto px-4 py-3">Reload saved people</Button>} /> : null}
        {state.phase === "ready" ? <Ledger state={state} controller={controller} run={run} /> : null}
      </section>
    </AppShell>
  );
}

function Loading() {
  return <div className="mx-auto max-w-6xl py-10"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Recovering account ledger</p><p className="mt-2 text-sm text-[#62695d]">Loading your latest submitted scenario and saved Key People.</p></div>;
}

function Ledger({ state, controller, run }: { state: FormalPeopleState; controller: FormalPeopleController; run: (work: () => Promise<void>) => Promise<void> }) {
  const groups = [
    ["Needs review", "Candidates remain provisional until you confirm them.", state.people.filter(review)],
    ["Confirmed for the next step", "These saved people can inform the Agent Profile stage.", state.people.filter((person) => person.status === "confirmed")],
    ["Removed or merged", "These saved outcomes cannot be restored from this page.", state.people.filter(archived)],
  ] as const;
  const confirmed = groups[1][2];
  return <div id="people-ledger" className="mt-8 space-y-8">
    <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Submitted scenario</p><p className="mt-1 text-sm font-semibold text-[#11150f]">Recovered submitted scenario</p><p className="mt-1 text-sm text-[#62695d]">Scenario text stays private; this page shows its saved Key People ledger only.</p></div>
      <Button variant="secondary" loading={state.pendingAction === "extract"} disabled={state.pendingAction !== null} onClick={() => void run(() => controller.extract())} className="!w-auto shrink-0 px-4 py-3">{state.people.length ? "Refresh candidates" : "Extract Key People"}</Button>
    </div>
    {state.notice ? <Notice notice={state.notice} reload={() => void run(() => controller.recover())} /> : null}
    {!state.people.length ? <EmptyState tone="accent" title="No saved Key People yet" description="Extract candidates from this submitted scenario, then review only what the server returns." action={<Button onClick={() => void run(() => controller.extract())} className="!w-auto px-4 py-3">Extract Key People</Button>} /> : null}
    {groups.map(([title, description, people]) => people.length ? <section key={title}><div className="mb-3 flex items-end justify-between"><div><h2 className="text-xl font-semibold text-[#11150f]">{title}</h2><p className="mt-1 text-sm text-[#62695d]">{description}</p></div><span className="font-mono text-sm text-[#7d8578]">{people.length}</span></div><div className="space-y-3">{people.map((person) => <PersonCard key={person.id} person={person} people={state.people} pending={state.pendingAction} action={(value) => void run(() => controller.mutate(value))} />)}</div></section> : null)}
    <Supplement disabled={state.pendingAction !== null} pending={state.pendingAction === "supplement"} action={(value) => void run(() => controller.mutate(value))} />
    <SurfaceCard emphasis="dark" className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/60">Next step</p><h2 className="mt-1 text-lg font-semibold text-white">Continue with the saved people you confirmed.</h2><p className="mt-1 text-sm text-white/65">Agent generation remains a separate, deliberate stage.</p></div><ButtonLink href="/app/new/agents" variant={confirmed.length ? "onDark" : "ghostOnDark"} aria-disabled={!confirmed.length} onClick={(event) => { if (!confirmed.length) event.preventDefault(); }} className="!w-auto shrink-0 px-4 py-3">{confirmed.length ? "Continue to Agents" : "Confirm a person first"}</ButtonLink></SurfaceCard>
  </div>;
}

function Notice({ notice, reload }: { notice: string; reload: () => void }) {
  const needsReload = notice.includes("Reload saved people") || notice.includes("changed elsewhere");
  return <div role="status" className="flex flex-col gap-3 border border-[#d49b4a]/30 bg-[#fff8ed] p-4 text-sm text-[#7c5524] sm:flex-row sm:items-center sm:justify-between"><p>{notice}</p>{needsReload ? <Button variant="ghost" onClick={reload} className="!w-auto px-3 py-2">Reload saved people</Button> : null}</div>;
}

function PersonCard({ person, people, pending, action }: { person: FormalPerson; people: FormalPerson[]; pending: FormalPeopleState["pendingAction"]; action: (value: FormalPeopleAction) => void }) {
  const [name, setName] = useState(person.display_name);
  const [target, setTarget] = useState("");
  const disabled = pending !== null || archived(person);
  const targets = people.filter((candidate) => candidate.id !== person.id && !archived(candidate));
  const rename = (event: FormEvent) => { event.preventDefault(); if (name.trim() && name.trim() !== person.display_name) action({ type: "rename", person_id: person.id, display_name: name.trim() }); };
  return <article className="border border-black/10 bg-white/70 p-4 transition-[opacity,transform] duration-120 ease-out sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-[#11150f]">{person.display_name}</h3><StatusPill tone={statusTone(person.status)}>{statusLabel(person.status)}</StatusPill><span className="rounded-full border border-[#568262]/25 bg-[#eef5ee] px-2.5 py-1 text-xs font-semibold text-[#2f5d3d]">Confidence {person.confidence}%</span></div><p className="mt-1 text-sm text-[#62695d]">{person.relationship_to_user || "Relationship not yet specified"} · {person.role_type || "Role not yet specified"}</p></div>{review(person) ? <Button loading={pending === "confirm"} disabled={disabled} onClick={() => action({ type: "confirm", person_id: person.id })} className="!w-auto shrink-0 px-4 py-3">Confirm</Button> : null}</div>
    <RecordList title="Known evidence" values={person.known_evidence} empty="No saved evidence is available." /><RecordList title="Missing fields" values={person.missing_fields} empty="No missing fields recorded." />
    {!archived(person) ? <details className="mt-4 border-t border-black/10 pt-3"><summary className="min-h-10 cursor-pointer py-2 text-sm font-semibold text-[#2f5d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#568262]">Review saved person details</summary><div className="mt-3 grid gap-4 border-t border-black/10 pt-4 lg:grid-cols-2"><form onSubmit={rename}><label className="text-xs font-semibold uppercase tracking-[.12em] text-[#7d8578]" htmlFor={"rename-" + person.id}>Display name</label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id={"rename-" + person.id} value={name} onChange={(event) => setName(event.target.value)} disabled={disabled} maxLength={120} className="mf-input min-h-10 min-w-0 flex-1" /><Button variant="secondary" type="submit" loading={pending === "rename"} disabled={disabled || name.trim() === person.display_name} className="!w-auto px-3 py-2">Save name</Button></div></form><div><label className="text-xs font-semibold uppercase tracking-[.12em] text-[#7d8578]" htmlFor={"merge-" + person.id}>Merge duplicate into</label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><select id={"merge-" + person.id} value={target} onChange={(event) => setTarget(event.target.value)} disabled={disabled || !targets.length} className="mf-input min-h-10 min-w-0 flex-1"><option value="">Choose a saved person</option>{targets.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.display_name}</option>)}</select><Button variant="secondary" loading={pending === "merge"} disabled={disabled || !target} onClick={() => action({ type: "merge", source_person_id: person.id, target_person_id: target })} className="!w-auto px-3 py-2">Merge</Button></div></div><div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4"><p className="text-xs text-[#62695d]">Delete and merge are saved decisions. They cannot be silently restored here.</p><Button variant="danger" loading={pending === "delete"} disabled={disabled} onClick={() => action({ type: "delete", person_id: person.id })} className="!w-auto px-3 py-2">Delete person</Button></div></div></details> : null}
  </article>;
}

function RecordList({ title, values, empty }: { title: string; values: string[]; empty: string }) {
  return <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#7d8578]">{title}</p>{values.length ? <ul className="mt-2 space-y-1 text-sm leading-6 text-[#3f483d]">{values.map((value) => <li key={value}>— {value}</li>)}</ul> : <p className="mt-2 text-sm text-[#62695d]">{empty}</p>}</div>;
}

function Supplement({ pending, disabled, action }: { pending: boolean; disabled: boolean; action: (value: FormalPeopleAction) => void }) {
  const [name, setName] = useState(""); const [relationship, setRelationship] = useState(""); const [role, setRole] = useState(""); const [note, setNote] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); if (name.trim() && relationship.trim() && role.trim()) action({ type: "supplement", display_name: name.trim(), relationship_to_user: relationship.trim(), role_type: role.trim(), ...(note.trim() ? { note: note.trim() } : {}) }); };
  return <SurfaceCard className="p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#7d8578]">Supplement</p><h2 className="mt-1 text-xl font-semibold text-[#11150f]">Add a missing person</h2><p className="mt-2 text-sm text-[#62695d]">Add only a person you want considered in this saved scenario. This is not a local draft.</p><form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2"><Field label="Display name" value={name} setValue={setName} disabled={disabled} required /><Field label="Relationship" value={relationship} setValue={setRelationship} disabled={disabled} required /><Field label="Role" value={role} setValue={setRole} disabled={disabled} required /><Field label="Short context (optional)" value={note} setValue={setNote} disabled={disabled} /><div className="sm:col-span-2"><Button type="submit" loading={pending} disabled={disabled} className="!w-auto px-4 py-3">Add saved person</Button></div></form></SurfaceCard>;
}

function Field({ label, value, setValue, disabled, required = false }: { label: string; value: string; setValue: (value: string) => void; disabled: boolean; required?: boolean }) {
  return <label className="text-sm font-semibold text-[#3f483d]">{label}<input value={value} onChange={(event) => setValue(event.target.value)} disabled={disabled} maxLength={label.includes("context") ? 1000 : 120} required={required} className="mf-input mt-1 min-h-10 w-full" /></label>;
}
