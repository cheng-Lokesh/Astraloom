"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AgentCard, type AgentProfileData } from "@/components/astraloom/AgentCard";
import { ObservatoryShell } from "@/components/astraloom/ObservatoryShell";

const initialAgents: AgentProfileData[] = [
  { agentId: "self_main", agentType: "user_core", displayName: "你 (主本位分身)", roleLabel: "主决策个体", confidence: 94, psychology: { conflictStyle: "strategic", riskTolerance: 45 }, motivation: { primaryGoal: "跳出当前无界消耗，获得自主施展空间", fear: "冲动决定导致现金流与关系承压" }, resources: { authority: 50, socialCapital: 68 }, currentStress: 76 },
  { agentId: "self_variant_bold", agentType: "user_variant", displayName: "激进突破态 (Parallel)", roleLabel: "扰动分身", confidence: 82, psychology: { conflictStyle: "direct", riskTolerance: 75 }, motivation: { primaryGoal: "快速切割旧环境，抓住新机会", fear: "在旧环境中被逐步边缘化" }, resources: { authority: 50, socialCapital: 68 }, currentStress: 60 },
  { agentId: "npc_victor", agentType: "npc", displayName: "Victor", roleLabel: "现任老板 · 阻力节点", confidence: 86, psychology: { conflictStyle: "direct", riskTolerance: 60 }, motivation: { primaryGoal: "保持项目控制与交付稳定", fear: "核心骨干流失带来项目风险" }, resources: { authority: 88, socialCapital: 60 }, currentStress: 68 },
  { agentId: "npc_lena", agentType: "npc", displayName: "Lena", roleLabel: "核心伴侣 · 支持节点", confidence: 88, psychology: { conflictStyle: "strategic", riskTolerance: 35 }, motivation: { primaryGoal: "维持共同生活的可预期性", fear: "突然变化造成长期压力" }, resources: { authority: 45, socialCapital: 74 }, currentStress: 45 },
];

export default function ReviewAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState(initialAgents);
  const [focused, setFocused] = useState(agents[0].agentId);
  return <ObservatoryShell title="校对人物智能体 (Agent Profile Review)" stage="阶段 2 / 4 · 来源与不确定性确认"><div className="space-y-6"><div><p className="font-mono text-[11px] uppercase tracking-widest text-amber-400">Agent ecology checkpoint</p><h1 className="mt-2 text-2xl font-bold text-slate-100">这些人物是否像你认识的他们？</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">这里只确认人物识别与信息来源。关系权重由后续规则生成，不能手动编辑。</p></div><div className="grid gap-3 md:grid-cols-2">{agents.map((agent) => <div key={agent.agentId} className="space-y-2"><AgentCard agent={agent} isFocused={focused === agent.agentId} onFocus={setFocused} />{agent.agentType === "npc" && <button type="button" onClick={() => setAgents((items) => items.filter((item) => item.agentId !== agent.agentId))} className="min-h-10 text-xs text-slate-500 hover:text-rose-300 active:scale-95">移除误识别人物</button>}</div>)}</div><div className="flex flex-col justify-between gap-3 border-t border-observatory-subtle pt-5 sm:flex-row"><button type="button" onClick={() => router.back()} className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm text-slate-300 active:scale-95">← 返回修改上下文</button><button type="button" onClick={() => router.push("/review/graph")} disabled={agents.length < 2} className="min-h-11 rounded-lg bg-amber-500 px-5 text-sm font-semibold text-slate-950 active:scale-95 disabled:opacity-40">确认人物并生成只读关系图 →</button></div></div></ObservatoryShell>;
}
