"use client";

import type { RelationEdgeDraft } from "@/types/relation-edge";

type GraphSummaryCardsProps = {
  edges: RelationEdgeDraft[];
  onSelectEdge?: (edgeId: string) => void;
};

function pressureScore(edge: RelationEdgeDraft) {
  return (
    edge.weights.hostility +
    edge.weights.competition +
    edge.weights.emotionalDebt
  );
}

function supportScore(edge: RelationEdgeDraft) {
  return Math.max(
    0,
    edge.weights.trust +
      edge.weights.dependency -
      edge.weights.hostility -
      edge.trend.volatility,
  );
}

function strongestPressureEdge(edges: RelationEdgeDraft[]) {
  return [...edges].sort(
    (left, right) => pressureScore(right) - pressureScore(left),
  )[0];
}

function largestInformationGap(edges: RelationEdgeDraft[]) {
  return [...edges].sort(
    (left, right) => right.weights.informationGap - left.weights.informationGap,
  )[0];
}

function mostStableSupportEdge(edges: RelationEdgeDraft[]) {
  return [...edges].sort(
    (left, right) => supportScore(right) - supportScore(left),
  )[0];
}

function highestDependencyEdge(edges: RelationEdgeDraft[]) {
  return [...edges].sort(
    (left, right) => right.weights.dependency - left.weights.dependency,
  )[0];
}

function edgeScore(edge: RelationEdgeDraft | undefined, kind: string) {
  if (!edge) return 0;
  if (kind === "pressure") return pressureScore(edge);
  if (kind === "gap") return edge.weights.informationGap;
  if (kind === "dependency") return edge.weights.dependency;
  return supportScore(edge);
}

export function GraphSummaryCards({
  edges,
  onSelectEdge,
}: GraphSummaryCardsProps) {
  const cards = [
    {
      id: "pressure",
      title: "Strongest pressure edge",
      body: "The edge where conflict, competition, and emotional debt cluster most strongly.",
      edge: strongestPressureEdge(edges),
    },
    {
      id: "gap",
      title: "Largest information gap",
      body: "The edge most likely to benefit from more observable facts before simulation.",
      edge: largestInformationGap(edges),
    },
    {
      id: "support",
      title: "Most stable support edge",
      body: "The edge with the strongest support signal after volatility is considered.",
      edge: mostStableSupportEdge(edges),
    },
    {
      id: "dependency",
      title: "Highest dependency edge",
      body: "The edge where timing, access, approval, or support depends most on another actor.",
      edge: highestDependencyEdge(edges),
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => card.edge && onSelectEdge?.(card.edge.id)}
          disabled={!card.edge}
          className="rounded-lg border border-black/8 bg-white p-4 text-left shadow-[0_16px_48px_rgba(17,21,15,0.05)] transition hover:border-[#568262]/35 disabled:cursor-default disabled:opacity-60"
        >
          <p className="text-xs font-semibold uppercase text-[#7d8578]">
            {card.title}
          </p>
          <h2 className="mt-2 text-sm font-semibold text-[#11150f]">
            {card.edge?.relationshipType ?? "No edge"}
          </h2>
          <p className="mt-2 min-h-[60px] text-xs leading-5 text-[#62695d]">
            {card.body}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <code className="truncate text-[11px] text-[#7d8578]">
              {card.edge?.id ?? "missing"}
            </code>
            <span className="rounded border border-[#568262]/20 bg-[#eef5ee] px-2 py-1 text-xs font-semibold text-[#2f5d3d]">
              {edgeScore(card.edge, card.id)}
            </span>
          </div>
        </button>
      ))}
    </section>
  );
}
