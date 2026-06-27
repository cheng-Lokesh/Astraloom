"use client";

export const agentCategories = [
  "self",
  "family",
  "partner",
  "ally",
  "competitor",
  "opportunity",
  "institution",
  "constraint",
] as const;

export type AgentNode = {
  id: number;
  x: number;
  y: number;
  category: (typeof agentCategories)[number];
  ring: number;
};

export const agentNodes: AgentNode[] = Array.from({ length: 32 }, (_, index) => {
  const ring = index < 10 ? 0 : index < 22 ? 1 : 2;
  const ringIndex = ring === 0 ? index : ring === 1 ? index - 10 : index - 22;
  const ringCount = ring === 0 ? 10 : ring === 1 ? 12 : 10;
  const angle = (ringIndex / ringCount) * Math.PI * 2 - Math.PI / 2 + ring * 0.13;
  const radiusX = [170, 290, 410][ring];
  const radiusY = [92, 160, 220][ring];

  return {
    id: index,
    x: 600 + Math.cos(angle) * radiusX,
    y: 382 + Math.sin(angle) * radiusY,
    category: agentCategories[index % agentCategories.length],
    ring,
  };
});

const categoryGlyph: Record<AgentNode["category"], string> = {
  self: "◎",
  family: "◇",
  partner: "◉",
  ally: "△",
  competitor: "×",
  opportunity: "+",
  institution: "▱",
  constraint: "□",
};

export function AgentNodeLayer({
  hoveredNode,
  onNodeHover,
}: {
  hoveredNode: number | null;
  onNodeHover: (node: AgentNode | null) => void;
}) {
  return (
    <g className="agent-node-layer" aria-label="Agent network">
      {agentNodes.map((node, index) => {
        const isHovered = hoveredNode === node.id;
        const isDimmed = hoveredNode !== null && !isHovered;
        return (
          <g
            key={node.id}
            className={`agent-node agent-node-${node.category}${isHovered ? " is-hovered" : ""}${isDimmed ? " is-dimmed" : ""}`}
            data-node-id={node.id}
            data-ring={node.ring}
            data-mobile-hidden={index >= 12 ? "true" : "false"}
            transform={`translate(${node.x} ${node.y})`}
            role="button"
            tabIndex={0}
            aria-label={`${node.category} agent ${node.id + 1}`}
            onPointerEnter={() => onNodeHover(node)}
            onPointerLeave={() => onNodeHover(null)}
            onFocus={() => onNodeHover(node)}
            onBlur={() => onNodeHover(null)}
            onClick={() => onNodeHover(isHovered ? null : node)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onNodeHover(isHovered ? null : node);
              }
            }}
          >
            <circle className="agent-node-hit" r="25" />
            <circle className="agent-node-halo" r={node.ring === 0 ? 15 : 12} />
            <circle className="agent-node-orbit" r={node.ring === 0 ? 9 : 7} />
            <circle className="agent-node-core" r={node.ring === 0 ? 4.2 : 3.4} />
            <text className="agent-node-glyph" textAnchor="middle" dy="3">
              {categoryGlyph[node.category]}
            </text>
          </g>
        );
      })}
    </g>
  );
}
