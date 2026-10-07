"use client";

import { useEffect, useId, useReducer, useRef, useState } from "react";
import { Button, SurfaceCard } from "@/components/ui-foundation";
import { createFormalSandboxClient } from "@/lib/formal-sandbox/client";
import type { FormalOutcomeInput, FormalOutcomeProjection, FormalOutcomeTarget } from "@/lib/formal-sandbox/outcomes/contracts";

type Observed = FormalOutcomeInput["observed"];
type Value = FormalOutcomeInput["observations"][number]["value"];
export type OutcomeDraft = { observed: Observed | null; occurredAt: string; conditionTimes: Record<string, string>; evidenceSummary: string; uncertainty: "low" | "medium" | "high"; confirmed: boolean; values: Record<string, Value>; correctionRuleKey: string; correctionConfirmed: boolean; unknown: boolean };
export const initialOutcomeDraft: OutcomeDraft = { observed: null, occurredAt: "", conditionTimes: {}, evidenceSummary: "", uncertainty: "high", confirmed: false, values: {}, correctionRuleKey: "", correctionConfirmed: false, unknown: false };
type DraftAction = { type: "target" | "unknown" | "recover" | "saved" } | { type: "edit"; field: keyof OutcomeDraft; value: OutcomeDraft[keyof OutcomeDraft] };
export function outcomeDraftReducer(state: OutcomeDraft, action: DraftAction): OutcomeDraft {
  if (action.type === "saved") return initialOutcomeDraft;
  if (action.type === "unknown") return { ...state, unknown: true };
  if (action.type === "recover") return state;
  if (state.unknown) return state;
  if (action.type === "target") return initialOutcomeDraft;
  if (action.type === "edit") return { ...state, [action.field]: action.value, ...(["observed", "values", "conditionTimes", "correctionRuleKey"].includes(action.field) ? { correctionConfirmed: false } : {}) };
  return state;
}
const control = "mt-2 block min-h-11 w-full rounded-md border border-white/20 bg-[var(--bg-base)] px-3 py-2 text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-60";
const observations = { occurred: "已发生", did_not_occur: "完整窗口结束后未发生", uncertain: "不确定" };
export function outcomeValueLabel(value: Value) {
  return value === null ? "未知" : typeof value === "boolean" ? value ? "是" : "否" : typeof value === "number" ? String(value) : ({ positive: "积极", neutral: "中性", negative: "消极", planned: "计划中", active: "进行中", fulfilled: "已完成", cancelled: "已取消" } as Record<string, string>)[value] ?? value;
}
function validTime(target: FormalOutcomeTarget, value: string) {
  const date = Date.parse(value);
  return Number.isFinite(date) && date >= Date.parse(target.observationWindow.startAt) && date <= Date.parse(target.observationWindow.horizonEnd) && date <= Date.now();
}
function correctionConditions(target: FormalOutcomeTarget, draft: OutcomeDraft) {
  return target.correctionAllowed ? target.conditions.filter(condition => condition.correctable && condition.ruleKey && draft.values[condition.key] != null && draft.values[condition.key] !== condition.expectedValue) : [];
}
function validDraft(target: FormalOutcomeTarget | undefined, draft: OutcomeDraft) {
  if (!target || !draft.confirmed || !draft.evidenceSummary.trim()) return false;
  if (target.canRecordTypedObservation && target.conditions.some(condition => draft.values[condition.key] != null && (typeof draft.values[condition.key] === "number" && (!Number.isFinite(draft.values[condition.key]) || Number(draft.values[condition.key]) < 0 || Number(draft.values[condition.key]) > 1_000_000) || condition.requiresTime && !validTime(target, draft.conditionTimes[condition.key] ?? "")))) return false;
  if (draft.correctionRuleKey && (!draft.correctionConfirmed || !correctionConditions(target, draft).some(condition => condition.ruleKey === draft.correctionRuleKey))) return false;
  if (target.status === "not_observable") return true;
  if (!draft.observed || (draft.observed === "did_not_occur" && !target.canRecordDidNotOccur)) return false;
  if (draft.observed === "occurred") {
    if (!validTime(target, draft.occurredAt)) return false;
  }
  if (draft.observed === "uncertain") return true;
  if (!target.conditions.every(condition => Object.hasOwn(draft.values, condition.key) && draft.values[condition.key] !== null && (typeof draft.values[condition.key] !== "number" || Number.isFinite(draft.values[condition.key])))) return false;
  const allMatch = target.conditions.every(condition => draft.values[condition.key] === condition.expectedValue);
  if (draft.observed === "occurred" ? !allMatch : allMatch) return false;
  return true;
}
type Phase = "loading" | "error" | "ready" | "saving" | "unknown";
export function OutcomeObservationsView({ projection, draft, targetKey, phase, message = "", onTargetChange, onDraftChange, onSave, onRetry, onRecover }: { projection: FormalOutcomeProjection | null; draft: OutcomeDraft; targetKey: string; phase: Phase; message?: string; onTargetChange: (key: string) => void; onDraftChange: (action: DraftAction) => void; onSave: () => void; onRetry: () => void; onRecover: () => void }) {
  const id = useId();
  const target = projection?.targets.find(item => item.key === targetKey);
  const locked = phase === "saving" || draft.unknown;
  const edit = (field: keyof OutcomeDraft, value: OutcomeDraft[keyof OutcomeDraft]) => onDraftChange({ type: "edit", field, value });
  return <SurfaceCard className="mt-8 min-w-0 p-5">
    <h2 className="text-xl font-semibold">回填本人观察的真实结果</h2>
    <p className="mt-2 max-w-prose text-sm leading-6 text-[var(--text-secondary)]">这里记录你在现实中观察到的情况与不确定性。本人观察仍有局限；原模拟结果保留，新的观察只供后续运行参考。</p>
    {phase === "loading" ? <p role="status" className="mt-4 animate-pulse motion-reduce:animate-none">正在读取事前锁定条件与观察记录…</p> : null}
    {phase === "error" ? <p role="alert" className="mt-4">暂时无法读取观察条件。请重新读取，本次模拟结果仍可查看。</p> : null}
    {projection ? <>
      <p className="mt-4 text-sm">{projection.calibration.status === "insufficient_data" ? "样本不足" : "已记录有限的回测样本"}：校准可用样本（由服务端核对）{projection.calibration.sampleCount}，最低需要 {projection.calibration.minimumSampleSize}。此页面不将模拟频率改称现实发生概率。</p>
      {!projection.targets.length ? <p className="mt-4 text-sm">此运行暂无可回填的主路径条件目标。已有结果评价仍可使用。</p> : <>
        <label className="mt-5 block" htmlFor={`${id}-target`}>观察目标 · 本人主路径<select id={`${id}-target`} value={targetKey} disabled={locked} onChange={event => onTargetChange(event.target.value)} className={control}>{projection.targets.map((item, index) => <option key={item.key} value={item.key}>目标 {index + 1} · {item.label}</option>)}</select></label>
        {target ? <div className="mt-4 min-w-0 space-y-4">
          <p className="text-sm leading-6">观察窗口：{new Date(target.observationWindow.startAt).toLocaleString()} 至 {new Date(target.observationWindow.horizonEnd).toLocaleString()}</p>
          {target.status === "not_observable" ? <p className="text-sm leading-6">不可评分：{target.reason ?? "此目标没有可核对的事前锁定条件"}。{target.canRecordTypedObservation ? "仅保留本人观察，不对整组条件评分。具体条件已知不表示整组情景已在现实发生。" : "仅保存观察说明，不补写事前预测。"}</p> : null}
          {target.canRecordTypedObservation ? <>
            <h3 className="font-semibold">{target.status === "observable" ? "完整条件列表" : "可记录的本人观察条件"}</h3>
            {target.status === "observable" ? <p className="text-sm leading-6">“已发生”表示这组条件全部吻合实际观察。至少一个条件不同且完整窗口结束后，才可选择“未发生”；尚未看清或窗口未结束时请选择“不确定”。</p> : null}
            <div className="space-y-4">{target.conditions.map((condition, index) => <label key={condition.key} className="block text-sm leading-6">条件 {index + 1} · {condition.label}<span className="block text-[var(--text-secondary)]">事前条件：{outcomeValueLabel(condition.expectedValue)}</span>
              {condition.actorLabel || condition.resourceLabel ? <span className="block text-[var(--text-secondary)]">{condition.actorLabel ? `对应行动者：${condition.actorLabel}` : ""}{condition.resourceLabel ? ` · 对应资源：${condition.resourceLabel}` : ""} · 条件顺序 {condition.sequence}</span> : null}
              {typeof condition.expectedValue === "number" ? <><input type="number" min={0} max={1000000} step="any" aria-label={`实际观察 · ${condition.label}`} value={typeof draft.values[condition.key] === "number" ? String(draft.values[condition.key]) : ""} disabled={locked} className={control} onChange={event => edit("values", { ...draft.values, [condition.key]: event.target.value === "" ? null : Number(event.target.value) })} /><span className="block mt-1">不确定时可以留空，表示实际数量未知。</span></> : <select aria-label={`实际观察 · ${condition.label}`} value={draft.values[condition.key] === undefined ? "" : draft.values[condition.key] === null ? "unknown" : String(draft.values[condition.key])} disabled={locked} className={control} onChange={event => edit("values", { ...draft.values, [condition.key]: event.target.value === "unknown" || !event.target.value ? null : typeof condition.expectedValue === "boolean" ? event.target.value === "true" : event.target.value as Value })}><option value="">请选择实际观察</option><option value="unknown">未知</option>{(typeof condition.expectedValue === "boolean" ? [true, false] : condition.kind === "update_relation_signal" ? ["positive", "neutral", "negative"] : ["planned", "active", "fulfilled", "cancelled"]).map(value => <option key={String(value)} value={String(value)}>{outcomeValueLabel(value as Value)}</option>)}</select>}
              {condition.requiresTime ? <span className="mt-2 block">条件发生时间 · {condition.label}<input aria-label={`条件发生时间 · ${condition.label}`} type="datetime-local" value={draft.conditionTimes[condition.key] ?? ""} disabled={locked || draft.values[condition.key] == null} onChange={event => edit("conditionTimes", { ...draft.conditionTimes, [condition.key]: event.target.value })} className={control} /><span className="mt-1 block">已知的实际观察需填写窗口内时间；未知项可以留空。</span></span> : null}
            </label>)}</div>
          </> : null}
          {target.status === "observable" ? <>
            <fieldset disabled={locked}><legend className="font-semibold">这组条件是否在现实中发生？</legend><div className="mt-2 flex flex-wrap gap-2">{(["occurred", "did_not_occur", "uncertain"] as const).map(value => <label key={value} className="flex min-h-11 items-center gap-2 px-2 focus-within:outline focus-within:outline-2"><input type="radio" name={`${id}-observed`} value={value} checked={draft.observed === value} disabled={value === "did_not_occur" && !target.canRecordDidNotOccur} onChange={() => edit("observed", value)} />{observations[value]}</label>)}</div></fieldset>
            {!target.canRecordDidNotOccur ? <p className="text-sm">完整观察窗口尚未结束，尚不能确认未发生。尚未看到结果时，请选择不确定。</p> : null}
            {draft.observed === "occurred" ? <label className="block">实际发生时间<input aria-label="实际发生时间" type="datetime-local" value={draft.occurredAt} disabled={locked} onChange={event => edit("occurredAt", event.target.value)} className={control} /><span className="mt-1 block text-sm">应位于上述观察窗口内，并且不晚于当前时间。</span></label> : null}
          </> : null}
          <label className="block">观察依据简述<textarea value={draft.evidenceSummary} disabled={locked} maxLength={160} onChange={event => edit("evidenceSummary", event.target.value)} className={`${control} min-h-24`} placeholder="简述本人观察，不填写姓名、联系方式或原始聊天内容" /></label>
          <label className="block">观察的不确定性<select value={draft.uncertainty} disabled={locked} onChange={event => edit("uncertainty", event.target.value as OutcomeDraft["uncertainty"])} className={control}><option value="high">高 · 仍有较多未知</option><option value="medium">中 · 部分情况无法确认</option><option value="low">低 · 本人观察较清楚</option></select></label>
          {correctionConditions(target, draft).length ? <label className="block">供下一次运行参考的条件修正（可不选）<select disabled={locked} value={draft.correctionRuleKey} onChange={event => edit("correctionRuleKey", event.target.value)} className={control}><option value="">不建立修正</option>{correctionConditions(target, draft).map(item => <option key={item.key} value={item.ruleKey!}>{item.label} · 根据上述实际观察建立条件假设</option>)}</select><span className="mt-1 block text-sm">它是未来运行的条件假设，不表示整组预测已在现实发生。保存后仍需在下一次运行中单独选择并确认，不会自动应用。</span></label> : null}
          {draft.correctionRuleKey ? <label className="flex min-h-11 items-start gap-3 py-2 focus-within:outline focus-within:outline-2"><input type="checkbox" checked={draft.correctionConfirmed} disabled={locked} onChange={event => edit("correctionConfirmed", event.target.checked)} className="mt-1" /><span>我单独确认建立所选条件修正，仅供下一次运行参考</span></label> : null}
          <label className="flex min-h-11 items-start gap-3 py-2 focus-within:outline focus-within:outline-2"><input type="checkbox" checked={draft.confirmed} disabled={locked} onChange={event => edit("confirmed", event.target.checked)} className="mt-1" /><span>我确认以上是本人观察，仍可能有记录和理解上的局限</span></label>
          <Button variant="onDark" disabled={locked || !validDraft(target, draft)} loading={phase === "saving"} loadingLabel="正在保存观察" onClick={onSave} className="!w-auto px-4 py-3">保存本人观察</Button>
        </div> : null}
      </>}
      <section className="mt-6 border-t border-white/15 pt-5"><h3 className="font-semibold">已保存的本人观察</h3><p className="mt-2 text-sm">每次记录独立保留；不会改写原条件结论或旧观察。</p>{projection.history.length ? <ol className="mt-3 space-y-4">{projection.history.map(item => {
        const frozenTarget = projection.targets.find(target => target.key === item.targetKey);
        return <li key={item.key} className="break-words text-sm leading-6"><p>{frozenTarget?.label ?? "历史观察目标"} · {observations[item.observed]} · 本人观察</p><p>{item.evidenceSummary}</p>
          {item.observations.length ? <ul className="mt-2 space-y-1">{item.observations.map((observation, index) => <li key={observation.key}>{frozenTarget?.conditions.find(condition => condition.key === observation.key)?.label ?? `已保存条件 ${index + 1}`}：{observation.value === null ? "未记录" : outcomeValueLabel(observation.value)} · 条件发生时间：{observation.occurredAt ? new Date(observation.occurredAt).toLocaleString() : "未记录"}</li>)}</ul> : null}
          <p className="text-[var(--text-secondary)]">记录时间：{new Date(item.recordedAt).toLocaleString()} · 不确定性：{{ low: "低", medium: "中", high: "高" }[item.uncertainty]} · {item.backtestStatus === "historical_lock_not_recorded" ? "历史运行缺少事前锁定，仅保留说明" : item.backtestStatus === "not_observable" ? "不具备可评分条件" : item.backtestStatus === "scored" ? "已记录该组条件的回测" : "样本不足"}</p>{item.correctionAvailable ? <p>已建立待选择的下一次运行条件假设</p> : null}</li>;
      })}</ol> : <p className="mt-3 text-sm">还没有保存本人观察。你可以在情况明朗后回来补充。</p>}</section>
    </> : null}
    {message ? <p role={phase === "unknown" ? "alert" : "status"} className="mt-4 text-sm leading-6">{message}</p> : null}
    {draft.unknown ? <Button variant="ghostOnDark" disabled={phase === "saving"} onClick={onRecover} className="!w-auto mt-3 px-4 py-3">重试原观察保存</Button> : <Button variant="ghostOnDark" disabled={phase === "saving" || phase === "loading"} onClick={onRetry} className="!w-auto mt-4 px-4 py-3">重新读取观察记录</Button>}
  </SurfaceCard>;
}

