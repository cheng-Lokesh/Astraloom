"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import {
  createManualPerson,
  extractPeopleCandidates,
  mergePeopleCandidates,
} from "@/lib/people/extract";
import {
  clearKeyPeopleDraft,
  loadKeyPeopleDraft,
  saveKeyPeopleDraft,
} from "@/lib/people/storage";
import { loadSeedContextDraft } from "@/lib/seed-context/storage";
import type { KeyPersonDraft, KeyPersonStatus } from "@/types/key-person";

const peopleCopy = {
  en: {
    title: "Confirm key people",
    status: "Local confirmation",
    body: "This step turns the seed context into concrete people. It uses simple local extraction only; relation weights stay hidden and system-owned.",
    noSeedTitle: "Seed context required",
    noSeedBody:
      "Create and save a seed context first. Person confirmation depends on the question, situation, and key people text.",
    openIntake: "Open seed intake",
    openAgents: "Build agent ecology",
    systemName: "MiroFish system",
    systemPrompt:
      "I found possible people from your seed context. Confirm who is actually involved, adjust the role if needed, and exclude anything that is not a person.",
    emptyPrompt:
      "I did not find a clear person yet. Add one manually, or return to the seed intake and describe the key people involved.",
    personLabel: "Person",
    roleLabel: "Role",
    rolePlaceholder: "manager, partner, investor, competitor...",
    confirm: "Confirm person",
    reject: "Not involved",
    addTitle: "Add missing person",
    addLabel: "Name or role",
    addLabelPlaceholder: "Example: current manager",
    addRolePlaceholder: "Role, if known",
    addButton: "Add person",
    reset: "Reset candidates",
    saved: "Saved locally.",
    resetDone: "Candidates reset from seed context.",
    addValidation: "Enter at least two characters.",
    source: "Source",
    sourceLabels: {
      key_people_text: "Key people text",
      seed_context_text: "Seed context",
      manual: "Manual entry",
    },
    statusLabels: {
      candidate: "Candidate",
      confirmed: "Confirmed",
      rejected: "Excluded",
    },
    summaryTitle: "Confirmation summary",
    seedQuestion: "Seed question",
    confirmed: "Confirmed",
    candidates: "Candidates",
    excluded: "Excluded",
    nextStep: "Next build step",
    nextStepBody:
      "Create agent profile shells from confirmed people. Do not generate simulation reports yet.",
    relationNote:
      "No trust, hostility, or influence sliders appear here. Those values are generated later by system logic and shown only as read-only evidence.",
  },
  zh: {
    title: "确认关键人物",
    status: "本地确认",
    body: "这一步把种子上下文转成具体人物。这里只做本地轻量抽取；关系权重仍然隐藏，并由系统生成。",
    noSeedTitle: "需要先保存种子上下文",
    noSeedBody:
      "请先创建并保存一次种子上下文。人物确认依赖主问题、当前处境和关键人物描述。",
    openIntake: "打开推演入口",
    openAgents: "生成 Agent 生态",
    systemName: "MiroFish 系统",
    systemPrompt:
      "我从你的种子上下文里找到了可能涉及的人。请确认谁真的参与其中，必要时调整角色，并排除不是人物的项目。",
    emptyPrompt:
      "我暂时没有找到明确人物。你可以手动补一个，或回到推演入口补充关键人物描述。",
    personLabel: "人物",
    roleLabel: "角色",
    rolePlaceholder: "上司、伴侣、投资人、竞争者……",
    confirm: "确认此人",
    reject: "不涉及",
    addTitle: "补充遗漏人物",
    addLabel: "姓名或角色",
    addLabelPlaceholder: "例如：当前上司",
    addRolePlaceholder: "角色，可选",
    addButton: "添加人物",
    reset: "重置候选",
    saved: "已保存到本地。",
    resetDone: "已根据种子上下文重置候选。",
    addValidation: "至少输入两个字符。",
    source: "来源",
    sourceLabels: {
      key_people_text: "关键人物描述",
      seed_context_text: "种子上下文",
      manual: "手动补充",
    },
    statusLabels: {
      candidate: "候选",
      confirmed: "已确认",
      rejected: "已排除",
    },
    summaryTitle: "确认摘要",
    seedQuestion: "种子问题",
    confirmed: "已确认",
    candidates: "候选中",
    excluded: "已排除",
    nextStep: "下一步构建",
    nextStepBody: "从已确认人物生成 Agent Profile 外壳。暂不生成推演报告。",
    relationNote:
      "这里不会出现信任、敌意、影响力滑块。这些数值后续由系统逻辑生成，只作为只读证据展示。",
  },
} as const;

function getStatusTone(status: KeyPersonStatus) {
  if (status === "confirmed") {
    return "ready";
  }

  if (status === "rejected") {
    return "blocked";
  }

  return "planned";
}

function countByStatus(people: KeyPersonDraft[], status: KeyPersonStatus) {
  return people.filter((person) => person.status === status).length;
}

