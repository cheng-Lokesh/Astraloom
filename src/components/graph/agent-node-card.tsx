"use client";

import type { NodeProps } from "@xyflow/react";

type AgentNodeData = {
  label: string;
  role: string;
  agentType: "self" | "parallel_self" | "npc";
  confidence: number;
};

export function AgentNodeCard({ data }: NodeProps) {
  const nodeData = data as AgentNodeData;
  const isSelf = nodeData.agentType === "self";
  const isParallel = nodeData.agentType === "parallel_self";

  return (
    <div
      className={`w-[178px] rounded-lg border px-3 py-3 shadow-[0_12px_32px_rgba(17,21,15,0.08)] ${
        isSelf
          ? "border-[#11150f] bg-[#11150f] text-white"
          : isParallel
            ? "border-[#8b6f9b]/25 bg-[#f1edf5] text-[#11150f]"
            : "border-black/15 bg-white text-[#11150f]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold">{nodeData.label}</p>
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
      <p
        className={`mt-1 line-clamp-2 text-xs leading-5 ${
          isSelf ? "text-white/62" : "text-[#62695d]"
        }`}
      >
        {nodeData.role}
      </p>
    </div>
  );
}
