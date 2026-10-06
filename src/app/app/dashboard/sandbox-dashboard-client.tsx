"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { SandboxOverview } from "@/lib/sandbox-overview/overview.server";
import { DashboardSymbolicSummary } from "./symbolic-summary";

type Load = { phase: "loading" } | { phase: "error"; message: string } | { phase: "ready"; overview: SandboxOverview };
const action: Record<SandboxOverview["nextAction"]["kind"], string> = {
  sign_in: "登录后查看我的沙盘", start_intake: "从现实情况开始", review_people: "确认关键人物", build_agents: "建立数字分身", review_graph: "查看关系网络", start_run: "开始正式 Run", start_next_run: "开始下一次 Run", open_running: "打开进行中的 Run", open_latest_result: "打开最近完成的结果",
};
const memberKindLabel: Record<SandboxOverview["people"]["items"][number]["kind"], string> = {
  user_core: "本人",
  user_variant: "平行自我",
  npc: "关键人物",
};

export function SandboxDashboardClient() {
  const [load, setLoad] = useState<Load>({ phase: "loading" });
  useEffect(() => {
    let live = true;
    void fetch("/api/sandbox-overview", { cache: "no-store" }).then(async response => {
      const body = await response.json().catch(() => null) as { ok?: boolean; error_code?: string; overview?: SandboxOverview } | null;
      if (!response.ok || !body?.ok || !body.overview) throw new Error(body?.error_code ?? "unavailable");
      if (live) setLoad({ phase: "ready", overview: body.overview });
    }).catch((error: unknown) => { if (live) setLoad({ phase: "error", message: error instanceof Error ? error.message : "unavailable" }); });
    return () => { live = false; };
  }, []);
  if (load.phase === "loading") return <main id="main-content" className="mx-auto w-full max-w-6xl py-12"><p role="status" className="font-mono text-xs uppercase tracking-[.14em] text-[var(--evidence-gold)]">读取账户账本</p><div className="mt-6 h-28 animate-pulse bg-white/[.035]" /></main>;
  if (load.phase === "error") return <main id="main-content" className="mx-auto w-full max-w-6xl py-12"><p role="alert" className="font-mono text-xs uppercase tracking-[.14em] text-[var(--risk-red)]">无法读取账户状态</p><h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">未显示任何推断状态</h1><p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">请刷新页面，或稍后重试。状态代码：{load.message}</p></main>;
  return <SandboxLedger overview={load.overview} />;
}

export function SandboxLedger({ overview }: { overview: SandboxOverview }) {
  const done = overview.latestCompletedRun;
  const memberNameByKey = new Map(overview.people.items.map(item => [item.key, item.label] as const));
  return <main id="main-content" className="mx-auto w-full max-w-6xl overflow-x-hidden py-7 sm:py-12"><section className="space-y-10">
    <header className="border-b border-white/10 pb-9"><p className="font-mono text-xs uppercase tracking-[.16em] text-[var(--evidence-gold)]"><span lang="en">My Sandbox</span> / 我的沙盘</p><h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.14] text-[var(--text-primary)] sm:text-6xl">你的个人数字生命，先从已保存的事实开始。</h1><p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[var(--text-secondary)]">这里只显示账户中已保存的正式链。没有权威模型支持的内容会明确保留为“尚未建模”。</p></header>
    <section aria-labelledby="chain-title"><Header id="chain-title" eyebrow="已保存的正式链" title="我的数字分身与关系网络" /><dl className="divide-y divide-white/10"><Row label="正式 Reality / Seed" value={overview.seed.state === "submitted" ? "已提交" : "尚未开始"} detail={overview.seed.state === "submitted" ? "生活气候、资源与限制可逐项复核" : "提交正式 Seed 后开始填写"} tone={overview.seed.state === "submitted" ? "verified" : "muted"} /><Row label="关键人物" value={`${overview.people.confirmedCount}`} detail="已确认人物" tone={overview.people.confirmedCount ? "verified" : "muted"} /><Row label="数字生命成员" value={`${overview.agents.immutableCount}`} detail="本人、平行自我与关键人物" tone={overview.agents.immutableCount ? "verified" : "muted"} /><Row label="关系网络" value={overview.graph.exists ? (overview.graph.locked ? "已锁定" : "待审阅") : "尚未建立"} detail={overview.graph.exists ? `${overview.graph.edgeCount} 条关系边` : "没有从演示数据补全"} tone={overview.graph.locked ? "verified" : overview.graph.exists ? "gold" : "muted"} /></dl><div className="mt-7 grid gap-8 md:grid-cols-2"><SummaryList title="数字生命成员" empty="当前链尚无数字生命成员" items={overview.people.items.map(item => ({ key: item.key, primary: item.label, secondary: `${memberKindLabel[item.kind]} · ${item.relationship}` }))} /><SummaryList title="当前关系" empty="当前链尚无可显示关系" items={overview.relations.items.map(item => ({ key: item.key, primary: item.label, secondary: `${memberNameByKey.get(item.fromPersonKey) ?? "当前成员"} → ${memberNameByKey.get(item.toPersonKey) ?? "当前成员"}` }))} /></div></section>
