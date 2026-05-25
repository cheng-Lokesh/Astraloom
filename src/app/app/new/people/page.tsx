"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import {
  createManualPerson,
  extractPeopleCandidates,
  mergePeopleCandidates,
} from "@/lib/people/extract";
import { getRepositories } from "@/lib/repositories/repository-provider";
import type { KeyPersonDraft } from "@/types/key-person";
import type { SeedContextDraft } from "@/types/seed-context";

type ExtractPeopleApiResponse = {
  ok?: boolean;
  source?: "llm" | "local_fallback";
  fallback_reason?: string;
  candidates?: KeyPersonDraft[];
  error_code?: string;
};

function activePeople(people: KeyPersonDraft[]) {
  return people.filter(
    (person) => person.status !== "deleted" && person.status !== "merged",
  );
}

function confirmedCount(people: KeyPersonDraft[]) {
  return people.filter((person) => person.status === "confirmed").length;
}

function statusTone(status: KeyPersonDraft["status"]) {
  if (status === "confirmed") return "ready";
  if (status === "deleted" || status === "merged" || status === "rejected") {
    return "blocked";
  }
  return "planned";
}

function statusLabel(status: KeyPersonDraft["status"]) {
  const labels: Record<KeyPersonDraft["status"], string> = {
    candidate: "待确认",
    confirmed: "已确认",
    deleted: "已删除",
    merged: "已合并",
    needs_confirmation: "需要确认",
    rejected: "已排除",
  };
  return labels[status];
}

function mergeUnique<T>(left: T[], right: T[]) {
  return Array.from(new Set([...left, ...right]));
}