export function OutcomeObservations({ runId }: { runId: string }) {
  const [projection, setProjection] = useState<FormalOutcomeProjection | null>(null);
  const [targetKey, setTargetKey] = useState("");
  const [draft, dispatch] = useReducer(outcomeDraftReducer, initialOutcomeDraft);
  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);
  const sequence = useRef(0);
  const inFlight = useRef(false);
  const pending = useRef<FormalOutcomeInput | null>(null);
  useEffect(() => {
    const request = ++sequence.current;
    void createFormalSandboxClient().outcomes(runId).then(response => {
      if (request !== sequence.current) return;
      if (!response.ok) { setPhase("error"); return; }
      setProjection(response.data.outcomes);
      setTargetKey(current => response.data.outcomes.targets.some(item => item.key === current) ? current : response.data.outcomes.targets[0]?.key ?? "");
      setPhase("ready");
    }).catch(() => { if (request === sequence.current) setPhase("error"); });
    return () => { sequence.current += 1; };
  }, [runId, reload]);
  async function save() {
    const target = projection?.targets.find(item => item.key === targetKey);
    if (inFlight.current || (!pending.current && !validDraft(target, draft))) return;
    if (!pending.current && target) {
      pending.current = { target_key: target.key, observed: target.status === "not_observable" ? "uncertain" : draft.observed!, ...(draft.observed === "occurred" && target.status === "observable" ? { occurred_at: new Date(draft.occurredAt).toISOString() } : {}), evidence_summary: draft.evidenceSummary.trim(), uncertainty: draft.uncertainty, confirmed_user_observation: true, observations: target.canRecordTypedObservation ? target.conditions.map(item => ({ key: item.key, value: draft.values[item.key] ?? null, ...(item.requiresTime && draft.values[item.key] != null ? { occurred_at: new Date(draft.conditionTimes[item.key]).toISOString() } : {}) })) : [], ...(draft.correctionRuleKey && draft.correctionConfirmed ? { correction: { rule_key: draft.correctionRuleKey, confirmed_for_next_run: true as const } } : {}), idempotency_key: crypto.randomUUID() };
    }
    if (!pending.current) return;
    const request = ++sequence.current;
    inFlight.current = true; setPhase("saving"); setMessage("");
    try {
      const response = await createFormalSandboxClient().saveOutcome(runId, pending.current);
      if (request !== sequence.current) return;
      if (!response.ok) {
        if (response.status >= 500 || response.errorCode === "request_failed" || response.errorCode === "invalid_response") throw new Error("unknown");
        pending.current = null; setPhase("ready");
        setMessage(response.errorCode === "observation_window_open" ? "完整窗口尚未结束，请重新读取后选择不确定。" : "观察未被接受。请检查发生时间、完整条件及简述后重试。");
        return;
      }
      pending.current = null;
      // A successful same-key replay is authoritative even after an ambiguous response.
      setProjection(response.data.outcomes);
      dispatch({ type: "saved" });
      setMessage("本人观察已保存；原模拟结果不变。下一次运行仍需另行选择条件修正。");
      setPhase("ready");
    } catch {
      if (request === sequence.current) { dispatch({ type: "unknown" }); setPhase("unknown"); setMessage("保存结果暂时未知。你的原内容与请求已保留；请重试原观察保存以恢复结果，期间不能修改或新增记录。"); }
    } finally { inFlight.current = false; }
  }
  return <OutcomeObservationsView projection={projection} targetKey={targetKey} draft={draft} phase={phase} message={message} onTargetChange={key => { if (inFlight.current || draft.unknown) return; setTargetKey(key); dispatch({ type: "target" }); setMessage(""); }} onDraftChange={dispatch} onSave={() => void save()} onRecover={() => void save()} onRetry={() => { setPhase("loading"); setReload(value => value + 1); }} />;
}
