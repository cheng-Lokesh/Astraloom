"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { AgentNodeLayer, type AgentNode } from "./agent-node-layer";
import { DestinyClimateRing } from "./destiny-climate-ring";
import { PathBranchStreams } from "./path-branch-streams";
import { RelationFlowLayer } from "./relation-flow-layer";

const EvidenceParticleLayer = dynamic(() => import("./evidence-particle-layer"), {
  ssr: false,
  loading: () => null,
});

export default function OrbitGraphCanvas({
  onNodeHover,
}: {
  onNodeHover?: (node: AgentNode | null) => void;
}) {
  const [hoveredNode, setHoveredNode] = useState<AgentNode | null>(null);

  const handleNodeHover = (node: AgentNode | null) => {
    setHoveredNode(node);
    onNodeHover?.(node);
  };

  return (
    <div className="orbit-graph-canvas" data-hovered-node={hoveredNode?.id ?? ""}>
      <svg viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid meet" aria-label="Interactive destiny intelligence graph">
        <defs>
          <radialGradient id="user-core-gradient">
            <stop offset="0%" stopColor="#e8f8ff" stopOpacity="1" />
            <stop offset="24%" stopColor="#8cd8ff" stopOpacity=".95" />
            <stop offset="62%" stopColor="#3b8fff" stopOpacity=".38" />
            <stop offset="100%" stopColor="#1b4dff" stopOpacity="0" />
          </radialGradient>
          <filter id="core-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g className="graph-perspective-plane">
          <DestinyClimateRing />
          <RelationFlowLayer hoveredNode={hoveredNode?.id ?? null} />
          <PathBranchStreams />
          <AgentNodeLayer hoveredNode={hoveredNode?.id ?? null} onNodeHover={handleNodeHover} />
          <g className="user-core" data-user-core="true" transform="translate(600 382)">
            <ellipse className="user-core-ground user-core-ground-outer" rx="82" ry="34" />
            <ellipse className="user-core-ground user-core-ground-middle" rx="58" ry="24" />
            <ellipse className="user-core-ground user-core-ground-inner" rx="34" ry="14" />
            <circle className="user-core-halo" r="52" fill="url(#user-core-gradient)" />
            <circle className="user-core-shell" r="19" filter="url(#core-glow)" />
            <circle className="user-core-heart" r="6" />
            <path className="user-core-beam" d="M600 382 L600 76" transform="translate(-600 -382)" />
            <text className="user-core-label" textAnchor="middle" y="73">USER CORE</text>
            <text className="user-core-state" textAnchor="middle" y="88">SYNCHRONIZED</text>
          </g>
        </g>
      </svg>
      <EvidenceParticleLayer />
      {hoveredNode ? (
        <div
          className="agent-tooltip"
          style={{
            left: `${(hoveredNode.x / 1200) * 100}%`,
            top: `${(hoveredNode.y / 720) * 100}%`,
          }}
          role="status"
        >
          <span>{hoveredNode.category}</span>
          <strong>Agent {String(hoveredNode.id + 1).padStart(2, "0")}</strong>
          <small>relation channel active</small>
        </div>
      ) : null}
    </div>
  );
}
