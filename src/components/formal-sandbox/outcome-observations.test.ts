import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OutcomeObservationsView, initialOutcomeDraft, outcomeDraftReducer } from "./outcome-observations";

const target = { key: "target-1", label: "本人主路径的资源投入条件", observationWindow: { startAt: "2026-10-01T00:00:00Z", horizonEnd: "2026-10-31T00:00:00Z" }, status: "observable" as const, reason: null, canRecordDidNotOccur: false, conditions: [{ key: "condition-1", label: "本人投入的时间", kind: "allocate_resource" as const, expectedValue: 2, ruleKey: "rule-1", correctable: true, requiresTime: true }] };
const projection = { lockStatus: "available" as const, assessedAt: "2026-10-06T00:00:00Z", targets: [target], history: [], calibration: { status: "insufficient_data" as const, sampleCount: 0, minimumSampleSize: 5 as const } };
const handlers = { onTargetChange: () => {}, onDraftChange: () => {}, onSave: () => {}, onRetry: () => {}, onRecover: () => {} };
describe("personal outcome capture", () => {
  it("shows complete conditions, an unchecked confirmation and an honest small-sample boundary", () => {
    const html = renderToStaticMarkup(createElement(OutcomeObservationsView, { projection, draft: initialOutcomeDraft, targetKey: "target-1", phase: "ready", ...handlers }));
    expect(html).toContain("本人投入的时间");
    expect(html).toContain("尚不能确认未发生");
    expect(html).toContain("我确认以上是本人观察");
    expect(html).not.toContain("checked=");
    expect(html).toContain("样本不足");
    expect(html).not.toMatch(/准确率|科学概率/);
  });
  it("keeps legacy notes separate from prelocked scoring", () => {
    const legacy = { ...projection, lockStatus: "historical_lock_not_recorded" as const, targets: [{ ...target, status: "not_observable" as const, conditions: [], reason: "此历史运行未记录事前锁定条件" }] };
    const html = renderToStaticMarkup(createElement(OutcomeObservationsView, { projection: legacy, draft: initialOutcomeDraft, targetKey: "target-1", phase: "ready", ...handlers }));
    expect(html).toContain("仅保存观察说明");
    expect(html).toContain("未记录事前锁定条件");
    expect(html).not.toContain('value="occurred"');
    expect(html).not.toContain('value="did_not_occur"');
  });
  it("never changes an unknown-outcome request body when edited or retried", () => {
    const pending = outcomeDraftReducer({ ...initialOutcomeDraft, evidenceSummary: "本人观察记录", confirmed: true }, { type: "unknown" });
    expect(outcomeDraftReducer(pending, { type: "edit", field: "evidenceSummary", value: "不同记录" })).toEqual(pending);
    expect(outcomeDraftReducer(pending, { type: "edit", field: "confirmed", value: false })).toEqual(pending);
    expect(outcomeDraftReducer(pending, { type: "recover" }).evidenceSummary).toBe("本人观察记录");
  });
  it("clears all old conditions and confirmation when selecting a different target", () => {
    expect(outcomeDraftReducer({ ...initialOutcomeDraft, confirmed: true, values: { "condition-1": 9 }, correctionRuleKey: "rule-1" }, { type: "target" })).toEqual(initialOutcomeDraft);
  });
  it("retains typed timed observations and a separate correction for a non-scored mixed target", () => {
    const mixed = { ...projection, targets: [{ ...target, status: "not_observable" as const, reason: "混合关系回应条件不具备整组可评分依据" }] };
    const html = renderToStaticMarkup(createElement(OutcomeObservationsView, { projection: mixed, draft: { ...initialOutcomeDraft, values: { "condition-1": 3 } }, targetKey: "target-1", phase: "ready", ...handlers }));
    expect(html).toContain("实际观察 · 本人投入的时间");
    expect(html).toContain("条件发生时间 · 本人投入的时间");
    expect(html).toContain("供下一次运行参考的条件修正");
    expect(html).toContain("仅保留本人观察，不对整组条件评分");
    expect(html).not.toContain('value="occurred"');
  });
});
