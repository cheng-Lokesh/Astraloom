"use client";

export type EvidenceType = "reality" | "event" | "edge_shift" | "agent_state" | "symbolic_lens";

interface EvidenceChipProps {
  type: EvidenceType;
  id: string;
  summary: string;
  tickIndex?: number;
  onClick?: () => void;
  active?: boolean;
}

const badgeStyles = {
  reality: { label: "现实事实", bg: "bg-slate-800/80 hover:bg-slate-700/80", border: "border-slate-500/50", text: "text-slate-100", dot: "bg-slate-300" },
  event: { label: "沙盘事件", bg: "bg-amber-950/40 hover:bg-amber-900/50", border: "border-amber-700/50", text: "text-amber-200", dot: "bg-amber-400" },
  edge_shift: { label: "关系边异动", bg: "bg-rose-950/40 hover:bg-rose-900/50", border: "border-rose-700/50", text: "text-rose-200", dot: "bg-rose-400" },
  symbolic_lens: { label: "象征透镜风向", bg: "bg-purple-950/40 hover:bg-purple-900/50", border: "border-purple-700/50", text: "text-purple-200", dot: "bg-purple-400" },
  agent_state: { label: "个体状态", bg: "bg-sky-950/40 hover:bg-sky-900/50", border: "border-sky-700/50", text: "text-sky-200", dot: "bg-sky-400" },
} as const;

export function EvidenceChip({ type, id, summary, tickIndex, onClick, active = false }: EvidenceChipProps) {
  const style = badgeStyles[type];
  const label = type === "event" && tickIndex !== undefined ? `Tick ${tickIndex} 事件` : style.label;

  return (
    <button type="button" onClick={onClick} className={`inline-flex min-h-10 items-center gap-1.5 rounded-md border px-2.5 py-1 text-left font-sans text-xs transition-[background-color,box-shadow,transform] active:scale-95 ${style.bg} ${style.border} ${style.text} ${active ? "ring-2 ring-amber-400/80 ring-offset-1 ring-offset-slate-950" : ""}`} title={`证据凭证 [${id}]: 点击在沙盘图谱中回放定位`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot} animate-pulse`} />
      <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">[{label}]</span>
      <span className="max-w-[180px] truncate">{summary}</span>
    </button>
  );
}
