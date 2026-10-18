"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { RealityProfileEditor } from "@/components/reality-profile/profile-editor";
import { SafetyDowngradeNotice } from "@/components/safety-downgrade-notice";
import { Button, ButtonLink } from "@/components/ui-foundation";
import { realityProfileDraftSchema, type RealityProfileDraft } from "@/lib/reality-profile/profile";
import { listExpiredRealityContinuationConstraintKeys, listRealityContinuationRateKeys, listRealityContinuationReviewKeys, preparedRealityProfileContinuationSchema, realityProfileContinuationReceiptSchema, realityProfileContinuationSchema, type PreparedRealityProfileContinuation } from "@/lib/reality-profile/continuation";
import type { SafetyDecision } from "@/lib/safety/safety-types";
import { verifySafety } from "@/lib/safety/safety-verifier";
import type { SeedContextDraft } from "@/types/seed-context";

type FormalTimeWindow = "30_days" | "90_days";
type Phase = "editing" | "sending" | "unknown" | "saved";
const submissionReceiptSchema = z.object({
  seedContext: z.object({ id: z.string().uuid(), version: z.literal("phase2-submitted-v1"), submittedAt: z.iso.datetime({ offset: true }), frozenAt: z.iso.datetime({ offset: true }) }).strict(),
  idempotent: z.boolean(),
  realityContinuation: realityProfileContinuationReceiptSchema.optional(),
}).strict();
const fieldClass = "mt-2 block min-h-11 w-full rounded border border-white/15 bg-black/20 px-3 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none focus-visible:border-[var(--evidence-gold)] focus-visible:ring-2 focus-visible:ring-[var(--evidence-gold)] disabled:opacity-60";
const controlClass = "min-h-11 rounded border border-white/15 px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-50";

