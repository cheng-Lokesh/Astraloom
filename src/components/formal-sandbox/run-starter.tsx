"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui-foundation";
import { createFormalSandboxClient } from "@/lib/formal-sandbox/client";
import { safeDigitalLifeContextSchema, type SafeDigitalLifeContext } from "@/lib/formal-sandbox/model-context";
import { digitalLifeRulesSchema, type DigitalLifeRules } from "@/lib/digital-life/model";
import { DigitalLifeRulesEditor } from "./digital-life-rules-editor";
import { CalibrationSelection } from "./calibration-selection";
import type { FormalCalibrationContext } from "@/lib/formal-sandbox/outcomes/contracts";

export function FormalRunStartError({ errorCode }: { errorCode: string }) {
  if (errorCode === "request_outcome_unknown") return null;
  if (errorCode === "invalid_correction") return <p role="alert" className="mt-2 max-w-prose text-sm text-[var(--risk-red)]">所选观察修正与当前行动条件不相符。请取消修正或恢复对应原行动条件，再重新确认后开始运行。</p>;
  if (errorCode === "world_model_required") {
    return (
      <p role="alert" className="mt-2 max-w-xs text-sm text-[var(--risk-red)]">
        请在上方添加明确行动规则，或补充资源及每周期投入规则，再开始运行。 {" "}
        <Link href="/app/reality-profile" className="underline underline-offset-4">
          修改背景资料
        </Link>
      </p>
    );
  }

  if (errorCode === "reservation_expired") {
    return (
      <p role="alert" className="mt-2 max-w-xs text-sm text-[var(--risk-red)]">
        首次请求冻结的运行时间窗口已过期，本次没有生成新的运行结果。已配置规则会保留。
      </p>
    );
  }

  return (
    <p role="alert" className="mt-2 max-w-xs text-sm text-[var(--risk-red)]">
      {errorCode === "profile_revision_conflict" ? "背景资料已更新，请重新读取当前模型并检查规则后重试。" : errorCode === "invalid_digital_life_rules" ? "规则未通过检查。请确认人物、触发条件、资源量和假设说明。" : errorCode === "current_graph_required" || errorCode === "graph_not_locked" ? "请先完成并锁定当前关系图，然后重新读取模型。" : errorCode === "unauthenticated" ? "登录后才能读取模型和开始运行。" : "无法开始运行。请检查已锁定关系图后重试；你的选择仍保留。"}
    </p>
  );
}

