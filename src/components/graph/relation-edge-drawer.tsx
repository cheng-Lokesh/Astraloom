"use client";

import type { RelationEdgeDraft } from "@/types/relation-edge";

type RelationEdgeDrawerProps = {
  edge: RelationEdgeDraft | null;
  locked: boolean;
};

const weightLabels: Record<keyof RelationEdgeDraft["weights"], string> = {
  trust: "信任基础",
  hostility: "冲突压力",
  dependency: "依赖程度",
  attraction: "吸引/靠近信号",
  competition: "竞争强度",
  informationGap: "信息差",
  resourceControl: "资源控制",
  emotionalDebt: "情绪债务",
};

function explainWeight(key: keyof RelationEdgeDraft["weights"], value: number) {
  if (value >= 70) {
    return `${weightLabels[key]}较高，需要在报告中谨慎解释。`;
  }
  if (value >= 40) {
    return `${weightLabels[key]}处在中段，适合作为观察信号。`;
  }
  return `${weightLabels[key]}较低，目前只作为背景信息。`;
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
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            Selected relationship
          </p>
          <h2 className="mt-2 text-lg font-semibold text-[#11150f]">
            {edge.relationshipType}
          </h2>
        </div>
        <span className="rounded border border-[#568262]/20 bg-[#eef5ee] px-2 py-1 text-xs font-semibold text-[#2f5d3d]">
          {locked ? "Graph locked" : "Draft"}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#62695d]">
        {edge.lastInteraction.summary}
      </p>

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
          Evidence refs
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
