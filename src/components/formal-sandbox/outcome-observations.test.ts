import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OutcomeObservationsView, initialOutcomeDraft, outcomeDraftReducer } from "./outcome-observations";

const target = { key: "target-1", label: "本人主路径的资源投入条件", observationWindow: { startAt: "2026-10-01T00:00:00Z", horizonEnd: "2026-10-31T00:00:00Z" }, status: "observable" as const, reason: null, canRecordDidNotOccur: false, canRecordTypedObservation: true, correctionAllowed: true, criteriaStatus: "available" as const, conditions: [{ key: "condition-1", label: "本人投入的时间", kind: "allocate_resource" as const, expectedValue: 2, ruleKey: "rule-1", correctable: true, requiresTime: true, measurement: "operation" as const, actorLabel: "本人", resourceLabel: "时间", sequence: 1 }] };
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
    const legacy = { ...projection, lockStatus: "historical_lock_not_recorded" as const, targets: [{ ...target, status: "not_observable" as const, canRecordTypedObservation: false, correctionAllowed: false, conditions: [], reason: "此历史运行未记录事前锁定条件" }] };
    const html = renderToStaticMarkup(createElement(OutcomeObservationsView, { projection: legacy, draft: initialOutcomeDraft, targetKey: "target-1", phase: "ready", ...handlers }));
    expect(html).toContain("仅保存观察说明");
    expect(html).toContain("未记录事前锁定条件");
    expect(html).not.toContain('value="occurred"');
    expect(html).not.toContain("checked=");
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
    expect(html).not.toContain("checked=");
    const selected = renderToStaticMarkup(createElement(OutcomeObservationsView, { projection: mixed, draft: { ...initialOutcomeDraft, values: { "condition-1": 3 }, correctionRuleKey: "rule-1", confirmed: true }, targetKey: "target-1", phase: "ready", ...handlers }));
    expect(selected).toContain("我单独确认建立所选条件修正");
    expect(selected).toMatch(/<button[^>]+disabled=""[^>]*>保存本人观察/);
    const recorded = { ...mixed, history: [{ key: "observation-1", targetKey: "target-1", observed: "uncertain" as const, recordedAt: "2026-10-06T00:00:00Z", occurredAt: null, source: "user_observation" as const, evidenceSummary: "本人已记录投入", uncertainty: "high" as const, backtestStatus: "not_observable" as const, correctionAvailable: true, criteriaComparison: { status: "different" as const, differences: ["condition-1"] }, observations: [{ key: "condition-1", value: 3, occurredAt: "2026-10-02T00:00:00Z" }, { key: "condition-2", value: null, occurredAt: null }] }] };
    const history = renderToStaticMarkup(createElement(OutcomeObservationsView, { projection: recorded, draft: initialOutcomeDraft, targetKey: "target-1", phase: "ready", ...handlers }));
    expect(history).toContain("本人投入的时间：3");
    expect(history).toContain(`条件发生时间：${new Date("2026-10-02T00:00:00Z").toLocaleString()}`);
    expect(history).toContain("已保存条件 2：未记录");
  });
  it("keeps zero as an observation but does not offer an invalid zero-amount correction", () => {
    const edited = outcomeDraftReducer({ ...initialOutcomeDraft, values: { "condition-1": 3 }, correctionRuleKey: "rule-1", correctionConfirmed: true }, { type: "edit", field: "values", value: { "condition-1": 0 } });
    expect(edited.correctionRuleKey).toBe("");
    expect(edited.correctionConfirmed).toBe(false);
    const mixed = { ...projection, targets: [{ ...target, status: "not_observable" as const }] };
    const html = renderToStaticMarkup(createElement(OutcomeObservationsView, { projection: mixed, draft: { ...initialOutcomeDraft, evidenceSummary: "本人未投入资源", confirmed: true, values: { "condition-1": 0 }, conditionTimes: { "condition-1": "2026-10-02T08:00" } }, targetKey: "target-1", phase: "ready", ...handlers }));
    expect(html).not.toContain("供下一次运行参考的条件修正");
    expect(html).toContain("零投入仍可记录");
    expect(html).not.toMatch(/<button[^>]+disabled=""[^>]*>保存本人观察/);
  });
  it("shows frozen real-criteria comparison with safe differences and explicit unknown and legacy boundaries", () => {
    const historyItem = { key: "observation-1", targetKey: "target-1", observed: "uncertain" as const, recordedAt: "2026-10-06T00:00:00Z", occurredAt: null, source: "user_observation" as const, evidenceSummary: "本人实际投入记录", uncertainty: "high" as const, backtestStatus: "not_observable" as const, correctionAvailable: false, observations: [{ key: "condition-1", value: 3, occurredAt: "2026-10-02T00:00:00Z" }], criteriaComparison: { status: "different" as const, differences: ["condition-1"] } };
    const comparisons = { ...projection, targets: [{ ...target, status: "not_observable" as const }], history: [historyItem, { ...historyItem, key: "observation-2", observations: [{ key: "condition-1", value: 2, occurredAt: "2026-10-02T00:00:00Z" }], criteriaComparison: { status: "matched" as const, differences: [] } }, { ...historyItem, key: "observation-3", observations: [{ key: "condition-1", value: null, occurredAt: null }], criteriaComparison: { status: "unknown" as const, differences: [] } }, { ...historyItem, key: "observation-4", observations: [], criteriaComparison: { status: "not_recorded" as const, differences: [] } }] };
    const html = renderToStaticMarkup(createElement(OutcomeObservationsView, { projection: comparisons, draft: initialOutcomeDraft, targetKey: "target-1", phase: "ready", ...handlers }));
    expect(html).toContain("具体事实条件对照");
    expect(html).toContain("已记录条件存在差异");
    expect(html).toContain("已记录条件相符");
    expect(html).toContain("信息不足，暂不能对照");
    expect(html).toContain("未记录事前现实条件，仅保留本人观察");
    expect(html).toContain("差异 · 本人投入的时间 · 事前：2 · 本人观察：3");
    expect(html).toContain("数值相同也可能存在时间或顺序差异");
    expect(html).toContain("不表示整组模拟情景发生");
    expect(html).not.toContain("差异 · condition-1");
  });
  it("limits action counts to whole numbers without limiting resource amounts",()=>{
    const countTarget={...target,status:"not_observable" as const,conditions:[{...target.conditions[0],key:"condition-2",label:"实际次数",measurement:"event_count" as const,requiresTime:false}]};
    const draft={...initialOutcomeDraft,confirmed:true,evidenceSummary:"本人实际次数",values:{"condition-2":1.5}};
    const html=renderToStaticMarkup(createElement(OutcomeObservationsView,{projection:{...projection,targets:[countTarget]},draft,targetKey:"target-1",phase:"ready",...handlers}));
    expect(html).toContain('step="1"');expect(html).toMatch(/<button[^>]+disabled=""[^>]*>保存本人观察/);
    const amount=renderToStaticMarkup(createElement(OutcomeObservationsView,{projection,draft:initialOutcomeDraft,targetKey:"target-1",phase:"ready",...handlers}));
    expect(amount).toContain('step="any"');
  });
});
