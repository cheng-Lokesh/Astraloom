"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button, ButtonLink, EmptyState, SurfaceCard } from "@/components/ui-foundation";
import {
  createManualPerson,
  extractPeopleCandidates,
  mergePeopleCandidates,
} from "@/lib/people/extract";
import { getRepositories } from "@/lib/repositories/repository-provider";
import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";

type ExtractPeopleApiResponse = {
  ok?: boolean;
  source?: "llm" | "local_fallback";
  fallback_reason?: string;
  candidates?: KeyPersonDraft[];
  error_code?: string;
};

function activePeople(people: KeyPersonDraft[]) {
  return people.filter(
    (person) =>
      person.status !== "deleted" &&
      person.status !== "merged" &&
      person.status !== "rejected",
  );
}

function confirmedPeople(people: KeyPersonDraft[]) {
  return people.filter(
    (person) => person.confirmed && person.status === "confirmed",
  );
}

function excludedPeople(people: KeyPersonDraft[]) {
  return people.filter(
    (person) =>
      person.status === "deleted" ||
      person.status === "merged" ||
      person.status === "rejected",
  );
}

function reviewPeople(people: KeyPersonDraft[]) {
  return activePeople(people).filter(
    (person) => !(person.confirmed && person.status === "confirmed"),
  );
}

function statusTone(status: KeyPersonDraft["status"]) {
  if (status === "confirmed") return "ready";
  if (status === "deleted" || status === "merged" || status === "rejected") {
    return "blocked";
  }
  return "planned";
}

function statusLabel(status: KeyPersonDraft["status"]) {
  const labels: Record<KeyPersonDraft["status"], string> = {
    candidate: "Candidate",
    confirmed: "Confirmed",
    deleted: "Deleted",
    merged: "Merged",
    needs_confirmation: "Needs review",
    rejected: "Excluded",
  };
  return labels[status];
}

function sourceLabel(source: KeyPersonDraft["source"]) {
  if (source === "manual") return "Added manually";
  if (source === "key_people_text") return "Named in intake";
  return "Detected from intake";
}

function mergeUnique<T>(left: T[], right: T[]) {
  return Array.from(new Set([...left, ...right]));
}

function isExcluded(person: KeyPersonDraft) {
  return (
    person.status === "deleted" ||
    person.status === "merged" ||
    person.status === "rejected"
  );
}

