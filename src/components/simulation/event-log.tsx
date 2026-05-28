"use client";

import type { AgentProfileDraft } from "@/types/agent-profile";
import type { RelationEdgeDraft, RelationWeights } from "@/types/relation-edge";
import type {
  SimulationBranchId,
  SimulationEventDraft,
  SimulationTickDraft,
} from "@/types/simulation-run";

type EventTone = "default" | "selected" | "highlighted" | "dimmed";
type WeightKey = keyof RelationWeights;

const branchClasses: Record<SimulationBranchId | "unknown", string> = {
  baseline: "border-l-[#7d8578]",
  cautious_self: "border-l-[#5b7f9b]",
  decisive_self: "border-l-[#c4824a]",
  unknown: "border-l-[#7d8578]",
};

const weightLabels: Record<WeightKey, string> = {
  trust: "Trust foundation",
  hostility: "Conflict pressure",
  dependency: "Dependency",
  attraction: "Attraction",
  competition: "Competition",
  informationGap: "Information gap",
  resourceControl: "Resource control",
  emotionalDebt: "Emotional debt",
};

function eventLabel(event: SimulationEventDraft) {
  const title = event.userFacingEventTitle ?? event.eventType.replaceAll("_", " ");
  return title
    .replace("Baseline path:", "Current inertia path:")
    .replace("Cautious self path:", "Cautious observation path:")
    .replace("Decisive self path:", "Active push path:");
}

function branchLabel(branchId: SimulationBranchId | undefined) {
  return branchId ?? "baseline";
}

function displayPathLabel(event: SimulationEventDraft) {
  if (event.pathLabel === "Baseline path") return "Current inertia path";
  if (event.pathLabel === "Cautious self path") return "Cautious observation path";
  if (event.pathLabel === "Decisive self path") return "Active push path";
  if (event.pathLabel) return event.pathLabel;
  if (event.branchId === "baseline") return "Current inertia path";
  if (event.branchId === "cautious_self") return "Cautious observation path";
  if (event.branchId === "decisive_self") return "Active push path";
  return branchLabel(event.branchId);
}

function agentLabel(agents: AgentProfileDraft[], id: string) {
  return agents.find((agent) => agent.id === id)?.label ?? id;
}

function edgeLabel(edges: RelationEdgeDraft[], agents: AgentProfileDraft[], id: string) {
  const edge = edges.find((item) => item.id === id);
  if (!edge) return id;
  const from = agentLabel(agents, edge.fromAgentId);
  const to = agentLabel(agents, edge.toAgentId);
  return `${from} -> ${to} / ${edge.relationshipType}`;
}

function deltaTone(key: WeightKey, value: number) {
  if (value === 0) return "text-[#7d8578]";
  const helpfulRise = key === "trust" || key === "attraction";
  const helpfulFall =
    key === "hostility" ||
    key === "competition" ||
    key === "informationGap" ||
    key === "emotionalDebt";
  if ((value > 0 && helpfulRise) || (value < 0 && helpfulFall)) {
    return "text-[#2f5d3d]";
  }
  return "text-[#7f1d1d]";
}

function eventCardClasses(tone: EventTone, lowConfidence: boolean) {
  const base =
    "w-full rounded-md border-l-4 border-y border-r p-4 text-left transition";
  if (tone === "selected") {
    return `${base} border-y-[#568262]/50 border-r-[#568262]/50 bg-[#eef5ee]`;
  }
  if (tone === "highlighted") {
    return `${base} border-y-[#d49b4a]/45 border-r-[#d49b4a]/45 bg-[#fff8ed]`;
  }
  if (tone === "dimmed") {
    return `${base} border-y-black/8 border-r-black/8 bg-[#f7f8f4] opacity-45`;
  }
  return `${base} ${lowConfidence ? "border-y-black/8 border-r-black/8 bg-white" : "border-y-black/8 border-r-black/8 bg-[#f7f8f4]"}`;
}

