import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

async function source(relativePath: string) {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("Observational Deep-Field frontend redesign", () => {
  it("provides the evidence-first observatory component set", async () => {
    const [confidence, evidence, claims, agents, graph] = await Promise.all([
      source("src/components/astraloom/ConfidenceIndicator.tsx"),
      source("src/components/astraloom/EvidenceChip.tsx"),
      source("src/components/astraloom/ClaimCard.tsx"),
      source("src/components/astraloom/AgentCard.tsx"),
      source("src/components/astraloom/RelationGraphView.tsx"),
    ]);

    expect(confidence).toContain("推演审计置信度");
    expect(evidence).toContain("证据凭证");
    expect(claims).toContain("证据链支撑");
    expect(agents).toContain("用户本位分身");
    expect(graph).toContain("只读未来演化拓扑");
    expect(graph).toContain("nodesDraggable={false}");
    expect(graph).toContain("nodesConnectable={false}");
  });

  it("exposes the complete observational journey without replacing the formal app routes", async () => {
    const pages = await Promise.all([
      source("src/app/page.tsx"),
      source("src/app/new/page.tsx"),
      source("src/app/review/agents/page.tsx"),
      source("src/app/review/graph/page.tsx"),
      source("src/app/simulation/running/page.tsx"),
      source("src/app/simulation/result/page.tsx"),
      source("src/app/history/page.tsx"),
      source("src/app/calibration/page.tsx"),
    ]);

    expect(pages[0]).toContain("可观察的数字生命沙盘");
    expect(pages[1]).toContain("种子上下文采集");
    expect(pages[2]).toContain("人物智能体");
    expect(pages[3]).toContain("关系图谱");
    expect(pages[4]).toContain("Simulation Tick Execution");
    expect(pages[5]).toContain("证据链");
    expect(pages[6]).toContain("沙盘归档");
    expect(pages[7]).toContain("现实校准");
  });

  it("defines Tailwind v4-compatible observatory tokens and motion safeguards", async () => {
    const [css, config] = await Promise.all([
      source("src/app/globals.css"),
      source("tailwind.config.ts"),
    ]);

    expect(css).toContain('@import "tailwindcss"');
    expect(css).toContain("--color-observatory-base");
    expect(css).toContain("prefers-reduced-motion");
    expect(config).toContain("observatory");
  });
});
