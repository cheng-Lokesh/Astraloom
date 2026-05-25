"use client";

import type { RelationEdgeDraft } from "@/types/relation-edge";

type RelationEdgeDrawerProps = {
  edge: RelationEdgeDraft | null;
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
  trust: "Stable cooperation, credibility, or confidence available on this edge.",
  hostility: "Friction, resistance, or conflict pressure present in the model.",
  dependency: "Reliance on timing, access, support, approval, or permission from the other actor.",
  attraction: "Pull, closeness, or desire to keep the relationship connected.",
  competition: "Competition for attention, resources, status, or options.",
  informationGap: "Important context that is missing or unevenly distributed between actors.",
  resourceControl: "Control over money, timing, approval, access, or other leverage.",
  emotionalDebt: "Unresolved obligation, guilt, or accumulated emotional cost.",
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

export function RelationEdgeDrawer({ edge, locked }: RelationEdgeDrawerProps) {
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
            {edge.relationshipType}
          </h2>
          <p className="mt-1 text-xs text-[#7d8578]">
            confidence {edge.confidence}%
          </p>
        </div>
        <span className="rounded border border-[#568262]/20 bg-[#eef5ee] px-2 py-1 text-xs font-semibold text-[#2f5d3d]">
          {locked ? "Graph locked" : "Draft"}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#62695d]">
        {edge.lastInteraction.summary}
      </p>

      <div className="mt-4 rounded-md border border-black/8 bg-[#f7f8f4] p-3">
        <div className="text-xs font-semibold uppercase text-[#7d8578]">
          Trend
        </div>
        <p className="mt-2 text-sm leading-6 text-[#62695d]">
          Volatility {edge.trend.volatility}; trust delta{" "}
          {edge.trend.trustDelta3Ticks}; hostility delta{" "}
          {edge.trend.hostilityDelta3Ticks}.
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
                <span className="text-lg font-semibold text-[#11150f]">
                  {value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

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
