import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { DigitalLifeModelCard, StrategyPathsCard } from "./result-workbench";

it("separates frozen background facts, assumptions and unknowns, and explains conditional rules", () => {
  const html = renderToStaticMarkup(createElement(DigitalLifeModelCard, { model: { status: "frozen", version: "digital-life-model-v1", profileRevision: 2, background: [{ key: "background-1", label: "当前目标", value: "完成共同任务", classification: "fact", evidenceSummary: "本人确认的目标", usage: "background_only" }, { key: "background-2", label: "生活阶段", value: "", classification: "unknown", evidenceSummary: "尚未提供", usage: "background_only" }], agents: [{ key: "person-4", label: "本人", role: "user_core", strategyStatus: "not_applicable", evidenceSummary: "冻结人物快照" }], rules: [{ key: "rule-1", actorKey: "person-4", pathKey: "main", when: { kind: "at_tick", tickIndex: 0 }, actionType: "request_information", operation: { actionType: "request_information", targetPersonKey: "person-8", question: "询问工作安排" }, evidenceSummary: "本人提出的沟通假设", boundary: "confirmed_simulation_assumption" }], limitations: ["背景记录不代表已建立因果规则"] } }));
  expect(html).toContain("事实"); expect(html).toContain("假设"); expect(html).toContain("未知");
  expect(html).toContain("第 1 模拟周期"); expect(html).toContain("本人提出的沟通假设");
  expect(html).toContain('href="/app/reality-profile"');
  expect(html).not.toContain("person-4"); expect(html).not.toContain("rule-1");
});

it("shows honest historical absence and does not invent a strategy", () => {
  const modelHtml = renderToStaticMarkup(createElement(DigitalLifeModelCard, {}));
  expect(modelHtml).toContain("未记录数字生命规则");
  const pathHtml = renderToStaticMarkup(createElement(StrategyPathsCard, { paths: [] }));
  expect(pathHtml).toContain("未设置独立策略");
  expect(pathHtml).toContain("采样路径");
});

it("shows each strategy's own resource changes and event-backed claim without baseline feedback controls", () => {
  const html = renderToStaticMarkup(createElement(StrategyPathsCard, { paths: [{ key: "path-1", label: "先补全信息", projection: { participants: [], relationships: [], facts: [], assumptions: [], realityProfile: { status: "not_recorded", revision: null, facts: [], assumptions: [], unknowns: [], structuredResources: [], structuredConstraints: [], worldVariables: [] }, resourceChanges: [{ key: "change-1", pathKey: "path-1", label: "专注时间", before: 8, after: 6, unit: "小时", minimum: 2, maximum: 8, boundary: "simulation_change" }], steps: [{ key: "step-1", order: 1, label: "条件沟通", kind: "sandbox_simulation", boundary: "simulation_step", participantKeys: [], relationshipKeys: [] }], claims: [{ key: "claim-1", statement: "沟通后信息可能增加", uncertainty: "取决于用户确认的回应假设", boundary: "conditional_claim", stepKeys: ["step-1"], supportingStepKeys: ["step-1"], participantKeys: [], relationshipKeys: [] }] } }] }));
  expect(html).toContain("专注时间");
  expect(html).toContain("8 → 6 小时");
  expect(html).toContain("沟通后信息可能增加");
  expect(html).toContain("条件沟通");
  expect(html).not.toContain("反馈这条结论");
  expect(html).not.toContain("claim-1");
});
