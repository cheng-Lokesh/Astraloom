"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { buildAgentProfiles } from "@/lib/agents/build";
import { getRepositories } from "@/lib/repositories/repository-provider";
import type {
  AgentFieldSourceType,
  AgentProfileDraft,
} from "@/types/agent-profile";

function metricAverage(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function agentTone(agent: AgentProfileDraft) {
  if (agent.profileJson.source.sourceType === "user_confirmed") return "ready";
  if (agent.agentType === "self") return "ready";
  return agent.confidence >= 70 ? "ready" : "planned";
}

function agentTypeLabel(agent: AgentProfileDraft) {
  if (agent.agentType === "self") return "User core";
  if (agent.agentType === "parallel_self") return "Parallel self";
  return "NPC agent";
}

function stanceLabel(value: string) {
  return value.replaceAll("_", " ");
}

function sourceLabel(value: AgentFieldSourceType) {
  const labels: Record<AgentFieldSourceType, string> = {
    user_confirmed: "User-confirmed",
    chat_inferred: "Inferred",
    default: "Default model",
    model_inferred: "Model-inferred",
  };
  return labels[value];
}

function sourceClasses(value: AgentFieldSourceType) {
  if (value === "user_confirmed") {
    return "border-[#568262]/30 bg-[#eef5ee] text-[#2f5d3d]";
  }
  if (value === "default") {
    return "border-black/8 bg-[#f7f8f4] text-[#52594d]";
  }
  return "border-[#d49b4a]/30 bg-[#fff8ed] text-[#7c5524]";
}

export default function AgentsPage() {
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [keyPeople] = useState(() => {
    if (!seedContext) return null;
    const result = repos.keyPeople.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [includeParallelSelves, setIncludeParallelSelves] = useState(() => {
    if (!seedContext) return true;
    const result = repos.agentProfiles.load(seedContext.id);
    return result.ok ? result.data?.includeParallelSelves ?? true : true;
  });
  const [savedAt, setSavedAt] = useState<string | null>(() => {
    if (!seedContext) return null;
    const result = repos.agentProfiles.load(seedContext.id);
    return result.ok ? result.data?.updatedAt ?? null : null;
  });
  const [selectedId, setSelectedId] = useState("");
  const [generationVersion, setGenerationVersion] = useState(0);

  const confirmedPeople = useMemo(
    () =>
      (keyPeople?.people ?? []).filter(
        (person) => person.confirmed && person.status === "confirmed",
      ),
    [keyPeople],
  );

  const agents = useMemo(() => {
    if (!seedContext) return [];
    const nextAgents = buildAgentProfiles(seedContext, confirmedPeople, includeParallelSelves);
    return generationVersion === 0
      ? nextAgents
      : nextAgents.map((agent) => ({ ...agent }));
  }, [confirmedPeople, generationVersion, includeParallelSelves, seedContext]);

  const userCore = agents.filter((agent) => agent.agentType === "self");
  const parallelSelves = agents.filter(
    (agent) => agent.agentType === "parallel_self",
  );
  const npcAgents = agents.filter((agent) => agent.agentType === "npc");
  const selectedAgent =
    agents.find((agent) => agent.id === selectedId) ?? userCore[0] ?? agents[0] ?? null;

  function saveDraft() {
    if (!seedContext) return;
    const updatedAt = new Date().toISOString();
    const result = repos.agentProfiles.save({
      seedContextId: seedContext.id,
      includeParallelSelves,
      agents,
      updatedAt,
    });
    if (result.ok) {
      setSavedAt(updatedAt);
    }
  }

  function regenerate() {
    setGenerationVersion((value) => value + 1);
    setSelectedId("");
    setSavedAt(null);
  }

  if (!seedContext) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">Needs scenario</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold text-[#11150f]">
            Add a situation before generating agents.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            Agent Profiles are local simulation models built from intake context and confirmed people.
          </p>
          <Link
            href="/app/new/intake"
            className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            Go to intake
          </Link>
        </section>
      </AppShell>
    );
  }

  if (!confirmedPeople.length) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">Needs confirmed people</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold text-[#11150f]">
            Confirm the cast before creating NPC agents.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            Every confirmed Key Person maps to one NPC agent. Deleted and merged people stay out of generation.
          </p>
          <Link
            href="/app/new/people"
            className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            Return to people
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <StatusPill tone="ready">Agent Profile confirmation</StatusPill>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#11150f]">
              Review the simulation models before the graph is built.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
              Agents are bounded simulation models, not truth claims about real people. Inspect
              their sources, confidence, missing fields, and behavior policy before freezing them
              into the relationship graph.
            </p>
            <div className="mt-5 rounded-md border border-black/8 bg-[#f7f8f4] p-4 text-sm leading-7 text-[#3f483d]">
              <span className="font-semibold text-[#11150f]">Scenario: </span>
              {seedContext.questionText}
            </div>
          </main>

          <aside className="rounded-lg bg-[#11150f] p-6 text-white">
            <div className="text-xs font-semibold uppercase text-[#b7e6c6]">
              Simulation readiness
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Agents" value={agents.length} />
              <Metric label="NPC agents" value={npcAgents.length} />
              <Metric
                label="Avg confidence"
                value={metricAverage(agents.map((agent) => agent.confidence))}
              />
              <Metric
                label="Evidence refs"
                value={agents.reduce(
                  (total, agent) => total + agent.evidenceRefs.length,
                  0,
                )}
              />
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-md border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-white/70">
              <input
                type="checkbox"
                checked={includeParallelSelves}
                onChange={(event) => setIncludeParallelSelves(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#b7e6c6]"
              />
              <span>
                Include cautious and decisive self variants for branch comparison.
              </span>
            </label>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={regenerate}
                className="inline-flex w-full justify-center rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
              >
                Regenerate from current context
              </button>
              <button
                type="button"
                onClick={saveDraft}
                className="inline-flex w-full justify-center rounded-md bg-[#b7e6c6] px-4 py-3 text-sm font-semibold text-[#11150f]"
              >
                Save local agent draft
              </button>
            </div>
            {savedAt ? (
              <p className="mt-3 text-xs leading-5 text-white/50">
                Saved {new Date(savedAt).toLocaleString()}
              </p>
            ) : null}
            <Link
              href="/app/new/graph"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
            >
              Continue to graph
            </Link>
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(340px,0.5fr)]">
          <main className="space-y-5">
            <AgentGroup
              title="User core agent"
              description="The baseline model for the user in this sandbox."
              agents={userCore}
              selectedId={selectedAgent?.id ?? ""}
              onSelect={setSelectedId}
            />
            <AgentGroup
              title="Parallel self variants"
              description="Comparison branches for cautious and decisive versions of the user's strategy."
              agents={parallelSelves}
              selectedId={selectedAgent?.id ?? ""}
              onSelect={setSelectedId}
            />
            <AgentGroup
              title="NPC agents"
              description="One NPC agent is generated for every confirmed Key Person."
              agents={npcAgents}
              selectedId={selectedAgent?.id ?? ""}
              onSelect={setSelectedId}
            />
          </main>

          <AgentInspector agent={selectedAgent} />
        </section>
      </div>
    </AppShell>
  );
}

function AgentGroup({
  title,
  description,
  agents,
  selectedId,
  onSelect,
}: {
  title: string;
  description: string;
  agents: AgentProfileDraft[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#11150f]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#62695d]">{description}</p>
        </div>
        <span className="text-xs font-semibold uppercase text-[#7d8578]">
          {agents.length} shown
        </span>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            selected={selectedId === agent.id}
            onSelect={() => onSelect(agent.id)}
          />
        ))}
      </div>
    </section>
  );
}

