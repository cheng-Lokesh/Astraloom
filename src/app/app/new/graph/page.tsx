"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { GraphSummaryCards } from "@/components/graph/graph-summary-cards";
import { RelationEdgeDrawer } from "@/components/graph/relation-edge-drawer";
import { RelationGraph } from "@/components/graph/relation-graph";
import { StatusPill } from "@/components/status-pill";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
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
  const [showLockModal, setShowLockModal] = useState(false);

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
    if (graphLocked) {
      setMessage("This graph is locked. Update upstream facts first, then create a new draft graph from the flow.");
      return;
    }
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
        <SurfaceCard emphasis="strong" className="mx-auto max-w-3xl p-8">
          <StatusPill tone="blocked">Agents required</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            Build Agent Profiles before opening the relationship ledger.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            The graph reads confirmed Agent Profiles and deterministic Relation
            Edges. It does not create editable customer records or direct edge
            controls.
          </p>
          <ButtonLink href="/app/new/agents" className="mt-6 px-5 py-3">
            Review Agent Profiles
          </ButtonLink>
        </SurfaceCard>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone={graphLocked ? "ready" : "planned"}>
            {graphLocked ? "Situation map details" : "Draft situation map"}
          </StatusPill>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            Inspect the read-only situation map.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            This optional detail page shows the map behind the destiny
            sandbox. Nodes come from situation models; edges come from
            deterministic relation rules, confidence scores, and evidence refs.
            This is not a CRM.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="accent"
            onClick={regenerateFromUpstream}
            disabled={graphLocked}
          >
            Regenerate from upstream facts
          </Button>
          <ButtonLink href="/app/new/people" variant="secondary">
            Supplement facts
          </ButtonLink>
        </div>
      </div>

      {message ? (
        <p className="mb-5 rounded-md border border-[#568262]/20 bg-[#eef5ee] px-4 py-3 text-sm text-[#2f5d3d]">
          {message}
        </p>
      ) : null}

      <div className="mb-5">
        <GraphSummaryCards
          edges={edges}
          agents={graphAgents}
          onSelectEdge={setSelectedEdgeId}
        />
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
          <section className="mf-panel-dark p-6">
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

            <EvidenceCoverage edges={edges} />

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
                <ButtonLink
                  href="/app/new/people"
                  variant="onDark"
                  className="mt-4 w-full px-4 py-3"
                >
                  Update facts on People page
                </ButtonLink>
                <ButtonLink
                  href="/app/new/agents"
                  variant="ghostOnDark"
                  className="mt-3 w-full px-4 py-3"
                >
                  Review Agent Profiles
                </ButtonLink>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                <Button
                  type="button"
                  variant="ghostOnDark"
                  onClick={() => saveGraph(false)}
                  className="w-full px-4 py-3"
                >
                  Save draft
                </Button>
                <Button
                  type="button"
                  variant="onDark"
                  onClick={() => setShowLockModal(true)}
                  className="w-full px-4 py-3"
                >
                  Lock relationship ledger
                </Button>
              </div>
            )}

            <ButtonLink
              href="/app/simulation/running"
              variant="ghostOnDark"
              className={`mt-3 w-full px-4 py-3 ${
                graphLocked
                  ? ""
                  : "cursor-not-allowed text-white/42"
              }`}
              onClick={(event) => {
                if (!graphLocked) event.preventDefault();
              }}
            >
              {graphLocked ? "Continue to simulation" : "Lock graph to start simulation"}
            </ButtonLink>
          </section>

          <RelationEdgeDrawer
            edge={selectedEdge}
            agents={graphAgents}
            locked={graphLocked}
          />
        </aside>
      </section>

      {showLockModal ? (
        <GraphLockModal
          edgeCount={edges.length}
          agentCount={graphAgents.length}
          onCancel={() => setShowLockModal(false)}
          onConfirm={() => {
            setShowLockModal(false);
            saveGraph(true);
          }}
        />
      ) : null}
    </AppShell>
  );
}

function EvidenceCoverage({ edges }: { edges: RelationGraphDraft["edges"] }) {
  const withEvidence = edges.filter((edge) => edge.evidenceRefs.length > 0).length;
  const inferred = edges.length - withEvidence;

  return (
    <details className="mt-4 rounded-md border border-white/10 bg-white/[0.06] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-white">
        Evidence coverage
      </summary>
      <p className="mt-3 text-sm leading-6 text-white/66">
        {withEvidence} of {edges.length} edges include evidence refs. {inferred} edge
        {inferred === 1 ? " uses" : "s use"} deterministic inference from Agent Profiles.
      </p>
    </details>
  );
}

function GraphLockModal({
  agentCount,
  edgeCount,
  onCancel,
  onConfirm,
}: {
  agentCount: number;
  edgeCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#11150f]/45 px-4">
      <section className="w-full max-w-lg rounded-lg border border-black/8 bg-white p-6 shadow-[0_32px_120px_rgba(17,21,15,0.22)]">
        <StatusPill tone="planned">Graph Lock</StatusPill>
        <h2 className="mt-4 text-2xl font-semibold text-[#11150f]">
          Lock this graph snapshot?
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#62695d]">
          Locking freezes {agentCount} agents and {edgeCount} relation edges as
          the local simulation input. The graph remains inspectable, but edge
          weights stay read-only.
        </p>
        <div className="mt-5 rounded-md border border-[#d49b4a]/30 bg-[#fff8ed] p-4 text-sm leading-6 text-[#7c5524]">
          To change the structure after locking, return to upstream facts and create a new draft graph.
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Keep reviewing
          </Button>
          <Button type="button" variant="primary" onClick={onConfirm}>
            Lock graph snapshot
          </Button>
        </div>
      </section>
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
