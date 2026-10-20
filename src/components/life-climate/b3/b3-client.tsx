"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button, ButtonLink } from "@/components/ui-foundation";
import { listRealityProfileEntries } from "@/lib/reality-profile/profile";
import { LIFE_CLIMATE_B3_VERSION, lifeClimateB3RequestSchema, type LifeClimateB3Assumption, type LifeClimateB3Horizon, type LifeClimateB3Rule } from "@/lib/life-climate/b3/contracts";
import { canonicalLifeClimateB3Json, createLifeClimateB3ConfirmationContext, createLifeClimateB3SourceContext, hashLifeClimateB3Value } from "@/lib/life-climate/b3/context";
import { bodySchema, completedEnvelopeSchema, intentSchema, matchesReceipt, readB3, runSchema, sourceSchema, type B3Body, type B3Intent, type B3Record, type B3Source } from "./http";
import { blankEditor, makeRule, profileResources, ruleNames, stageName, type DeclaredResource, type Editor } from "./model";
import { control, Field, RuleEditor } from "./rule-editor";
import { B3Result } from "./result";
import { ResourceEditor } from "./resource-editor";

type Row = { path: string; rule: LifeClimateB3Rule; assumptions: LifeClimateB3Assumption[]; editor: Editor };
const initialPaths = () => [{ id: "choice-one", label: "选择一" }, { id: "choice-two", label: "选择二" }];
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange(value: boolean): void }) { return <label className="flex min-h-11 items-start gap-3 py-2 text-sm leading-7"><input className="mt-1.5 h-5 w-5 shrink-0 accent-[var(--evidence-gold)]" type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />{label}</label>; }
const safeMessage = (error: unknown) => error instanceof z.ZodError ? "账户记录不符合完整合约，暂不采用；请重新核对，原请求仍保留。" : error instanceof Error ? error.message : "暂时无法核对，请重试。";
export function B3Client() {
  const [horizon, setHorizon] = useState<LifeClimateB3Horizon>("1_year");
  const [source, setSource] = useState<B3Source | null>(null);
  const [loading, setLoading] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [intents, setIntents] = useState<B3Intent[]>([]);
  const [history, setHistory] = useState<B3Record[]>([]);
  const [sourceChecks, setSourceChecks] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [paths, setPaths] = useState(initialPaths);
  const [rows, setRows] = useState<Row[]>([]);
  const [resources, setResources] = useState<DeclaredResource[]>([]);
  const [editor, setEditor] = useState<Editor>(blankEditor);
  const [editing, setEditing] = useState<number | null>(null);
  const [symbolic, setSymbolic] = useState(false);
  const [pending, setPending] = useState<B3Body | null>(null);
  const pendingText = useRef<string | null>(null);
  const pendingLock = useRef(false);
  const [sending, setSending] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const sendingLock = useRef(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<B3Record[]>([]);
  const sourceSequence = useRef(0);
  const accountSequence = useRef(0);
  const locked = pending !== null || sending || preparing;
  const entries = source ? listRealityProfileEntries(source.view.profile) : [];
  const sourceKeys = [...entries.map(item => item.key), ...(source?.view.profile.worldInputs.resources ?? []).map(item => `resource:${item.key}`), ...(source?.view.profile.worldInputs.constraints ?? []).map(item => `constraint:${item.key}`)];
  const resourceAssumptions = resources.flatMap(item => item.initialAssumption ? [item.initialAssumption] : []);
  const allAssumptions = [...resourceAssumptions, ...rows.flatMap(row => row.assumptions)];
  const confirmationKeys = [...allAssumptions.map(item => item.id), ...resources.map(item => `declared:${item.id}`), ...rows.map(item => item.rule.id), "baseline", ...paths.map(item => item.id)];
  const allReviewed = source !== null && sourceKeys.every(key => sourceChecks.includes(key));
  const allConfirmed = confirmationKeys.every(key => confirmed.includes(key));
  const resetConfirmations = () => { setConfirmed([]); setSymbolic(false); };
  const toggle = (list: string[], key: string, value: boolean) => value ? [...list.filter(item => item !== key), key] : list.filter(item => item !== key);
  const showRun = useCallback((record: B3Record) => setResults(current => [record, ...current.filter(item => item.id !== record.id)].slice(0, 2)), []);

  const loadSource = useCallback(async (nextHorizon: LifeClimateB3Horizon) => {
    const sequence = ++sourceSequence.current;
    setLoading(true); setSource(null); setSourceChecks([]); setConfirmed([]); setSymbolic(false);
    try {
      const envelope = await readB3(`/api/life-climate/b3/source?horizon=${nextHorizon}`);
      const next = sourceSchema.parse(envelope.source);
      if (await createLifeClimateB3SourceContext(next.view) !== next.sourceContext) throw new Error("资料冻结标识不一致，请重新读取。");
      if (next.symbolic && next.symbolic.horizon !== nextHorizon) throw new Error("象征参考时间范围不一致，请重试。");
      if (sequence === sourceSequence.current) { setSource(next); setResources(profileResources(next)); }
    } catch (error) { if (sequence === sourceSequence.current) setMessage(safeMessage(error)); }
    finally { if (sequence === sourceSequence.current) setLoading(false); }
  }, []);
  const recoverIntent = useCallback((intent: B3Intent) => {
    if (intent.status === "pending") {
      pendingLock.current = true;
      pendingText.current = canonicalLifeClimateB3Json(intent.originalBody);
      setPending(intent.originalBody);
      setMessage("已从账户恢复服务端登记的原请求。表单已锁定，只能核对或重试同一份请求。");
    } else if (intent.receipt?.status === "completed") {
      showRun(intent.receipt.run);
      setMessage("已读取服务端完成回执，原历史结果保持冻结。");
    } else if (intent.receipt?.status === "rejected") setMessage("该请求已被服务端明确拒绝，未建立对照；请重新核对资料和条件。");
  }, [showRun]);
  const loadAccount = useCallback(async () => {
    const sequence = ++accountSequence.current;
    setRecoveryReady(false);
    try {
      const envelope = await readB3("/api/life-climate/b3/intents?limit=20");
      const next = z.array(intentSchema).parse(envelope.items);
      if (sequence !== accountSequence.current) return;
      setIntents(next); setRecoveryReady(true);
      const outstanding = next.find(item => item.status === "pending");
      if (outstanding && !pendingLock.current) recoverIntent(outstanding);
      const completed = await readB3("/api/life-climate/b3/runs?limit=20");
      if (sequence !== accountSequence.current) return;
      setHistory(z.array(runSchema).parse(completed.items));
    } catch (error) { setMessage(safeMessage(error)); }
  }, [recoverIntent]);
  useEffect(() => { const timer = window.setTimeout(() => { void loadSource("1_year"); void loadAccount(); }, 0); return () => window.clearTimeout(timer); }, [loadSource, loadAccount]);

  async function resolvePending(body: B3Body) {
    try {
      const envelope = await readB3(`/api/life-climate/b3/intents?key=${encodeURIComponent(body.idempotency_key)}`);
      const intent = intentSchema.parse(envelope.intent);
      if (canonicalLifeClimateB3Json(intent.originalBody) !== canonicalLifeClimateB3Json(body)) throw new Error("原请求核对不一致，仍保持锁定。");
      if (intent.receipt?.status === "completed") {
        if (!matchesReceipt(intent.receipt.run, body)) throw new Error("完成回执与原请求不符，仍保持锁定。");
        showRun(intent.receipt.run); releasePending(); setMessage("原请求已完成，已读取账户回执。"); void loadAccount();
      } else if (intent.receipt?.status === "rejected") {
        releasePending(); resetConfirmations(); setSourceChecks([]); setMessage("服务端已明确拒绝原请求，未生成对照。请重新读取并逐项核对后另建请求。"); void loadAccount();
      } else setMessage("原请求仍在服务端等待完成。保持原请求锁定，可以再次核对或精确重试。");
    } catch (error) { setMessage(`${safeMessage(error)} 原请求仍锁定；未在服务端登记成功的本地草稿不保证跨刷新恢复。`); }
  }
  function releasePending() { pendingLock.current = false; pendingText.current = null; setPending(null); }
  async function send(body: B3Body, text: string, firstDispatch = false) {
    if (sendingLock.current) return;
    sendingLock.current = true;
    setSending(true);
    try {
      const response = await fetch("/api/life-climate/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: text });
      const payload = await response.json().catch(() => null);
      const parsed = completedEnvelopeSchema.safeParse(payload);
      const notRegistered = firstDispatch && !response.ok && [409, 422].includes(response.status) && payload?.ok === false && payload.outcome === "not_registered" && payload.idempotency_key === body.idempotency_key && ["b3_source_stale", "current_seed_required", "reality_profile_required", "b3_unsupported_precision", "b3_symbolic_source_unavailable", "invalid_b3_request"].includes(payload.error_code) && payload.request_digest === await hashLifeClimateB3Value(body.request);
      if (notRegistered) {
        releasePending(); resetConfirmations(); setSourceChecks([]); setSource(null);
        setMessage("服务端已明确确认此请求未登记，未生成对照。请重新读取资料、检查精度或期限，并重新逐项确认。");
        return;
      }
      if (response.ok && parsed.success && matchesReceipt(parsed.data.run, body)) {
        showRun(parsed.data.run); releasePending(); setMessage("对照已保存；服务端完成回执与原请求一致。"); void loadAccount();
      } else {
        setMessage("提交结果尚未确认，保留原请求与原编号；编辑和来源刷新已锁定。");
        await resolvePending(body);
      }
    } catch { setMessage("连接中断，结果尚未确认。请保留此页，核对服务端登记或精确重试原请求；恢复登录也不会释放原请求。"); }
    finally { sendingLock.current = false; setSending(false); }
  }
  async function submit() {
    if (pendingLock.current || !source || sending) return;
    if (!recoveryReady || !allReviewed || !allConfirmed) { setMessage("请先完成账户恢复核对、全部资料复核，以及每项假设、规则和路径的独立确认。"); return; }
    if (paths.some(path => !path.label.trim()) || new Set(paths.map(path => path.label.trim())).size !== paths.length) { setMessage("请为每条选择填写不同的名称。"); return; }
    pendingLock.current = true;
    setPreparing(true);
    try {
      const profile = source.view.profile;
      const without = { version: LIFE_CLIMATE_B3_VERSION, horizon, periodUnit: horizon === "1_year" ? "quarter" as const : "year" as const, profileRevision: profile.revision, sourceContext: source.sourceContext,
        model: { resources: resources.map(({ initialAssumption: _assumption, ...item }) => { void _assumption; return item; }), assumptions: allAssumptions, constraintBindings: profile.worldInputs.constraints.map(item => ({ constraintKey: item.key, mode: "source_deadline" as const })), commonRules: rows.filter(row => row.path === "common").map(row => row.rule), alternatives: paths.map(path => ({ ...path, label: path.label.trim(), rules: rows.filter(row => row.path === path.id).map(row => row.rule) })) },
        symbolic: symbolic && source.symbolic ? { enabled: true as const, sourceContext: source.symbolic.sourceContext } : { enabled: false as const } };
      const request = lifeClimateB3RequestSchema.parse({ ...without, confirmation: { context: await createLifeClimateB3ConfirmationContext(without), assumptionIds: allAssumptions.map(item => item.id), ruleIds: rows.map(item => item.rule.id), pathIds: ["baseline", ...paths.map(path => path.id)], reviewedSource: true } });
      const body = bodySchema.parse({ idempotency_key: crypto.randomUUID(), request });
      pendingLock.current = true; pendingText.current = canonicalLifeClimateB3Json(body); setPending(body);
      await send(body, pendingText.current, true);
    } catch { releasePending(); setMessage("条件尚未满足保存合约。请核对数量、资料来源、各项确认及路径条件，未自动调整你的输入。"); }
    finally { setPreparing(false); }
  }
  function addRule() {
    if (!source) return;
    try {
      const built = makeRule(editor, source, horizon, editing === null ? rows.length : rows[editing].rule.order, resources);
      if (editing !== null) {
        const old = rows[editing].rule;
        built.rule.id = old.id;
        if (old.kind === "investment_cycle" && built.rule.kind === "investment_cycle") built.rule.investmentId = old.investmentId;
      }
      const row = { ...built, editor: structuredClone(editor), path: editor.path };
      setRows(current => editing === null ? [...current, row] : current.map((item, i) => i === editing ? row : item));
      setEditing(null); setEditor(blankEditor()); resetConfirmations(); setMessage("条件已加入草稿；全部假设、规则与路径需要重新确认。");
    } catch (error) { setMessage(safeMessage(error)); }
  }
  function removeRule(index: number) {
    const removing = new Set([rows[index].rule.id]);
    let changed = true;
    while (changed) { changed = false; for (const row of rows) if (!removing.has(row.rule.id) && row.rule.guard?.all.some(guard => guard.kind === "rule_executed" ? removing.has(guard.ruleId) : guard.kind === "investment_at_least" && rows.some(item => removing.has(item.rule.id) && item.rule.kind === "investment_cycle" && item.rule.investmentId === guard.investmentId))) { removing.add(row.rule.id); changed = true; } }
    if (!window.confirm(`将移除以下条件及其依赖：${rows.filter(row => removing.has(row.rule.id)).map(row => row.rule.label).join("、")}。是否继续？`)) return;
    setRows(current => current.filter(row => !removing.has(row.rule.id)).map((row, order) => ({ ...row, rule: { ...row.rule, order } }))); setEditing(null); setEditor(blankEditor()); resetConfirmations();
  }
  function changeHorizon(value: LifeClimateB3Horizon) {
    if (rows.length && !window.confirm("切换时间范围会清空所有条件、逐期数量及确认；季度数量不会被默认为年率。是否重新填写？")) return;
    setHorizon(value); setRows([]); setEditor(blankEditor()); setEditing(null); resetConfirmations(); void loadSource(value);
  }
  return <div className="mx-auto w-full max-w-6xl space-y-7 py-8 text-[var(--text-primary)]">
    <header className="space-y-4"><h1 className="text-3xl font-semibold">多领域人生结构对照</h1><p className="max-w-prose text-sm leading-7 text-[var(--text-secondary)]">把六个人生领域放在同一张条件地图里，比较一年、三年或五年的不同选择。完整冻结资料、明确的数量和规则共同决定模拟轨迹，不生成确定预言或现实概率。</p><ButtonLink variant="secondary" href="/app/new/life-climate">返回原有单领域对照与历史</ButtonLink></header>
    <p role="status" aria-live="polite" className="max-w-prose text-sm leading-7 text-[var(--evidence-gold)]">{message || "草稿不会自动提交。先读取账户中已登记请求，再配置新对照。"}</p>
    <section aria-label="账户请求恢复" className="border-y border-white/15 py-5"><h2 className="text-xl font-semibold">已登记请求与恢复</h2><p className="mt-3 max-w-prose text-sm leading-7 text-[var(--text-secondary)]">只从服务器恢复已登记的原请求；未登记成功的本地草稿不能保证跨刷新恢复。登录变化后可重新读取，不会自动重发。</p><Button type="button" variant="secondary" className="mt-4" disabled={sending} onClick={() => void loadAccount()}>重新读取账户请求</Button>{!recoveryReady && <p className="mt-3 text-sm">账户请求尚未核对，不能提交新对照。</p>}{intents.map((intent, index) => <div key={intent.id} className="mt-4 flex flex-wrap items-center gap-3 text-sm"><span>账户请求 {index + 1} · {intent.status === "pending" ? "待核对" : intent.status === "completed" ? "已完成" : "已拒绝"}</span><Button type="button" variant="secondary" disabled={sending || pending !== null && pending.idempotency_key !== intent.originalBody.idempotency_key} onClick={() => recoverIntent(intent)}>读取该请求状态</Button></div>)}{pending && <div className="mt-5 space-y-3"><p className="text-sm leading-7">原请求已锁定：{pending.request.horizon === "1_year" ? "一年" : pending.request.horizon === "3_years" ? "三年" : "五年"}，{pending.request.model.alternatives.map(path => path.label).join(" / ")}；{pending.request.model.assumptions.length} 项数量或状态假设。</p><div className="flex flex-wrap gap-3"><Button type="button" variant="secondary" disabled={sending} onClick={() => void resolvePending(pending)}>核对原请求的服务端回执</Button><Button type="button" variant="accent" disabled={sending} onClick={() => void send(pending, pendingText.current ?? canonicalLifeClimateB3Json(pending))}>{sending ? "正在核对原请求" : "精确重试原请求"}</Button></div></div>}</section>
    <fieldset disabled={locked} className="min-w-0 space-y-7">
      <Field label="推演时间范围"><select aria-label="推演时间范围" className={control} value={horizon} onChange={event => changeHorizon(event.target.value as LifeClimateB3Horizon)}><option value="1_year">一年 · 四个季度</option><option value="3_years">三年 · 三个年度</option><option value="5_years">五年 · 五个年度</option></select></Field>
      <p className="text-sm leading-7 text-[var(--text-secondary)]">所有逐期数量按当前{horizon === "1_year" ? "季度" : "年度"}填写。原 Profile 的每次受控行动变化量不会当作年率或资源再生。</p>
      <Button type="button" variant="secondary" disabled={loading} onClick={() => { if (!rows.length || window.confirm("重新读取来源将清空条件与确认，以免把旧规则绑定到新资料。是否继续？")) { setRows([]); setEditing(null); setEditor(blankEditor()); void loadSource(horizon); } }}>重新读取当前资料</Button>
      {loading && <p className="text-sm" aria-busy="true">正在读取冻结资料与期限…</p>}
      {!source && !loading && <div className="space-y-3"><p className="text-sm leading-7">当前资料尚不可用。请确认已登录、已提交正式处境并保存现实资料。</p><ButtonLink href="/login" variant="secondary">前往登录</ButtonLink><ButtonLink href="/app/reality-profile" variant="secondary">检查现实资料</ButtonLink></div>}
      {source && <>
        <section aria-label="完整资料冻结复核" className="space-y-4"><h2 className="text-2xl font-semibold">核对完整十四维起点</h2><p className="max-w-prose text-sm leading-7 text-[var(--text-secondary)]">资料版本 {source.view.profile.revision}。每个事实、假设和未知都要复核；期限照原样保留，不会忽略或自动延长。</p>{entries.map(item => <div key={item.key} className="border-t border-white/10 py-3"><p className="text-sm leading-7"><strong>{item.label}</strong>：{item.field.classification === "unknown" ? "明确未知" : item.field.value}（{item.field.classification === "fact" ? "事实" : item.field.classification === "assumption" ? "假设" : "未知"}）</p><p className="mt-1 text-sm text-[var(--text-secondary)]">来源摘要：{item.field.evidenceSummary}</p><Check label={`已复核：${item.label}`} checked={sourceChecks.includes(item.key)} onChange={value => setSourceChecks(toggle(sourceChecks, item.key, value))} /></div>)}{source.view.profile.worldInputs.resources.map(item => <div key={item.key} className="border-t border-white/10 py-3"><p className="text-sm leading-7">{item.label}：{item.available} {item.unit}，下界 {item.minimum}，上界 {item.maximum}。只使用冻结存量，不推断补给。</p><Check label={`已复核资源：${item.label}`} checked={sourceChecks.includes(`resource:${item.key}`)} onChange={value => setSourceChecks(toggle(sourceChecks, `resource:${item.key}`, value))} /></div>)}{source.view.profile.worldInputs.constraints.map(item => <div key={item.key} className="border-t border-white/10 py-3"><p className="text-sm leading-7">{item.label} · 原截止时间：{item.rule.value}。截止落在阶段内时可行性保持未知，截止后受限。</p><Check label={`保留原期限：${item.label}`} checked={sourceChecks.includes(`constraint:${item.key}`)} onChange={value => setSourceChecks(toggle(sourceChecks, `constraint:${item.key}`, value))} /></div>)}<p className="text-sm">已核对 {sourceChecks.filter(key => sourceKeys.includes(key)).length} / {sourceKeys.length} 项</p></section>
        <section className="space-y-4 border-t border-white/15 pt-6"><h2 className="text-2xl font-semibold">为不同选择命名</h2><p className="max-w-prose text-sm leading-7">不增加新变化条件的对照会保留共同条件；这不表示现实不变。至少两条选择可包含多个领域的条件，并排比较而不选出唯一答案。</p>{paths.map((path, index) => <Field key={path.id} label={`选择 ${index + 1} 名称`}><input aria-label={`选择 ${index + 1} 名称`} className={control} maxLength={80} value={path.label} onChange={event => { setPaths(paths.map(item => item.id === path.id ? { ...item, label: event.target.value } : item)); resetConfirmations(); }} /></Field>)}</section>
        <ResourceEditor resources={resources} change={value => { setResources(value); resetConfirmations(); }} />
        {resources.map(item => <Check key={item.id} label={`确认资源起点与上下界：${item.label}`} checked={confirmed.includes(`declared:${item.id}`)} onChange={value => setConfirmed(toggle(confirmed, `declared:${item.id}`, value))} />)}
        {resourceAssumptions.map(item => <Check key={item.id} label={`确认独立资源数量假设：${item.label} = ${item.value ?? "未知"}`} checked={confirmed.includes(item.id)} onChange={value => setConfirmed(toggle(confirmed, item.id, value))} />)}
        <RuleEditor editor={editor} update={setEditor} source={source} horizon={horizon} paths={paths} rules={rows} resources={resources} add={addRule} />
        <section aria-label="条件与独立确认" className="space-y-4"><h2 className="text-2xl font-semibold">逐项确认你声明的条件</h2>{rows.length === 0 && <p className="text-sm leading-7">还没有加入条件。可先声明共同补给与义务，再为各条选择加入差异。未填写的数量保持未知。</p>}{rows.map((row, index) => <div key={row.rule.id} className="space-y-3 border-t border-white/10 pt-4"><h3 className="font-semibold">{index + 1}. {row.rule.label} · {row.path === "common" ? "所有路径共同条件" : paths.find(item => item.id === row.path)?.label}</h3><p className="text-sm text-[var(--text-secondary)]">{ruleNames[row.rule.kind]} · {row.rule.stages.map(stage => stageName(horizon, stage)).join("、")}</p>{row.assumptions.map(item => <Check key={item.id} label={`确认假设：${item.label} = ${item.value ?? "明确未知"}${item.kind === "quantity" ? ` ${item.unit} / ${item.periodUnit === "once" ? "一次" : item.periodUnit === "quarter" ? "季度" : "年"}` : ""}`} checked={confirmed.includes(item.id)} onChange={value => setConfirmed(toggle(confirmed, item.id, value))} />)}<Check label={`确认规则：${row.rule.label}`} checked={confirmed.includes(row.rule.id)} onChange={value => setConfirmed(toggle(confirmed, row.rule.id, value))} /><div className="flex flex-wrap gap-3"><Button type="button" variant="secondary" onClick={() => { setEditor(structuredClone(row.editor)); setEditing(index); resetConfirmations(); }}>修改这项条件</Button><Button type="button" variant="secondary" onClick={() => removeRule(index)}>移除此条件及依赖</Button>{index > 0 && <Button type="button" variant="secondary" onClick={() => { setRows(current => { const next = [...current]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next.map((item, order) => ({ ...item, rule: { ...item.rule, order } })); }); resetConfirmations(); }}>提前此条件顺序</Button>}</div></div>)}<Check label="确认对照：不增加新变化条件的对照" checked={confirmed.includes("baseline")} onChange={value => setConfirmed(toggle(confirmed, "baseline", value))} />{paths.map(path => <Check key={path.id} label={`确认路径：${path.label}`} checked={confirmed.includes(path.id)} onChange={value => setConfirmed(toggle(confirmed, path.id, value))} />)}</section>
        <section className="border-t border-white/15 pt-5"><h2 className="text-xl font-semibold">可选的独立象征参考</h2><p className="mt-3 max-w-prose text-sm leading-7">默认关闭。它只使用已有来源为未来各粗期独立计算参考系列，不进入资源数值、规则执行或事件依据；不呈现生日原文或精确事件预言。</p>{source.symbolic ? <Check label="我单独授权本次对照附加象征参考镜头" checked={symbolic} onChange={value => { setSymbolic(value); setConfirmed([]); }} /> : <p className="mt-3 text-sm text-[var(--text-secondary)]">没有可用的已授权来源，象征参考保持未知。</p>}</section>
        <Button type="button" variant="accent" disabled={!allReviewed || !allConfirmed || !recoveryReady || editing !== null || rows.length === 0} onClick={() => void submit()}>登记并保存多领域对照</Button>
      </>}
    </fieldset>
    <section aria-label="B3独立历史" className="space-y-4 border-t border-white/15 pt-6"><h2 className="text-2xl font-semibold">已保存的多领域对照</h2><p className="text-sm leading-7 text-[var(--text-secondary)]">本区只读取多领域记录；原有单领域历史仍在原入口。可同时打开两条历史，分别查看各自冻结的事件依据。</p>{history.map((record, index) => <Button key={record.id} type="button" variant="secondary" onClick={() => showRun(record)}>打开多领域历史 {index + 1}</Button>)}</section>
    {results.map(record => <B3Result key={record.id} record={record} />)}
  </div>;
}
