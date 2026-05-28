"use client";

import type { RelationEdgeDraft } from "@/types/relation-edge";
import type { AgentProfileDraft } from "@/types/agent-profile";

type RelationEdgeDrawerProps = {
  edge: RelationEdgeDraft | null;
  agents: AgentProfileDraft[];
  locked: boolean;
};

const weightLabels: Record<keyof RelationEdgeDraft["weights"], string> = {
  trust: "Trust foundation",
  hostility: "Conflict pressure",
  dependency: "Dependency",
  attraction: "Attraction or pull",
  competition: "Competition",
  informationGap: "Information gap",
  resourceControl: "Resource control",
  emotionalDebt: "Emotional debt",
};

const weightExplanations: Record<keyof RelationEdgeDraft["weights"], string> = {
  trust: "信任基础: stable cooperation, credibility, or confidence available on this edge.",
  hostility: "冲突压力: friction, resistance, or conflict pressure present in the model.",
  dependency: "依赖程度: reliance on timing, access, support, approval, or permission from the other actor.",
  attraction: "吸引或牵引: pull, closeness, or a reason to keep the relationship connected.",
  competition: "竞争压力: competition for attention, resources, status, or options.",
  informationGap: "信息差: important context that is missing or unevenly distributed between actors.",
  resourceControl: "资源控制: control over money, timing, approval, access, or other leverage.",
  emotionalDebt: "情绪债务: unresolved obligation, guilt, or accumulated emotional cost.",
};

function explainWeight(key: keyof RelationEdgeDraft["weights"], value: number) {
  if (value >= 70) {
    return `${weightExplanations[key]} This signal is high, so later simulation should treat it carefully.`;
  }
  if (value >= 40) {
    return `${weightExplanations[key]} This signal is moderate and useful for event observation.`;
  }
  return `${weightExplanations[key]} This signal is low and stays as background context.`;
}

function strengthLabel(value: number) {
  if (value >= 70) return "Strong";
  if (value >= 40) return "Moderate";
  return "Weak";
}

function strengthClasses(value: number) {
  if (value >= 70) return "border-[#b95b4d]/25 bg-[#fff1ed] text-[#7f1d1d]";
  if (value >= 40) return "border-[#d49b4a]/30 bg-[#fff8ed] text-[#7c5524]";
  return "border-[#568262]/20 bg-[#eef5ee] text-[#2f5d3d]";
}

function trendDirection(value: number) {
  if (value > 0) return "rising";
  if (value < 0) return "easing";
  return "steady";
}

function agentLabel(agents: AgentProfileDraft[], id: string) {
  return agents.find((agent) => agent.id === id)?.label ?? "Unknown agent";
}

function relationTitle(edge: RelationEdgeDraft, agents: AgentProfileDraft[]) {
  return `${agentLabel(agents, edge.fromAgentId)} -> ${agentLabel(agents, edge.toAgentId)}`;
}

