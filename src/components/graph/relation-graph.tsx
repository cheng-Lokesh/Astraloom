"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge as FlowEdge,
  type Node,
} from "@xyflow/react";

import type { AgentProfileDraft } from "@/types/agent-profile";
import type { RelationEdgeDraft, RelationWeights } from "@/types/relation-edge";

import { AgentNodeCard } from "./agent-node-card";

type RelationGraphProps = {
  agents: AgentProfileDraft[];
  edges: RelationEdgeDraft[];
  selectedEdgeId: string;
  locked: boolean;
  onSelectEdge: (edgeId: string) => void;
};

const palette = {
  self: "#11150f",
  parallel: "#8b6f9b",
  npc: "#568262",
  authority: "#7f5f2b",
  opportunity: "#3d6770",
  rivalry: "#9a4f20",
  low: "#7d8578",
};

const nodeTypes = { agentNode: AgentNodeCard };

function agentPosition(agent: AgentProfileDraft, index: number, total: number) {
  if (agent.agentType === "self") return { x: 360, y: 220 };
  if (agent.agentType === "parallel_self") {
    return { x: 120 + index * 40, y: 80 + index * 86 };
  }

  const angle = ((index + 1) / Math.max(total, 1)) * Math.PI * 1.5 - Math.PI / 4;
  return {
    x: Math.round(360 + Math.cos(angle) * 280),
    y: Math.round(220 + Math.sin(angle) * 190),
  };
}

function edgeColor(edge: RelationEdgeDraft) {
  if (edge.relationshipType === "authority") return palette.authority;
  if (edge.relationshipType === "opportunity") return palette.opportunity;
  if (edge.relationshipType === "rivalry") return palette.rivalry;
  if (edge.relationshipType === "self_variant") return palette.parallel;
  if (edge.confidence < 55) return palette.low;
  return palette.npc;
}

function topWeightLabel(weights: RelationWeights) {
  const top = Object.entries(weights).sort((left, right) => right[1] - left[1])[0];
  return `${top[0]} ${top[1]}`;
}

function toFlowNodes(agents: AgentProfileDraft[]): Node[] {
  return agents.map((agent, index) => ({
    id: agent.id,
    type: "agentNode",
    position: agentPosition(agent, index, agents.length),
    data: {
      label: agent.label,
      role: agent.role,
      agentType: agent.agentType,
      confidence: agent.confidence,
    },
  }));
}

function toFlowEdges(
  edges: RelationEdgeDraft[],
  selectedEdgeId: string,
): FlowEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.fromAgentId,
    target: edge.toAgentId,
    label: `${edge.relationshipType} / ${edge.confidence}% / ${topWeightLabel(edge.weights)}`,
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: edge.trend.volatility > 42,
    style: {
      stroke: edge.id === selectedEdgeId ? "#11150f" : edgeColor(edge),
      strokeWidth:
        edge.id === selectedEdgeId ? 3 : Math.max(1.5, edge.confidence / 28),
      strokeDasharray: edge.confidence < 55 ? "6 6" : undefined,
    },
  }));
}

export function RelationGraph({
  agents,
  edges,
  selectedEdgeId,
  locked,
  onSelectEdge,
}: RelationGraphProps) {
  const flowNodes = useMemo(() => toFlowNodes(agents), [agents]);
  const flowEdges = useMemo(
    () => toFlowEdges(edges, selectedEdgeId),
    [edges, selectedEdgeId],
  );

  return (
    <section className="overflow-hidden rounded-lg border border-black/8 bg-white shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/8 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
            Read-only scenario graph
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#11150f]">
            Agents to relationship evidence
          </h2>
        </div>
        <span
          className={`rounded border px-2 py-1 text-xs font-semibold ${
            locked
              ? "border-[#568262]/20 bg-[#eef5ee] text-[#2f5d3d]"
              : "border-[#d49b4a]/30 bg-[#fff8ed] text-[#7c5524]"
          }`}
        >
          {locked ? "Graph Lock: on" : "Graph Lock: draft"}
        </span>
      </div>
      <div className="h-[640px] bg-[#f7f8f4]">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable
          elementsSelectable
          panOnDrag
          zoomOnScroll
          onEdgeClick={(_, edge) => onSelectEdge(edge.id)}
        >
          <Background color="#d7ddcf" gap={24} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </section>
  );
}
