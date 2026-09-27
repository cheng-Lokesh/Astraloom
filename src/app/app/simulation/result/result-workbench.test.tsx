import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FrozenRealityProfileCard, ResourceChangeCard } from "./result-workbench";

describe("formal Run resource result cards", () => {
  it("shows the frozen user-entered resource and its fact or assumption boundary", () => {
    const html = renderToStaticMarkup(createElement(FrozenRealityProfileCard, {
      profile: {
        status: "frozen",
        revision: 4,
        facts: [],
        assumptions: [],
        unknowns: [],
        structuredResources: [{
          key: "weekly-focus",
          label: "每周可投入时间",
          resourceType: "time",
          available: 8,
          unit: "小时",
          minimum: 2,
          maximum: 8,
          usePerTick: 1,
          classification: "assumption",
          evidenceSummary: "本人明确设定的模拟参数",
        }],
        structuredConstraints: [],
      },
    }));

    expect(html).toContain("冻结的结构化资源");
    expect(html).toContain("每周可投入时间");
    expect(html).toContain("8 小时");
    expect(html).toContain("模拟假设");
  });

  it("labels path changes as simulation rather than real-world outcomes", () => {
    const html = renderToStaticMarkup(createElement(ResourceChangeCard, {
      changes: [{ key: "change-1", pathKey: "path-1", label: "每周可投入时间", before: 8, after: 5, unit: "小时", minimum: 2, maximum: 8, boundary: "simulation_change" }],
    }));

    expect(html).toContain("结构化资源变化 · 模拟路径");
    expect(html).toContain("路径 1");
    expect(html).toContain("8 → 5 小时");
    expect(html).toContain("不代表现实中已经发生或必然发生");
  });
});