<section aria-labelledby="reality-world-title" className="grid gap-8 border-y border-white/10 py-7 lg:grid-cols-2"><div><CurrentReality overview={overview} /><Header id="reality-world-title" eyebrow="Reality Profile" title="现实资料账本" /><p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">目标与价值观记录个人方向，人生主题与压力记录已确认的处境，外部变量记录环境因素；这些维度只按你的输入补全。</p><RealityDimensionList items={overview.reality.dimensions} /><LedgerSection label="事实" items={overview.reality.facts} empty="尚无可显示的账户事实" /><LedgerSection label="假设" items={overview.reality.assumptions} empty="当前没有被当作事实呈现的账户假设" /><LedgerSection label="未知项" items={overview.reality.unknowns.map(item => ({ ...item, evidenceSummary: "明确未知" }))} empty="" /><Link href="/app/reality-profile" className="mt-4 inline-flex min-h-11 items-center border border-white/15 px-4 text-sm font-semibold text-[var(--text-primary)]">编辑并复核资料</Link></div><div><Header id="world-title" eyebrow="World State" title="世界状态与变化节点" /><p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{overview.resources.state === "saved_profile" ? `来源：当前已保存的现实资料 · 资料版本：${overview.resources.profileRevision}。` : ""}当前状态：{worldStateLabel(overview.world.state)}。下列资料逐项标明事实、假设或未知，只对应当前正式链、锁定关系网络和正式运行事件。</p><LedgerSection label="资源" items={overview.resources.state === "saved_profile" ? overview.resources.items : overview.world.resources} empty="尚无已复核的资源资料" /><LedgerSection label="限制" items={overview.constraints.state === "saved_profile" ? overview.constraints.items : overview.world.constraints} empty="尚无已复核的限制资料" /><LedgerSection label="目标" items={overview.world.goals} empty="尚无用户确认的目标" /><LedgerSection label="价值观" items={overview.world.values} empty="尚无用户确认的价值观" /><LedgerSection label="人生主题" items={overview.world.lifeThemes} empty="尚无用户确认的人生主题" /><LedgerSection label="压力" items={overview.world.pressures} empty="尚无用户确认的压力资料" /><LedgerSection label="外部变量" items={overview.world.externalVariables} empty="尚无用户确认的外部变量" /><LedgerSection label="模拟中出现的变化" items={overview.world.changeNodes} empty="尚无当前正式运行的事件节点，因此不会补造变化。" /></div></section>
    <section aria-labelledby="runs-title" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]"><div><Header id="runs-title" eyebrow="运行与记录" title="沙盘的当前位置" /><dl className="divide-y divide-white/10"><Row label="运行中" value={overview.running.exists ? "有进行中的 Run" : "暂无"} detail={overview.running.exists ? "状态由服务端确认" : ""} tone={overview.running.exists ? "gold" : "muted"} /><Row label="最近完成" value={done ? "已完成" : "暂无已完成 Run"} detail={done ? new Date(done.completedAt).toLocaleString() : ""} tone={done ? "verified" : "muted"} /><Row label="历史" value={`${overview.history.count}`} detail="账户中的正式 Run" tone={overview.history.count ? "verified" : "muted"} /><Row label="最近反馈" value={overview.feedback.exists ? "已有反馈" : "暂无反馈"} detail="反馈只影响新的 Run" tone={overview.feedback.exists ? "verified" : "muted"} /></dl></div><aside className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><p className="font-mono text-[11px] uppercase tracking-[.14em] text-[var(--evidence-gold)]">唯一下一步</p><p className="mt-3 text-lg font-semibold leading-7 text-[var(--text-primary)]">{action[overview.nextAction.kind]}</p><p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">每次只给出与当前服务端链一致的一个动作。</p><Action overview={overview} /></aside></section>
    <section aria-labelledby="not-modeled-title" className="border-y border-white/10 py-7"><p className="font-mono text-[11px] uppercase tracking-[.14em] text-[var(--text-muted)]">模型边界</p><h2 id="not-modeled-title" className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">当前视图不推断</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{["现实变化历史", "资源变化轨迹", "未来状态转移", "外部变量影响"].map(label => <div key={label} className="border-t border-white/10 pt-3"><p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">目前没有当前正式链的已确认资料或受控事件支持。</p></div>)}</div></section>
    <DashboardSymbolicSummary />
  </section></main>;
}

