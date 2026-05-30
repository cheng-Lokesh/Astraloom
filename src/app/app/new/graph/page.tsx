"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { GraphSummaryCards } from "@/components/graph/graph-summary-cards";
import { RelationEdgeDrawer } from "@/components/graph/relation-edge-drawer";
import { RelationGraph } from "@/components/graph/relation-graph";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { buildRelationEdges } from "@/lib/relations/build";
import type { AgentProfileDraft } from "@/types/agent-profile";
import type { RelationGraphDraft } from "@/types/relation-edge";

const emptyAgents: AgentProfileDraft[] = [];

const graphCopy = {
  en: {
    agentsRequired: "Agents required",
    emptyTitle: "Build Agent Profiles before opening the relationship ledger.",
    emptyBody:
      "The graph reads confirmed Agent Profiles and deterministic Relation Edges. It does not create editable customer records or direct edge controls.",
    reviewAgents: "Review Agent Profiles",
    lockedStatus: "Situation map details",
    draftStatus: "Draft situation map",
    title: "Inspect the read-only situation map.",
    intro:
      "This optional detail page shows the map behind the destiny sandbox. Nodes come from situation models; edges come from deterministic relation rules, confidence scores, and evidence refs. This is not a CRM.",
    regenerate: "Regenerate from upstream facts",
    supplement: "Supplement facts",
    saveFailed: "Save failed",
    lockedMessage:
      "Relation ledger locked. To change facts, return to People and regenerate the graph.",
    draftSaved: "Draft relation ledger saved locally.",
    lockedGraphMessage:
      "This graph is locked. Update upstream facts first, then create a new draft graph from the flow.",
    regenerated:
      "Graph regenerated from current Agent Profiles and upstream facts. Review and lock before simulation.",
    lockState: "Graph lock state",
    lockedForSimulation: "Locked for simulation",
    draftReview: "Draft review required",
    locked: "Locked",
    unlocked: "Unlocked",
    canStart: "Simulation can start from this frozen graph snapshot.",
    cannotStart: "Simulation cannot start until this graph is locked.",
    lockedAt: "Locked",
    agents: "Agents",
    edges: "Edges",
    avgConfidence: "Avg confidence",
    evidenceRefs: "Evidence refs",
    saved: "Saved",
    lockedHelp:
      "This graph is locked for the current run. To change people or relationship facts, update upstream facts and regenerate a new draft graph.",
    updateFacts: "Update facts on People page",
    saveDraft: "Save draft",
    lockLedger: "Lock relationship ledger",
    continueSimulation: "Continue to simulation",
    lockToStart: "Lock graph to start simulation",
    coverageTitle: "Evidence coverage",
    coverage: (withEvidence: number, total: number, inferred: number) =>
      `${withEvidence} of ${total} edges include evidence refs. ${inferred} edge${
        inferred === 1 ? " uses" : "s use"
      } deterministic inference from Agent Profiles.`,
    modalStatus: "Graph Lock",
    modalTitle: "Lock this graph snapshot?",
    modalBody: (agentCount: number, edgeCount: number) =>
      `Locking freezes ${agentCount} agents and ${edgeCount} relation edges as the local simulation input. The graph remains inspectable, but edge weights stay read-only.`,
    modalWarning:
      "To change the structure after locking, return to upstream facts and create a new draft graph.",
    keepReviewing: "Keep reviewing",
    lockSnapshot: "Lock graph snapshot",
  },
  zh: {
    agentsRequired: "需要先生成 Agent",
    emptyTitle: "打开关系账本前，请先生成 Agent 画像。",
    emptyBody:
      "关系图读取已确认的 Agent 画像和确定性关系边。它不会创建可编辑客户记录，也不会提供直接编辑边权重的控件。",
    reviewAgents: "查看 Agent 画像",
    lockedStatus: "处境地图详情",
    draftStatus: "处境地图草稿",
    title: "检查只读处境地图。",
    intro:
      "这个可选详情页展示命理沙盘背后的地图。节点来自处境模型；边来自确定性关系规则、置信度分数和证据引用。这不是 CRM。",
    regenerate: "从上游事实重新生成",
    supplement: "补充事实",
    saveFailed: "保存失败",
    lockedMessage: "关系账本已锁定。若要修改事实，请返回人物页并重新生成关系图。",
    draftSaved: "关系账本草稿已保存到本地。",
    lockedGraphMessage:
      "这张关系图已锁定。请先更新上游事实，再从流程中创建新的草稿关系图。",
    regenerated: "已根据当前 Agent 画像和上游事实重新生成关系图。请在推演前检查并锁定。",
    lockState: "关系图锁定状态",
    lockedForSimulation: "已为推演锁定",
    draftReview: "需要审查草稿",
    locked: "已锁定",
    unlocked: "未锁定",
    canStart: "推演可以从这个冻结的关系图快照开始。",
    cannotStart: "关系图锁定前不能开始推演。",
    lockedAt: "锁定于",
    agents: "Agent",
    edges: "关系边",
    avgConfidence: "平均置信度",
    evidenceRefs: "证据引用",
    saved: "已保存",
    lockedHelp:
      "当前推演已锁定这张关系图。若要修改人物或关系事实，请更新上游事实并重新生成草稿关系图。",
    updateFacts: "到人物页更新事实",
    saveDraft: "保存草稿",
    lockLedger: "锁定关系账本",
    continueSimulation: "继续推演",
    lockToStart: "锁定关系图后开始推演",
    coverageTitle: "证据覆盖",
    coverage: (withEvidence: number, total: number, inferred: number) =>
      `${total} 条关系边中有 ${withEvidence} 条包含证据引用。${inferred} 条关系边使用来自 Agent 画像的确定性推断。`,
    modalStatus: "关系图锁定",
    modalTitle: "锁定这个关系图快照？",
    modalBody: (agentCount: number, edgeCount: number) =>
      `锁定会将 ${agentCount} 个 Agent 和 ${edgeCount} 条关系边冻结为本地推演输入。关系图仍可检查，但边权重保持只读。`,
    modalWarning: "锁定后若要修改结构，请返回上游事实并创建新的草稿关系图。",
    keepReviewing: "继续检查",
    lockSnapshot: "锁定关系图快照",
  },
} as const;