function EventDisplaySummary({ event }: { event: SimulationEventDraft }) {
  const sourceTags = event.sourceTags ?? [];
  const summaryItems = [
    ["Destiny influence", event.destinyInfluenceSummary],
    ["Interaction", event.interactionSummary],
    ["Pressure delta", event.pressureDeltaSummary],
    ["Information gap", event.informationGapDeltaSummary],
    ["Resource pressure", event.resourcePressureDeltaSummary],
  ].filter(([, value]) => Boolean(value));

  if (!summaryItems.length && !event.generatedClues?.length && !sourceTags.length) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3 rounded-md border border-black/8 bg-white p-3">
      {sourceTags.length ? (
        <div className="flex flex-wrap gap-2">
          {sourceTags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-[#568262]/20 bg-[#eef5ee] px-2 py-1 text-xs font-semibold text-[#2f5d3d]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {summaryItems.length ? (
        <div className="grid gap-2 lg:grid-cols-2">
          {summaryItems.map(([label, value]) => (
            <div key={label} className="rounded border border-black/8 bg-[#f7f8f4] p-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
                {label}
              </div>
              <p className="mt-1 text-xs leading-5 text-[#62695d]">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {event.generatedClues?.length ? (
        <RefList
          title="Generated clues"
          values={event.generatedClues}
          empty="No generated clues."
        />
      ) : null}
    </div>
  );
}

export function ConfidenceExplanation({ value }: { value: number }) {
  const label =
    value >= 80 ? "high confidence" : value >= 55 ? "moderate confidence" : value >= 25 ? "low confidence" : "weak signal";
  const detail =
    value >= 80
      ? "Multiple evidence refs and strong agent policy signals support this event."
      : value >= 55
        ? "Some evidence supports this event, but agent parameters are the primary driver."
        : value >= 25
          ? "This event is primarily policy-generated with limited direct evidence. Treat as a possible scenario, not a likely one."
          : "Very limited evidence. This event is almost entirely policy-generated. Treat as a weak signal only.";
  const badgeClass =
    value < 25
      ? "border-dashed border-black/20 text-[#7d8578]"
      : value >= 80
        ? "border-[#568262]/25 text-[#2f5d3d]"
        : value >= 55
          ? "border-[#d49b4a]/35 text-[#7c5524]"
          : "border-dashed border-[#d49b4a]/30 text-[#7c5524]";

  return (
    <div className="rounded border border-black/8 bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase text-[#7d8578]">
          confidence
        </span>
        <span className={`rounded border bg-white px-2 py-1 text-xs font-semibold ${badgeClass}`}>
          {value}% / {label}
        </span>
      </div>
      <p className="mt-1 text-xs leading-5 text-[#62695d]">{detail}</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-semibold text-[#7d8578]">
          What does event confidence mean?
        </summary>
        <p className="mt-2 text-xs leading-5 text-[#62695d]">
          Event confidence measures how strongly the available evidence and
          agent parameters support this specific event at this tick under this
          branch policy. Confidence does not make the event a certain outcome.
        </p>
      </details>
    </div>
  );
}

export function EdgeDeltaView({
  event,
  edges = [],
  agents = [],
  compact = false,
}: {
  event: SimulationEventDraft;
  edges?: RelationEdgeDraft[];
  agents?: AgentProfileDraft[];
  compact?: boolean;
}) {
  const rows = Object.entries(event.edgeWeightDeltas).flatMap(([edgeId, delta]) =>
    Object.entries(delta).map(([key, value]) => {
      const typedKey = key as WeightKey;
      const before = event.beforeState.weights[edgeId]?.[typedKey];
      const after = event.afterState.weights[edgeId]?.[typedKey];
      return {
        id: `${edgeId}:${key}`,
        edgeId,
        edgeLabel: edgeLabel(edges, agents, edgeId),
        key: typedKey,
        value: value ?? 0,
        before,
        after,
      };
    }),
  );

  if (!rows.length) {
    return (
      <p className="rounded border border-dashed border-black/12 bg-white p-3 text-xs leading-5 text-[#7d8578]">
        No edge weight delta recorded for this event.
      </p>
    );
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {rows.map((row) => (
        <div
          key={row.id}
          className="grid gap-2 rounded border border-black/8 bg-white p-3 text-xs sm:grid-cols-[1fr_auto]"
        >
          <div>
            <div className="font-semibold text-[#11150f]">
              {row.edgeLabel}
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
              {weightLabels[row.key]}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-[#11150f]">
              {row.before ?? "-"}{" -> "}{row.after ?? "-"}
            </div>
            <div className={`mt-1 font-semibold ${deltaTone(row.key, row.value)}`}>
              {row.value > 0 ? "Increased" : row.value < 0 ? "Decreased" : "Unchanged"}{" "}
              {row.value > 0 ? `+${row.value}` : row.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AgentRefsView({
  agentIds,
  agents,
}: {
  agentIds: string[];
  agents: AgentProfileDraft[];
}) {
  return (
    <RefList
      title="Agents"
      values={agentIds.map((id) => agentLabel(agents, id))}
      empty="No agent refs."
    />
  );
}

export function RelationEdgeRefsView({
  edgeIds,
  edges,
  agents,
}: {
  edgeIds: string[];
  edges: RelationEdgeDraft[];
  agents: AgentProfileDraft[];
}) {
  return (
    <RefList
      title="Relation edges"
      values={edgeIds.map((id) => edgeLabel(edges, agents, id))}
      empty="No relation edge refs."
    />
  );
}

export function EvidenceRefsView({ refs }: { refs: string[] }) {
  return (
    <details className="rounded border border-black/8 bg-white p-3">
      <summary className="cursor-pointer text-xs font-semibold uppercase text-[#7d8578]">
        Evidence refs ({refs.length})
      </summary>
      {refs.length ? (
        <div className="mt-2 space-y-1">
          <p className="mb-2 text-xs text-[#7d8578]">
            These refs link back to passages in your scenario intake that informed this event.
          </p>
          {refs.map((ref) => (
            <code key={ref} className="block break-all text-xs text-[#62695d]">
              {ref}
            </code>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs leading-5 text-[#62695d]">
          No evidence refs attached to this event.
        </p>
      )}
    </details>
  );
}

export function EventCard({
  event,
  agents = [],
  edges = [],
  selected = false,
  highlighted = false,
  dimmed = false,
  onSelectEvent,
}: {
  event: SimulationEventDraft;
  agents?: AgentProfileDraft[];
  edges?: RelationEdgeDraft[];
  selected?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  onSelectEvent?: (eventId: string) => void;
}) {
  const tone: EventTone = selected
    ? "selected"
    : highlighted
      ? "highlighted"
      : dimmed
        ? "dimmed"
        : "default";
  const lowConfidence = event.confidence < 55;
  const Wrapper = onSelectEvent ? "button" : "article";

  return (
    <Wrapper
      type={onSelectEvent ? "button" : undefined}
      onClick={onSelectEvent ? () => onSelectEvent(event.id) : undefined}
      className={`${eventCardClasses(tone, lowConfidence)} ${
        branchClasses[branchLabel(event.branchId)]
      } ${lowConfidence ? "border-l-dashed" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
            {displayPathLabel(event)} / Tick {event.tickIndex} / {event.timeLabel}
          </div>
          <h3 className="mt-2 text-sm font-semibold text-[#11150f]">
            {eventLabel(event)}
          </h3>
        </div>
        <span className="rounded border border-black/8 bg-white px-2 py-1 text-xs font-semibold text-[#3f483d]">
          {event.confidence}%
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#62695d]">{event.summary}</p>
      <EventDisplaySummary event={event} />

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ConfidenceExplanation value={event.confidence} />
        <div className="rounded border border-black/8 bg-white px-3 py-2">
          <div className="text-xs font-semibold uppercase text-[#7d8578]">
            event source
          </div>
          <p className="mt-1 text-xs leading-5 text-[#62695d]">
            {event.source} / {event.status}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <AgentRefsView agentIds={event.involvedAgentIds} agents={agents} />
        <RelationEdgeRefsView
          edgeIds={event.relationEdgeIds}
          edges={edges}
          agents={agents}
        />
      </div>

      <div className="mt-4">
        <EdgeDeltaView event={event} compact />
      </div>

      <div className="mt-4">
        <EvidenceRefsView refs={event.evidence?.evidenceRefs ?? []} />
      </div>
    </Wrapper>
  );
}

export function TickGroup({
  tick,
  events,
  agents = [],
  edges = [],
  highlightedEventIds = [],
  selectedEventId = "",
  onSelectEvent,
}: {
  tick: Pick<SimulationTickDraft, "id" | "tickIndex" | "timeLabel" | "summary">;
  events: SimulationEventDraft[];
  agents?: AgentProfileDraft[];
  edges?: RelationEdgeDraft[];
  highlightedEventIds?: string[];
  selectedEventId?: string;
  onSelectEvent?: (eventId: string) => void;
}) {
  const hasHighlight = highlightedEventIds.length > 0;

  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#11150f]">
            Tick {tick.tickIndex}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[#62695d]">{tick.summary}</p>
        </div>
        <span className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs font-semibold text-[#3f483d]">
          {tick.timeLabel}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {events.length ? (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              agents={agents}
              edges={edges}
              selected={selectedEventId === event.id}
              highlighted={highlightedEventIds.includes(event.id)}
              dimmed={hasHighlight && !highlightedEventIds.includes(event.id)}
              onSelectEvent={onSelectEvent}
            />
          ))
        ) : (
          <div className="rounded-md border border-dashed border-black/16 bg-[#f7f8f4] p-4">
            <div className="text-sm font-semibold text-[#11150f]">
              Empty tick slot
            </div>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              No Event Log was produced in this tick. This is a valid simulation
              result and helps distinguish branch behavior.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export function TimelineFeed({
  ticks,
  events,
  agents = [],
  edges = [],
  highlightedEventIds = [],
  selectedEventId = "",
  onSelectEvent,
  title = "Event Log timeline",
  description = "Events are grouped by tick so claims can be traced back to the local audit trail.",
}: {
  ticks?: SimulationTickDraft[];
  events: SimulationEventDraft[];
  agents?: AgentProfileDraft[];
  edges?: RelationEdgeDraft[];
  highlightedEventIds?: string[];
  selectedEventId?: string;
  onSelectEvent?: (eventId: string) => void;
  title?: string;
  description?: string;
}) {
  const tickEntries =
    ticks?.length
      ? ticks.map((tick) => ({
          tick,
          events: events.filter((event) => event.tickIndex === tick.tickIndex),
        }))
      : Array.from(new Set(events.map((event) => event.tickIndex)))
          .sort((left, right) => left - right)
          .map((tickIndex) => {
            const tickEvents = events.filter((event) => event.tickIndex === tickIndex);
            const first = tickEvents[0];
            return {
              tick: {
                id: `tick_${tickIndex}`,
                tickIndex,
                timeLabel: first?.timeLabel ?? `Tick ${tickIndex}`,
                summary: `Tick ${tickIndex} Event Log entries.`,
              },
              events: tickEvents,
            };
          });

  return (
    <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#11150f]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#62695d]">{description}</p>
        </div>
        <span className="rounded border border-[#568262]/20 bg-[#eef5ee] px-2 py-1 text-xs font-semibold text-[#2f5d3d]">
          {events.length} events
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {tickEntries.map(({ tick, events: tickEvents }) => (
          <TickGroup
            key={tick.id}
            tick={tick}
            events={tickEvents}
            agents={agents}
            edges={edges}
            highlightedEventIds={highlightedEventIds}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </div>
    </section>
  );
}

function RefList({
  title,
  values,
  empty,
}: {
  title: string;
  values: string[];
  empty: string;
}) {
  return (
    <div className="rounded border border-black/8 bg-white p-3">
      <div className="text-xs font-semibold uppercase text-[#7d8578]">
        {title}
      </div>
      <div className="mt-2 space-y-1">
        {values.length ? (
          values.map((value) => (
            <p key={value} className="break-words text-xs leading-5 text-[#62695d]">
              {value}
            </p>
          ))
        ) : (
          <p className="text-xs leading-5 text-[#7d8578]">{empty}</p>
        )}
      </div>
    </div>
  );
}
