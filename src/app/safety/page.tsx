"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { StatusPill } from "@/components/status-pill";
import { getRepositories } from "@/lib/repositories/repository-provider";
import { buildSafetyReviewDraft, markSafetyBlocked } from "@/lib/safety/build";
import type { SafetyReviewDraft } from "@/types/safety-review";

function toneForStatus(status: string) {
  if (status === "ready") return "ready";
  if (status === "blocked") return "blocked";
  return "planned";
}

export default function SafetyPage() {
  const { locale } = useLanguage();
  const zh = locale === "zh";
  const [repos] = useState(() => getRepositories());
  const [seedContext] = useState(() => {
    const result = repos.seedContexts.load();
    return result.ok ? result.data : null;
  });
  const [simulationRun] = useState(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    if (!seed) return null;
    const result = repos.simulations.load(seed.id);
    return result.ok ? result.data : null;
  });
  const [review, setReview] = useState<SafetyReviewDraft | null>(() => {
    const seedResult = repos.seedContexts.load();
    const seed = seedResult.ok ? seedResult.data : null;
    const runResult = seed ? repos.simulations.load(seed.id) : null;
    const run = runResult?.ok ? runResult.data : null;
    if (!seed || !run) return null;
    const result = repos.safetyReviews.load(seed.id);
    return (result.ok ? result.data : null) ?? buildSafetyReviewDraft(seed, run);
  });
  const [message, setMessage] = useState("");

  if (!seedContext || !simulationRun || !review) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl rounded-lg border border-black/8 bg-white p-8 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
          <StatusPill tone="blocked">
            {zh ? "需要先运行" : "Run required"}
          </StatusPill>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#11150f]">
            {zh
              ? "请先生成事件日志，再进行安全检查。"
              : "Generate Event Log before safety review."}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#62695d]">
            {zh
              ? "安全降级会读取本地推演、事件日志和种子上下文。付费解锁不能绕过这道检查。"
              : "Safety downgrade reads the local run, Event Log, and seed context. It cannot be bypassed by paid unlock."}
          </p>
          <Link
            href="/app/simulation/running"
            className="mt-6 inline-flex rounded-md bg-[#11150f] px-5 py-3 text-sm font-semibold text-white"
          >
            {zh ? "打开事件日志" : "Open Event Log"}
          </Link>
        </section>
      </AppShell>
    );
  }

  function persist(nextReview: SafetyReviewDraft, nextMessage: string) {
    const result = repos.safetyReviews.save(nextReview);
    if (!result.ok) {
      setMessage(
        zh
          ? `保存失败：${result.errorCode}`
          : `Save failed: ${result.errorCode}`,
      );
      return;
    }
    setReview(nextReview);
    setMessage(nextMessage);
  }

  function save() {
    if (!review) return;
    persist(review, zh ? "安全检查已保存。" : "Safety review saved.");
  }

  function rebuild() {
    if (!seedContext || !simulationRun) return;
    persist(
      buildSafetyReviewDraft(seedContext, simulationRun),
      zh
        ? "已根据当前本地推演重建安全检查。"
        : "Safety review rebuilt from current local run.",
    );
  }

  function block() {
    if (!review) return;
    persist(
      markSafetyBlocked(review),
      zh ? "安全门已手动暂停。" : "Safety gate manually blocked.",
    );
  }

  function reset() {
    if (!seedContext || !simulationRun) return;
    repos.safetyReviews.clearDraft(seedContext.id);
    setReview(buildSafetyReviewDraft(seedContext, simulationRun));
    setMessage(zh ? "安全检查已重置。" : "Safety review reset.");
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill tone={review.reportReady ? "ready" : "blocked"}>
            {zh ? "安全门" : "Safety gate"}
          </StatusPill>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-[#11150f]">
            {zh
              ? "安全门让动态沙盘保持在可用边界内。"
              : "Safety gate keeps the sandbox inside usable boundaries."}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#62695d]">
            {zh
              ? "安全检查可以通过、增加提示、调整输出，或暂停一次推演。完整深度访问不能移除这道检查，也不能提高关键发现的强度。"
              : "Safety review can pass, add caution, adjust output, or pause a run. Full-depth access cannot remove this gate or make claims stronger."}
          </p>
        </div>
        <StatusPill tone={review.reportReady ? "ready" : "blocked"}>
          {review.safetyLevel}
        </StatusPill>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-6">
          <section className="rounded-lg border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(17,21,15,0.06)]">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={save}
                className="rounded-md bg-[#11150f] px-4 py-2 text-sm font-semibold text-white"
              >
                {zh ? "保存检查" : "Save review"}
              </button>
              <button
                type="button"
                onClick={rebuild}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
              >
                {zh ? "重建检查" : "Rebuild checks"}
              </button>
              <button
                type="button"
                onClick={block}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
              >
                {zh ? "暂停检查" : "Place review hold"}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#11150f]"
              >
                {zh ? "重置" : "Reset"}
              </button>
            </div>
            {message ? (
              <p className="mt-4 text-sm leading-6 text-[#62695d]">{message}</p>
            ) : null}
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6">
            <h2 className="text-base font-semibold text-[#11150f]">
              {zh ? "安全状态" : "Safety states"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#62695d]">
              {zh
                ? "这些状态会影响产品可以显示的内容。它们不会生成专业建议，也不会改变历史证据。"
                : "These states change what the product can show. They do not create professional advice, and they do not change historical evidence."}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <SafetyStateCard
                label={zh ? "安全" : "Safe"}
                tone="border-[#568262]/25 bg-[#eef5ee] text-[#2f5d3d]"
                body={
                  zh
                    ? "场景可以继续进入 Agent、关系图、推演、事件日志和有证据支撑的关键发现。"
                    : "The scenario can continue through agents, graph, simulation, event logs, and evidence-backed claims."
                }
              />
              <SafetyStateCard
                label={zh ? "谨慎" : "Caution"}
                tone="border-[#6f8faa]/35 bg-[#eef4f8] text-[#2f5064]"
                body={
                  zh
                    ? "流程可以继续，但会使用更谨慎的措辞、置信度语言，并避免对结果或他人想法作确定表达。"
                    : "The flow continues with careful wording, confidence language, and no certainty about outcomes or private thoughts."
                }
              />
              <SafetyStateCard
                label={zh ? "降级" : "Downgraded"}
                tone="border-[#c4824a]/35 bg-[#fdf5ed] text-[#7c5524]"
                body={
                  zh
                    ? "动态沙盘保留结构和低风险沟通选项，但强判断和深度扩展会保持不可用。"
                    : "The sandbox keeps structure and low-risk communication options, while strong claims and depth expansion stay unavailable."
                }
              />
              <SafetyStateCard
                label={zh ? "已暂停" : "Blocked"}
                tone="border-[#8c6bb1]/35 bg-[#f4effa] text-[#4b3568]"
                body={
                  zh
                    ? "这次输入会暂停运行。用户可以修改设置，或通过支持页请求安全复核。"
                    : "The run is paused for this input. The user can revise setup or request a safety review through support."
                }
              />
            </div>
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6">
            <h2 className="text-base font-semibold text-[#11150f]">
              {zh ? "风险检查" : "Risk checks"}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {review.riskChecks.map((risk) => (
                <article
                  key={risk.id}
                  className="rounded-lg border border-black/8 bg-[#f7f8f4] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#11150f]">
                      {risk.id}
                    </h3>
                    <StatusPill tone={toneForStatus(risk.status)}>
                      {risk.status}
                    </StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#62695d]">
                    {risk.detail}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#7d8578]">
                    {risk.action} / {risk.severity}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-black/8 bg-white p-6">
            <h2 className="text-base font-semibold text-[#11150f]">
              {zh ? "安全门" : "Gates"}
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {review.gates.map((gate) => (
                <article
                  key={gate.id}
                  className="rounded-md border border-black/8 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[#11150f]">
                      {gate.id}
                    </h3>
                    <StatusPill tone={toneForStatus(gate.status)}>
                      {gate.status}
                    </StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#62695d]">
                    {gate.detail}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="h-fit rounded-lg border border-black/8 bg-[#11150f] p-6 text-white">
          <h2 className="text-sm font-semibold text-[#b7e6c6]">
            {zh ? "安全结论" : "Safety decision"}
          </h2>
          <p className="mt-4 rounded-md border border-white/10 bg-white/[0.06] p-4 text-sm leading-7 text-white/70">
            {review.reportBlockedReason}
          </p>
          <div className="mt-4 rounded-md border border-white/10 bg-white/[0.06] p-4 text-xs leading-5 text-white/62">
            {zh
              ? "如果这次检查看起来过于保守，可以请求安全复核。这不会绕过安全门，只会为支持处理记录上下文。"
              : "If this review feels too restrictive, request a safety review. This does not bypass the gate; it only records context for support."}
          </div>
          <div className="mt-5 space-y-3">
            <Link
              href="/app/simulation/result"
              className="inline-flex w-full justify-center rounded-md bg-[#b7e6c6] px-4 py-3 text-sm font-semibold text-[#11150f]"
            >
              {zh ? "打开结果沙盘" : "Open Result Sandbox"}
            </Link>
            <Link
              href="/app/support"
              className="inline-flex w-full justify-center rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white"
            >
              {zh ? "请求安全复核" : "Request safety review"}
            </Link>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function SafetyStateCard({
  label,
  tone,
  body,
}: {
  label: string;
  tone: string;
  body: string;
}) {
  return (
    <article className={`rounded-md border p-4 ${tone}`}>
      <h3 className="text-sm font-semibold">{label}</h3>
      <p className="mt-2 text-sm leading-6 opacity-80">{body}</p>
    </article>
  );
}