export default function PeoplePage() {
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [people, setPeople] = useState<KeyPersonDraft[]>(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return [];
    const savedResult = repos.keyPeople.load(seed.id);
    const saved = savedResult.ok ? savedResult.data : null;
    return mergePeopleCandidates(
      saved?.people ?? [],
      extractPeopleCandidates(seed),
    );
  });
  const [manualLabel, setManualLabel] = useState("");
  const [manualRole, setManualRole] = useState("");
  const [message, setMessage] = useState("");
  const [isSmartExtracting, setIsSmartExtracting] = useState(false);

  function persist(nextPeople: KeyPersonDraft[], nextMessage: string) {
    if (!seedContext) return;
    const result = repos.keyPeople.save({
      seedContextId: seedContext.id,
      people: nextPeople,
      updatedAt: new Date().toISOString(),
    });
    if (!result.ok) {
      setMessage(`Save failed: ${result.errorCode}`);
      return;
    }
    setPeople(nextPeople);
    setMessage(nextMessage);
  }

  function patchPerson(id: string, patch: Partial<KeyPersonDraft>) {
    const now = new Date().toISOString();
    persist(
      people.map((person) =>
        person.id === id ? { ...person, ...patch, updatedAt: now } : person,
      ),
      "已保存人物确认。",
    );
  }

  function mergePerson(sourceId: string, targetId: string) {
    if (!targetId || sourceId === targetId) return;
    const now = new Date().toISOString();
    const source = people.find((person) => person.id === sourceId);
    const target = people.find((person) => person.id === targetId);
    if (!source || !target) return;

    persist(
      people.map((person) => {
        if (person.id === sourceId) {
          return {
            ...person,
            confirmed: false,
            status: "merged" as const,
            mergedIntoId: targetId,
            updatedAt: now,
          };
        }

        if (person.id === targetId) {
          return {
            ...person,
            confidence: Math.max(person.confidence, source.confidence),
            knownEvidence: [person.knownEvidence, source.knownEvidence]
              .filter(Boolean)
              .join("\n"),
            evidenceText: [person.evidenceText, source.evidenceText]
              .filter(Boolean)
              .join("\n"),
            evidenceRefs: mergeUnique(person.evidenceRefs, source.evidenceRefs),
            missingFields: mergeUnique(person.missingFields, source.missingFields),
            userNote: [person.userNote, source.userNote].filter(Boolean).join("\n"),
            updatedAt: now,
          };
        }

        return person;
      }),
      "已合并重复人物，并保留证据来源。",
    );
  }

  function addManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!seedContext || manualLabel.trim().length < 2) {
      setMessage("请至少输入两字人物称谓。");
      return;
    }

    const nextPeople = mergePeopleCandidates(people, [
      createManualPerson(seedContext.id, manualLabel, manualRole),
    ]);
    setManualLabel("");
    setManualRole("");
    persist(nextPeople, "已补充关键人物。");
  }

  function reset() {
    if (!seedContext) return;
    repos.keyPeople.clearDraft(seedContext.id);
    persist(extractPeopleCandidates(seedContext), "已重新从输入中识别人物。");
  }

  async function runSmartExtraction() {
    if (!seedContext) return;
    setIsSmartExtracting(true);

    try {
      const response = await fetch("/api/key-people/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          seedContextId: seedContext.id,
          seedContext: seedContext satisfies SeedContextDraft,
        }),
      });
      const payload = (await response.json()) as ExtractPeopleApiResponse;

      if (!response.ok || !payload.ok || !Array.isArray(payload.candidates)) {
        throw new Error(payload.error_code ?? "extract_people_failed");
      }

      persist(
        mergePeopleCandidates(people, payload.candidates),
        payload.source === "local_fallback"
          ? `Using local fallback: ${payload.fallback_reason ?? "llm_unavailable"}`
          : "Smart people candidates added for confirmation.",
      );
    } catch {
      persist(
        mergePeopleCandidates(people, extractPeopleCandidates(seedContext)),
        "Smart extraction was unavailable, so local candidates stayed active.",
      );
    } finally {
      setIsSmartExtracting(false);
    }
  }

  if (!seedContext) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">需要输入</StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            先创建一次推演。
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#62695d]">
            人物确认依赖你的问题、背景和关键人物提示。
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

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <StatusPill tone="planned">Key People</StatusPill>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
              这些人像不像你的真实局面？
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
              你可以确认、删除、合并或补充人物。关系权重仍由系统后续根据 Agent 和事件生成，不能在这里手动编辑。
            </p>
            <div className="mt-5 rounded-md border border-black/8 bg-[#f7f8f4] p-4 text-sm leading-7 text-[#3f483d]">
              {seedContext.questionText}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {people.map((person) => (
              <article
                key={person.id}
                className={`rounded-lg border p-5 transition ${
                  person.status === "confirmed"
                    ? "border-[#568262]/35 bg-[#eef5ee]"
                    : person.status === "deleted" || person.status === "merged"
                      ? "border-black/8 bg-white opacity-60"
                      : person.status === "needs_confirmation"
                        ? "border-[#d49b4a]/35 bg-[#fff8ed]"
                        : "border-black/8 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <input
                      value={person.label}
                      onChange={(event) =>
                        patchPerson(person.id, { label: event.target.value })
                      }
                      className="w-full border-0 bg-transparent p-0 text-lg font-semibold text-[#11150f] outline-none"
                    />
                    <p className="mt-1 text-xs text-[#7d8578]">
                      {person.source === "manual"
                        ? "用户补充"
                        : person.source === "key_people_text"
                          ? "明确提及"
                          : "从文本识别"}
                    </p>
                  </div>
                  <StatusPill tone={statusTone(person.status)}>
                    {statusLabel(person.status)}
                  </StatusPill>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field
                    label="关系"
                    value={person.relationshipToUser}
                    onChange={(value) =>
                      patchPerson(person.id, {
                        relationshipToUser: value.trim() || "unknown",
                      })
                    }
                  />
                  <Field
                    label="角色作用"
                    value={person.role}
                    onChange={(value) =>
                      patchPerson(person.id, {
                        role: value.trim() || "待确认角色",
                        roleType: value.trim() || "待确认角色",
                      })
                    }
                  />
                </div>

                <div className="mt-4 rounded-md border border-black/8 bg-white/70 p-3">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#62695d]">
                    <span>置信度</span>
                    <span>{person.confidence}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#e8ebe3]">
                    <div
                      className="h-2 rounded-full bg-[#568262]"
                      style={{ width: `${person.confidence}%` }}
                    />
                  </div>
                  {person.missingFields.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {person.missingFields.map((field) => (
                        <span
                          key={field}
                          className="rounded border border-[#d49b4a]/30 bg-[#fff8ed] px-2 py-1 text-xs font-medium text-[#7c5524]"
                        >
                          缺：{field}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <p className="mt-4 line-clamp-3 text-xs leading-5 text-[#7d8578]">
                  证据：{person.knownEvidence || person.evidenceText || "来自本次输入"}
                </p>

                <label className="mt-4 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
                    补充一句事实
                  </span>
                  <textarea
                    value={person.userNote}
                    onChange={(event) =>
                      patchPerson(person.id, { userNote: event.target.value })
                    }
                    rows={2}
                    placeholder="例如：这个人最近掌握关键资源。"
                    className="mt-2 w-full resize-none rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[#11150f] outline-none focus:border-[#568262]"
                  />
                </label>

                <label className="mt-4 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
                    合并重复人物
                  </span>
                  <select
                    value=""
                    onChange={(event) => mergePerson(person.id, event.target.value)}
                    disabled={person.status === "deleted" || person.status === "merged"}
                    className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[#11150f] outline-none focus:border-[#568262] disabled:opacity-50"
                  >
                    <option value="">选择要合并到的人物</option>
                    {activePeople(people)
                      .filter((target) => target.id !== person.id)
                      .map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.label}
                        </option>
                      ))}
                  </select>
                </label>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      patchPerson(person.id, {
                        confirmed: true,
                        status: "confirmed",
                      })
                    }
                    className="rounded-md bg-[#11150f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a3026]"
                  >
                    放进沙盘
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patchPerson(person.id, {
                        confirmed: false,
                        status: "deleted",
                      })
                    }
                    className="rounded-md border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#11150f] transition hover:border-[#11150f]"
                  >
                    本次不放
                  </button>
                </div>
              </article>
            ))}
          </section>

          <form
            onSubmit={addManual}
            className="rounded-lg border border-black/8 bg-white p-5"
          >
            <h2 className="text-sm font-semibold text-[#11150f]">
              补充遗漏人物
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={manualLabel}
                onChange={(event) => setManualLabel(event.target.value)}
                placeholder="称谓，例如：前老板、合伙人、伴侣"
                className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#568262]"
              />
              <input
                value={manualRole}
                onChange={(event) => setManualRole(event.target.value)}
                placeholder="角色作用，可选"
                className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-[#568262]"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-[#11150f] px-4 py-2.5 text-sm font-semibold text-white"
              >
                添加并确认
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#11150f]"
              >
                重新识别
              </button>
              <button
                type="button"
                onClick={runSmartExtraction}
                disabled={isSmartExtracting}
                className="rounded-md border border-[#568262]/30 bg-[#eef5ee] px-4 py-2.5 text-sm font-semibold text-[#2f5d3d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSmartExtracting ? "Identifying..." : "Smart identify"}
              </button>
              {message ? (
                <span className="text-sm text-[#62695d]">{message}</span>
              ) : null}
            </div>
          </form>
        </main>

        <aside className="h-fit rounded-lg border border-black/8 bg-[#11150f] p-6 text-white shadow-[0_24px_80px_rgba(17,21,15,0.14)]">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b7e6c6]">
            Agent 装载进度
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="候选人物" value={activePeople(people).length} />
            <Metric label="已确认" value={confirmedCount(people)} />
          </div>
          <p className="mt-5 text-sm leading-7 text-white/68">
            下一步会生成主分身、平行分身和关键 NPC，并进入只读关系图谱。图谱只展示证据，不允许手动调权。
          </p>
          <Link
            href="/app/new/agents"
            className="mt-6 inline-flex w-full justify-center rounded-md bg-[#b7e6c6] px-4 py-3 text-sm font-semibold text-[#11150f]"
          >
            生成 Agent Profile
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d8578]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-[#11150f] outline-none focus:border-[#568262]"
      />
    </label>
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