export function RelationEdgeDrawer({
  edge,
  agents,
  locked,
}: RelationEdgeDrawerProps) {
  if (!edge) {
    return (
      <section className="rounded-lg border border-black/8 bg-white p-5">
        <h2 className="text-sm font-semibold text-[#11150f]">
          Selected relationship
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#62695d]">
          Select an edge in the graph to inspect the read-only relation ledger.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-black/8 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-[#7d8578]">
            Selected relationship
          </p>
          <h2 className="mt-2 text-lg font-semibold text-[#11150f]">
            {relationTitle(edge, agents)}
          </h2>
          <p className="mt-1 text-xs capitalize text-[#7d8578]">
            {edge.relationshipType.replaceAll("_", " ")} / confidence {edge.confidence}%
          </p>
        </div>
        <span className="rounded border border-[#568262]/20 bg-[#eef5ee] px-2 py-1 text-xs font-semibold text-[#2f5d3d]">
          {locked ? "Graph locked" : "Draft"}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#62695d]">
        {edge.lastInteraction.summary}
      </p>

      <div className="mt-4 rounded-md border border-[#568262]/20 bg-[#eef5ee] p-3">
        <div className="text-xs font-semibold uppercase text-[#2f5d3d]">
          How to read this edge
        </div>
        <p className="mt-2 text-sm leading-6 text-[#2f5d3d]">
          These values describe simulation pressure between the two agent models. They are not editable relationship records and do not state private facts.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-black/8 bg-[#f7f8f4] p-3">
        <div className="text-xs font-semibold uppercase text-[#7d8578]">
          Trend
        </div>
        <p className="mt-2 text-sm leading-6 text-[#62695d]">
          This edge is {strengthLabel(edge.trend.volatility).toLowerCase()} in
          volatility. Trust is {trendDirection(edge.trend.trustDelta3Ticks)} and
          conflict pressure is {trendDirection(edge.trend.hostilityDelta3Ticks)}
          across the recent simulation window.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {Object.entries(edge.weights).map(([key, value]) => {
          const typedKey = key as keyof RelationEdgeDraft["weights"];
          return (
            <div
              key={key}
              className="rounded-md border border-black/8 bg-[#f7f8f4] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#11150f]">
                    {weightLabels[typedKey]}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#62695d]">
                    {explainWeight(typedKey, value)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${strengthClasses(value)}`}
                >
                  {strengthLabel(value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <details className="mt-5 rounded-md border border-black/8 bg-white p-3">
        <summary className="cursor-pointer text-sm font-semibold text-[#11150f]">
          Technical details
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <div className="text-xs font-semibold uppercase text-[#7d8578]">
              Exact relation weights
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {Object.entries(edge.weights).map(([key, value]) => {
                const typedKey = key as keyof RelationEdgeDraft["weights"];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 rounded border border-black/8 bg-[#f7f8f4] px-3 py-2"
                  >
                    <span className="text-xs text-[#62695d]">
                      {weightLabels[typedKey]}
                    </span>
                    <code className="text-xs font-semibold text-[#11150f]">
                      {value}
                    </code>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-[#7d8578]">
              Exact trend values
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <TechnicalValue label="Volatility" value={edge.trend.volatility} />
              <TechnicalValue
                label="Trust delta"
                value={edge.trend.trustDelta3Ticks}
              />
              <TechnicalValue
                label="Hostility delta"
                value={edge.trend.hostilityDelta3Ticks}
              />
            </div>
          </div>
        </div>
      </details>

      <details className="mt-5 rounded-md border border-black/8 bg-[#f7f8f4] p-3">
        <summary className="cursor-pointer text-sm font-semibold text-[#11150f]">
          What the weights mean
        </summary>
        <div className="mt-3 space-y-2">
          {Object.entries(weightExplanations).map(([key, explanation]) => (
            <p key={key} className="text-xs leading-5 text-[#62695d]">
              <span className="font-semibold text-[#11150f]">
                {weightLabels[key as keyof RelationEdgeDraft["weights"]]}:
              </span>{" "}
              {explanation}
            </p>
          ))}
        </div>
      </details>

      <details className="mt-5 rounded-md border border-black/8 bg-white p-3">
        <summary className="cursor-pointer text-sm font-semibold text-[#11150f]">
          Evidence refs ({edge.evidenceRefs.length})
        </summary>
        <div className="mt-3 space-y-1">
          {edge.evidenceRefs.map((ref) => (
            <code key={ref} className="block break-all text-xs text-[#7d8578]">
              {ref}
            </code>
          ))}
        </div>
      </details>
    </section>
  );
}

function TechnicalValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-black/8 bg-[#f7f8f4] px-3 py-2">
      <div className="text-xs text-[#62695d]">{label}</div>
      <code className="mt-1 block text-xs font-semibold text-[#11150f]">
        {value}
      </code>
    </div>
  );
}
