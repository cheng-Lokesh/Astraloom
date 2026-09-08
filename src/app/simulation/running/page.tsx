"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ObservatoryShell } from "@/components/astraloom/ObservatoryShell";

const stages = [
  { id: "freeze", label: "冻结种子上下文 (Seed Context Frozen)" },
  { id: "persona", label: "个体智能体实例化 (Persona Factory Compilation)" },
  { id: "topology", label: "拓扑关系图谱快照固化 (Graph Topology Snapshot)" },
  { id: "ticks", label: "沙盘微循环推演 (Simulation Tick Execution)" },
  { id: "ledger", label: "事件事实账本归档 (Event Log Ledger Compiled)" },
  { id: "report", label: "证据链契约审查与安全审计 (Schema & Safety Guard)" },
];

const traceMessages = [
  "[INIT] 已锁定 Track A · 90 天窗口与行动边界",
  "[AGENT] 已实例化主本位、平行分身与关键个体",
  "[GRAPH] 已固化只读拓扑快照并记录证据缺口",
  "[TICK] 正在执行 baseline、cautious_self、decisive_self 分支",
  "[LEDGER] 已建立模拟事件与关系变化的分离账本",
  "[GUARD] 已完成 Claim 到 Event 的证据引用检查",
];

export default function SimulationRunningPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timers = stages.slice(1).map((_, index) => window.setTimeout(() => setCurrent(index + 1), (index + 1) * 700));
    const complete = window.setTimeout(() => router.push("/simulation/result"), stages.length * 700 + 700);
    return () => { timers.forEach(window.clearTimeout); window.clearTimeout(complete); };
  }, [router]);

  return <ObservatoryShell title="沙盘运行中 (Simulation Runtime)" stage={`执行阶段 ${current + 1} / ${stages.length}`}><div className="mx-auto max-w-3xl space-y-6"><div className="text-center"><div className="mx-auto h-3 w-3 rounded-full bg-amber-400 animate-pulse" /><h1 className="mt-4 text-2xl font-bold">正在运行可复现的数字生命微循环</h1><p className="mt-2 text-sm text-slate-400">运行期间无需做连续剧情选择。完成后将打开只读结果控制台。</p></div><ol className="space-y-2">{stages.map((stage, index) => { const done = index < current; const active = index === current; return <li key={stage.id} className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 ${active ? "border-amber-500/60 bg-amber-950/20" : done ? "border-emerald-900/40 bg-emerald-950/10" : "border-observatory-subtle bg-observatory-surface"}`}><span className={`grid h-7 w-7 place-items-center rounded-full font-mono text-xs ${done ? "bg-emerald-500 text-slate-950" : active ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-500"}`}>{done ? "✓" : index + 1}</span><span className={active ? "text-slate-100" : "text-slate-400"}>{stage.label}</span></li>; })}</ol><div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-7 text-slate-400" aria-live="polite">{traceMessages.slice(0, current + 1).map((message, index) => <p key={message}><span className="mr-2 text-slate-600 tabular-nums">00:0{index}.{index * 17 + 12}</span>{message}</p>)}</div><button type="button" onClick={() => router.push("/simulation/result")} className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 active:scale-[0.99]">跳过动画，打开已生成的演示结果</button></div></ObservatoryShell>;
}
