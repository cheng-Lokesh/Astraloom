import { describe, expect, it } from "vitest";

import {
  buildRealityWorldProjection,
  realityProfileDraftSchema,
} from "./profile";

describe("Reality Profile", () => {
  it("keeps confirmed facts, assumptions, and unknowns distinct while deriving the locked-graph state", () => {
    const draft = realityProfileDraftSchema.parse({
      lifeClimate: { value: "当前协作节奏变化较多", classification: "fact", evidenceSummary: "用户已确认的近期工作观察" },
      resources: { value: "可协调的支持有限", classification: "assumption", evidenceSummary: "仍待复核" },
      constraints: { value: "", classification: "unknown", evidenceSummary: "明确未知" },
      revision: 2,
    });

    expect(buildRealityWorldProjection(draft, { graphLocked: true, latestRunEvent: "cooperation" })).toEqual({
      reality: {
        facts: [{ label: "当前协作节奏变化较多", evidenceSummary: "用户已确认的近期工作观察" }],
        assumptions: [{ label: "可协调的支持有限", evidenceSummary: "仍待复核" }],
        unknowns: [{ label: "约束" }],
      },
      world: {
        state: "locked_graph",
        resources: [{ label: "可协调的支持有限", evidenceSummary: "仍待复核" }],
        constraints: [],
        changeNodes: [{ label: "协作变化", evidenceSummary: "来自当前正式运行的受控模拟事件" }],
      },
    });
  });

  it("fails closed for identifiers, raw scenarios, and unsafe evidence summaries", () => {
    expect(() => realityProfileDraftSchema.parse({
      lifeClimate: { value: "plain", classification: "fact", evidenceSummary: "safe" },
      resources: { value: "plain", classification: "fact", evidenceSummary: "550e8400-e29b-41d4-a716-446655440000" },
      constraints: { value: "raw scenario", classification: "fact", evidenceSummary: "safe" },
      revision: 0,
    })).toThrow();
  });

  it("preserves each classification when separate fields share the same description", () => {
    const projection = buildRealityWorldProjection({
      lifeClimate: { value: "支持有限", classification: "fact", evidenceSummary: "已确认的当前情况" },
      resources: { value: "支持有限", classification: "assumption", evidenceSummary: "需要后续复核" },
      constraints: { value: "", classification: "unknown", evidenceSummary: "明确未知" },
      revision: 1,
    }, { graphLocked: false, latestRunEvent: null });

    expect(projection.reality.facts).toEqual([{ label: "支持有限", evidenceSummary: "已确认的当前情况" }]);
    expect(projection.reality.assumptions).toEqual([{ label: "支持有限", evidenceSummary: "需要后续复核" }]);
  });
});
