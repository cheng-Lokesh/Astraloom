"use client";

import { useState } from "react";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { EvidenceChip, type EvidenceType } from "./EvidenceChip";

export type RiskLevel = "L1" | "L2" | "L3";

export interface ClaimEvidence {
  id: string;
  type: EvidenceType;
  summary: string;
  tickIndex?: number;
  agentIds?: string[];
  edgeIds?: string[];
}

export interface ClaimData {
  claimId: string;
  claim: string;
  riskLevel: RiskLevel;
  confidenceScore: number;
  timeWindowText: string;
  divergenceVariable?: string;
  involvedAgentNames: string[];
  evidences: ClaimEvidence[];
  strategySnippet?: string;
  isUnlocked?: boolean;
}

interface ClaimCardProps {
  claim: ClaimData;
  isSelected?: boolean;
  onSelectClaim?: (claimId: string) => void;
  onHighlightEvidence?: (evidence: ClaimEvidence) => void;
  onTriggerUnlock?: () => void;
}

const riskMeta = {
  L1: { label: "L1 观察级", badge: "border-emerald-700/60 bg-emerald-950/30 text-emerald-400" },
  L2: { label: "L2 干预级", badge: "border-amber-700/60 bg-amber-950/30 text-amber-300" },
  L3: { label: "L3 止损级", badge: "border-rose-700/60 bg-rose-950/30 text-rose-400" },
} as const;

export function ClaimCard({ claim, isSelected = false, onSelectClaim, onHighlightEvidence, onTriggerUnlock }: ClaimCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const risk = riskMeta[claim.riskLevel];

  return (
    <article className={`rounded-xl border p-4 font-sans transition-[background-color,border-color,box-shadow] ${isSelected ? "border-amber-500/70 bg-observatory-raised shadow-lg shadow-amber-500/10" : "border-observatory-subtle bg-observatory-surface hover:border-slate-700 hover:bg-observatory-raised/60"}`}>
      <button type="button" onClick={() => onSelectClaim?.(claim.claimId)} className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2"><span className={`rounded border px-2 py-0.5 font-mono text-[11px] font-semibold ${risk.badge}`}>{risk.label}</span><span className="font-mono text-xs text-slate-400">{claim.timeWindowText}</span></div>
          <ConfidenceIndicator score={claim.confidenceScore} compact />
        </div>
        <h3 className="mb-2 text-base font-semibold leading-snug tracking-tight text-slate-100">{claim.claim}</h3>
      </button>

      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-400"><span className="text-[11px] text-slate-500">关键个体:</span>{claim.involvedAgentNames.map((name) => <span key={name} className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">{name}</span>)}</div>

      {claim.divergenceVariable && <div className="mb-3 rounded-lg border border-slate-800 bg-slate-900/70 p-2.5 text-xs text-slate-300"><span className="mb-0.5 block font-mono text-[11px] font-medium text-amber-400">⚑ 关键分叉变量 (Divergence Variable)</span>{claim.divergenceVariable}</div>}

      <div className="border-t border-slate-800/80 pt-2.5">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-400"><span className="font-mono text-[11px] text-slate-500">证据链支撑 ({claim.evidences.length})</span><button type="button" onClick={() => setIsExpanded((value) => !value)} className="min-h-10 text-[11px] text-amber-400 underline underline-offset-2 transition-transform active:scale-95">{isExpanded ? "收起因果明细" : "展开证据与策略"}</button></div>
        <div className="flex flex-wrap gap-1.5">{claim.evidences.slice(0, isExpanded ? undefined : 2).map((evidence) => <EvidenceChip key={evidence.id} {...evidence} onClick={() => onHighlightEvidence?.(evidence)} />)}{!isExpanded && claim.evidences.length > 2 && <span className="self-center px-1 font-mono text-[11px] text-slate-500">+{claim.evidences.length - 2} 更多证据</span>}</div>
        {isExpanded && <div className="mt-3 space-y-2 border-t border-slate-800 pt-3 text-xs">{claim.strategySnippet ? <div className="rounded border border-emerald-900/40 bg-emerald-950/20 p-2.5 text-emerald-200"><span className="mb-1 block font-semibold text-emerald-400">可执行应对策略:</span>{claim.strategySnippet}</div> : !claim.isUnlocked && <div className="flex items-center justify-between gap-3 rounded border border-amber-900/50 bg-amber-950/30 p-3"><span className="text-xs text-amber-300/90">该结论关联的深度应对脚本已生成，需解锁完整沙盘。</span><button type="button" onClick={onTriggerUnlock} className="min-h-10 shrink-0 rounded bg-amber-500 px-2.5 py-1 text-xs font-semibold text-slate-950 transition-[background-color,transform] hover:bg-amber-400 active:scale-95">解锁策略</button></div>}</div>}
      </div>
    </article>
  );
}
