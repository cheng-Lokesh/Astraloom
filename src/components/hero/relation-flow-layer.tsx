"use client";

import { agentNodes } from "./agent-node-layer";

const flowTones = ["normal", "evidence", "climate", "normal", "risk"] as const;

const buildPath = (x: number, y: number, bend: number) => {
  const controlX = 600 + (x - 600) * 0.48 + bend;
  const controlY = 382 + (y - 382) * 0.36 - 22;
  return `M600 382 Q${controlX.toFixed(1)} ${controlY.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
};

export function RelationFlowLayer({ hoveredNode }: { hoveredNode: number | null }) {
  return (
    <g className="relation-flow-layer" aria-hidden="true">
      {agentNodes.map((node, index) => {
        if (index % 2 !== 0) return null;
        const path = buildPath(node.x, node.y, index % 4 < 2 ? -28 : 28);
        const tone = flowTones[index % flowTones.length];
        const related = hoveredNode === null || hoveredNode === node.id;
        return (
          <g
            key={node.id}
            className={`relation-flow relation-flow-${tone}${related ? " is-related" : " is-unrelated"}`}
            data-node-id={node.id}
          >
            <path d={path} className="relation-flow-base" />
            <path d={path} className="relation-flow-energy" pathLength="100" />
            <circle r="3.2" className="relation-flow-signal">
              <animateMotion dur={`${5.4 + (index % 5) * 0.55}s`} repeatCount="indefinite" path={path} />
            </circle>
          </g>
        );
      })}
      {agentNodes.slice(0, 10).map((node, index) => {
        const target = agentNodes[(index + 4) % 10];
        const path = `M${node.x.toFixed(1)} ${node.y.toFixed(1)} Q600 ${300 + index * 9} ${target.x.toFixed(1)} ${target.y.toFixed(1)}`;
        return <path key={`cross-${node.id}`} d={path} className="relation-flow-cross" pathLength="100" />;
      })}
    </g>
  );
}
