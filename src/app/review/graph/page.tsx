"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarkerType, type Edge, type Node } from "@xyflow/react";
import { ObservatoryShell } from "@/components/astraloom/ObservatoryShell";
import { RelationGraphView } from "@/components/astraloom/RelationGraphView";

const nodes: Node[] = [
  { id: "self_main", type: "agentNode", position: { x: 300, y: 180 }, data: { label: "你 (主本位)", role: "产品负责人", type: "user_core", stress: 76 } },
  { id: "self_bold", type: "agentNode", position: { x: 500, y: 180 }, data: { label: "激进态自我", role: "平行分身", type: "user_variant", stress: 60 } },
  { id: "npc_victor", type: "agentNode", position: { x: 300, y: 20 }, data: { label: "Victor", role: "直属上级", type: "npc", stress: 68 } },
  { id: "npc_lena", type: "agentNode", position: { x: 80, y: 260 }, data: { label: "Lena", role: "核心伴侣", type: "npc", stress: 45 } },
];
const edges: Edge[] = [
  { id: "edge_self_victor", source: "self_main", target: "npc_victor", label: "权力依赖 · 信任待补", style: { stroke: "#ef4444", strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#ef4444" } },
  { id: "edge_lena_self", source: "npc_lena", target: "self_main", label: "支持 · 风险敏感", style: { stroke: "#10b981", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" } },
  { id: "edge_self_variant", source: "self_main", target: "self_bold", label: "决策分叉", animated: true, style: { stroke: "#f59e0b", strokeDasharray: "6 5" } },
];

export default function ReviewGraphPage() {
  const router = useRouter();
  const [selection, setSelection] = useState("尚未选择节点或关系边");
  return <ObservatoryShell title="只读关系图谱 (Relation Graph Review)" stage="阶段 3 / 4 · 拓扑快照与证据缺口"><div className="space-y-5"><div><p className="font-mono text-[11px] uppercase tracking-widest text-amber-400">Read-only topology</p><h1 className="mt-2 text-2xl font-bold">确认关系图谱，而不是编辑关系分数</h1><p className="mt-2 text-sm text-slate-400">点击节点或关系边查看定位。锁定后，本次运行只读取这个快照。</p></div><div className="h-[560px] min-h-[480px]"><RelationGraphView nodes={nodes} edges={edges} onSelectNode={(id) => setSelection(`已选择人物节点: ${id}`)} onSelectEdge={(id) => setSelection(`已选择关系边: ${id}`)} /></div><div className="grid gap-3 md:grid-cols-3"><Summary label="最强压力边" value="直属上级 → 主本位" tone="text-rose-300" /><Summary label="最大信息缺口" value="新机会的资源承诺" tone="text-slate-200" /><Summary label="最稳定支持边" value="核心伴侣 → 主本位" tone="text-emerald-300" /></div><p aria-live="polite" className="font-mono text-xs text-slate-500">{selection}</p><div className="flex flex-col justify-between gap-3 border-t border-observatory-subtle pt-5 sm:flex-row"><button type="button" onClick={() => router.back()} className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm active:scale-95">← 返回人物确认</button><button type="button" onClick={() => router.push("/simulation/running")} className="min-h-11 rounded-lg bg-amber-500 px-5 text-sm font-semibold text-slate-950 active:scale-95">锁定图谱并运行沙盘 →</button></div></div></ObservatoryShell>;
}

function Summary({ label, value, tone }: { label: string; value: string; tone: string }) { return <div className="rounded-xl border border-observatory-subtle bg-observatory-surface p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className={`mt-1 text-sm font-semibold ${tone}`}>{value}</p></div>; }
