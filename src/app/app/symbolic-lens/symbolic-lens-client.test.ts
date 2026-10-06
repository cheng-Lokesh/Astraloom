import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SymbolicLensClient, SymbolicFrameView } from "./symbolic-lens-client";
import { buildSymbolicFrame } from "@/lib/formal-symbolic-lens/frame";
describe("symbolic lens account surface", () => {
  it("starts empty with unchecked consent and an explicit skip", () => {
    const markup = renderToStaticMarkup(createElement(SymbolicLensClient));
    expect(markup.includes('type="checkbox"')).toBe(true);
    expect(markup.includes('checked=""')).toBe(false);
    expect(markup.includes("暂时跳过")).toBe(true);
    expect(markup.includes("出生地点")).toBe(false);
    expect(markup.includes("尚未接入新运行")).toBe(true);
  });
  it("renders five explainable rows without birth values or source ids", () => {
    const source = { birthDate: "1991-06-15", birthTime: null };
    const frame = buildSymbolicFrame(source, 1, "2026-10-06T00:00:00Z");
    const markup = renderToStaticMarkup(createElement(SymbolicFrameView, { frame }));
    expect((markup.match(/data-symbolic-dimension=/g) ?? []).length).toBe(5);
    expect(markup.includes(source.birthDate)).toBe(false);
    expect(markup.includes("natal_stem_counts")).toBe(false);
    expect(markup.includes("查看计算依据")).toBe(true);
    expect(markup.includes("事实、假设")).toBe(false);
  });
});
