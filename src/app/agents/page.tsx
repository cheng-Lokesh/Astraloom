"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { buildAgentProfiles, getConfirmedPeople } from "@/lib/agents/build";
import {
  clearAgentEcologyDraft,
  loadAgentEcologyDraft,
  saveAgentEcologyDraft,
} from "@/lib/agents/storage";
import { loadKeyPeopleDraft } from "@/lib/people/storage";
import { loadSeedContextDraft } from "@/lib/seed-context/storage";
import type {
  AgentEcologyDraft,
  AgentProfileDraft,
  AgentType,
} from "@/types/agent-profile";
import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";

type AgentsPageContext = {
  seedContext: SeedContextDraft | null;
  confirmedPeople: KeyPersonDraft[];
  savedEcology: AgentEcologyDraft | null;
};

const agentsCopy = {
  en: {
    title: "Agent ecology shell",
    status: "Local shell",
    body: "Create the living pieces of the sandbox before any simulation runs. This page only builds local shells; no model call or prediction is made.",
    noSeedTitle: "Seed context required",
    noSeedBody: "Create and save a seed context before building agents.",
    noPeopleTitle: "Confirmed people required",
    noPeopleBody:
      "Confirm at least one key person before creating NPC placeholders.",
    openIntake: "Open seed intake",
    openPeople: "Confirm people",
    openRuns: "Create run shell",
    save: "Save ecology shell",
    rebuild: "Rebuild shell",
    reset: "Clear saved shell",
    saved: "Agent ecology shell saved locally.",
    rebuilt: "Agent ecology shell rebuilt from current confirmations.",
    resetDone: "Saved agent shell cleared.",
    parallelLabel: "Include parallel selves",
    parallelHint:
      "Adds cautious and decisive variants of the user self for later comparison.",
    seedQuestion: "Seed question",
    confirmedPeople: "Confirmed people",
    agents: "Agents",
    relationPreview: "Read-only ecology preview",
    relationPending: "Relationship pending",
    relationNote:
      "Edges are placeholders only. Trust, hostility, influence, and confidence are generated later by system logic and are never manually edited here.",
    typeLabels: {
      self: "User self",
      parallel_self: "Parallel self",
      npc: "NPC",
    },
    stanceLabels: {
      baseline: "Baseline",
      cautious_parallel: "Cautious variant",
      decisive_parallel: "Decisive variant",
      confirmed_npc: "Confirmed participant",
    },
    sections: {
      self: "Core self",
      parallel: "Parallel selves",
      npcs: "Confirmed NPCs",
    },
    counts: {
      self: "Self",
      parallel: "Parallel",
      npc: "NPCs",
    },
    nextStep: "Next build step",
    nextStepBody:
      "Create the simulation run shell and event-log skeleton. Keep generation disabled until the prompt and safety checks are ready.",
  },
  zh: {
    title: "Agent 个体生态外壳",
    status: "本地外壳",
    body: "在任何推演开始前，先把沙盘里的“活体个体”搭出来。这里仅生成本地外壳，不调用模型，也不做预测。",
    noSeedTitle: "需要先保存种子上下文",
    noSeedBody: "请先创建并保存种子上下文，然后再生成 Agent。",
    noPeopleTitle: "需要先确认关键人物",
    noPeopleBody: "请至少确认一个关键人物，再生成 NPC 占位。",
    openIntake: "打开推演入口",
    openPeople: "确认人物",
    openRuns: "创建 run 外壳",
    save: "保存生态外壳",
    rebuild: "重建外壳",
    reset: "清空已保存外壳",
    saved: "Agent 生态外壳已保存到本地。",
    rebuilt: "已根据当前人物确认重建 Agent 生态外壳。",
    resetDone: "已清空保存的 Agent 外壳。",
    parallelLabel: "包含平行自我",
    parallelHint: "加入谨慎版和行动版自我，供后续推演对照。",
    seedQuestion: "种子问题",
    confirmedPeople: "已确认人物",
    agents: "Agent",
    relationPreview: "只读生态预览",
    relationPending: "关系待生成",
    relationNote:
      "边只是占位。信任、敌意、影响力和置信度后续由系统逻辑生成，这里永远不让用户手动编辑。",
    typeLabels: {
      self: "用户自我",
      parallel_self: "平行自我",
      npc: "NPC",
    },
    stanceLabels: {
      baseline: "基线版本",
      cautious_parallel: "谨慎变体",
      decisive_parallel: "行动变体",
      confirmed_npc: "已确认参与者",
    },
    sections: {
      self: "核心自我",
      parallel: "平行自我",
      npcs: "已确认 NPC",
    },
    counts: {
      self: "自我",
      parallel: "平行",
      npc: "NPC",
    },
    nextStep: "下一步构建",
    nextStepBody:
      "创建 simulation run 外壳和事件日志骨架。在提示词和安全检查准备好之前，继续关闭真实生成。",
  },
} as const;