export default function GraphPage() {
  const { locale } = useLanguage();
  const t = graphCopy[locale];
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
      setMessage(`${t.saveFailed}: ${result.errorCode}`);
      return;
    }
    setSavedGraph(nextGraph);
    setMessage(
      lock
        ? t.lockedMessage
        : t.draftSaved,
    );
  }

  function regenerateFromUpstream() {
    if (!seedContext) return;
    if (graphLocked) {
      setMessage(t.lockedGraphMessage);
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
      setMessage(`${t.saveFailed}: ${result.errorCode}`);
      return;
    }
    setSavedGraph(nextGraph);
    setSelectedEdgeId("");
    setMessage(t.regenerated);
  }

  if (!seedContext || !agentEcology?.agents.length) {
    return (
      <AppShell>
        <SurfaceCard emphasis="strong" className="mx-auto max-w-3xl p-8">
          <StatusPill tone="blocked">{t.agentsRequired}</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            {t.emptyTitle}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            {t.emptyBody}
          </p>
          <ButtonLink href="/app/new/agents" className="mt-6 px-5 py-3">
            {t.reviewAgents}
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
            {graphLocked ? t.lockedStatus : t.draftStatus}
          </StatusPill>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            {t.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            {t.intro}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="accent"
            onClick={regenerateFromUpstream}
            disabled={graphLocked}
          >
            {t.regenerate}
          </Button>
          <ButtonLink href="/app/new/people" variant="secondary">
            {t.supplement}
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
              {t.lockState}
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
                  {graphLocked ? t.lockedForSimulation : t.draftReview}
                </span>
                <StatusPill tone={graphLocked ? "ready" : "blocked"}>
                  {graphLocked ? t.locked : t.unlocked}
                </StatusPill>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/66">
                {graphLocked
                  ? t.canStart
                  : t.cannotStart}
              </p>
              {lockedAtLabel ? (
                <p className="mt-2 text-xs text-white/45">
                  {t.lockedAt} {lockedAtLabel}
                </p>
              ) : null}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label={t.agents} value={graphAgents.length} />
              <Metric label={t.edges} value={edges.length} />
              <Metric
                label={t.avgConfidence}
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
                label={t.evidenceRefs}
                value={edges.reduce(
                  (sum, edge) => sum + edge.evidenceRefs.length,
                  0,
                )}
              />
            </div>

            <EvidenceCoverage edges={edges} />

            {savedGraph?.updatedAt ? (
              <p className="mt-4 text-xs leading-5 text-white/50">
                {t.saved}: {new Date(savedGraph.updatedAt).toLocaleString()}
              </p>
            ) : null}

            {graphLocked ? (
              <div className="mt-5 rounded-md border border-white/10 bg-white/[0.06] p-4">
                <p className="text-sm leading-6 text-white/72">
                  {t.lockedHelp}
                </p>
                <ButtonLink
                  href="/app/new/people"
                  variant="onDark"
                  className="mt-4 w-full px-4 py-3"
                >
                  {t.updateFacts}
                </ButtonLink>
                <ButtonLink
                  href="/app/new/agents"
                  variant="ghostOnDark"
                  className="mt-3 w-full px-4 py-3"
                >
                  {t.reviewAgents}
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
                  {t.saveDraft}
                </Button>
                <Button
                  type="button"
                  variant="onDark"
                  onClick={() => setShowLockModal(true)}
                  className="w-full px-4 py-3"
                >
                  {t.lockLedger}
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
              {graphLocked ? t.continueSimulation : t.lockToStart}
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
          copy={t}
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

function EvidenceCoverage({
  edges,
}: {
  edges: RelationGraphDraft["edges"];
}) {
  const { locale } = useLanguage();
  const t = graphCopy[locale];
  const withEvidence = edges.filter((edge) => edge.evidenceRefs.length > 0).length;
  const inferred = edges.length - withEvidence;

  return (
    <details className="mt-4 rounded-md border border-white/10 bg-white/[0.06] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-white">
        {t.coverageTitle}
      </summary>
      <p className="mt-3 text-sm leading-6 text-white/66">
        {t.coverage(withEvidence, edges.length, inferred)}
      </p>
    </details>
  );
}

function GraphLockModal({
  agentCount,
  edgeCount,
  copy,
  onCancel,
  onConfirm,
}: {
  agentCount: number;
  edgeCount: number;
  copy: (typeof graphCopy)["en"] | (typeof graphCopy)["zh"];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#11150f]/45 px-4">
      <section className="w-full max-w-lg rounded-lg border border-black/8 bg-white p-6 shadow-[0_32px_120px_rgba(17,21,15,0.22)]">
        <StatusPill tone="planned">{copy.modalStatus}</StatusPill>
        <h2 className="mt-4 text-2xl font-semibold text-[#11150f]">
          {copy.modalTitle}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#62695d]">
          {copy.modalBody(agentCount, edgeCount)}
        </p>
        <div className="mt-5 rounded-md border border-[#d49b4a]/30 bg-[#fff8ed] p-4 text-sm leading-6 text-[#7c5524]">
          {copy.modalWarning}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {copy.keepReviewing}
          </Button>
          <Button type="button" variant="primary" onClick={onConfirm}>
            {copy.lockSnapshot}
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