export function FormalRunStarter({ graphId }: { graphId?: string }) {
  const router = useRouter();
  const id = useId();
  const [context, setContext] = useState<SafeDigitalLifeContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [horizon, setHorizon] = useState<30 | 90>(30);
  const [rules, setRules] = useState<Pick<DigitalLifeRules, "actions" | "strategies">>({ actions: [], strategies: [] });
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calibration, setCalibration] = useState<FormalCalibrationContext | null>(null);
  const [calibrationError, setCalibrationError] = useState(false);
  const [correctionKeys, setCorrectionKeys] = useState<string[]>([]);
  const [calibrationConfirmed, setCalibrationConfirmed] = useState(false);
  const [unknownStart, setUnknownStart] = useState(false);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const replay = useRef<{ signature: string; key: string } | null>(null);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    let active = true;
    const abort = new AbortController();
    async function recover() {
      setLoading(true); setContext(null); setError(null); setRules({ actions: [], strategies: [] });
      setCalibration(null); setCalibrationError(false); setCorrectionKeys([]); setCalibrationConfirmed(false);
      try {
        const response = await fetch(`/api/sandbox/model-context${graphId ? `?graph_id=${encodeURIComponent(graphId)}` : ""}`, { cache: "no-store", signal: abort.signal });
        const body = await response.json().catch(() => null);
        if (!active) return;
        const parsed = safeDigitalLifeContextSchema.safeParse(body?.context);
        if (!response.ok || body?.ok !== true || !parsed.success || (graphId && parsed.data.graphSnapshotId !== graphId)) { setError(typeof body?.error_code === "string" ? body.error_code : "context_unavailable"); return; }
        setContext(parsed.data);
        try {
          const result = await createFormalSandboxClient().calibrationContext(graphId);
          if (!active || currentGeneration !== generation.current) return;
          if (!result.ok || result.data.context.graphSnapshotId !== parsed.data.graphSnapshotId || result.data.context.profileRevision !== parsed.data.profileRevision) { setCalibrationError(true); return; }
          setCalibration(result.data.context);
        } catch { if (active) setCalibrationError(true); }
      } catch { if (active) setError("context_unavailable"); }
      finally { if (active) setLoading(false); }
    }
    void recover();
    return () => { active = false; generation.current += 1; abort.abort(); };
  }, [graphId, reload]);

  async function start() {
    if (!context || inFlight.current) return;
    if (correctionKeys.length && !calibrationConfirmed) { setNotice("请先明确确认所选观察修正的条件假设，再开始运行。"); return; }
    const parsed = digitalLifeRulesSchema.safeParse({ version: "digital-life-rules-v1", graphSnapshotId: context.graphSnapshotId, agentSnapshotId: context.agentSnapshotId, profileRevision: context.profileRevision, ...rules });
    if (!parsed.success) { setError("invalid_digital_life_rules"); return; }
    inFlight.current = true;
    setPending(true);
    setError(null);
    const outcomeCalibration = correctionKeys.length ? { version: 1 as const, correction_keys: correctionKeys, confirmed: true as const } : undefined;
    const signature = JSON.stringify({ horizon, rules: parsed.data, outcomeCalibration });
    if (unknownStart && replay.current?.signature !== signature) return;
    if (replay.current?.signature !== signature) replay.current = { signature, key: crypto.randomUUID() };
    const currentGeneration = generation.current;
    try {
      const response = await createFormalSandboxClient().start({ graphSnapshotId: context.graphSnapshotId, idempotencyKey: replay.current.key, horizonDays: horizon, digitalLifeRules: parsed.data, ...(outcomeCalibration ? { outcomeCalibration } : {}) });
      if (currentGeneration !== generation.current) return;
      if (!response.ok) { if (response.status >= 500 || response.errorCode === "request_failed" || response.errorCode === "invalid_response") { setUnknownStart(true); setError("request_outcome_unknown"); } else { setUnknownStart(false); setError(response.errorCode); } return; }
      router.push(`/app/simulation/running?run_id=${response.data.run.id}`);
    } catch { if (currentGeneration === generation.current) { setUnknownStart(true); setError("request_outcome_unknown"); } }
    finally { inFlight.current = false; setPending(false); }
  }

  function changeHorizon(value: 30 | 90) {
    if (value === horizon) return;
    setHorizon(value);
    if (rules.actions.length) {
      setRules({ actions: [], strategies: [] });
      setNotice("时间窗口已更改，原规则已清空，请按新周期重新配置。" );
    }
  }

  function prepareExpiredReservationRetry() {
    replay.current = null;
    setError(null);
    setNotice("已准备新的运行，请确认后开始");
  }

  return (
    <div className="min-w-0 w-full space-y-5">
      <h2 className="text-xl font-semibold">配置本次数字生命运行</h2>
      <p className="max-w-prose text-sm leading-6 text-[var(--text-secondary)]">30 天包含 3 个模拟周期，90 天包含 6 个周期。周期表达条件变化，不是现实中的精确发生日期。</p>
      {loading ? <p role="status" className="animate-pulse motion-reduce:animate-none">正在读取已锁定模型与可选人物…</p> : null}
      {!loading && !context ? <div><p className="text-sm leading-6">当前模型暂不可读取。请完成当前情境的人物与关系图，再重新读取。</p><Button variant="ghostOnDark" onClick={() => setReload(value => value + 1)} className="!w-auto px-4 py-3">重新读取模型</Button><Link href="/app/new/intake" className="ml-3 inline-flex min-h-11 items-center underline">返回情境准备</Link></div> : null}
      {context ? <><label htmlFor={`${id}-horizon`} className="block max-w-xs">运行时间窗口<select id={`${id}-horizon`} value={horizon} disabled={pending || unknownStart} onChange={event => changeHorizon(Number(event.target.value) as 30 | 90)} className="mt-2 block min-h-11 w-full rounded-md border border-white/20 bg-[var(--bg-base)] px-3 text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)]"><option value="30">30 天 · 3 个模拟周期</option><option value="90">90 天 · 6 个模拟周期</option></select></label><p role="status" className="text-sm">{notice}</p><DigitalLifeRulesEditor key={`${context.graphSnapshotId}-${context.profileRevision}-${horizon}`} context={context} horizonDays={horizon} actions={rules.actions} strategies={rules.strategies} onChange={setRules} disabled={pending || unknownStart} />{calibration ? <CalibrationSelection context={calibration} selectedKeys={correctionKeys} confirmed={calibrationConfirmed} onChange={setCorrectionKeys} onConfirm={setCalibrationConfirmed} disabled={pending || unknownStart} /> : null}{calibrationError ? <p role="status" className="text-sm">观察修正暂不可读取，本次不应用修正。重新读取模型可再次检查可用条件。</p> : null}</> : null}
      <Button
        variant="onDark"
        loading={pending}
        disabled={pending || loading || !context || unknownStart || (correctionKeys.length > 0 && !calibrationConfirmed)}
        onClick={() => void start()}
        className="!w-auto px-4 py-3"
        loadingLabel="正在提交本次运行"
      >
        开始 {horizon} 天运行
      </Button>
      {error ? <FormalRunStartError errorCode={error} /> : null}
      {unknownStart ? <div><p role="alert" className="text-sm leading-6">运行提交结果暂时未知。原请求与选择已保留；请恢复原运行请求，期间不能修改配置或自动发起新运行。</p><Button variant="ghostOnDark" disabled={pending} onClick={() => void start()} className="!w-auto px-4 py-3">恢复原运行请求</Button></div> : null}
      {context && error === "reservation_expired" ? <Button variant="ghostOnDark" onClick={prepareExpiredReservationRetry} className="!w-auto px-4 py-3">保留规则，重新发起</Button> : null}
      {context && error === "profile_revision_conflict" ? <Button variant="ghostOnDark" onClick={() => { setNotice("重新读取将更新模型并清空旧规则。"); setReload(value => value + 1); }} className="!w-auto px-4 py-3">重新读取模型并检查规则</Button> : null}
      {context && calibrationError && !unknownStart ? <Button variant="ghostOnDark" disabled={pending} onClick={() => { setNotice("重新读取将清空旧规则，请重新确认条件。"); setReload(value => value + 1); }} className="!w-auto px-4 py-3">重新读取模型与观察修正</Button> : null}
    </div>
  );
}
