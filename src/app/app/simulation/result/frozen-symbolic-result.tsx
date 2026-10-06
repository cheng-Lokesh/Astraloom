import type { SymbolicFrame } from "@/lib/formal-symbolic-lens/frame";

type FrozenLens = {
  status: "attached" | "not_configured" | "not_authorized" | "stale" | "withdrawn" | "not_recorded";
  frozenAt: string | null;
  preferenceRevision: number | null;
  frame: SymbolicFrame | null;
  causalUse: false;
};
const absence = {
  not_recorded: "当时未保存个人象征框架。",
  not_configured: "当时尚未配置象征框架。",
  not_authorized: "当时未授权新运行保存象征对照。",
  stale: "当时的框架属于旧参考时期，未附加本次运行。",
  withdrawn: "当时已撤回授权，未附加本次运行。",
} as const;

/** Display the Run's immutable projection only; never load current preferences here. */
export function FrozenSymbolicResult({ lens }: { lens?: FrozenLens }) {
  const frame = lens?.status === "attached" && lens.causalUse === false ? lens.frame : null;
  const message = !lens ? absence.not_recorded : lens.status === "attached" ? "本次象征对照资料不可用。" : absence[lens.status];
  return <section data-frozen-symbolic aria-labelledby="frozen-symbolic-title" className="mt-8 min-w-0 border-y border-white/15 py-6">
    <h2 id="frozen-symbolic-title" className="text-xl font-semibold text-[var(--text-primary)]">本次冻结的象征对照</h2>
    <p className="mt-3 max-w-prose text-sm leading-7 text-[var(--text-secondary)]">独立的非因果象征对照，与现实资料分别阅读。不参与人物行动、世界状态、事件证据、结论或模拟频率；尚未融合初始倾向，不提供预测或现实概率。</p>
    {frame ? <>
      <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">已附加五维框架 · 只读冻结记录</p>
      <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">参考时期：{frame.referencePeriod.key}（北京时间） · 参考日期：{frame.referencePeriod.referenceDate}。此处保留本次运行开始时的框架，不会随当前月份或配置更新。</p>
      <dl className="mt-4 divide-y divide-white/10">{frame.dimensions.map(dimension => <div key={dimension.key} data-frozen-symbolic-dimension className="grid min-w-0 gap-2 py-4 sm:grid-cols-[11rem_minmax(0,1fr)]">
        <dt className="text-sm font-semibold text-[var(--text-primary)]">{dimension.label}</dt>
        <dd className="min-w-0 break-words"><p className="text-sm text-[var(--text-primary)]">{dimension.value}</p><p className="mt-1 max-w-prose text-sm leading-7 text-[var(--text-secondary)]">{dimension.summary}</p>{dimension.limitations.map((item, index) => <p key={index} className="mt-1 text-sm leading-7 text-[var(--text-secondary)]">限制：{item}</p>)}</dd>
      </div>)}</dl>
      <details className="mt-4"><summary className="min-h-11 cursor-pointer py-3 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--evidence-gold)]">查看冻结来源与计算限制</summary>
        <p className="break-words text-sm leading-7 text-[var(--text-secondary)]">来源版本：{frame.sourceVersion} · 授权版本：{lens?.preferenceRevision ?? "未记录"} · 规则版本：{frame.ruleVersion} · 计算版本：{frame.calculation.calculationVersion}</p>
        <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">精度：{frame.calculation.precision === "date_only" ? "出生时刻未知，使用三柱近似结构" : "使用日期与民用时刻的四柱近似结构"}。使用近似节气边界，未做出生时区或真太阳时修正。</p>
        {lens?.frozenAt ? <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">冻结保存时间：{new Date(lens.frozenAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}（北京时间）。这是保存时间，不是事件预测日期。</p> : null}
        <ul className="mt-3 max-w-prose space-y-2 text-sm leading-7 text-[var(--text-secondary)]">{frame.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul>
      </details>
    </> : <p className="mt-4 max-w-prose text-sm leading-7 text-[var(--text-secondary)]">{message}不会用当前配置补写本次运行。</p>}
  </section>;
}