function FormField({ label, description, value, onChange, rows = 3 }: { label: string; description: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="block"><span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span><span className="mt-1 block text-sm leading-6 text-[var(--text-secondary)]">{description}</span><textarea value={value} onChange={event => onChange(event.target.value)} rows={rows} className={fieldClass} /></label>;
}

function ReviewCheckbox({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  return <label className="mt-4 flex min-h-11 items-start gap-3 text-sm leading-6 text-[var(--text-secondary)]"><input type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--evidence-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)]" /><span>{label}</span></label>;
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
  const [phase, setPhase] = useState<Phase>("editing");
  const [safetyDecision, setSafetyDecision] = useState<SafetyDecision | null>(null);
  const [receipt, setReceipt] = useState<z.infer<typeof submissionReceiptSchema> | null>(null);
  const [mode, setMode] = useState<"blank" | "continue">("blank");
  const [prepared, setPrepared] = useState<PreparedRealityProfileContinuation | null>(null);
  const [profile, setProfile] = useState<RealityProfileDraft | null>(null);
  const [reviewedKeys, setReviewedKeys] = useState<string[]>([]);
  const [confirmedRateKeys, setConfirmedRateKeys] = useState<string[]>([]);
  const [confirmedForNewSituation, setConfirmedForNewSituation] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceMessage, setSourceMessage] = useState("");
  const [sourceStale, setSourceStale] = useState(false);
  const [assessedAt, setAssessedAt] = useState(() => new Date().toISOString());
  const frozenBody = useRef<string | null>(null);
  const writing = useRef(false);
  const generation = useRef(0);
  const locked = phase !== "editing";

  const prepareContinuation = useCallback(async () => {
    if (frozenBody.current || writing.current) return;
    const requestGeneration = ++generation.current;
    setMode("continue"); setSourceLoading(true); setSourceStale(false);
    setPrepared(null); setProfile(null); setReviewedKeys([]); setConfirmedRateKeys([]); setConfirmedForNewSituation(false); setPrivacySafetyAck(false);
    setSourceMessage("正在读取当前已保存的现实资料，读取不会修改原资料。");
    try {
      const response = await fetch("/api/seed-context?prepare_continuation=1", { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (requestGeneration !== generation.current || frozenBody.current) return;
      const parsed = preparedRealityProfileContinuationSchema.safeParse(payload?.continuation);
      if (!response.ok || !parsed.success) {
        setSourceMessage(payload?.errorCode === "current_seed_required" ? "尚无已提交的处境，请先从空白新建。" : payload?.errorCode === "reality_profile_required" ? "当前处境尚未保存现实资料。可以从空白新建，或先回到我的沙盘填写资料。" : "暂时无法读取现实资料，请重试，或从空白新建。");
        return;
      }
      setPrepared(parsed.data); setProfile(parsed.data.profile);
      setSourceMessage(`已读取资料版本 ${parsed.data.sourceRevision}，请逐项核对是否适用于这次新处境。原资料不会自动成为当前事实。`);
    } catch {
      if (requestGeneration === generation.current) setSourceMessage("暂时无法读取现实资料，请检查连接后重试，或从空白新建。");
    } finally {
      if (requestGeneration === generation.current) setSourceLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active && new URLSearchParams(window.location.search).get("reality") === "continue") void prepareContinuation(); });
    const interval = setInterval(() => setAssessedAt(new Date().toISOString()), 30_000);
    return () => { active = false; generation.current += 1; clearInterval(interval); };
  }, [prepareContinuation]);

  const parsedProfile = profile ? realityProfileDraftSchema.safeParse(profile) : null;
  const validProfile = parsedProfile?.success ? parsedProfile.data : null;
  const expectedKeys = validProfile ? listRealityContinuationReviewKeys(validProfile) : [];
  const expectedRateKeys = validProfile ? listRealityContinuationRateKeys(validProfile) : [];
  const expiredKeys = validProfile ? listExpiredRealityContinuationConstraintKeys(validProfile, new Date(Math.max(Date.parse(assessedAt), Date.parse(prepared?.preparedAt ?? "1970-01-01"))).toISOString()) : [];
  const reviewCount = expectedKeys.filter(key => reviewedKeys.includes(key)).length;

  function editSituation(setter: (value: string) => void, value: string) {
    if (locked) return;
    setter(value); setConfirmedForNewSituation(false); setPrivacySafetyAck(false); setMessage("");
  }

  function changeProfile(next: RealityProfileDraft) {
    if (locked || sourceStale || !profile) return;
    const changedPrefixes: string[] = [];
    for (const key of ["lifeClimate", "resources", "constraints", "goals", "values", "lifeThemes", "pressures", "externalVariables", "worldInputs"] as const) {
      if (JSON.stringify(profile[key]) !== JSON.stringify(next[key])) changedPrefixes.push(key);
    }
    for (const key of ["identity", "career", "wealth", "relationships", "environment", "lifeStage"] as const) {
      if (JSON.stringify(profile.lifeModelDomains[key]) !== JSON.stringify(next.lifeModelDomains[key])) changedPrefixes.push(`lifeModelDomains.${key}`);
    }
    setReviewedKeys(keys => keys.filter(key => !changedPrefixes.some(prefix => key === prefix || key.startsWith(`${prefix}.`))));
    if (changedPrefixes.includes("worldInputs")) setConfirmedRateKeys([]);
    setProfile(next); setConfirmedForNewSituation(false); setPrivacySafetyAck(false); setMessage("");
  }

  function chooseBlank() {
    if (locked || frozenBody.current) return;
    generation.current += 1; setMode("blank"); setPrepared(null); setProfile(null); setSourceLoading(false); setSourceMessage(""); setSourceStale(false);
    setReviewedKeys([]); setConfirmedRateKeys([]); setConfirmedForNewSituation(false); setPrivacySafetyAck(false); setMessage("");
  }

  function buildDraft(): SeedContextDraft {
    const timestamp = new Date().toISOString();
    return { id: "formal_preview", questionText: question.trim(), trackType: "crossroad", timeWindow, situationSummary: situationSummary.trim(), recentEvents: recentEvents.trim(), recentEventsText: recentEvents.trim(), keyPeopleText: people.trim(), decisionOptions: decisionOptions.trim(), decisionOptionsText: decisionOptions.trim(), worries: worries.trim(), forbiddenActions: forbiddenActions.trim(), forbiddenActionsText: forbiddenActions.trim(), safetyBoundaries: safetyBoundaries.trim(), desiredOutput: desiredOutput.trim(), desiredOutputText: desiredOutput.trim(), privacyAck: privacySafetyAck, privacySafetyAck, locale: "en", status: "draft", createdAt: timestamp, updatedAt: timestamp };
  }

  async function submit() {
    if (writing.current || phase === "saved") return;
    if (!frozenBody.current) {
      if (situationSummary.trim().length < 20) { setMessage("请至少写下 20 个字符的处境摘要，再提交新处境。"); return; }
      if (question.trim().length < 8) { setMessage("请写下至少 8 个字符的具体问题。"); return; }
      if (!privacySafetyAck) { setMessage("请先重新确认这次新处境的隐私与安全边界。"); return; }
      const draft = buildDraft();
      const decision = verifySafety({ seedContext: draft }); setSafetyDecision(decision);
      if (decision.safetyLevel === "blocked") { setMessage(decision.userMessage); return; }
      let realityContinuation;
      if (mode === "continue") {
        if (!prepared || !validProfile || sourceLoading || sourceStale) { setMessage("请先读取并完整核对现实资料，或选择从空白新建。"); return; }
        if (listExpiredRealityContinuationConstraintKeys(validProfile, new Date(Math.max(new Date().getTime(), Date.parse(prepared.preparedAt))).toISOString()).length) { setMessage("仍有已到期的时间限制。请逐项更新实际截止时间或删除，不会自动延期。"); return; }
        const parsed = realityProfileContinuationSchema.safeParse({ version: prepared.version, sourceSeedContextId: prepared.sourceSeedContextId, sourceRevision: prepared.sourceRevision, reviewedProfile: validProfile, reviewedKeys, confirmedRateKeys, confirmedForNewSituation });
        if (!parsed.success) { setMessage("请逐项核对全部资料，单独确认已填写的资源变化量，再确认用于这次新处境。"); return; }
        realityContinuation = parsed.data;
      }
      frozenBody.current = JSON.stringify({ draft, submissionKey: crypto.randomUUID(), ...(realityContinuation ? { realityContinuation } : {}) });
    }
    const recoveringUnknown = phase === "unknown";
    writing.current = true; setPhase("sending"); setMessage("正在确认新处境的服务器记录，请保留当前页面。");
    try {
      const response = await fetch("/api/seed-context", { method: "POST", headers: { "content-type": "application/json" }, body: frozenBody.current });
      const payload = await response.json().catch(() => null);
      const parsed = submissionReceiptSchema.safeParse(payload);
      const continuing = Object.prototype.hasOwnProperty.call(JSON.parse(frozenBody.current), "realityContinuation");
      if (response.ok && parsed.success && (!continuing || parsed.data.realityContinuation)) {
        setReceipt(parsed.data); setPhase("saved");
        setMessage(continuing ? "新处境与已复核现实资料已一并保存。接下来为新处境确认人物与关系。" : "新处境已由服务器确认并保存。接下来可以确认人物。");
        return;
      }
      const code = payload?.errorCode;
      const stale = code === "reality_continuation_source_stale" || code === "reality_continuation_revision_conflict";
      const knownRejection = !response.ok && ((response.status === 409 && (stale || code === "reality_continuation_deadline_expired" || (!recoveringUnknown && ["current_seed_required", "reality_profile_required"].includes(code)))) || (!recoveringUnknown && [400, 401, 403, 422].includes(response.status) && typeof code === "string"));
      if (knownRejection) {
        frozenBody.current = null; setPhase("editing"); setReviewedKeys([]); setConfirmedRateKeys([]); setConfirmedForNewSituation(false); setPrivacySafetyAck(false);
        if (stale) { setSourceStale(true); setMessage("来源资料已变化，这次提交未保存。请重新读取当前资料并逐项复核；也可以从空白新建。"); }
        else if (code === "reality_continuation_deadline_expired") setMessage("时间限制已到期，这次提交未保存。请更新或删除到期限制，并重新核对资料。");
        else if (response.status === 401) setMessage("登录状态已失效，这次提交未保存。请重新登录后再填写并提交。");
        else setMessage("这次提交未被接受。请检查新处境与资料，并重新确认后提交。");
        return;
      }
      setPhase("unknown"); setMessage(recoveringUnknown && [401, 403].includes(response.status) ? "身份验证暂时阻止了结果核对，之前的提交仍可能已保存。请保留此页面，在另一窗口恢复登录后回到这里重试原处境提交。" : "提交结果尚未确认。请保留当前页面；所有内容已锁定，只能重试原处境提交，避免重复创建。");
    } catch {
      setPhase("unknown"); setMessage("连接中断，提交结果尚未确认。请保留当前页面并重试原处境提交，系统将核对同一份请求。");
    } finally { writing.current = false; }
  }

  const toggleKey = (setter: (update: (keys: string[]) => string[]) => void, key: string, checked: boolean) => {
    if (locked || sourceStale) return;
    setter(keys => checked ? [...keys.filter(item => item !== key), key] : keys.filter(item => item !== key)); setConfirmedForNewSituation(false);
  };

  return <main id="main-content" className="mx-auto w-full max-w-4xl py-7 sm:py-12">
    <p className="text-sm text-[var(--evidence-gold)]">新处境 · 现实资料与问题</p>
    <h1 className="mt-4 text-3xl font-semibold leading-tight text-[var(--text-primary)] sm:text-4xl">带着重新核对的现实，开始一段新处境。</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">可以沿用自己的现实资料，也可以从空白开始。新处境会单独保存，问题、人物与关系都需要重新确认。</p>

    <fieldset disabled={locked} className="mt-7 min-w-0 border-0 p-0">
      <legend className="text-base font-semibold text-[var(--text-primary)]">这次从哪里开始？</legend>
      <div className="mt-3 flex flex-wrap gap-3"><button type="button" aria-pressed={mode === "continue"} disabled={sourceLoading} className={controlClass} onClick={() => void prepareContinuation()}>沿用我的现实资料</button><button type="button" aria-pressed={mode === "blank"} className={controlClass} onClick={chooseBlank}>从空白新建</button></div>
      {mode === "continue" ? <section aria-label="复核沿用资料" className="mt-6 border-y border-white/15 py-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">先核对适用于这次的现实资料</h2>
        <p role="status" className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{sourceMessage}</p>
        <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">保留、修改或标为明确未知，再逐项确认。旧人物、关系、行动规则与过去的授权不会带入。长期资料仍按现有路径 B 能力读取，不会生成新的长期模型。</p>
        <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" className={controlClass} disabled={sourceLoading} onClick={() => void prepareContinuation()}>{sourceLoading ? "正在读取资料…" : "重新读取当前资料"}</button>{!locked ? <ButtonLink href="/app/dashboard" variant="secondary" className="px-4 py-2">回到我的沙盘</ButtonLink> : null}</div>
        {profile ? <>
          <p aria-live="polite" className="mt-5 text-sm font-semibold text-[var(--evidence-gold)]">{validProfile ? `已核对 ${reviewCount} / ${expectedKeys.length} 项 · 资源变化量另行确认 ${confirmedRateKeys.filter(key => expectedRateKeys.includes(key)).length} / ${expectedRateKeys.length} 项` : "有资料尚未填写完整，请补齐描述、来源或数值后再逐项确认。"}</p>
          {sourceStale ? <p role="alert" className="mt-3 text-sm leading-7 text-[var(--risk-red)]">来源已变化，当前草稿只供查看。请重新读取后复核。</p> : null}
          {expiredKeys.length ? <p role="alert" className="mt-3 text-sm leading-7 text-[var(--risk-red)]">有 {expiredKeys.length} 项时间限制已到期。请在“明确时间限制”中核对名称，更新实际截止时间或删除；不会自动延期。</p> : null}
          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">原先的资源变化量已清空。留空只保留资源背景；重新填写后，还需要单独确认用于这次处境。</p>
          <RealityProfileEditor profile={profile} disabled={locked || sourceStale} onChange={changeProfile}
            renderReview={(key, label) => <>{expiredKeys.includes(key) ? <p className="mt-3 text-sm leading-7 text-[var(--risk-red)]">{label}已到期，请修改截止时间或删除此限制后再确认。</p> : null}<ReviewCheckbox label={`已核对：${label}，适用于新处境（明确未知也可保留）`} checked={reviewedKeys.includes(key)} disabled={locked || sourceStale || !validProfile || expiredKeys.includes(key)} onChange={checked => toggleKey(setReviewedKeys, key, checked)} /></>}
            renderRateReview={(key, label) => <ReviewCheckbox label={`单独确认：${label}的资源变化量仅用于本次新处境`} checked={confirmedRateKeys.includes(key)} disabled={locked || sourceStale || !validProfile} onChange={checked => toggleKey(setConfirmedRateKeys, key, checked)} />} />
        </> : null}
      </section> : <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">本次从空白建立，现有资料不会带入。请描述这一次发生的事情。</p>}

      <section aria-labelledby="new-situation-title" className="mt-8 space-y-7">
        <div><h2 id="new-situation-title" className="text-xl font-semibold text-[var(--text-primary)]">现在，写下全新的处境与问题</h2><p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">围绕这次想理解的变化，观察未来 30 或 90 天。不限于单一职业选择，也无需套用固定的三选一问题。</p></div>
        <FormField label="Situation summary · 这次发生了什么" description="用自己的话说明发生了什么、为什么重要，以及涉及哪些关系动态。" value={situationSummary} onChange={value => editSituation(setSituationSummary, value)} rows={4} />
        <FormField label="Main question · 这次想理解的问题" description="写下一个具体的比较问题。" value={question} onChange={value => editSituation(setQuestion, value)} />
        <FormField label="Recent key events · 最近的已知变化" description="记录已观察到的日期、承诺、冲突、截止时间或变化。" value={recentEvents} onChange={value => editSituation(setRecentEvents, value)} />
        <FormField label="Key people hints · 这次涉及的人" description="写下可能需要重新确认的人物、角色或群体。" value={people} onChange={value => editSituation(setPeople, value)} />
        <div className="grid gap-5 md:grid-cols-2"><FormField label="Decision options · 可考虑的做法" description="列出这一次想比较的现实分支。" value={decisionOptions} onChange={value => editSituation(setDecisionOptions, value)} /><FormField label="Risks and concerns · 担忧与风险" description="将担忧和已确认事实区分开。" value={worries} onChange={value => editSituation(setWorries, value)} /></div>
        <div className="grid gap-5 md:grid-cols-2"><FormField label="Forbidden actions · 行动边界" description="列出不应模拟的行动。" value={forbiddenActions} onChange={value => editSituation(setForbiddenActions, value)} /><FormField label="Sandbox safety limits · 安全边界" description="说明沙盘不应建议或假设的内容。" value={safetyBoundaries} onChange={value => editSituation(setSafetyBoundaries, value)} /></div>
        <FormField label="Desired output · 想重点观察什么" description="例如关系变化、资源限制、行动时机或后续可观察信号。" value={desiredOutput} onChange={value => editSituation(setDesiredOutput, value)} />
        <fieldset><legend className="text-sm font-semibold text-[var(--text-primary)]">观察时间</legend><div className="mt-3 flex flex-wrap gap-3">{(["30_days", "90_days"] as const).map(value => <button key={value} type="button" aria-pressed={timeWindow === value} className={controlClass} onClick={() => { setTimeWindow(value); setConfirmedForNewSituation(false); setPrivacySafetyAck(false); }}>{value === "30_days" ? "30 days" : "90 days"}</button>)}</div></fieldset>
        {mode === "continue" ? <ReviewCheckbox label="我确认逐项核对后的现实资料适用于这次新处境，未知仍保持未知" checked={confirmedForNewSituation} disabled={locked || sourceStale || !validProfile || reviewCount !== expectedKeys.length || confirmedRateKeys.length !== expectedRateKeys.length || expiredKeys.length > 0} onChange={setConfirmedForNewSituation} /> : null}
        <ReviewCheckbox label="我了解提交内容会作为本次新处境的证据输入，并重新同意隐私与安全边界；产品不提供专业建议" checked={privacySafetyAck} disabled={locked} onChange={setPrivacySafetyAck} />
      </section>
    </fieldset>

    <div className="mt-7 flex flex-wrap gap-3"><Button type="button" variant="accent" disabled={phase === "sending" || phase === "saved" || sourceLoading || (sourceStale && phase !== "unknown")} onClick={() => void submit()} className="px-5 py-3">{phase === "sending" ? "正在确认新处境" : phase === "unknown" ? "重试原处境提交" : "提交正式 Track A Seed"}</Button>{receipt ? <><ButtonLink href="/app/new/people" variant="secondary" className="px-5 py-3">进入 People</ButtonLink><ButtonLink href="/app/new/life-climate" variant="secondary" className="px-5 py-3">查看新资料的路径 B</ButtonLink></> : null}</div>
    {message ? <p role="status" className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">{message}</p> : null}
    {receipt ? <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">已确认版本：{receipt.seedContext.version} · 保存时间：{new Date(receipt.seedContext.submittedAt).toLocaleString()}。{receipt.realityContinuation ? "新处境的现实资料版本：1。" : ""}</p> : null}
    {safetyDecision && safetyDecision.safetyLevel !== "safe" ? <div className="mt-5"><SafetyDowngradeNotice decision={safetyDecision} title="提交前的安全检查" /></div> : null}
  </main>;
}
