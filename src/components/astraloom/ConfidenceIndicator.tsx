"use client";

export type ConfidenceLabel = "high_confidence" | "probable_trend" | "weak_signal" | "insufficient_evidence";

interface ConfidenceIndicatorProps {
  score: number;
  label?: ConfidenceLabel;
  sourceBreakdown?: {
    confirmedFacts: number;
    graphStability: number;
    eventEvidence: number;
    branchConsensus: number;
  };
  compact?: boolean;
}

export function ConfidenceIndicator({ score, sourceBreakdown, compact = false }: ConfidenceIndicatorProps) {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const meta = normalizedScore >= 80
    ? { text: "已确认模式 (High Pattern)", color: "text-emerald-400 bg-emerald-950/40", border: "border-emerald-800/60" }
    : normalizedScore >= 60
      ? { text: "高概率趋势 (Probable Trend)", color: "text-amber-300 bg-amber-950/40", border: "border-amber-800/60" }
      : normalizedScore >= 40
        ? { text: "待观察弱信号 (Weak Signal)", color: "text-slate-300 bg-slate-800/50", border: "border-slate-700/60" }
        : { text: "证据不足的假设 (Low Confidence)", color: "text-rose-400 bg-rose-950/40", border: "border-rose-800/60" };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-xs tabular-nums ${meta.border} ${meta.color}`} title={`沙盘置信评分: ${normalizedScore}/100 (基于事实支撑与分支一致性计算)`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
        <span>置信度 {normalizedScore}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-observatory-subtle bg-observatory-surface p-3 font-sans text-xs">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-slate-400">推演审计置信度</span>
        <span className={`rounded border px-2 py-0.5 font-mono font-semibold tabular-nums ${meta.border} ${meta.color}`}>
          {normalizedScore}% · {meta.text}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-900">
        <div className="h-full bg-gradient-to-r from-slate-600 via-amber-500 to-emerald-400 transition-[width] duration-500" style={{ width: `${normalizedScore}%` }} />
      </div>
      {sourceBreakdown && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-slate-800/60 pt-1 text-[11px] text-slate-400">
          <div>事实支撑度: <span className="font-mono text-slate-200 tabular-nums">{sourceBreakdown.confirmedFacts}%</span></div>
          <div>图谱演变稳定度: <span className="font-mono text-slate-200 tabular-nums">{sourceBreakdown.graphStability}%</span></div>
          <div>日志证据覆盖: <span className="font-mono text-slate-200 tabular-nums">{sourceBreakdown.eventEvidence}%</span></div>
          <div>分身收敛共识: <span className="font-mono text-slate-200 tabular-nums">{sourceBreakdown.branchConsensus}%</span></div>
        </div>
      )}
    </div>
  );
}
