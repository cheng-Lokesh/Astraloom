"use client";

import { useCallback, useMemo } from "react";
import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type AgentNodeData = { label: string; role: string; type: "user_core" | "user_variant" | "npc"; stress?: number };
type AgentNode = Node<AgentNodeData, "agentNode">;

function CustomAgentNode({ data }: NodeProps<AgentNode>) {
  const isMain = data.type === "user_core";
  const isVariant = data.type === "user_variant";

  return (
    <div className={`min-w-[130px] rounded-xl border px-3.5 py-2.5 text-center font-sans shadow-xl transition-[background-color,border-color,box-shadow] ${isMain ? "border-slate-300 bg-slate-900/95 text-slate-100 shadow-slate-100/10 ring-2 ring-slate-400/40" : isVariant ? "border-dashed border-amber-500/80 bg-slate-900/90 text-amber-200" : "border-slate-700 bg-slate-950/90 text-slate-300 hover:border-slate-500"}`}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-slate-600" />
      <div className="truncate text-xs font-semibold">{data.label}</div>
      <div className="mt-0.5 truncate font-mono text-[10px] text-slate-400">{data.role}</div>
      {data.stress !== undefined && <div className="mt-1.5 inline-block rounded border border-slate-800 bg-slate-950/80 px-1.5 py-0.5 font-mono text-[9px] text-slate-400 tabular-nums">压力 {data.stress}</div>}
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-slate-600" />
    </div>
  );
}

interface RelationGraphViewProps {
  nodes: Node[];
  edges: Edge[];
  onSelectNode?: (nodeId: string) => void;
  onSelectEdge?: (edgeId: string) => void;
}

export function RelationGraphView({ nodes: initialNodes, edges: initialEdges, onSelectNode, onSelectEdge }: RelationGraphViewProps) {
  const nodeTypes = useMemo(() => ({ agentNode: CustomAgentNode }), []);
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => onSelectNode?.(node.id), [onSelectNode]);
  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => onSelectEdge?.(edge.id), [onSelectEdge]);
  const fallbackNodes = useMemo(() => {
    const xs = initialNodes.map((node) => node.position.x);
    const ys = initialNodes.map((node) => node.position.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return initialNodes.map((node) => ({
      ...node,
      graphX: 22 + ((node.position.x - minX) / Math.max(maxX - minX, 1)) * 56,
      graphY: 29 + ((node.position.y - minY) / Math.max(maxY - minY, 1)) * 42,
      agent: node.data as AgentNodeData,
    }));
  }, [initialNodes]);
  const nodePoints = useMemo(() => new Map(fallbackNodes.map((node) => [node.id, node])), [fallbackNodes]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-observatory-subtle bg-observatory-base">
      <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-3 rounded-lg border border-observatory-subtle bg-observatory-surface/95 px-3 py-1.5 text-xs">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">沙盘生态图例:</span>
        <Legend tone="bg-emerald-400" label="信任/支持" /><Legend tone="bg-rose-500" label="敌意/压力" /><Legend tone="bg-sky-400" label="依赖/控制" /><Legend tone="bg-slate-500" label="待观察信息差" />
      </div>
      <div className="absolute bottom-3 left-3 z-10 rounded border border-slate-800 bg-slate-950/80 px-2.5 py-1 font-mono text-[11px] text-slate-500">只读未来演化拓扑 · 状态由微观 Tick 日志计算推演</div>
      <ReactFlow aria-hidden="true" defaultNodes={initialNodes} defaultEdges={initialEdges} nodeTypes={nodeTypes} onNodeClick={handleNodeClick} onEdgeClick={handleEdgeClick} nodesDraggable={false} nodesConnectable={false} elementsSelectable fitView fitViewOptions={{ padding: 0.22, minZoom: 0.45 }} className="pointer-events-none opacity-0">
        <Background color="#1E2530" gap={24} size={1} />
        <Controls showInteractive={false} className="!border-slate-800 !bg-slate-900 !fill-slate-200" />
      </ReactFlow>
      <div className="observatory-grid absolute inset-0 z-[5]" role="group" aria-label="只读关系图">
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          {initialEdges.map((edge) => {
            const source = nodePoints.get(edge.source);
            const target = nodePoints.get(edge.target);
            if (!source || !target) return null;
            const color = typeof edge.style?.stroke === "string" ? edge.style.stroke : "#64748b";
            return <line key={edge.id} x1={`${source.graphX}%`} y1={`${source.graphY}%`} x2={`${target.graphX}%`} y2={`${target.graphY}%`} stroke={color} strokeWidth={typeof edge.style?.strokeWidth === "number" ? edge.style.strokeWidth : 2} strokeDasharray={typeof edge.style?.strokeDasharray === "string" ? edge.style.strokeDasharray : undefined} opacity="0.82" />;
          })}
        </svg>
        {fallbackNodes.map((node) => <button key={node.id} type="button" onClick={() => onSelectNode?.(node.id)} style={{ left: `${node.graphX}%`, top: `${node.graphY}%` }} className={`absolute min-h-16 w-[130px] -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-center shadow-xl transition-[border-color,background-color,transform] active:scale-95 ${node.agent.type === "user_core" ? "border-slate-300 bg-slate-900 text-slate-100 ring-2 ring-slate-400/40" : node.agent.type === "user_variant" ? "border-dashed border-amber-500 bg-slate-900 text-amber-200" : "border-slate-700 bg-slate-950 text-slate-300"}`}><span className="block truncate text-xs font-semibold">{node.agent.label}</span><span className="mt-0.5 block truncate font-mono text-[10px] text-slate-400">{node.agent.role}</span>{node.agent.stress !== undefined && <span className="mt-1 inline-block rounded border border-slate-800 px-1.5 font-mono text-[9px] text-slate-400">压力 {node.agent.stress}</span>}</button>)}
        {initialEdges.map((edge) => {
          const source = nodePoints.get(edge.source);
          const target = nodePoints.get(edge.target);
          if (!source || !target || !edge.label) return null;
          return <button key={`${edge.id}-label`} type="button" onClick={() => onSelectEdge?.(edge.id)} style={{ left: `${(source.graphX + target.graphX) / 2}%`, top: `${(source.graphY + target.graphY) / 2}%` }} className="absolute min-h-10 max-w-32 -translate-x-1/2 -translate-y-1/2 rounded border border-slate-700 bg-slate-950/95 px-2 py-1 font-mono text-[9px] text-slate-400 active:scale-95">{String(edge.label)}</button>;
        })}
      </div>
    </div>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return <div className="flex items-center gap-1.5"><span className={`h-0.5 w-2.5 rounded ${tone}`} /><span className="text-[11px] text-slate-300">{label}</span></div>;
}