export default function PeoplePage() {
  const { locale } = useLanguage();
  const copy = peopleCopy[locale];
  const [seedContext] = useState(() => loadSeedContextDraft());
  const [people, setPeople] = useState<KeyPersonDraft[]>(() => {
    const seed = loadSeedContextDraft();
    if (!seed) {
      return [];
    }

    const saved = loadKeyPeopleDraft(seed.id);
    return mergePeopleCandidates(
      saved?.people ?? [],
      extractPeopleCandidates(seed),
    );
  });
  const [manualLabel, setManualLabel] = useState("");
  const [manualRole, setManualRole] = useState("");
  const [message, setMessage] = useState("");

  function persistPeople(nextPeople: KeyPersonDraft[], nextMessage: string) {
    if (!seedContext) {
      return;
    }

    saveKeyPeopleDraft({
      seedContextId: seedContext.id,
      people: nextPeople,
      updatedAt: new Date().toISOString(),
    });
    setPeople(nextPeople);
    setMessage(nextMessage);
  }

  function patchPerson(id: string, patch: Partial<KeyPersonDraft>) {
    const now = new Date().toISOString();
    const nextPeople = people.map((person) =>
      person.id === id ? { ...person, ...patch, updatedAt: now } : person,
    );
    persistPeople(nextPeople, copy.saved);
  }

  function confirmPerson(id: string) {
    patchPerson(id, { confirmed: true, status: "confirmed" });
  }

  function rejectPerson(id: string) {
    patchPerson(id, { confirmed: false, status: "rejected" });
  }

  function resetCandidates() {
    if (!seedContext) {
      return;
    }

    clearKeyPeopleDraft(seedContext.id);
    persistPeople(extractPeopleCandidates(seedContext), copy.resetDone);
  }

  function addManualPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!seedContext) {
      return;
    }

    if (manualLabel.trim().length < 2) {
      setMessage(copy.addValidation);
      return;
    }

    const manualPerson = createManualPerson(
      seedContext.id,
      manualLabel,
      manualRole,
    );
    const nextPeople = mergePeopleCandidates(people, [manualPerson]);

    setManualLabel("");
    setManualRole("");
    persistPeople(nextPeople, copy.saved);
  }

  if (!seedContext) {
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
        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">
              {copy.systemName}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {people.length > 0 ? copy.systemPrompt : copy.emptyPrompt}
            </p>
          </div>

          {people.map((person) => (
            <article
              key={person.id}
              className={`rounded-lg border bg-white p-5 shadow-sm ${
                person.status === "rejected"
                  ? "border-slate-200 opacity-70"
                  : "border-slate-200"
              }`}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={getStatusTone(person.status)}>
                    {copy.statusLabels[person.status]}
                  </StatusPill>
                  <span className="text-xs font-medium text-slate-500">
                    {copy.source}: {copy.sourceLabels[person.source]}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-900">
                    {copy.personLabel}
                  </span>
                  <input
                    value={person.label}
                    onChange={(event) =>
                      patchPerson(person.id, { label: event.target.value })
                    }
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-900">
                    {copy.roleLabel}
                  </span>
                  <input
                    value={person.role === "unknown" ? "" : person.role}
                    onChange={(event) =>
                      patchPerson(person.id, {
                        role: event.target.value.trim() || "unknown",
                      })
                    }
                    placeholder={copy.rolePlaceholder}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => confirmPerson(person.id)}
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {copy.confirm}
                </button>
                <button
                  type="button"
                  onClick={() => rejectPerson(person.id)}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  {copy.reject}
                </button>
              </div>
            </article>
          ))}

          <form
            onSubmit={addManualPerson}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold text-slate-950">
              {copy.addTitle}
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-900">
                  {copy.addLabel}
                </span>
                <input
                  value={manualLabel}
                  onChange={(event) => setManualLabel(event.target.value)}
                  placeholder={copy.addLabelPlaceholder}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-900">
                  {copy.roleLabel}
                </span>
                <input
                  value={manualRole}
                  onChange={(event) => setManualRole(event.target.value)}
                  placeholder={copy.addRolePlaceholder}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {copy.addButton}
              </button>
              <button
                type="button"
                onClick={resetCandidates}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {copy.reset}
              </button>
              {message ? (
                <span className="text-sm font-medium text-slate-600">
                  {message}
                </span>
              ) : null}
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">
              {copy.summaryTitle}
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-900">
                  {copy.seedQuestion}
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {seedContext.questionText}
                </dd>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-emerald-50 p-3">
                  <dt className="text-xs font-semibold text-emerald-700">
                    {copy.confirmed}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-emerald-900">
                    {countByStatus(people, "confirmed")}
                  </dd>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="text-xs font-semibold text-slate-600">
                    {copy.candidates}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">
                    {countByStatus(people, "candidate")}
                  </dd>
                </div>
                <div className="rounded-md bg-amber-50 p-3">
                  <dt className="text-xs font-semibold text-amber-700">
                    {copy.excluded}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-amber-900">
                    {countByStatus(people, "rejected")}
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
              href="/agents"
              className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {copy.openAgents}
            </Link>
            <p className="mt-4 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
              {copy.relationNote}
            </p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
