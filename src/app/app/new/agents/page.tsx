"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
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

function confidenceTone(value: number) {
  if (value >= 80) return "ready";
  if (value >= 55) return "planned";
  return "caution";
}

function sourceFor(agent: AgentProfileDraft, field: string) {
  return agent.profileJson.fieldSources[field] ?? agent.profileJson.source.sourceType;
}

function fieldLabel(value: string) {
  return value
    .replace("motivation.fear", "motivation.concern")
    .replace("state.currentIntention", "state.current model aim")
    .replaceAll(".", " / ")
    .replace(/([A-Z])/g, " $1")
    .replaceAll("_", " ")
    .toLowerCase();
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
        <SurfaceCard emphasis="strong" className="mx-auto max-w-3xl p-8">
          <StatusPill tone="blocked">Needs scenario</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold text-[#11150f]">
            Add a situation before generating agents.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            Agent Profiles are local simulation models built from intake context and confirmed people.
          </p>
          <ButtonLink href="/app/new/intake" className="mt-6 px-5 py-3">
            Go to intake
          </ButtonLink>
        </SurfaceCard>
      </AppShell>
    );
  }

  if (!confirmedPeople.length) {
    return (
      <AppShell>
        <SurfaceCard emphasis="strong" className="mx-auto max-w-3xl p-8">
          <StatusPill tone="blocked">Needs confirmed people</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold text-[#11150f]">
            Confirm the cast before creating NPC agents.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            Every confirmed Key Person maps to one NPC agent. Deleted and merged people stay out of generation.
          </p>
          <ButtonLink href="/app/new/people" className="mt-6 px-5 py-3">
            Return to people
          </ButtonLink>
        </SurfaceCard>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <SurfaceCard emphasis="strong">
            <StatusPill tone="ready">Situation model details</StatusPill>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#11150f]">
              Inspect bounded agent models behind the sandbox.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
              This optional detail page shows the situation models used for
              dynamic path simulation. They are bounded models, not statements
              of fact about real people.
            </p>
            <div className="mt-5 rounded-md border border-black/8 bg-[#f7f8f4] p-4 text-sm leading-7 text-[#3f483d]">
              <span className="font-semibold text-[#11150f]">Scenario: </span>
              {seedContext.questionText}
            </div>
          </SurfaceCard>

          <aside className="mf-panel-dark p-6">
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
              <Button
                type="button"
                variant="ghostOnDark"
                onClick={regenerate}
                className="w-full px-4 py-3"
              >
                Regenerate from updated people/context
              </Button>
              <Button
                type="button"
                variant="onDark"
                onClick={saveDraft}
                className="w-full px-4 py-3"
              >
                Save local agent draft
              </Button>
            </div>
            {savedAt ? (
              <p className="mt-3 text-xs leading-5 text-white/50">
                Saved {new Date(savedAt).toLocaleString()}
              </p>
            ) : null}
            <ButtonLink
              href="/app/new/graph"
              variant="ghostOnDark"
              className="mt-3 w-full px-4 py-3"
            >
              Continue to graph
            </ButtonLink>
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(340px,0.5fr)]">
          <main className="space-y-5">
            <UserCoreSection
              agents={userCore}
              selectedId={selectedAgent?.id ?? ""}
              onSelect={setSelectedId}
            />
            <ParallelSelfSection
              agents={parallelSelves}
              selectedId={selectedAgent?.id ?? ""}
              onSelect={setSelectedId}
              enabled={includeParallelSelves}
            />
            <NpcAgentSection
              agents={npcAgents}
              expectedCount={confirmedPeople.length}
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

function UserCoreSection({
  agents,
  selectedId,
  onSelect,
}: {
  agents: AgentProfileDraft[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const agent = agents[0] ?? null;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#11150f]">User core card</h2>
          <p className="mt-1 text-sm leading-6 text-[#62695d]">
            The baseline user model used to anchor the local simulation.
          </p>
        </div>
        <StatusPill tone={agent ? "ready" : "blocked"}>
          {agent ? "Core exists" : "Missing core"}
        </StatusPill>
      </div>
      {agent ? (
        <UserCoreCard
          agent={agent}
          selected={selectedId === agent.id}
          onSelect={() => onSelect(agent.id)}
        />
      ) : (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          User core should always be generated before graph preparation.
        </div>
      )}
    </section>
  );
}

function ParallelSelfSection({
  agents,
  selectedId,
  onSelect,
  enabled,
}: {
  agents: AgentProfileDraft[];
  selectedId: string;
  onSelect: (id: string) => void;
  enabled: boolean;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#11150f]">
            Parallel self comparison cards
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#62695d]">
            Cautious and decisive branches expose different simulation policies for the same user context.
          </p>
        </div>
        <StatusPill tone={enabled ? "active" : "locked"}>
          {enabled ? `${agents.length} variants` : "Disabled"}
        </StatusPill>
      </div>
      {enabled ? (
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {agents.map((agent) => (
            <ParallelSelfCard
              key={agent.id}
              agent={agent}
              selected={selectedId === agent.id}
              onSelect={() => onSelect(agent.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-black/8 bg-white p-5 text-sm leading-6 text-[#62695d]">
          Parallel self variants are turned off for this draft.
        </div>
      )}
    </section>
  );
}

function NpcAgentSection({
  agents,
  expectedCount,
  selectedId,
  onSelect,
}: {
  agents: AgentProfileDraft[];
  expectedCount: number;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const complete = agents.length === expectedCount;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#11150f]">NPC agent cards</h2>
          <p className="mt-1 text-sm leading-6 text-[#62695d]">
            Each confirmed Key Person becomes one NPC model with source and evidence details.
          </p>
        </div>
        <StatusPill tone={complete ? "ready" : "caution"}>
          {agents.length}/{expectedCount} mapped
        </StatusPill>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {agents.map((agent) => (
          <NpcAgentCard
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

function SelectableCard({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
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
      {children}
    </button>
  );
}

function UserCoreCard({
  agent,
  selected,
  onSelect,
}: {
  agent: AgentProfileDraft;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <SelectableCard selected={selected} onSelect={onSelect}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase text-[#7d8578]">
            {agentTypeLabel(agent)}
          </div>
          <h3 className="mt-2 text-xl font-semibold text-[#11150f]">
            {agent.label}
          </h3>
        </div>
        <ConfidenceDisplay value={agent.confidence} compact />
      </div>

      <p className="mt-3 text-sm leading-6 text-[#62695d]">
        {agent.role} / {agent.relationshipToUser}
      </p>
      <FieldLine
        label="Recognizable core"
        value={agent.profileJson.motivation.primaryGoal}
        source={sourceFor(agent, "motivation.primaryGoal")}
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MiniField
          label="Resources"
          value={`authority ${agent.profileJson.resources.authority}, information ${agent.profileJson.resources.information}`}
          source={sourceFor(agent, "resources")}
        />
        <MiniField
          label="Behavior"
          value={`${agent.profileJson.behaviorPolicy.communicationStyle}, initiative ${agent.profileJson.behaviorPolicy.initiative}`}
          source={sourceFor(agent, "behaviorPolicy")}
        />
      </div>
      <CardFooter agent={agent} />
    </SelectableCard>
  );
}

function ParallelSelfCard({
  agent,
  selected,
  onSelect,
}: {
  agent: AgentProfileDraft;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <SelectableCard selected={selected} onSelect={onSelect}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase text-[#7d8578]">
            {stanceLabel(agent.profileJson.stance)}
          </div>
          <h3 className="mt-2 text-xl font-semibold text-[#11150f]">
            {agent.label}
          </h3>
        </div>
        <ConfidenceDisplay value={agent.confidence} compact />
      </div>
      <div className="mt-4 grid gap-3">
        <MiniField
          label="Action speed"
          value={String(agent.profileJson.behaviorPolicy.actionSpeed)}
          source={sourceFor(agent, "behaviorPolicy.actionSpeed")}
        />
        <MiniField
          label="Initiative"
          value={String(agent.profileJson.behaviorPolicy.initiative)}
          source={sourceFor(agent, "behaviorPolicy.initiative")}
        />
        <MiniField
          label="Avoidance"
          value={agent.profileJson.motivation.avoidancePattern}
          source={sourceFor(agent, "motivation.avoidancePattern")}
        />
      </div>
      <CardFooter agent={agent} />
    </SelectableCard>
  );
}

function NpcAgentCard({
  agent,
  selected,
  onSelect,
}: {
  agent: AgentProfileDraft;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <SelectableCard selected={selected} onSelect={onSelect}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase text-[#7d8578]">
            NPC from confirmed Key Person
          </div>
          <h3 className="mt-2 text-xl font-semibold text-[#11150f]">
            {agent.label}
          </h3>
        </div>
        <ConfidenceDisplay value={agent.confidence} compact />
      </div>
      <p className="mt-3 text-sm leading-6 text-[#62695d]">
        {agent.role} / {agent.relationshipToUser}
      </p>
      <div className="mt-4 grid gap-3">
        <FieldLine
          label="Why this NPC exists"
          value={agent.profileJson.origin}
          source={agent.profileJson.source.sourceType}
        />
        <MiniField
          label="Current model state"
          value={agent.profileJson.state.currentIntention}
          source={sourceFor(agent, "state.currentIntention")}
        />
      </div>
      <CardFooter agent={agent} />
    </SelectableCard>
  );
}

function CardFooter({ agent }: { agent: AgentProfileDraft }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/8 pt-4">
      <SourceBadge value={agent.profileJson.source.sourceType} />
      <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#3f483d]">
        evidence refs: {agent.evidenceRefs.length}
      </span>
      <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#3f483d]">
        missing: {agent.profileJson.missingFields.length}
      </span>
    </div>
  );
}

function FieldLine({
  label,
  value,
  source,
}: {
  label: string;
  value: string;
  source: AgentFieldSourceType;
}) {
  return (
    <div className="mt-4 rounded-md border border-black/8 bg-[#fbfcf8] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase text-[#7d8578]">
          {label}
        </div>
        <SourceBadge value={source} />
      </div>
      <p className="mt-2 text-sm leading-6 text-[#3f483d]">{value}</p>
    </div>
  );
}

function MiniField({
  label,
  value,
  source,
}: {
  label: string;
  value: string;
  source: AgentFieldSourceType;
}) {
  return (
    <div className="rounded-md border border-black/8 bg-[#f7f8f4] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase text-[#7d8578]">
          {label}
        </div>
        <SourceBadge value={source} />
      </div>
      <p className="mt-2 text-sm leading-6 text-[#3f483d]">{value}</p>
    </div>
  );
}

function ConfidenceDisplay({
  value,
  compact = false,
}: {
  value: number;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "min-w-[76px]" : ""}>
      <StatusPill tone={confidenceTone(value)}>{value}% confidence</StatusPill>
      {!compact ? (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/8">
          <div
            className="h-full rounded-full bg-[#568262]"
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          />
        </div>
      ) : null}
    </div>
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
            {agentTypeLabel(agent)}
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-[#11150f]">
            {agent.label}
          </h2>
        </div>
        <StatusPill tone={agentTone(agent)}>{agentTypeLabel(agent)}</StatusPill>
      </div>

      <div className="mt-4 rounded-md border border-[#568262]/20 bg-[#eef5ee] p-4 text-sm leading-6 text-[#2f5d3d]">
        This profile prepares simulation behavior. It is a bounded local model, not a statement of fact about a person.
      </div>

      <div className="mt-4 space-y-3">
        <ConfidenceDisplay value={agent.confidence} />
        <div className="flex flex-wrap gap-2">
          <SourceBadge value={agent.profileJson.source.sourceType} />
          <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#52594d]">
            {agent.version}
          </span>
          {agent.sourceKeyPersonId ? (
            <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#52594d]">
              key person: {agent.sourceKeyPersonId}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <FieldLine
          label="Why this agent exists"
          value={agent.profileJson.origin}
          source={agent.profileJson.source.sourceType}
        />
        <FieldLine
          label="Role"
          value={agent.role}
          source={sourceFor(agent, "role")}
        />
        <FieldLine
          label="Stance"
          value={stanceLabel(agent.profileJson.stance)}
          source={sourceFor(agent, "stance")}
        />
        <FieldLine
          label="Motivation"
          value={agent.profileJson.motivation.primaryGoal}
          source={sourceFor(agent, "motivation.primaryGoal")}
        />
        <FieldLine
          label="Concern"
          value={agent.profileJson.motivation.fear}
          source={sourceFor(agent, "motivation.fear")}
        />
        <FieldLine
          label="Avoidance pattern"
          value={agent.profileJson.motivation.avoidancePattern}
          source={sourceFor(agent, "motivation.avoidancePattern")}
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
        <TextList
          title="Traits"
          items={agent.profileJson.traits}
          empty="No traits marked."
        />
        <TextList
          title="Missing fields"
          items={agent.profileJson.missingFields}
          empty="No missing fields marked."
        />
        <TextList
          title="Model boundaries"
          items={agent.profileJson.constraints}
          empty="No boundaries listed."
        />

        <EvidenceDisclosure refs={agent.evidenceRefs} />
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
            {fieldLabel(field)}: {sourceLabel(source)}
          </span>
        ))}
      </div>
    </div>
  );
}

function EvidenceDisclosure({ refs }: { refs: string[] }) {
  return (
    <details className="rounded-md bg-[#f7f8f4] p-4">
      <summary className="cursor-pointer text-xs font-semibold uppercase text-[#7d8578]">
        Evidence refs ({refs.length})
      </summary>
      {refs.length ? (
        <div className="mt-3 space-y-1">
          {refs.map((ref) => (
            <code key={ref} className="block break-all text-xs text-[#3f483d]">
              {ref}
            </code>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-[#62695d]">
          No evidence refs are attached to this local model.
        </p>
      )}
    </details>
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

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-black/8 p-3">
      <div className="text-xs text-[#7d8578]">{label}</div>
      <div className="mt-1 text-xl font-semibold text-[#11150f]">{value}</div>
    </div>
  );
}
