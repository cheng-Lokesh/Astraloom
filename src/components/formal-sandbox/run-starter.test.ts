import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormalRunStartError, isCurrentPlanningContext } from "./run-starter";
import { defaultPlanningContextSchema } from "@/lib/formal-planning/contracts";

describe("formal Run start errors", () => {
  it("directs users to add explicit resource inputs when the World model is missing", () => {
    const html = renderToStaticMarkup(createElement(FormalRunStartError, { errorCode: "world_model_required" }));

    expect(html.includes("明确授权资源预算、添加行动规则")).toBe(true);
    expect(html).toContain('href="/app/reality-profile"');
    expect(html).toContain("修改背景资料");
  });

  it("keeps unrelated failures on the locked Graph retry guidance", () => {
    const html = renderToStaticMarkup(createElement(FormalRunStartError, { errorCode: "graph_not_found" }));

    expect(html.includes("无法开始运行。请检查已锁定关系图后重试")).toBe(true);
    expect(html.includes("graph_not_found")).toBe(false);
  });
  it("discloses a stale planning source without internal identifiers and ignores stale generations", () => {
    const html = renderToStaticMarkup(createElement(FormalRunStartError, { errorCode: "planning_context_stale" }));
    expect(html.includes("旧规划授权已清空")).toBe(true);
    const context = defaultPlanningContextSchema.parse({ version: "formal-default-planner-v1", consentContext: "a".repeat(64), profileRevision: 3, resources: [], symbolicFusion: { status: "off", classification: "hypothesis", relationshipEffect: "not_implemented" } });
    expect(isCurrentPlanningContext(context, 3, 2, 2)).toBe(true);
    expect(isCurrentPlanningContext(context, 3, 1, 2)).toBe(false);
    expect(isCurrentPlanningContext(context, 4, 2, 2)).toBe(false);
  });
});
