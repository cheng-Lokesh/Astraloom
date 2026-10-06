"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SymbolicFrame } from "@/lib/formal-symbolic-lens/frame";
import { canWriteSymbolicLens, readSymbolicLensAccount, writeSymbolicLensAccount, type SymbolicAccountState } from "@/lib/formal-symbolic-lens/client-transport";

const control = "min-h-11 rounded-md border border-white/20 px-4 py-2 text-sm text-[var(--text-primary)] transition-[transform,opacity] hover:bg-white/5 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-45 motion-reduce:transition-none";
const inputStyle = "mt-2 min-h-11 w-full rounded-md border border-white/20 bg-[var(--surface-deep,#101214)] px-3 py-2 text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)] disabled:opacity-45";
const messages: Record<string, string> = {
  unauthenticated: "请先登录，再保存可跨设备恢复的象征镜头。",
  symbolic_revision_conflict: "此资料已在其他窗口更新。请重新读取后再提交；当前表单仍保留。",
  symbolic_idempotency_conflict: "此次请求与已有记录冲突。请重新读取后再试。",
  symbolic_consent_required: "同意已撤回，无法继续计算。重新填写并明确同意后才能启用。",
  invalid_request: "请检查日期、时刻与两项独立同意。未填写的时刻请保持未知。",
};
export function SymbolicLensClient() {
  const [account, setAccount] = useState<SymbolicAccountState>({ ready: false, lens: null });
  const { ready, lens } = account;
  const requestGeneration = useRef(0);
  const mounted = useRef(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("正在读取账户中的象征镜头…");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [timeMode, setTimeMode] = useState("unknown");
  const [storageConsent, setStorageConsent] = useState(false);
  const [calculationConsent, setCalculationConsent] = useState(false);
  function load() {
    const generation = ++requestGeneration.current;
    setAccount({ ready: false, lens: null }); setNotice("正在读取账户资料…");
    void readSymbolicLensAccount().then(result => {
      if (!mounted.current || generation !== requestGeneration.current) return;
      setAccount(result.account);
      setNotice(result.error ? messages[result.error] ?? "暂时无法读取，请稍后重试。" : "读取完成。出生资料不会在此回显；纠正时请重新填写。");
    });
  }
  useEffect(() => {
    mounted.current = true;
    const generation = ++requestGeneration.current;
    void readSymbolicLensAccount().then(result => {
      if (!mounted.current || generation !== requestGeneration.current) return;
      setAccount(result.account);
      setNotice(result.error ? messages[result.error] ?? "暂时无法读取，请稍后重试。" : "读取完成。出生资料不会在此回显；纠正时请重新填写。");
    });
    return () => { mounted.current = false; };
  }, []);
  async function mutate(operation: "replace_source" | "refresh_period" | "withdraw") {
    if (!canWriteSymbolicLens(account, pending) || !lens) return;
    const generation = ++requestGeneration.current;
    setPending(true); setNotice("正在保存到账户…");
    const idempotencyKey = crypto.randomUUID();
    const body = operation === "withdraw" ? { revision: lens.revision, idempotency_key: idempotencyKey }
      : operation === "refresh_period" ? { operation, revision: lens.revision, idempotency_key: idempotencyKey }
      : { operation, revision: lens.revision, idempotency_key: idempotencyKey, source: { birthDate, birthTime: timeMode === "unknown" ? null : birthTime }, consent: { storage: storageConsent, calculation: calculationConsent, futureAttachment: false } };
    const result = await writeSymbolicLensAccount(operation, body);
    if (!mounted.current || generation !== requestGeneration.current) return;
    setAccount(result.account);
    if (result.error) {
      setNotice(`${messages[result.error] ?? "暂时无法确认是否保存；当前表单仍保留。"} 请先重新读取账户状态；不会自动换请求标识重写。`);
    } else {
      setBirthDate(""); setBirthTime(""); setStorageConsent(false); setCalculationConsent(false);
      setNotice(operation === "withdraw" ? "已撤回后续使用：不再计算或附加到新运行。此前来源未执行删除，历史运行保持原样。" : "已安全保存。此镜头是独立象征框架，尚未接入新运行。");
    }
    setPending(false);
  }
  const active = lens?.status === "active" || lens?.status === "stale";
  return <main id="main-content" className="mx-auto w-full max-w-4xl py-7 sm:py-12">
    <Link href="/app/dashboard" className={`${control} inline-flex items-center`}>返回我的沙盘</Link>
    <h1 className="mt-6 text-3xl font-semibold text-[var(--text-primary)]">象征镜头 · 可选的人生气候</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">用一套可查看依据的象征规则对照自己的节奏。它与本人记录的现实近况分别保存，不是事实、证据、科学概率或未来预言；跳过不会影响沙盘使用。</p>
    <p role="status" className="mt-5 text-sm leading-7 text-[var(--text-secondary)]">{notice}</p>
    <div className="mt-3 flex flex-wrap gap-3"><button className={control} type="button" disabled={pending} onClick={() => void load()}>重新读取</button><Link className={`${control} inline-flex items-center`} href="/app/dashboard">暂时跳过</Link></div>
    {lens?.status === "withdrawn" ? <p className="mt-6 border-y border-white/15 py-4 text-sm leading-7 text-[var(--text-secondary)]">已撤回，没有当前有效镜头。后续计算已停用；此前出生来源仍未执行删除。</p> : null}
    {lens?.status === "stale" ? <section className="mt-6 border-y border-[var(--evidence-gold)]/30 py-4"><h2 className="text-base font-semibold text-[var(--text-primary)]">此镜头属于此前时期，需更新</h2><p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">当前年、月结构已变化。下方保留原镜头供复核，读取页面不会自动重新计算。</p><button className={`${control} mt-3`} type="button" disabled={pending} onClick={() => void mutate("refresh_period")}>更新到当前时期</button></section> : null}
    {lens?.snapshot ? <SymbolicFrameView frame={lens.snapshot} /> : <p className="mt-6 text-sm leading-7 text-[var(--text-secondary)]">{ready ? "尚未启用。你可以保留未知，或在明确同意后建立第一份镜头。" : "账户资料尚未读取，当前不显示已保存镜头。"}</p>}
    {active ? <div className="mt-5 flex flex-wrap items-center gap-3"><button className={control} type="button" disabled={pending} onClick={() => void mutate("withdraw")}>撤回后续使用</button><p className="text-sm text-[var(--text-secondary)]">纠正资料会生成新版本，旧运行不被改写。</p></div> : null}
    <form className="mt-9 border-t border-white/15 pt-6" onSubmit={event => { event.preventDefault(); void mutate("replace_source"); }}>
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">{lens?.sourceVersion ? "重新填写并纠正出生来源" : "建立可选的出生来源"}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">日期与可选民用时刻是全部计算输入。未知时刻可直接保存，解释精度会降低。</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="text-sm text-[var(--text-primary)]">出生日期<input type="date" min="1900-01-01" autoComplete="off" required value={birthDate} disabled={!ready || pending} onChange={event => setBirthDate(event.target.value)} className={inputStyle} /></label>
        <label className="text-sm text-[var(--text-primary)]">出生时刻<select value={timeMode} disabled={!ready || pending} onChange={event => { setTimeMode(event.target.value); setBirthTime(""); }} className={inputStyle}><option value="unknown">不知道，保持未知</option><option value="known">知道当地民用时刻</option></select></label>
        {timeMode === "known" ? <label className="text-sm text-[var(--text-primary)]">当地民用时刻<input type="time" value={birthTime} required autoComplete="off" disabled={!ready || pending} onChange={event => setBirthTime(event.target.value)} className={inputStyle} /></label> : null}
      </div>
      <fieldset className="mt-6 space-y-3 border-t border-white/10 pt-5" disabled={!ready || pending}>
        <legend className="pt-3 text-sm font-semibold text-[var(--text-primary)]">逐项选择，默认不授权</legend>
        <label className="flex min-h-11 items-start gap-3 text-sm leading-7 text-[var(--text-secondary)]"><input className="mt-1.5 h-5 w-5 accent-[var(--evidence-gold)]" type="checkbox" name="storage-consent" checked={storageConsent} onChange={event => setStorageConsent(event.target.checked)} />允许将本次出生来源保存到我的账户，以便跨设备恢复。</label>
        <label className="flex min-h-11 items-start gap-3 text-sm leading-7 text-[var(--text-secondary)]"><input className="mt-1.5 h-5 w-5 accent-[var(--evidence-gold)]" type="checkbox" name="calculation-consent" checked={calculationConsent} onChange={event => setCalculationConsent(event.target.checked)} />允许按公开的产品象征规则计算镜头；我理解它不能替代现实资料。</label>
        <label className="flex min-h-11 items-start gap-3 text-sm leading-7 text-[var(--text-secondary)]"><input className="mt-1.5 h-5 w-5" type="checkbox" name="future-attachment-consent" checked={false} disabled readOnly />附加到后续运行：尚未接入新运行，当前不可启用。</label>
      </fieldset>
      <button className={`${control} mt-5 bg-[var(--evidence-gold)] font-semibold !text-black`} type="submit" disabled={!ready || pending || !storageConsent || !calculationConsent}>{pending ? "正在保存…" : "同意并保存象征镜头"}</button>
    </form>
    <section className="mt-8 border-t border-white/15 pt-5"><h2 className="text-base font-semibold text-[var(--text-primary)]">撤回与删除的区别</h2><p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">撤回会立即停止后续计算与使用，不代表已删除此前来源。账户出生来源的正式删除流程尚未接通；支持页的申请也不代表删除已执行。</p><Link href="/app/support" className={`${control} mt-3 inline-flex items-center`}>查看支持与删除申请说明</Link></section>
  </main>;
}
export function SymbolicFrameView({ frame }: { frame: SymbolicFrame }) {
  const counts = frame.calculation.groupCounts;
  return <section className="mt-7" aria-label="已保存象征镜头"><h2 className="text-xl font-semibold text-[var(--text-primary)]">已保存的象征框架</h2><p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">参考日期 {frame.referencePeriod.referenceDate} · 上海时间 · {frame.calculation.precision === "date_only" ? "出生时刻未知，仅日期结构" : "使用日期与当地民用时刻"} · 来源第 {frame.sourceVersion} 版</p>
    <dl className="mt-5 divide-y divide-white/10 border-y border-white/15">{frame.dimensions.map(item => <div key={item.key} data-symbolic-dimension={item.key} className="py-5 sm:grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"><dt className="font-semibold text-[var(--text-primary)]">{item.label}</dt><dd className="mt-2 min-w-0 sm:mt-0"><p className="text-sm font-medium text-[var(--evidence-gold)]">{item.value}</p><p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{item.summary}</p><details className="mt-3 text-sm leading-7 text-[var(--text-secondary)]"><summary className="min-h-10 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)]">查看计算依据</summary><p className="mt-2">{item.key === "initial_tendency" || item.key === "relationship_sensitivity" ? `干与藏干归组计数：自我节奏 ${counts.peer}、表达 ${counts.expression}、资源协调 ${counts.resource}、角色边界 ${counts.responsibility}、信息支持 ${counts.support}。计数只用于象征主题筛选。` : "使用参考日期的年、月结构与出生元素锚点对照；日期哈希、提问主题、事件概率不参与。"}</p>{item.limitations.map(text => <p key={text} className="mt-2">{text}</p>)}</details></dd></div>)}</dl>
    <details className="mt-5 text-sm leading-7 text-[var(--text-secondary)]"><summary className="min-h-11 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)]">计算方法与限制</summary>{frame.limitations.map(text => <p key={text} className="mt-2">{text}</p>)}</details>
  </section>;
}
