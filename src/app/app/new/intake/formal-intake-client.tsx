"use client";

import { useState } from "react";

import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { Button, ButtonLink, SurfaceCard } from "@/components/ui-foundation";
import type { SafetyDecision } from "@/lib/safety/safety-types";
import { verifySafety } from "@/lib/safety/safety-verifier";
import type { SeedContextDraft } from "@/types/seed-context";

type FormalTimeWindow = "30_days" | "90_days";

type SubmittedSeedContext = {
  version: string;
  submittedAt: string;
};

type FormFieldProps = {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
};

function FormField({ label, description, value, onChange, rows = 3 }: FormFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#11150f]">{label}</span>
      <span className="mt-1 block text-sm leading-6 text-[#62695d]">{description}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-3 w-full rounded-md border border-black/10 bg-white px-3 py-3 text-sm leading-6 text-[#11150f] outline-none transition focus-visible:border-[#11150f] focus-visible:ring-2 focus-visible:ring-[#b6c6ac]"
      />
    </label>
  );
}

export function FormalIntakeClient() {
  const [situationSummary, setSituationSummary] = useState("");
  const [question, setQuestion] = useState("");
  const [recentEvents, setRecentEvents] = useState("");
  const [people, setPeople] = useState("");
  const [decisionOptions, setDecisionOptions] = useState("");
  const [worries, setWorries] = useState("");
  const [forbiddenActions, setForbiddenActions] = useState("");
  const [safetyBoundaries, setSafetyBoundaries] = useState("");
  const [desiredOutput, setDesiredOutput] = useState("");
  const [timeWindow, setTimeWindow] = useState<FormalTimeWindow>("90_days");
  const [privacySafetyAck, setPrivacySafetyAck] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [safetyDecision, setSafetyDecision] = useState<SafetyDecision | null>(null);
  const [submittedSeedContext, setSubmittedSeedContext] = useState<SubmittedSeedContext | null>(null);

  function buildDraft(): SeedContextDraft {
    const timestamp = new Date().toISOString();
    return {
      id: "formal_preview",
      questionText: question.trim(),
      trackType: "crossroad",
      timeWindow,
      situationSummary: situationSummary.trim(),
      recentEvents: recentEvents.trim(),
      recentEventsText: recentEvents.trim(),
      keyPeopleText: people.trim(),
      decisionOptions: decisionOptions.trim(),
      decisionOptionsText: decisionOptions.trim(),
      worries: worries.trim(),
      forbiddenActions: forbiddenActions.trim(),
      forbiddenActionsText: forbiddenActions.trim(),
      safetyBoundaries: safetyBoundaries.trim(),
      desiredOutput: desiredOutput.trim(),
      desiredOutputText: desiredOutput.trim(),
      privacyAck: privacySafetyAck,
      privacySafetyAck,
      locale: "en",
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  function validate() {
    if (situationSummary.trim().length < 20) {
      setMessage("请至少写下 20 个字符的处境摘要，再提交正式 Seed。");
      return false;
    }
    if (question.trim().length < 8) {
      setMessage("请写下一个具体问题，让 Track A 有明确的比较对象。");
      return false;
    }
    if (!privacySafetyAck) {
      setMessage("请先确认隐私与安全边界，再提交正式 Seed。");
      return false;
    }
    return true;
  }

  async function submit() {
    if (!validate() || isSubmitting || submittedSeedContext) return;

    const draft = buildDraft();
    const decision = verifySafety({ seedContext: draft });
    setSafetyDecision(decision);
    if (decision.safetyLevel === "blocked") {
      setMessage(decision.userMessage);
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/seed-context", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draft, submissionKey: crypto.randomUUID() }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { seedContext?: SubmittedSeedContext; errorCode?: string }
        | null;

      if (!response.ok || !payload?.seedContext) {
        setMessage(
          payload?.errorCode === "authentication_required"
            ? "登录状态已失效，请重新登录后再提交。"
            : "正式提交未完成。表单内容仍停留在当前页面，请检查后重试。",
        );
        return;
      }

      setSubmittedSeedContext(payload.seedContext);
      setMessage("正式 Track A Seed 已由服务器确认并冻结。现在可以进入 People。 ");
    } catch {
      setMessage("正式提交未完成。表单内容仍停留在当前页面，请检查网络后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="main-content" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <SurfaceCard emphasis="strong" className="p-7">
        <p className="font-mono text-xs uppercase tracking-[.14em] text-[#5b644f]">Formal Track A / 正式处境</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-[#11150f]">
          为关系沙盘提交一段清晰的现实处境
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62695d]">
          只提供 30 或 90 天的具体岔路比较。提交成功前，表单不会创建正式 Seed，也不会进入 People。
        </p>

        <div className="mt-8 space-y-7">
          <FormField label="Situation summary" description="用自己的话说明发生了什么、为什么重要，以及涉及哪些关系动态。" value={situationSummary} onChange={setSituationSummary} rows={4} />
          <FormField label="Main question" description="写下一个具体的比较问题。" value={question} onChange={setQuestion} />
          <FormField label="Recent key events" description="记录已观察到的日期、承诺、冲突、截止时间或变化。" value={recentEvents} onChange={setRecentEvents} rows={4} />
          <FormField label="Key people hints" description="写下可能成为 Agent 的人物、角色或群体。" value={people} onChange={setPeople} />
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Decision options" description="列出要比较的现实分支。" value={decisionOptions} onChange={setDecisionOptions} rows={4} />
            <FormField label="Risks and concerns" description="将担忧和已确认事实区分开。" value={worries} onChange={setWorries} rows={4} />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Forbidden actions" description="列出不应模拟的行动边界。" value={forbiddenActions} onChange={setForbiddenActions} rows={4} />
            <FormField label="Sandbox safety limits" description="说明沙盘不应建议或假设的内容。" value={safetyBoundaries} onChange={setSafetyBoundaries} rows={4} />
          </div>
          <FormField label="Desired output" description="说明后续结果应重点呈现哪类证据和比较。" value={desiredOutput} onChange={setDesiredOutput} />

          <fieldset>
            <legend className="text-sm font-semibold text-[#11150f]">Time horizon</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["30_days", "90_days"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTimeWindow(value)}
                  className={`min-h-11 rounded-md border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#11150f] ${timeWindow === value ? "border-[#11150f] bg-[#11150f] text-white" : "border-black/10 bg-white text-[#52594d] hover:border-[#11150f]"}`}
                >
                  {value === "30_days" ? "30 days" : "90 days"}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex gap-3 rounded-md border border-black/8 bg-[#f7f8f4] p-4">
            <input
              type="checkbox"
              checked={privacySafetyAck}
              onChange={(event) => setPrivacySafetyAck(event.target.checked)}
              style={{ minHeight: 44, minWidth: 44 }}
              className="shrink-0 accent-[#11150f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#11150f]"
            />
            <span className="text-sm leading-6 text-[#52594d]">
              我了解提交内容会作为正式处境的证据输入，且该产品不提供专业建议，也不能绕过安全边界。
            </span>
          </label>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Button type="button" variant="accent" onClick={() => void submit()} disabled={isSubmitting || Boolean(submittedSeedContext)} className="px-5 py-3">
            {isSubmitting ? "正在提交正式 Seed" : "提交正式 Track A Seed"}
          </Button>
          {submittedSeedContext ? <ButtonLink href="/app/new/people" variant="secondary" className="px-5 py-3">进入 People</ButtonLink> : null}
        </div>
        {message ? <p role="status" className="mt-4 text-sm leading-6 text-[#526650]">{message}</p> : null}
        {submittedSeedContext ? <p className="mt-3 text-sm leading-6 text-[#294c34]">已确认版本：{submittedSeedContext.version}，提交时间：{new Date(submittedSeedContext.submittedAt).toLocaleString()}。</p> : null}
        {safetyDecision && safetyDecision.safetyLevel !== "safe" ? <div className="mt-5"><SafetyDowngradeNotice decision={safetyDecision} title="提交前的安全检查" /></div> : null}
      </SurfaceCard>

      <aside className="mf-panel-dark h-fit p-6">
        <p className="font-mono text-[11px] uppercase tracking-[.14em] text-[var(--evidence-gold)]">Submission boundary</p>
        <h2 className="mt-3 text-xl font-semibold text-white">先确认服务器记录，再继续人物确认</h2>
        <p className="mt-3 text-sm leading-7 text-white/65">提交失败时不会显示成功状态。只有服务端返回正式 Seed 后，下一步才会出现。</p>
      </aside>
    </section>
  );
}