function AgentCard({
  agent,
  selected,
  onSelect,
}: {
  agent: AgentProfileDraft;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-lg border p-5 text-left transition ${
        selected
          ? "border-[#568262]/50 bg-[#eef5ee]"
          : "border-black/8 bg-white hover:border-[#568262]/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase text-[#7d8578]">
            {agentTypeLabel(agent)}
          </div>
          <h3 className="mt-2 text-xl font-semibold text-[#11150f]">
            {agent.label}
          </h3>
        </div>
        <StatusPill tone={agentTone(agent)}>{agent.confidence}%</StatusPill>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#62695d]">
        {agent.role} / {agent.relationshipToUser}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <SourceBadge value={agent.profileJson.source.sourceType} />
        <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#3f483d]">
          stance: {stanceLabel(agent.profileJson.stance)}
        </span>
        <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#3f483d]">
          evidence refs: {agent.evidenceRefs.length}
        </span>
      </div>
      <p className="mt-4 line-clamp-3 text-xs leading-5 text-[#7d8578]">
        {agent.profileJson.motivation.primaryGoal}
      </p>
    </button>
  );
}

function AgentInspector({ agent }: { agent: AgentProfileDraft | null }) {
  if (!agent) {
    return (
      <aside className="h-fit rounded-lg border border-black/8 bg-white p-5">
        <h2 className="text-sm font-semibold text-[#11150f]">Agent details</h2>
        <p className="mt-3 text-sm leading-6 text-[#62695d]">
          Select an agent to inspect its source and simulation profile.
        </p>
      </aside>
    );
  }

  return (
    <aside className="h-fit rounded-lg border border-black/8 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase text-[#7d8578]">
            {agent.profileJson.origin}
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-[#11150f]">
            {agent.label}
          </h2>
        </div>
        <StatusPill tone={agentTone(agent)}>{agentTypeLabel(agent)}</StatusPill>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <SourceBadge value={agent.profileJson.source.sourceType} />
        <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#52594d]">
          confidence {agent.confidence}%
        </span>
        <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#52594d]">
          {agent.version}
        </span>
      </div>

      <div className="mt-5 space-y-5">
        <Detail label="Role" value={agent.role} />
        <Detail label="Stance" value={stanceLabel(agent.profileJson.stance)} />
        <Detail label="Motivation" value={agent.profileJson.motivation.primaryGoal} />
        <Detail label="Fear" value={agent.profileJson.motivation.fear} />
        <Detail
          label="Avoidance pattern"
          value={agent.profileJson.motivation.avoidancePattern}
        />

        <ScoreGrid
          title="Resources"
          items={[
            ["Authority", agent.profileJson.resources.authority],
            ["Information", agent.profileJson.resources.information],
            ["Social capital", agent.profileJson.resources.socialCapital],
            ["Emotional leverage", agent.profileJson.resources.emotionalLeverage],
          ]}
        />
        <ScoreGrid
          title="Behavior policy"
          items={[
            ["Action speed", agent.profileJson.behaviorPolicy.actionSpeed],
            ["Initiative", agent.profileJson.behaviorPolicy.initiative],
            ["Cooperation", agent.profileJson.behaviorPolicy.cooperationBias],
          ]}
          footer={`Communication style: ${agent.profileJson.behaviorPolicy.communicationStyle}`}
        />
        <ScoreGrid
          title="Current state"
          items={[
            ["Stress", agent.profileJson.state.stress],
            ["User trust", agent.profileJson.state.trustInUser],
            ["Friction", agent.profileJson.state.hostilityToUser],
          ]}
          footer={agent.profileJson.state.currentIntention}
        />

        <FieldSources sources={agent.profileJson.fieldSources} />
        <TextList title="Missing fields" items={agent.profileJson.missingFields} empty="No missing fields marked." />
        <TextList title="Model boundaries" items={agent.profileJson.constraints} empty="No boundaries listed." />

        <div className="rounded-md bg-[#f7f8f4] p-4">
          <div className="text-xs font-semibold uppercase text-[#7d8578]">
            Evidence refs
          </div>
          <div className="mt-2 space-y-1">
            {agent.evidenceRefs.map((ref) => (
              <code
                key={ref}
                className="block break-all text-xs text-[#3f483d]"
              >
                {ref}
              </code>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function SourceBadge({ value }: { value: AgentFieldSourceType }) {
  return (
    <span className={`rounded border px-2 py-1 text-xs font-semibold ${sourceClasses(value)}`}>
      {sourceLabel(value)}
    </span>
  );
}

function FieldSources({
  sources,
}: {
  sources: Record<string, AgentFieldSourceType>;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-[#7d8578]">
        Field sources
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {Object.entries(sources).map(([field, source]) => (
          <span
            key={field}
            className={`rounded border px-2 py-1 text-xs ${sourceClasses(source)}`}
          >
            {field}: {sourceLabel(source)}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScoreGrid({
  title,
  items,
  footer,
}: {
  title: string;
  items: Array<[string, number]>;
  footer?: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-[#7d8578]">
        {title}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {items.map(([label, value]) => (
          <Score key={label} label={label} value={value} />
        ))}
      </div>
      {footer ? (
        <p className="mt-2 text-xs leading-5 text-[#62695d]">{footer}</p>
      ) : null}
    </div>
  );
}

function TextList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-[#7d8578]">
        {title}
      </div>
      {items.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#52594d]"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-[#62695d]">{empty}</p>
      )}
    </div>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-[#7d8578]">
        {label}
      </div>
      <p className="mt-1 text-sm leading-6 text-[#62695d]">{value}</p>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-black/8 p-3">
      <div className="text-xs text-[#7d8578]">{label}</div>
      <div className="mt-1 text-xl font-semibold text-[#11150f]">{value}</div>
    </div>
  );
}
