"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge as FlowEdge,
  type Node,
} from "@xyflow/react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { loadAgentEcologyDraft } from "@/lib/agents/storage";
import { buildRelationEdges } from "@/lib/relations/build";
import {
  loadRelationGraphDraft,
  saveRelationGraphDraft,
} from "@/lib/relations/storage";
import { loadSeedContextDraft } from "@/lib/seed-context/storage";
import type { AgentProfileDraft } from "@/types/agent-profile";
import type { RelationEdgeDraft, RelationWeights } from "@/types/relation-edge";

const palette = {
  self: "#11150f",
  parallel: "#8b6f9b",
  npc: "#568262",
  authority: "#7f5f2b",
  opportunity: "#3d6770",
  rivalry: "#9a4f20",
  low: "#7d8578",
};

const emptyAgents: AgentProfileDraft[] = [];

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

function edgeLabel(weights: RelationWeights) {
  const top = Object.entries(weights).sort((left, right) => right[1] - left[1])[0];
  return `${top[0]} ${top[1]}`;
}

function toFlowNodes(agents: AgentProfileDraft[]): Node[] {
  return agents.map((agent, index) => ({
    id: agent.id,
    position: agentPosition(agent, index, agents.length),
    data: {
      label: `${agent.label}\n${agent.role}`,
    },
    style: {
      width: 170,
      border:
        agent.agentType === "self"
          ? `2px solid ${palette.self}`
          : "1px solid rgba(17,21,15,0.18)",
      borderRadius: 8,
      background:
        agent.agentType === "self"
          ? "#11150f"
          : agent.agentType === "parallel_self"
            ? "#f1edf5"
            : "#ffffff",
      color: agent.agentType === "self" ? "#ffffff" : "#11150f",
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "pre-line",
      boxShadow: "0 12px 32px rgba(17,21,15,0.08)",
    },
  }));
}

function toFlowEdges(edges: RelationEdgeDraft[]): FlowEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.fromAgentId,
    target: edge.toAgentId,
    label: edgeLabel(edge.weights),
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: edge.trend.volatility > 42,
    style: {
      stroke: edgeColor(edge),
      strokeWidth: Math.max(1.5, edge.confidence / 28),
      strokeDasharray: edge.confidence < 55 ? "6 6" : undefined,
    },
  }));
}

export default function GraphPage() {
  const [seedContext] = useState(() => loadSeedContextDraft());
  const [agentEcology] = useState(() =>
    seedContext ? loadAgentEcologyDraft(seedContext.id) : null,
  );
  const [savedAt, setSavedAt] = useState(() =>
    seedContext ? loadRelationGraphDraft(seedContext.id)?.updatedAt ?? null : null,
  );
  const [selectedEdgeId, setSelectedEdgeId] = useState("");

  const agents = agentEcology?.agents ?? emptyAgents;
  const edges = useMemo(
    () => (seedContext ? buildRelationEdges(seedContext.id, agents) : []),
    [agents, seedContext],
  );
  const selectedEdge =
    edges.find((edge) => edge.id === selectedEdgeId) ?? edges[0] ?? null;

  const flowNodes = useMemo(() => toFlowNodes(agents), [agents]);
  const flowEdges = useMemo(() => toFlowEdges(edges), [edges]);

  function saveGraph() {
    if (!seedContext) return;
    const updatedAt = new Date().toISOString();
    saveRelationGraphDraft({
      seedContextId: seedContext.id,
      version: "local-deterministic-v0",
      agents,
      edges,
      updatedAt,
    });
    setSavedAt(updatedAt);
  }

  if (!seedContext || !agentEcology?.agents.length) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">需要 Agent 草稿</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            先把确认人物装载成 Agent Profile。
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            关系图谱必须直接映射 Agent Profile 和 Relation Edge 草稿，不能继续依赖空的展示节点。
          </p>
          <Link
            href="/app/new/agents"
            className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            生成 Agent 草稿
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="overflow-hidden rounded-lg border border-black/8 bg-white shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <div className="border-b border-black/8 p-6">
            <StatusPill tone="ready">Read-only Relation Graph</StatusPill>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
              关系图谱现在来自本地 Agent 和 Relation Edge 草稿。
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
              节点来自 Agent Profile，边来自确定性 Relation Edge 生成器。用户可以查看证据和权重读数，但不能编辑
              trust、hostility、dependency 或任何边权。
            </p>
          </div>

          <div className="h-[620px] bg-[#f7f8f4]">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              edgesFocusable
              elementsSelectable
              panOnDrag
              zoomOnScroll
              onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
            >
              <Background color="#d7ddcf" gap={24} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        </main>

        <aside className="h-fit rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            Relation Edge ledger
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="Agents" value={agents.length} />
            <Metric label="Edges" value={edges.length} />
            <Metric
              label="Avg confidence"
              value={
                edges.length
                  ? Math.round(
                      edges.reduce((sum, edge) => sum + edge.confidence, 0) /
                        edges.length,
                    )
                  : 0
              }
            />
            <Metric
              label="Evidence refs"
              value={edges.reduce(
                (sum, edge) => sum + edge.evidenceRefs.length,
                0,
              )}
            />
          </div>

          {selectedEdge ? (
            <section className="mt-5 rounded-md border border-white/10 bg-white/[0.06] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                Selected edge
              </div>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {selectedEdge.relationshipType}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/62">
                {selectedEdge.lastInteraction.summary}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {Object.entries(selectedEdge.weights).map(([key, value]) => (
                  <div key={key} className="rounded bg-white/[0.06] p-2">
                    <div className="text-[11px] text-white/42">{key}</div>
                    <div className="mt-1 text-base font-semibold">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1">
                {selectedEdge.evidenceRefs.map((ref) => (
                  <code key={ref} className="block break-all text-xs text-white/50">
                    {ref}
                  </code>
                ))}
              </div>
            </section>
          ) : null}

          <button
            type="button"
            onClick={saveGraph}
            className="mt-5 inline-flex w-full justify-center rounded-md bg-[#b7e6c6] px-4 py-3 text-sm font-semibold text-[#11150f]"
          >
            保存本地关系图谱草稿
          </button>
          {savedAt ? (
            <p className="mt-3 text-xs leading-5 text-white/50">
              已保存：{new Date(savedAt).toLocaleString()}
            </p>
          ) : null}
          <Link
            href="/app/simulation/running"
            className="mt-3 inline-flex w-full justify-center rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
          >
            Continue to running state
          </Link>
        </aside>
      </section>
    </AppShell>
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