export default function PeoplePage() {
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [people, setPeople] = useState<KeyPersonDraft[]>(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return [];
    const savedResult = repos.keyPeople.load(seed.id);
    const saved = savedResult.ok ? savedResult.data : null;
    return mergePeopleCandidates(
      saved?.people ?? [],
      extractPeopleCandidates(seed),
    );
  });
  const [manualLabel, setManualLabel] = useState("");
  const [manualRole, setManualRole] = useState("");
  const [manualRelationship, setManualRelationship] = useState("");
  const [message, setMessage] = useState("");
  const [isSmartExtracting, setIsSmartExtracting] = useState(false);

  const active = activePeople(people);
  const confirmed = confirmedPeople(people);
  const review = reviewPeople(people);
  const excluded = excludedPeople(people);

  function persist(nextPeople: KeyPersonDraft[], nextMessage: string) {
    if (!seedContext) return;
    const result = repos.keyPeople.save({
      seedContextId: seedContext.id,
      people: nextPeople,
      updatedAt: new Date().toISOString(),
    });
    if (!result.ok) {
      setMessage(`Save failed: ${result.errorCode}`);
      return;
    }
    setPeople(nextPeople);
    setMessage(nextMessage);
  }

  function patchPerson(id: string, patch: Partial<KeyPersonDraft>) {
    const now = new Date().toISOString();
    persist(
      people.map((person) =>
        person.id === id ? { ...person, ...patch, updatedAt: now } : person,
      ),
      "Cast update saved.",
    );
  }

  function confirmPerson(id: string) {
    patchPerson(id, { confirmed: true, status: "confirmed" });
  }

  function deletePerson(id: string) {
    patchPerson(id, { confirmed: false, status: "deleted" });
  }

  function restorePerson(id: string) {
    patchPerson(id, {
      confirmed: false,
      mergedIntoId: undefined,
      status: "candidate",
    });
  }

  function mergePerson(sourceId: string, targetId: string) {
    if (!targetId || sourceId === targetId) return;
    const now = new Date().toISOString();
    const source = people.find((person) => person.id === sourceId);
    const target = people.find((person) => person.id === targetId);
    if (!source || !target) return;

    persist(
      people.map((person) => {
        if (person.id === sourceId) {
          return {
            ...person,
            confirmed: false,
            status: "merged" as const,
            mergedIntoId: targetId,
            updatedAt: now,
          };
        }

        if (person.id === targetId) {
          return {
            ...person,
            confidence: Math.max(person.confidence, source.confidence),
            knownEvidence: [person.knownEvidence, source.knownEvidence]
              .filter(Boolean)
              .join("\n"),
            evidenceText: [person.evidenceText, source.evidenceText]
              .filter(Boolean)
              .join("\n"),
            evidenceRefs: mergeUnique(person.evidenceRefs, source.evidenceRefs),
            missingFields: mergeUnique(person.missingFields, source.missingFields),
            userNote: [person.userNote, source.userNote].filter(Boolean).join("\n"),
            updatedAt: now,
          };
        }

        return person;
      }),
      "Duplicate person merged. Evidence refs were preserved.",
    );
  }

  function addManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!seedContext || manualLabel.trim().length < 2) {
      setMessage("Add at least a short display name for the missing person.");
      return;
    }

    const person = createManualPerson(seedContext.id, manualLabel, manualRole);
    const nextPeople = mergePeopleCandidates(people, [
      {
        ...person,
        relationshipToUser:
          manualRelationship.trim() || person.relationshipToUser,
      },
    ]);
    setManualLabel("");
    setManualRole("");
    setManualRelationship("");
    persist(nextPeople, "Missing person added and confirmed.");
  }

  function reset() {
    if (!seedContext) return;
    repos.keyPeople.clearDraft(seedContext.id);
    persist(extractPeopleCandidates(seedContext), "Candidates re-read from intake.");
  }

  async function runSmartExtraction() {
    if (!seedContext) return;
    setIsSmartExtracting(true);

    try {
      const response = await fetch("/api/key-people/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          seedContextId: seedContext.id,
          seedContext: seedContext satisfies SeedContextDraft,
        }),
      });
      const payload = (await response.json()) as ExtractPeopleApiResponse;

      if (!response.ok || !payload.ok || !Array.isArray(payload.candidates)) {
        throw new Error(payload.error_code ?? "extract_people_failed");
      }

      persist(
        mergePeopleCandidates(people, payload.candidates),
        payload.source === "local_fallback"
          ? `Local fallback used: ${payload.fallback_reason ?? "llm_unavailable"}`
          : "Smart people candidates added for review.",
      );
    } catch {
      persist(
        mergePeopleCandidates(people, extractPeopleCandidates(seedContext)),
        "Smart extraction was unavailable, so local candidates stayed active.",
      );
    } finally {
      setIsSmartExtracting(false);
    }
  }

  if (!seedContext) {
    return (
      <AppShell>
        <SurfaceCard emphasis="strong" className="mx-auto max-w-3xl p-8">
          <StatusPill tone="blocked">Needs scenario</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold text-[#11150f]">
            Create a situation before confirming people.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#62695d]">
            Key People confirmation depends on your scenario question, recent events, and people hints.
          </p>
          <ButtonLink href="/app/new/intake" className="mt-6 px-5 py-3">
            Go to intake
          </ButtonLink>
        </SurfaceCard>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <SurfaceCard emphasis="strong">
            <StatusPill tone="planned">Key People confirmation</StatusPill>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#11150f]">
              Confirm the cast before MiroFish builds agents.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
              These are people or roles detected from your intake. They are not agents yet.
              Confirm, rename, merge, delete, or supplement the cast before the next step creates
              agent profiles and a read-only relationship graph.
            </p>
            <div className="mt-5 rounded-md border border-black/8 bg-[#f7f8f4] p-4 text-sm leading-7 text-[#3f483d]">
              <span className="font-semibold text-[#11150f]">Scenario: </span>
              {seedContext.questionText}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <CastMetric tone="ready" label="Confirmed" value={confirmed.length} />
              <CastMetric tone="review" label="Needs review" value={review.length} />
              <CastMetric tone="excluded" label="Excluded" value={excluded.length} />
            </div>
          </SurfaceCard>

          {active.length === 0 ? (
            <EmptyState
              title="No active people yet"
              description="Add at least one important person or role so agent generation has a real cast."
            />
          ) : null}

          <PeopleSection
            title="Confirmed cast"
            description="These people or roles will be eligible for Agent Profile generation on the next page."
            count={confirmed.length}
            tone="confirmed"
            empty="Confirm at least one person before generating agents."
          >
            {confirmed.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  people={people}
                  onPatch={(patch) => patchPerson(person.id, patch)}
                  onConfirm={() => confirmPerson(person.id)}
                  onDelete={() => deletePerson(person.id)}
                  onRestore={() => restorePerson(person.id)}
                  onMerge={(targetId) => mergePerson(person.id, targetId)}
                />
            ))}
          </PeopleSection>

          <PeopleSection
            title="Needs review"
            description="Check the label, role, evidence, and confidence before deciding whether this belongs in the cast."
            count={review.length}
            tone="review"
            empty="No candidates waiting for review."
          >
            {review.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  people={people}
                  onPatch={(patch) => patchPerson(person.id, patch)}
                  onConfirm={() => confirmPerson(person.id)}
                  onDelete={() => deletePerson(person.id)}
                  onRestore={() => restorePerson(person.id)}
                  onMerge={(targetId) => mergePerson(person.id, targetId)}
                />
            ))}
          </PeopleSection>

          <form
            onSubmit={addManual}
            className="mf-card p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#11150f]">
                  Add a missing person
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#62695d]">
                  Add a real person, role, or group that affects the scenario. Keep notes observable.
                </p>
              </div>
              <StatusPill tone="ready">Confirmed on add</StatusPill>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                value={manualLabel}
                onChange={(event) => setManualLabel(event.target.value)}
                placeholder="Display name or role"
                className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#568262]"
              />
              <input
                value={manualRelationship}
                onChange={(event) => setManualRelationship(event.target.value)}
                placeholder="Relationship to you"
                className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#568262]"
              />
              <input
                value={manualRole}
                onChange={(event) => setManualRole(event.target.value)}
                placeholder="Role in this scenario"
                className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#568262]"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="submit"
              >
                Add confirmed person
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={reset}
              >
                Re-read intake
              </Button>
              <Button
                type="button"
                variant="accent"
                onClick={runSmartExtraction}
                disabled={isSmartExtracting}
              >
                {isSmartExtracting ? "Identifying..." : "Smart identify"}
              </Button>
              {message ? (
                <span className="text-sm text-[#62695d]">{message}</span>
              ) : null}
            </div>
          </form>

          <PeopleSection
            title="Deleted or merged"
            description="These records stay in the local ledger for traceability, but they will not generate agents."
            count={excluded.length}
            tone="excluded"
            empty="No deleted or merged people."
          >
            {excluded.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  people={people}
                  onPatch={(patch) => patchPerson(person.id, patch)}
                  onConfirm={() => confirmPerson(person.id)}
                  onDelete={() => deletePerson(person.id)}
                  onRestore={() => restorePerson(person.id)}
                  onMerge={(targetId) => mergePerson(person.id, targetId)}
                />
            ))}
          </PeopleSection>
        </main>

        <aside className="mf-panel-dark h-fit p-6">
          <div className="text-xs font-semibold uppercase text-[#b7e6c6]">
            Cast status
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="Active" value={active.length} />
            <Metric label="Confirmed" value={confirmed.length} />
            <Metric label="Excluded" value={excluded.length} />
            <Metric
              label="Avg confidence"
              value={
                active.length
                  ? Math.round(
                      active.reduce((sum, person) => sum + person.confidence, 0) /
                        active.length,
                    )
                  : 0
              }
            />
          </div>
          <div className="mt-5 space-y-4 text-sm leading-7 text-white/68">
            <p>Confirmed people become candidates for agent profiles on the next page.</p>
            <p>Deleted or merged people are kept in the local ledger but will not generate agents.</p>
            <p>This step never edits relation weights or turns guesses into facts.</p>
          </div>
          <ButtonLink
            href="/app/new/agents"
            variant={confirmed.length ? "onDark" : "ghostOnDark"}
            className="mt-6 w-full px-4 py-3"
            onClick={(event) => {
              if (!confirmed.length) event.preventDefault();
            }}
          >
            {confirmed.length ? "Generate agents" : "Confirm one person first"}
          </ButtonLink>
        </aside>
      </div>
    </AppShell>
  );
}

