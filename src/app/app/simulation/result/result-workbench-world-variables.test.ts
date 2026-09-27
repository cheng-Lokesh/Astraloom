import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FrozenRealityProfileCard } from "./result-workbench";

describe("formal Run world-variable result explanation", () => {
  it("shows modeled pressure and external variables and explains why they stayed static", () => {
    const profile = Object.assign({
      status: "frozen" as const,
      revision: 4,
      facts: [],
      assumptions: [],
      unknowns: [],
      structuredResources: [],
      structuredConstraints: [],
    }, {
      worldVariables: [{
        key: "world-variable-1",
        category: "pressure" as const,
        label: "压力",
        value: "本季度存在明确的交付压力",
        classification: "assumption" as const,
        evidenceSummary: "本人提交的待验证情境",
        state: "static_without_explicit_rule" as const,
      }],
    });
    const html = renderToStaticMarkup(createElement(FrozenRealityProfileCard, { profile }));

    expect(html).toContain("进入本次模拟的压力与外部变量");
    expect(html).toContain("本季度存在明确的交付压力");
    expect(html).toContain("未提供变化规则，保持静态");
  });
});
