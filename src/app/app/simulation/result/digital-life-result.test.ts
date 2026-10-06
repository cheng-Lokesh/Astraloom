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
