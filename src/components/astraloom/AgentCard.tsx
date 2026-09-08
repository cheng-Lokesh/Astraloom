"use client";

export type AgentType = "user_core" | "user_variant" | "npc";

export interface AgentProfileData {
  agentId: string;
  agentType: AgentType;
  displayName: string;
  roleLabel: string;
  confidence: number;
  psychology: { conflictStyle: "avoidant" | "direct" | "strategic" | "impulsive"; riskTolerance: number };
  motivation: { primaryGoal: string; fear: string };
  resources: { authority: number; socialCapital: number };
  currentStress: number;
  frozenAt?: string;
}

interface AgentCardProps {
  agent: AgentProfileData;
  isFocused?: boolean;
  onFocus?: (agentId: string) => void;
}

export function AgentCard({ agent, isFocused = false, onFocus }: AgentCardProps) {
  const meta = agent.agentType === "user_core"
    ? { label: "用户本位分身 (Main Self)", border: "border-slate-400/60", badge: "bg-slate-100 text-slate-950", ring: "ring-slate-300" }
    : agent.agentType === "user_variant"
      ? { label: "平行分身 (Variant)", border: "border-amber-600/60", badge: "border border-amber-500/40 bg-amber-400/20 text-amber-300", ring: "ring-amber-400" }
      : { label: `关键个体 · ${agent.roleLabel}`, border: "border-observatory-subtle", badge: "border border-slate-700 bg-slate-800 text-slate-300", ring: "ring-sky-400" };

  return (
    <button type="button" onClick={() => onFocus?.(agent.agentId)} className={`w-full rounded-xl border bg-observatory-surface p-4 text-left font-sans transition-[background-color,border-color,box-shadow,transform] active:scale-[0.99] ${meta.border} ${isFocused ? `ring-2 ${meta.ring} bg-observatory-raised` : "hover:border-slate-600 hover:bg-observatory-raised/50"}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h4 className="truncate text-base font-semibold text-slate-100">{agent.displayName}</h4>
          <span className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] ${meta.badge}`}>{meta.label}</span>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-slate-500 tabular-nums" title="人物置信度">置信度 {agent.confidence}%</span>
      </div>
      <div className="my-2.5 space-y-1.5 border-y border-slate-800/80 py-2 text-xs">
        <div className="flex items-baseline gap-2"><span className="w-14 shrink-0 text-[11px] font-medium text-slate-500">核心目标:</span><span className="truncate text-slate-200">{agent.motivation.primaryGoal}</span></div>
        <div className="flex items-baseline gap-2"><span className="w-14 shrink-0 text-[11px] font-medium text-slate-500">核心回避:</span><span className="truncate text-slate-300">{agent.motivation.fear}</span></div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
        <Metric label="当前压力" value={agent.currentStress} tone={agent.currentStress > 70 ? "bg-rose-500" : "bg-sky-500"} />
        <Metric label="话语权/影响力" value={agent.resources.authority} tone="bg-amber-500" />
      </div>
    </button>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  const normalized = Math.min(Math.max(value, 0), 100);
  return <div><div className="mb-1 flex justify-between text-[11px] text-slate-400"><span>{label}</span><span className="font-mono text-slate-200 tabular-nums">{normalized}%</span></div><div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900"><div className={`h-full ${tone}`} style={{ width: `${normalized}%` }} /></div></div>;
}