function CurrentReality({ overview }: { overview: SandboxOverview }) {
  const climate = overview.lifeClimate;
  const deadlines = overview.nextChange;
  return <section aria-label="本人记录与现实观察" className="mb-7">
    <LedgerSection label="本人记录的现实近况" items={climate.state === "saved_profile" ? climate.items : []} empty="尚未填写，现实近况明确未知。" />
    <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">来源：本人填写的当前现实资料{climate.state === "saved_profile" ? ` · 资料版本：${climate.profileRevision}` : "尚未保存"}。这里只记录本人描述，不代表人生气候模型或未来预测。</p>
    <h3 className="mt-5 text-sm font-semibold text-[var(--text-primary)]">现实观察期限</h3>
    {deadlines.state === "recorded_deadlines" ? <>
      <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">来源：当前已保存的现实资料 · 资料版本：{deadlines.profileRevision} · 服务端核对时间：<time dateTime={deadlines.assessedAt}>{formatRealityTime(deadlines.assessedAt)}</time>。期限来自本人记录，到期后的实际结果仍需复核。</p>
      <p className="mt-2 text-sm leading-7 text-[var(--text-primary)]">下一项现实观察：{deadlines.upcoming[0]?.label ?? "没有尚未到期的已记录期限"}</p>
      <LedgerSection label="尚未到期" items={deadlines.upcoming} empty="没有尚未到期的已记录期限。" />
      <LedgerSection label="已到期，结果待核实" items={deadlines.expired} empty="没有已到期的已记录期限。" />
    </> : <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">尚未填写可观察的现实期限，下一次现实变化明确未知。</p>}
  </section>;
}

function RealityDimensionList({ items }: { items?: SandboxOverview["reality"]["dimensions"] }) {
  const dimensions = items ?? [];
  return <section aria-label="数字生命模型补全维度" className="mt-5 border-y border-white/10 py-4"><h3 className="text-sm font-semibold text-[var(--text-primary)]">数字生命模型维度</h3><ul className="mt-3 grid gap-3 sm:grid-cols-2">{dimensions.filter(item => ["目标", "价值观", "人生主题", "压力", "外部变量", "身份结构", "职业结构", "财富结构", "关系生态", "城市与生活环境", "人生阶段"].includes(item.label)).map(item => <li key={item.label} className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3"><span className="text-sm text-[var(--text-primary)]">{item.label}</span><span className="text-xs text-[var(--text-muted)]">{item.facts + item.assumptions === 0 && item.unknowns > 0 ? "明确未知" : `事实 ${item.facts} · 假设 ${item.assumptions} · 未知 ${item.unknowns}`}</span></li>)}</ul></section>;
}

function formatRealityTime(value: string) {
  const parts = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? "";
  return `${part("year")}年${part("month")}月${part("day")}日 ${part("hour")}:${part("minute")}（北京时间，UTC+8）`;
}

function SummaryList({ title, empty, items }: { title: string; empty: string; items: Array<{ key: string; primary: string; secondary: string }> }) { return <section aria-label={title} className="border-t border-white/10 pt-4"><h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>{items.length ? <ul className="mt-3 divide-y divide-white/10">{items.map(item => <li key={item.key} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto]"><span className="text-sm text-[var(--text-primary)]">{item.primary}</span><span className="font-mono text-xs text-[var(--text-muted)]">{item.secondary}</span></li>)}</ul> : <p className="mt-3 text-sm text-[var(--text-muted)]">{empty}</p>}</section>; }
function Header({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) { return <div className="border-b border-white/10 pb-4"><p className="font-mono text-[11px] uppercase tracking-[.14em] text-[var(--text-muted)]">{eyebrow}</p><h2 id={id} className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{title}</h2></div>; }
type LedgerDisplayItem = { label: string; evidenceSummary: string; classification?: "fact" | "assumption" | "unknown"; kind?: "structured_resource" | "structured_constraint"; available?: number; unit?: string; minimum?: number; maximum?: number; usePerTick?: number | null; resourceLabel?: string; deadline?: string };
function LedgerSection({ label, items, empty }: { label: string; items: LedgerDisplayItem[]; empty: string }) { const classLabel = { fact: "事实", assumption: "假设", unknown: "未知" } as const; return <section className="border-b border-white/10 py-4"><h3 className="text-sm font-semibold text-[var(--text-primary)]">{label}</h3>{items.length ? <ul className="mt-2 space-y-3">{items.map((item, index) => <li key={`${label}-${item.label}-${index}`}><p className="text-sm text-[var(--text-primary)]">{item.label}</p>{item.classification ? <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">分类：{classLabel[item.classification]}</p> : null}{item.kind === "structured_resource" ? <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">当前可用：{item.available} {item.unit} · 声明范围：{item.minimum}–{item.maximum} {item.unit} · 每周期使用：{item.usePerTick === null ? "未设置" : `${item.usePerTick} ${item.unit}`}</p> : null}{item.kind === "structured_constraint" ? <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">关联资源：{item.resourceLabel} · 截止时间：{item.deadline ? <time dateTime={item.deadline}>{formatRealityTime(item.deadline)}</time> : "未知"}</p> : null}<p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{item.evidenceSummary}</p></li>)}</ul> : <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{empty}</p>}</section>; }
function worldStateLabel(state: SandboxOverview["world"]["state"]) { return ({ not_started: "尚未开始", submitted: "等待确认关键人物", people_confirmed: "等待建立数字分身", agents_ready: "等待关系网络", locked_graph: "关系网络已锁定", running: "正式运行中", completed: "已有完成运行" } as const)[state]; }
function Action({ overview }: { overview: SandboxOverview }) { return <Link href={overview.nextAction.href} className="mt-5 inline-flex min-h-10 items-center justify-center rounded border border-white/15 px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-[transform,opacity] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)]">{action[overview.nextAction.kind]}</Link>; }
function Row({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "verified" | "gold" | "muted" }) { const color = tone === "verified" ? "text-[var(--verified-green)]" : tone === "gold" ? "text-[var(--evidence-gold)]" : "text-[var(--text-secondary)]"; return <div className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><dt className="text-sm font-semibold text-[var(--text-primary)]">{label}<span className="mt-1 block text-xs font-normal leading-5 text-[var(--text-muted)]">{detail}</span></dt><dd className={`font-mono text-sm tabular-nums ${color}`}>{value}</dd></div>; }
