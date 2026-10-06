import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CalibrationSelection } from "./calibration-selection";

const context = { status: "available" as const, graphSnapshotId: "00000000-0000-4000-8000-000000000001", profileRevision: 3, corrections: [{ key: `correction-v1-${"a".repeat(64)}`, label: "本人投入时间", evidenceSummary: "本人观察记录", ruleKey: "rule-1", kind: "allocate_resource" as const, previousValue: 2, nextValue: 3, version: 1 as const, status: "eligible" as const, reason: null }, { key: `correction-v1-${"b".repeat(64)}`, label: "先前合作回应", evidenceSummary: "此前观察", ruleKey: "rule-2", kind: "update_relation_signal" as const, previousValue: "positive" as const, nextValue: "neutral" as const, version: 1 as const, status: "incompatible" as const, reason: "绑定条件已过期或不适用于当前模型" }] };
describe("explicit next-run calibration selection", () => {
  it("defaults off, shows bindings and incompatible reasons, and offers no arbitrary replacement inputs", () => {
    const html = renderToStaticMarkup(createElement(CalibrationSelection, { context, selectedKeys: [], confirmed: false, onChange: () => {}, onConfirm: () => {}, disabled: false }));
    expect(html).not.toContain("checked=");
    expect(html).toContain("本人投入时间");
    expect(html).toContain("2 → 3");
    expect(html).toContain("绑定条件已过期或不适用于当前模型");
    expect(html).toContain("条件假设");
    expect(html).not.toContain('type="number"');
    expect(html).not.toContain(context.graphSnapshotId);
  });
  it("explains an empty context without claiming a measurable improvement", () => {
    const html = renderToStaticMarkup(createElement(CalibrationSelection, { context: { ...context, corrections: [] }, selectedKeys: [], confirmed: false, onChange: () => {}, onConfirm: () => {}, disabled: false }));
    expect(html).toContain("暂无适用于当前模型的观察修正");
    expect(html).not.toMatch(/提高准确率|科学概率/);
  });
});
