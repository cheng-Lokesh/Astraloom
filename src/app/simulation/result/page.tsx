"use client";

import { useState } from "react";
import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { AgentCard, type AgentProfileData } from "@/components/astraloom/AgentCard";
import { ClaimCard, type ClaimData, type ClaimEvidence } from "@/components/astraloom/ClaimCard";
import { ConfidenceIndicator } from "@/components/astraloom/ConfidenceIndicator";
import { ObservatoryShell } from "@/components/astraloom/ObservatoryShell";
import { RelationGraphView } from "@/components/astraloom/RelationGraphView";

const agents: AgentProfileData[] = [
  { agentId: "self_mira", agentType: "user_core", displayName: "Mira (本位)", roleLabel: "主决策者", confidence: 92, psychology: { conflictStyle: "strategic", riskTolerance: 45 }, motivation: { primaryGoal: "恢复自主权，停止无界消耗", fear: "冲动变化导致关系与资源承压" }, resources: { authority: 55, socialCapital: 70 }, currentStress: 78 },
  { agentId: "npc_boss_victor", agentType: "npc", displayName: "Victor", roleLabel: "现任老板", confidence: 85, psychology: { conflictStyle: "direct", riskTolerance: 60 }, motivation: { primaryGoal: "维持项目控制与交付", fear: "关键人才流失带来项目风险" }, resources: { authority: 88, socialCapital: 60 }, currentStress: 65 },
  { agentId: "npc_partner_lena", agentType: "npc", displayName: "Lena", roleLabel: "亲密伴侣", confidence: 88, psychology: { conflictStyle: "strategic", riskTolerance: 35 }, motivation: { primaryGoal: "保持共同生活稳定", fear: "不可逆决定放大财务压力" }, resources: { authority: 45, socialCapital: 74 }, currentStress: 44 },
];
const nodes: Node[] = agents.map((agent, index) => ({ id: agent.agentId, type: "agentNode", position: [{ x: 300, y: 210 }, { x: 290, y: 35 }, { x: 60, y: 280 }][index], data: { label: agent.displayName, role: agent.roleLabel, type: agent.agentType, stress: agent.currentStress } }));
const edges: Edge[] = [
  { id: "edge_01", source: "self_mira", target: "npc_boss_victor", label: "控制压力上升", style: { stroke: "#ef4444", strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#ef4444" } },
  { id: "edge_02", source: "npc_partner_lena", target: "self_mira", label: "支持仍稳定", style: { stroke: "#10b981", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" } },
];
const claims: ClaimData[] = [
  { claimId: "claim_01", claim: "在中段观察窗口，上级控制行为在多数已采样分支中增强。", riskLevel: "L2", confidenceScore: 78, timeWindowText: "Tick 2 · 第 30 至 45 天", divergenceVariable: "是否在冲突前取得书面资源边界，是三条分支分化最大的变量。", involvedAgentNames: ["Mira", "Victor"], evidences: [{ id: "evt_101", type: "event", summary: "资源承诺被重新讨论", tickIndex: 2, agentIds: ["self_mira", "npc_boss_victor"], edgeIds: ["edge_01"] }, { id: "edge_delta_01", type: "edge_shift", summary: "控制压力由中等升至偏高", tickIndex: 2, edgeIds: ["edge_01"] }, { id: "reality_01", type: "reality", summary: "用户确认近期职责边界反复变化" }], strategySnippet: "将职责、资源与退出条件写成可确认的书面清单，再选择沟通时点。" },
  { claimId: "claim_02", claim: "若资源缓冲不足，亲密关系可能在后段成为主要约束。", riskLevel: "L1", confidenceScore: 64, timeWindowText: "Tick 3 · 第 60 至 90 天", involvedAgentNames: ["Mira", "Lena"], evidences: [{ id: "reality_02", type: "reality", summary: "共同支出对收入稳定性敏感" }, { id: "evt_204", type: "event", summary: "谨慎分支先补足现金缓冲", tickIndex: 3 }], isUnlocked: false },
];

export default function SimulationResultPage() {
  const [selectedClaim, setSelectedClaim] = useState(claims[0].claimId);
  const [focusedAgent, setFocusedAgent] = useState<string>();
  const [highlight, setHighlight] = useState("选择 Claim 或证据，在图谱中定位相关对象。");
  function showEvidence(evidence: ClaimEvidence) { setFocusedAgent(evidence.agentIds?.[0]); setHighlight(`证据 ${evidence.id}: ${evidence.summary}`); }
  return <ObservatoryShell title="只读沙盘控制台 (Result Sandbox)"><div className="space-y-6"><div className="grid gap-4 lg:grid-cols-[1fr_auto]"><div><p className="font-mono text-[11px] uppercase tracking-widest text-amber-400">Evidence-backed simulation result</p><h1 className="mt-2 text-2xl font-bold">90 天职业十字路口 · 观察结果</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">这是基于明确假设和有限分支的条件性推演，不是现实世界概率，也不代表第三方真实想法。</p></div><ConfidenceIndicator score={78} sourceBreakdown={{ confirmedFacts: 76, graphStability: 72, eventEvidence: 84, branchConsensus: 79 }} /></div><div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]"><section className="h-[620px]"><RelationGraphView nodes={nodes} edges={edges} onSelectNode={(id) => setFocusedAgent(id)} onSelectEdge={(id) => setHighlight(`关系边 ${id} 已定位`)} /></section><section className="space-y-3"><h2 className="font-mono text-xs uppercase tracking-wider text-slate-400">结论与证据链</h2>{claims.map((claim) => <ClaimCard key={claim.claimId} claim={claim} isSelected={selectedClaim === claim.claimId} onSelectClaim={setSelectedClaim} onHighlightEvidence={showEvidence} onTriggerUnlock={() => setHighlight("付费仅解锁既有 Claim 的证据与策略深度，不会提高置信度。")}/>)}</section></div><section><h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-slate-400">相关人物状态</h2><div className="grid gap-3 md:grid-cols-3">{agents.map((agent) => <AgentCard key={agent.agentId} agent={agent} isFocused={focusedAgent === agent.agentId} onFocus={setFocusedAgent} />)}</div></section><p className="rounded-lg border border-observatory-subtle bg-observatory-surface p-3 font-mono text-xs text-slate-400" aria-live="polite">{highlight}</p></div></ObservatoryShell>;
}
