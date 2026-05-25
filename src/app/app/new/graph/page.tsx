"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { GraphSummaryCards } from "@/components/graph/graph-summary-cards";
import { RelationEdgeDrawer } from "@/components/graph/relation-edge-drawer";
import { RelationGraph } from "@/components/graph/relation-graph";
import { StatusPill } from "@/components/status-pill";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { buildRelationEdges } from "@/lib/relations/build";
import type { AgentProfileDraft } from "@/types/agent-profile";
import type { RelationGraphDraft } from "@/types/relation-edge";

const emptyAgents: AgentProfileDraft[] = [];

export default function GraphPage() {
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [agentEcology] = useState(() => {
    if (!seedContext) return null;
    const result = repos.agentProfiles.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [savedGraph, setSavedGraph] = useState<RelationGraphDraft | null>(() => {
    if (!seedContext) return null;
    const result = repos.relationGraphs.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [selectedEdgeId, setSelectedEdgeId] = useState("");
  const [message, setMessage] = useState("");

  const agents = agentEcology?.agents ?? emptyAgents;
  const generatedEdges = useMemo(
    () => (seedContext ? buildRelationEdges(seedContext.id, agents) : []),
    [agents, seedContext],
  );
  const graphLocked = savedGraph?.graphLocked ?? false;
  const graphAgents = graphLocked ? savedGraph?.agents ?? agents : agents;
  const edges = graphLocked ? savedGraph?.edges ?? generatedEdges : generatedEdges;
  const selectedEdge =
    edges.find((edge) => edge.id === selectedEdgeId) ?? edges[0] ?? null;
  const lockedAtLabel = savedGraph?.lockedAt
    ? new Date(savedGraph.lockedAt).toLocaleString()
    : null;

  function saveGraph(lock: boolean) {
    if (!seedContext) return;
    const updatedAt = new Date().toISOString();
    const nextGraph: RelationGraphDraft = {
      seedContextId: seedContext.id,
      version: "local-deterministic-v0",
      agents: graphAgents,
      edges,
      graphLocked: lock,
      lockedAt: lock ? savedGraph?.lockedAt ?? updatedAt : null,
      updatedAt,
    };
    const result = repos.relationGraphs.save(nextGraph);
    if (!result.ok) {
      setMessage(`Save failed: ${result.errorCode}`);
      return;
    }
    setSavedGraph(nextGraph);
    setMessage(
      lock
        ? "Relation ledger locked. To change facts, return to People and regenerate the graph."
        : "Draft relation ledger saved locally.",
    );
  }

  function regenerateFromUpstream() {
    if (!seedContext) return;
    const updatedAt = new Date().toISOString();
    const nextGraph: RelationGraphDraft = {
      seedContextId: seedContext.id,
      version: "local-deterministic-v0",
      agents,
      edges: generatedEdges,
      graphLocked: false,
      lockedAt: null,
      updatedAt,
    };
    const result = repos.relationGraphs.save(nextGraph);
    if (!result.ok) {
      setMessage(`Save failed: ${result.errorCode}`);
      return;
    }
    setSavedGraph(nextGraph);
    setSelectedEdgeId("");
    setMessage("Graph regenerated from current Agent Profiles and upstream facts. Review and lock before simulation.");
  }

  if (!seedContext || !agentEcology?.agents.length) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">Agents required</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            Build Agent Profiles before opening the relationship ledger.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            The graph reads confirmed Agent Profiles and deterministic Relation
            Edges. It does not create editable customer records or direct edge
            controls.
          </p>
          <Link
            href="/app/new/agents"
            className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            Review Agent Profiles
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone={graphLocked ? "ready" : "planned"}>
            {graphLocked ? "Graph locked" : "Draft graph"}
          </StatusPill>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Review the read-only scenario graph.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            Nodes come from Agent Profiles. Edges come from deterministic relation rules,
            confidence scores, and evidence refs. This is not a CRM: there are no edge
            sliders, relation controls, or direct weight edits.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={regenerateFromUpstream}
            className="rounded-md border border-[#568262]/30 bg-[#eef5ee] px-4 py-2 text-sm font-semibold text-[#2f5d3d]"
          >
            Regenerate from upstream facts
          </button>
          <Link
            href="/app/new/people"
            className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
          >
            Supplement facts
          </Link>
        </div>
      </div>

      {message ? (
        <p className="mb-5 rounded-md border border-[#568262]/20 bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3d]">
          {message}
        </p>
      ) : null}

      <div className="mb-5">
        <GraphSummaryCards edges={edges} onSelectEdge={setSelectedEdgeId} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <main>
          <RelationGraph
            agents={graphAgents}
            edges={edges}
            selectedEdgeId={selectedEdge?.id ?? ""}
            locked={graphLocked}
            onSelectEdge={setSelectedEdgeId}
          />
        </main>

        <aside className="h-fit space-y-5">
          <section className="rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
            <h2 className="text-sm font-semibold text-[#b7e6c6]">
              Graph lock state
            </h2>
            <div
              className={`mt-4 rounded-md border p-4 ${
                graphLocked
                  ? "border-[#b7e6c6]/30 bg-[#b7e6c6]/10"
                  : "border-[#d49b4a]/35 bg-[#d49b4a]/10"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">
                  {graphLocked ? "Locked for simulation" : "Draft review required"}
                </span>
                <StatusPill tone={graphLocked ? "ready" : "blocked"}>
                  {graphLocked ? "Locked" : "Unlocked"}
                </StatusPill>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/66">
                {graphLocked
                  ? "Simulation can start from this frozen graph snapshot."
                  : "Simulation cannot start until this graph is locked."}
              </p>
              {lockedAtLabel ? (
                <p className="mt-2 text-xs text-white/45">Locked {lockedAtLabel}</p>
              ) : null}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Agents" value={graphAgents.length} />
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

            {savedGraph?.updatedAt ? (
              <p className="mt-4 text-xs leading-5 text-white/50">
                Saved: {new Date(savedGraph.updatedAt).toLocaleString()}
              </p>
            ) : null}

            {graphLocked ? (
              <div className="mt-5 rounded-md border border-white/10 bg-white/[0.06] p-4">
                <p className="text-sm leading-6 text-white/72">
                  This graph is locked for the current run. To change people or
                  relationship facts, update upstream facts and regenerate a new draft graph.
                </p>
                <Link
                  href="/app/new/people"
                  className="mt-4 inline-flex w-full justify-center rounded-md bg-[#b7e6c6] px-4 py-3 text-sm font-semibold text-[#11150f]"
                >
                  Update facts on People page
                </Link>
                <button
                  type="button"
                  onClick={regenerateFromUpstream}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
                >
                  Regenerate draft from upstream
                </button>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => saveGraph(false)}
                  className="inline-flex w-full justify-center rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  onClick={() => saveGraph(true)}
                  className="inline-flex w-full justify-center rounded-md bg-[#b7e6c6] px-4 py-3 text-sm font-semibold text-[#11150f]"
                >
                  Lock relationship ledger
                </button>
              </div>
            )}

            <Link
              href="/app/simulation/running"
              className={`mt-3 inline-flex w-full justify-center rounded-md px-4 py-3 text-sm font-semibold ${
                graphLocked
                  ? "border border-white/10 text-white"
                  : "cursor-not-allowed border border-white/10 text-white/42"
              }`}
              onClick={(event) => {
                if (!graphLocked) event.preventDefault();
              }}
            >
              Continue to simulation
            </Link>
          </section>

          <RelationEdgeDrawer edge={selectedEdge} locked={graphLocked} />
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
