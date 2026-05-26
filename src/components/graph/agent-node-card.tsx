"use client";

import type { NodeProps } from "@xyflow/react";

type AgentNodeData = {
  label: string;
  role: string;
  agentType: "self" | "parallel_self" | "npc";
  confidence: number;
  stance?: string;
};

export function AgentNodeCard({ data }: NodeProps) {
  const nodeData = data as AgentNodeData;
  const isSelf = nodeData.agentType === "self";
  const isParallel = nodeData.agentType === "parallel_self";
  const typeLabel = isSelf ? "User core" : isParallel ? "Parallel self" : "NPC";

  return (
    <div
      className={`w-[190px] rounded-lg border px-3 py-3 shadow-[0_12px_32px_rgba(17,21,15,0.08)] ${
        isSelf
          ? "border-[#11150f] bg-[#11150f] text-white ring-2 ring-[#b7e6c6]/35"
          : isParallel
            ? "border-[#8b6f9b]/35 bg-[#f1edf5] text-[#11150f]"
            : "border-[#568262]/25 bg-white text-[#11150f]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
            isSelf
              ? "bg-white/12 text-white/72"
              : isParallel
                ? "bg-[#8b6f9b]/12 text-[#604870]"
                : "bg-[#eef5ee] text-[#2f5d3d]"
          }`}
        >
          {typeLabel}
        </span>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
            isSelf
              ? "border-white/20 text-white/70"
              : "border-black/10 text-[#62695d]"
          }`}
        >
          {nodeData.confidence}%
        </span>
      </div>
      <p className="mt-2 truncate text-sm font-semibold">{nodeData.label}</p>
      <p
        className={`mt-1 line-clamp-2 text-xs leading-5 ${
          isSelf ? "text-white/62" : "text-[#62695d]"
        }`}
      >
        {nodeData.role}
      </p>
      {nodeData.stance ? (
        <p
          className={`mt-2 text-[11px] leading-4 ${
            isSelf ? "text-white/48" : "text-[#7d8578]"
          }`}
        >
          {nodeData.stance.replaceAll("_", " ")}
        </p>
      ) : null}
    </div>
  );
}
