"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { buildAgentProfiles } from "@/lib/agents/build";
import { getRepositories } from "@/lib/repositories/repository-provider";
import type { AgentProfileDraft } from "@/types/agent-profile";

function metricAverage(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function agentTone(agent: AgentProfileDraft) {
  if (agent.agentType === "self") return "ready";
  if (agent.agentType === "parallel_self") return "planned";
  return agent.confidence >= 70 ? "ready" : "planned";
}

export default function AgentsPage() {
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [keyPeople] = useState(() => {
    if (!seedContext) return null;
    const result = repos.keyPeople.load(seedContext.id);
    return result.ok ? result.data : null;
  });
  const [includeParallelSelves, setIncludeParallelSelves] = useState(() => {
    if (!seedContext) return true;
    const result = repos.agentProfiles.load(seedContext.id);
    return result.ok ? result.data?.includeParallelSelves ?? true : true;
  });
  const [savedAt, setSavedAt] = useState<string | null>(() => {
    if (!seedContext) return null;
    const result = repos.agentProfiles.load(seedContext.id);
    return result.ok ? result.data?.updatedAt ?? null : null;
  });
  const [selectedId, setSelectedId] = useState("");

  const confirmedPeople = useMemo(
    () =>
      (keyPeople?.people ?? []).filter(
        (person) => person.confirmed && person.status === "confirmed",
      ),
    [keyPeople],
  );

  const agents = useMemo(() => {
    if (!seedContext) return [];
    return buildAgentProfiles(seedContext, confirmedPeople, includeParallelSelves);
  }, [confirmedPeople, includeParallelSelves, seedContext]);

  const selectedAgent =
    agents.find((agent) => agent.id === selectedId) ?? agents[0] ?? null;

  function saveDraft() {
    if (!seedContext) return;
    const updatedAt = new Date().toISOString();
    const result = repos.agentProfiles.save({
      seedContextId: seedContext.id,
      includeParallelSelves,
      agents,
      updatedAt,
    });
    if (result.ok) {
      setSavedAt(updatedAt);
    }
  }

  if (!seedContext) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">需要局面信息</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            先输入一个真实局面。
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            Agent Profile 草稿必须来自本次输入和已确认人物。
          </p>
          <Link
            href="/app/new/intake"
            className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            开始输入
          </Link>
        </section>
      </AppShell>
    );
  }

  if (!confirmedPeople.length) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">需要确认人物</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            先确认至少一个关键 NPC。
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            白皮书要求重要人物先成为 Agent Profile。没有确认人物时，不能进入关系图谱。
          </p>
          <Link
            href="/app/new/people"
            className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            返回人物确认
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <StatusPill tone="ready">People model</StatusPill>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
              已确认人物被装载为可行动的数字个体。
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
              这是本地确定性草稿：不调用 LLM，不写后端，不推断第三方真实内心。每个 NPC 都保留来源、置信度、证据引用和缺失字段。
            </p>

            <div className="mt-5 rounded-md border border-black/8 bg-[#f7f8f4] p-4 text-sm leading-7 text-[#3f483d]">
              {seedContext.questionText}
            </div>
          </main>

          <aside className="rounded-lg bg-[#11150f] p-6 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b7e6c6]">
              Sandbox summary
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Agents" value={agents.length} />
              <Metric label="NPC" value={confirmedPeople.length} />
              <Metric
                label="Avg confidence"
                value={metricAverage(agents.map((agent) => agent.confidence))}
              />
              <Metric
                label="Evidence refs"
                value={agents.reduce(
                  (total, agent) => total + agent.evidenceRefs.length,
                  0,
                )}
              />
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-md border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-white/70">
              <input
                type="checkbox"
                checked={includeParallelSelves}
                onChange={(event) => setIncludeParallelSelves(event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>加入谨慎/行动两个平行分身，用于后续路径稳定性对照。</span>
            </label>

            <button
              type="button"
              onClick={saveDraft}
              className="mt-5 inline-flex w-full justify-center rounded-md bg-[#b7e6c6] px-4 py-3 text-sm font-semibold text-[#11150f]"
            >
              保存本地 Agent 草稿
            </button>
            {savedAt ? (
              <p className="mt-3 text-xs leading-5 text-white/50">
                已保存：{new Date(savedAt).toLocaleString()}
              </p>
            ) : null}
            <Link
              href="/app/new/graph"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
            >
              查看只读关系图谱
            </Link>
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.45fr)]">
          <main className="grid gap-4 md:grid-cols-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedId(agent.id)}
                className={`rounded-lg border p-5 text-left transition ${
                  selectedAgent?.id === agent.id
                    ? "border-[#568262]/50 bg-[#eef5ee]"
                    : "border-black/8 bg-white hover:border-[#568262]/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                      {agent.agentType}
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-[#11150f]">
                      {agent.label}
                    </h2>
                  </div>
                  <StatusPill tone={agentTone(agent)}>
                    {agent.confidence}%
                  </StatusPill>
                </div>

                <p className="mt-3 text-sm leading-6 text-[#62695d]">
                  {agent.role} / {agent.relationshipToUser}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {agent.profileJson.traits.slice(0, 3).map((trait) => (
                    <span
                      key={trait}
                      className="rounded border border-black/8 bg-[#f7f8f4] px-2 py-1 text-xs text-[#3f483d]"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </main>

          <aside className="h-fit rounded-lg border border-black/8 bg-white p-5">
            <h2 className="text-sm font-semibold text-[#11150f]">
              Agent 详情
            </h2>
            {selectedAgent ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                    {selectedAgent.profileJson.origin}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#11150f]">
                    {selectedAgent.label}
                  </h3>
                </div>

                <Detail label="主要目标" value={selectedAgent.profileJson.motivation.primaryGoal} />
                <Detail label="回避模式" value={selectedAgent.profileJson.motivation.avoidancePattern} />
                <Detail label="当前意图" value={selectedAgent.profileJson.state.currentIntention} />

                <div className="grid grid-cols-2 gap-3">
                  <Score label="资源权力" value={selectedAgent.profileJson.resources.authority} />
                  <Score label="信息量" value={selectedAgent.profileJson.resources.information} />
                  <Score label="行动速度" value={selectedAgent.profileJson.behaviorPolicy.actionSpeed} />
                  <Score label="当前压力" value={selectedAgent.profileJson.state.stress} />
                </div>

                <div className="rounded-md bg-[#f7f8f4] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                    Evidence refs
                  </div>
                  <div className="mt-2 space-y-1">
                    {selectedAgent.evidenceRefs.map((ref) => (
                      <code
                        key={ref}
                        className="block break-all text-xs text-[#3f483d]"
                      >
                        {ref}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </section>
      </div>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
        {label}
      </div>
      <p className="mt-1 text-sm leading-6 text-[#62695d]">{value}</p>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-black/8 p-3">
      <div className="text-xs text-[#7d8578]">{label}</div>
      <div className="mt-1 text-xl font-semibold text-[#11150f]">{value}</div>
    </div>
  );
}