function PeopleSection({
  title,
  description,
  count,
  tone,
  empty,
  children,
}: {
  title: string;
  description: string;
  count: number;
  tone: "confirmed" | "review" | "excluded";
  empty: string;
  children: React.ReactNode;
}) {
  const toneClasses = {
    confirmed: "border-[#568262]/25 bg-[#eef5ee]",
    review: "border-[#d49b4a]/25 bg-[#fff8ed]",
    excluded: "border-black/8 bg-[#f7f8f4]",
  };

  return (
    <section className={`rounded-lg border p-5 ${toneClasses[tone]}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#11150f]">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#62695d]">
            {description}
          </p>
        </div>
        <span className="rounded border border-black/10 bg-white px-2 py-1 text-xs font-semibold text-[#52594d]">
          {count}
        </span>
      </div>
      {count ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
      ) : (
        <p className="mt-4 rounded-md border border-black/8 bg-white/70 p-4 text-sm text-[#62695d]">
          {empty}
        </p>
      )}
    </section>
  );
}

function CastMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ready" | "review" | "excluded";
}) {
  const toneClasses = {
    ready: "border-[#568262]/25 bg-[#eef5ee] text-[#2f5d3d]",
    review: "border-[#d49b4a]/30 bg-[#fff8ed] text-[#7c5524]",
    excluded: "border-black/8 bg-[#f7f8f4] text-[#62695d]",
  };

  return (
    <div className={`rounded-md border p-3 ${toneClasses[tone]}`}>
      <div className="text-xs font-semibold uppercase opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function PersonCard({
  person,
  people,
  onPatch,
  onConfirm,
  onDelete,
  onRestore,
  onMerge,
}: {
  person: KeyPersonDraft;
  people: KeyPersonDraft[];
  onPatch: (patch: Partial<KeyPersonDraft>) => void;
  onConfirm: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onMerge: (targetId: string) => void;
}) {
  const excluded = isExcluded(person);
  const mergeTargets = activePeople(people).filter(
    (target) => target.id !== person.id,
  );

  return (
    <article
      className={`rounded-lg border p-5 transition ${
        person.status === "confirmed"
          ? "border-[#568262]/35 bg-[#eef5ee]"
          : excluded
            ? "border-black/8 bg-white opacity-60"
            : person.status === "needs_confirmation"
              ? "border-[#d49b4a]/35 bg-[#fff8ed]"
              : "border-black/8 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-[#7d8578]">
              Display name
            </span>
            <input
              value={person.displayName ?? person.label}
              onChange={(event) =>
                onPatch({
                  displayName: event.target.value,
                  label: event.target.value,
                })
              }
              disabled={excluded}
              className="mt-1 w-full border-0 bg-transparent p-0 text-lg font-semibold text-[#11150f] outline-none disabled:cursor-not-allowed"
            />
          </label>
          <p className="mt-1 text-xs text-[#7d8578]">
            {sourceLabel(person.source)}
          </p>
        </div>
        <StatusPill tone={statusTone(person.status)}>
          {statusLabel(person.status)}
        </StatusPill>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field
          label="Relationship to you"
          value={person.relationshipToUser}
          disabled={excluded}
          onChange={(value) =>
            onPatch({ relationshipToUser: value.trim() || "unknown" })
          }
        />
        <Field
          label="Role type"
          value={person.roleType}
          disabled={excluded}
          onChange={(value) =>
            onPatch({
              role: value.trim() || "unknown",
              roleType: value.trim() || "unknown",
            })
          }
        />
      </div>

      <div className="mt-4 rounded-md border border-black/8 bg-white/70 p-3">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#62695d]">
          <span>Confidence</span>
          <span>{person.confidence}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-[#e8ebe3]">
          <div
            className="h-2 rounded-full bg-[#568262]"
            style={{ width: `${person.confidence}%` }}
          />
        </div>
        <details className="mt-3 text-xs leading-5 text-[#62695d]">
          <summary className="cursor-pointer font-semibold text-[#3f483d]">
            How is this determined?
          </summary>
          <p className="mt-2">
            Confidence is how clearly the local extractor could connect this candidate
            to your intake evidence. It is not a score for how important the person is,
            and it does not claim to know private thoughts or motives.
          </p>
        </details>
      </div>

      <div className="mt-4 rounded-md border border-black/8 bg-[#f7f8f4] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase text-[#7d8578]">
            Known evidence from intake
          </div>
          <span className="rounded border border-black/10 bg-white px-2 py-1 text-xs font-medium text-[#62695d]">
            refs {person.evidenceRefs.length}
          </span>
        </div>
        <p className="mt-2 line-clamp-4 text-xs leading-5 text-[#52594d]">
          {person.knownEvidence || person.evidenceText || "No evidence text captured yet."}
        </p>
        {person.evidenceText && person.evidenceText !== person.knownEvidence ? (
          <details className="mt-2 text-xs leading-5 text-[#62695d]">
            <summary className="cursor-pointer font-semibold text-[#3f483d]">
              Show evidence text
            </summary>
            <p className="mt-2 whitespace-pre-wrap">{person.evidenceText}</p>
          </details>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase text-[#7d8578]">
          Missing fields
        </div>
        {person.missingFields.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {person.missingFields.map((field) => (
              <span
                key={field}
                className="rounded border border-[#d49b4a]/30 bg-[#fff8ed] px-2 py-1 text-xs font-medium text-[#7c5524]"
              >
                {field}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-[#62695d]">
            No missing fields marked.
          </p>
        )}
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase text-[#7d8578]">
          One short note
        </span>
        <textarea
          value={person.userNote}
          onChange={(event) => onPatch({ userNote: event.target.value })}
          disabled={excluded}
          rows={2}
          placeholder="Add one observable fact, boundary, or correction."
          className="mt-2 w-full resize-none rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[#11150f] outline-none focus:border-[#568262] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase text-[#7d8578]">
          Merge duplicate into
        </span>
        <select
          value=""
          onChange={(event) => onMerge(event.target.value)}
          disabled={excluded || mergeTargets.length === 0}
          className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[#11150f] outline-none focus:border-[#568262] disabled:opacity-50"
        >
          <option value="">Choose another active person</option>
          {mergeTargets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.label}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {excluded ? (
          <button
            type="button"
            onClick={onRestore}
            className="rounded-md bg-[#11150f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a3026] sm:col-span-2"
          >
            Restore as candidate
          </button>
        ) : person.status === "confirmed" ? (
          <>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-md border border-[#568262]/25 bg-[#eef5ee] px-4 py-2.5 text-sm font-semibold text-[#2f5d3d]"
            >
              Confirmed for agents
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#11150f] transition hover:border-[#11150f]"
            >
              Delete from cast
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-md bg-[#11150f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a3026]"
            >
              Confirm for agents
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#11150f] transition hover:border-[#11150f]"
            >
              Delete from cast
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function Field({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-[#7d8578]">
        {label}
      </span>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[#11150f] outline-none focus:border-[#568262] disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
      <div className="text-xs text-white/48">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
