import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("displays evidence source categories and counts without rendering stored references", async () => {
  const { GraphEvidenceSummary } = await import("./graph-evidence-summary");
  const reference = "seed_context:00000000-0000-4000-8000-000000000001:0123456789abcdef";
  const html = renderToStaticMarkup(createElement(GraphEvidenceSummary, { references: [reference, "key_person:confirmed", "agent:user_core"] }));
  expect(html).toContain("3 条已保存证据");
  expect(html).toContain("已提交情境"); expect(html).toContain("已确认人物"); expect(html).toContain("冻结人物快照");
  expect(html).not.toContain(reference); expect(html).not.toContain("00000000");
});

it("uses the safe evidence summary in the explicit Graph entry", () => {
  const source = readFileSync(new URL("../../app/app/new/graph/page.tsx", import.meta.url), "utf8");
  expect(source.includes("<GraphEvidenceSummary references={edge.evidence_refs}")).toBe(true);
  expect(source.includes("{reference}</span>")).toBe(false);
});