function loadAgentsPageContext(): AgentsPageContext {
  const seedContext = loadSeedContextDraft();
  if (!seedContext) {
    return {
      seedContext: null,
      confirmedPeople: [],
      savedEcology: null,
    };
  }

  const keyPeople = loadKeyPeopleDraft(seedContext.id);

  return {
    seedContext,
    confirmedPeople: getConfirmedPeople(keyPeople?.people ?? []),
    savedEcology: loadAgentEcologyDraft(seedContext.id),
  };
}

function countByType(agents: AgentProfileDraft[], type: AgentType) {
  return agents.filter((agent) => agent.agentType === type).length;
}

function getAgentGroups(agents: AgentProfileDraft[]) {
  return {
    self: agents.filter((agent) => agent.agentType === "self"),
    parallel: agents.filter((agent) => agent.agentType === "parallel_self"),
    npcs: agents.filter((agent) => agent.agentType === "npc"),
  };
}

export default function AgentsPage() {
  const { locale } = useLanguage();
  const copy = agentsCopy[locale];
  const [context] = useState(loadAgentsPageContext);
  const initialIncludeParallel =
    context.savedEcology?.includeParallelSelves ?? true;
  const [includeParallelSelves, setIncludeParallelSelves] = useState(
    initialIncludeParallel,
  );
  const [agents, setAgents] = useState<AgentProfileDraft[]>(() => {
    if (!context.seedContext) {
      return [];
    }

    return (
      context.savedEcology?.agents ??
      buildAgentProfiles(
        context.seedContext,
        context.confirmedPeople,
        initialIncludeParallel,
      )
    );
  });
  const [message, setMessage] = useState("");

  function rebuildShell(nextIncludeParallel = includeParallelSelves) {
    if (!context.seedContext) {
      return [];
    }

    const nextAgents = buildAgentProfiles(
      context.seedContext,
      context.confirmedPeople,
      nextIncludeParallel,
    );

    setAgents(nextAgents);
    setMessage(copy.rebuilt);
    return nextAgents;
  }

  function updateParallelSetting(checked: boolean) {
    setIncludeParallelSelves(checked);
    rebuildShell(checked);
  }

  function saveShell() {
    if (!context.seedContext) {
      return;
    }

    saveAgentEcologyDraft({
      seedContextId: context.seedContext.id,
      includeParallelSelves,
      agents,
      updatedAt: new Date().toISOString(),
    });
    setMessage(copy.saved);
  }

  function resetShell() {
    if (!context.seedContext) {
      return;
    }

    clearAgentEcologyDraft(context.seedContext.id);
    setIncludeParallelSelves(true);
    const nextAgents = buildAgentProfiles(
      context.seedContext,
      context.confirmedPeople,
      true,
    );
    setAgents(nextAgents);
    setMessage(copy.resetDone);
  }

  if (!context.seedContext) {
    return (
      <AppShell>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <StatusPill tone="blocked">{copy.status}</StatusPill>
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">
            {copy.noSeedTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {copy.noSeedBody}
          </p>
          <Link
            href="/intake"
            className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {copy.openIntake}
          </Link>
        </section>
      </AppShell>
    );
  }

  if (context.confirmedPeople.length === 0) {
    return (
      <AppShell>
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <StatusPill tone="blocked">{copy.status}</StatusPill>
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">
            {copy.noPeopleTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {copy.noPeopleBody}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/people"
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {copy.openPeople}
            </Link>
            <Link
              href="/intake"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              {copy.openIntake}
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  const groups = getAgentGroups(agents);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {copy.body}
          </p>
        </div>
        <StatusPill tone="planned">{copy.status}</StatusPill>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="flex max-w-xl items-start gap-3">
                <input
                  type="checkbox"
                  checked={includeParallelSelves}
                  onChange={(event) =>
                    updateParallelSetting(event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-950">
                    {copy.parallelLabel}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    {copy.parallelHint}
                  </span>
                </span>
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => rebuildShell()}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  {copy.rebuild}
                </button>
                <button
                  type="button"
                  onClick={saveShell}
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {copy.save}
                </button>
                <button
                  type="button"
                  onClick={resetShell}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  {copy.reset}
                </button>
              </div>
            </div>
            {message ? (
              <p className="mt-4 text-sm font-medium text-slate-600">
                {message}
              </p>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.relationPreview}
            </h2>
            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <AgentColumn
                title={copy.sections.self}
                agents={groups.self}
                copy={copy}
              />
              <AgentColumn
                title={copy.sections.parallel}
                agents={groups.parallel}
                copy={copy}
              />
              <AgentColumn
                title={copy.sections.npcs}
                agents={groups.npcs}
                copy={copy}
              />
            </div>

            <div className="mt-5 space-y-2">
              {groups.npcs.map((agent) => (
                <div
                  key={agent.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                >
                  <span className="font-semibold text-slate-900">
                    User self
                  </span>
                  <span>→</span>
                  <span className="font-semibold text-slate-900">
                    {agent.label}
                  </span>
                  <StatusPill tone="planned">{copy.relationPending}</StatusPill>
                </div>
              ))}
            </div>

            <p className="mt-4 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
              {copy.relationNote}
            </p>
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.agents}
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.seedQuestion}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {context.seedContext.questionText}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.confirmedPeople}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {context.confirmedPeople
                    .map((person) => person.label)
                    .join(", ")}
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-emerald-50 p-3">
                  <dt className="text-xs font-semibold text-emerald-700">
                    {copy.counts.self}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-emerald-900">
                    {countByType(agents, "self")}
                  </dd>
                </div>
                <div className="rounded-md bg-sky-50 p-3">
                  <dt className="text-xs font-semibold text-sky-700">
                    {copy.counts.parallel}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-sky-900">
                    {countByType(agents, "parallel_self")}
                  </dd>
                </div>
                <div className="rounded-md bg-amber-50 p-3">
                  <dt className="text-xs font-semibold text-amber-700">
                    {copy.counts.npc}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-amber-900">
                    {countByType(agents, "npc")}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.nextStep}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {copy.nextStepBody}
            </p>
            <Link
              href="/runs"
              className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {copy.openRuns}
            </Link>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

type AgentColumnProps = {
  title: string;
  agents: AgentProfileDraft[];
  copy: (typeof agentsCopy)["en"] | (typeof agentsCopy)["zh"];
};

function AgentColumn({ title, agents, copy }: AgentColumnProps) {
  return (
    <section className="min-h-40 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <div className="mt-3 space-y-3">
        {agents.map((agent) => (
          <article
            key={agent.id}
            className="rounded-md border border-slate-200 bg-white p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-950">
                {agent.label}
              </p>
              <StatusPill tone={agent.agentType === "npc" ? "planned" : "ready"}>
                {copy.typeLabels[agent.agentType]}
              </StatusPill>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {copy.stanceLabels[agent.profileJson.stance]}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {agent.profileJson.traits.join(", ")}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
