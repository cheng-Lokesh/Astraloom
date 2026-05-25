"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { StatusPill } from "@/components/status-pill";
import { TrialSampleButton } from "@/components/trial-sample-button";
import { getRepositories } from "@/lib/repositories/repository-provider";
import type { SafetyDecision } from "@/lib/safety/safety-types";
import { verifySafety } from "@/lib/safety/safety-verifier";
import type { SeedContextDraft, TimeWindow } from "@/types/seed-context";

const sample = {
  question:
    "我应该接受一个更高薪但不确定的新机会，还是留在当前团队等待承诺中的晋升？",
  context:
    "新公司给了更高薪资和更大职责，但行业风险更高。现在团队稳定，直属上级口头支持晋升，但没有明确时间表。我担心跳槽影响长期声誉，也担心留下会错过窗口。",
  people: "当前上级、招聘方、核心同事、伴侣",
};

export default function IntakePage() {
  const [repos] = useState(() => getRepositories());
  const [initialDraft] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [question, setQuestion] = useState(initialDraft?.questionText ?? "");
  const [context, setContext] = useState(initialDraft?.situationSummary ?? "");
  const [people, setPeople] = useState(initialDraft?.keyPeopleText ?? "");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(
    initialDraft?.timeWindow ?? "90_days",
  );
  const [message, setMessage] = useState("");
  const [safetyDecision, setSafetyDecision] = useState<SafetyDecision | null>(
    null,
  );

  function save(status: SeedContextDraft["status"] = "submitted") {
    if (question.trim().length < 8) {
      setMessage("请至少写下一个具体问题，系统才有足够上下文抽取人物。");
      return false;
    }

    const now = new Date().toISOString();
    const draft = {
      id: initialDraft?.id ?? repos.seedContexts.createId(),
      questionText: question.trim(),
      trackType:
        timeWindow === "30_days" || timeWindow === "90_days"
          ? "crossroad"
          : "life_climate",
      timeWindow,
      situationSummary: context.trim(),
      keyPeopleText: people.trim(),
      privacyAck: true,
      locale: "zh",
      status,
      createdAt: initialDraft?.createdAt ?? now,
      updatedAt: now,
    } satisfies SeedContextDraft;
    const decision = verifySafety({ seedContext: draft });
    setSafetyDecision(decision);

    if (decision.safetyLevel === "blocked") {
      setMessage(decision.userMessage);
      return false;
    }

    const result = repos.seedContexts.save(draft);
    if (!result.ok) {
      setMessage(`Save failed: ${result.errorCode}`);
      return false;
    }
    if (decision.safetyLevel === "downgraded") {
      setMessage(decision.userMessage);
      return true;
    }
    setMessage("已保存局面信息。下一步请确认关键人物。");
    return true;
  }

  function useSample() {
    setQuestion(sample.question);
    setContext(sample.context);
    setPeople(sample.people);
    setTimeWindow("90_days");
    setMessage("已载入样例，你可以直接保存并进入人物确认。");
  }

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="rounded-lg border border-black/8 bg-white p-7 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="planned">Situation setup</StatusPill>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#11150f]">
            先讲清楚一个真实局面。
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
            本页只负责保存起始上下文，不生成 Agent、不调用 LLM、不生成报告。下一步会把关键人物变成可确认的 Agent 候选。
          </p>

          <div className="mt-7 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-[#11150f]">
                主问题
              </span>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={4}
                placeholder="例如：我要不要接受一个更高薪但不确定的新机会？"
                className="mt-2 w-full resize-none rounded-md border border-black/10 bg-[#f7f8f4] px-4 py-3 text-sm leading-7 text-[#11150f] outline-none focus:border-[#568262]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#11150f]">
                背景和近期事件
              </span>
              <textarea
                value={context}
                onChange={(event) => setContext(event.target.value)}
                rows={5}
                placeholder="写下最近发生了什么、有哪些承诺、冲突、机会或限制。"
                className="mt-2 w-full resize-none rounded-md border border-black/10 bg-[#f7f8f4] px-4 py-3 text-sm leading-7 text-[#11150f] outline-none focus:border-[#568262]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#11150f]">
                关键人物提示
              </span>
              <input
                value={people}
                onChange={(event) => setPeople(event.target.value)}
                placeholder="例如：当前上级、招聘方、核心同事、伴侣"
                className="mt-2 w-full rounded-md border border-black/10 bg-[#f7f8f4] px-4 py-3 text-sm text-[#11150f] outline-none focus:border-[#568262]"
              />
            </label>

            <div>
              <div className="text-sm font-semibold text-[#11150f]">
                时间视界
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  ["30_days", "30 天"],
                  ["90_days", "90 天"],
                  ["1_year", "1 年"],
                  ["3_years", "3 年"],
                  ["5_years", "5 年"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTimeWindow(value as TimeWindow)}
                    className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                      timeWindow === value
                        ? "border-[#11150f] bg-[#11150f] text-white"
                        : "border-black/10 bg-white text-[#52594d] hover:border-[#11150f]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => save()}
              className="rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2a3026]"
            >
              保存局面信息
            </button>
            <button
              type="button"
              onClick={useSample}
              className="rounded-md border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#11150f] transition hover:border-[#11150f]"
            >
              使用样例文本
            </button>
            <Link
              href="/app/new/people"
              onClick={(event) => {
                if (!save()) event.preventDefault();
              }}
              className="rounded-md border border-[#568262]/30 bg-[#eef5ee] px-5 py-3 text-sm font-semibold text-[#2f5d3d] transition hover:border-[#568262]"
            >
              进入人物确认
            </Link>
          </div>

          {message ? (
            <p className="mt-4 text-sm leading-6 text-[#62695d]">{message}</p>
          ) : null}
          {safetyDecision && safetyDecision.safetyLevel !== "safe" ? (
            <div className="mt-5">
              <SafetyDowngradeNotice
                decision={safetyDecision}
                title="Safety check before saving"
              />
            </div>
          ) : null}
        </main>

        <aside className="h-fit rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            想快速体验完整形态？
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/64">
            直接载入试用样例，会一次性生成 Agent、只读关系图谱、Event Log 和带证据的 Claim 草稿。
          </p>
          <TrialSampleButton className="mt-5 inline-flex w-full justify-center rounded-md bg-[#b7e6c6] px-4 py-3 text-sm font-semibold text-[#11150f]">
            载入完整样例
          </TrialSampleButton>
        </aside>
      </section>
    </AppShell>
  );
}
