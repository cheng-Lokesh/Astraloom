import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { freezeDefaultPlanning } from "@/lib/formal-planning";
import { planningRequest, planningSource } from "@/lib/formal-planning/test-fixtures";
import { projectDefaultPlanning } from "@/lib/formal-planning/projection";
import { safeRelationshipResponseSchema } from "@/lib/formal-planning/relationship-contracts";
import { FrozenDefaultPlanningResult } from "./frozen-default-planning";
import { FrozenRelationshipResponseResult } from "./frozen-relationship-response";

export const relationshipResultFixture = () => safeRelationshipResponseSchema.parse({ version: "formal-relationship-response-hypothesis-v1", pathKey: "main", status: "active",
  selfLabel: "本人", npcLabel: "协作对象", relationLabel: "协作关系", resourceLabel: "时间", unit: "小时", signal: "negative",
  baseNegativeReduction: 0.05, symbolicAdditionalReduction: 0.05, negativeReduction: 0.1, reductionCap: 0.1, symbolicStatus: "active",
  classification: "hypothesis", realWorldEvidence: false, scientificProbability: false,
  samples: [{ key: "sample-1", status: "selected", responseTickNumber: 2, allocationTickNumber: 3, neutralAmount: 1, proposedAmount: 0.9, actualAmount: 0.9, appliedReduction: 0.1,
    assumptionCategories: ["formal_default_planning_resource_1", "formal_relationship_response_v1"] },
  { key: "sample-2", status: "not_selected", responseTickNumber: 2, allocationTickNumber: null, neutralAmount: 1, proposedAmount: 0.9, actualAmount: null, appliedReduction: 0.1, assumptionCategories: ["formal_relationship_response_v1"] },
  { key: "sample-3", status: "not_triggered", responseTickNumber: null, allocationTickNumber: null, neutralAmount: 1, proposedAmount: null, actualAmount: null, appliedReduction: null, assumptionCategories: [] }] });
function planningResult() {
  const frozen = freezeDefaultPlanning(planningRequest(false), planningSource());
  if (!frozen.ok) throw new Error("invalid_fixture");
  return { ...projectDefaultPlanning(frozen.planning), relationshipResponse: relationshipResultFixture() };
}

it("shows the frozen response hypothesis and separate selected, unselected and not-triggered samples", () => {
  const html = renderToStaticMarkup(createElement(FrozenDefaultPlanningResult, { planning: planningResult() }));
  expect(html.includes("模拟回应 → 我的后续投入")).toBe(true);
  expect(html.includes("协作对象") && html.includes("消极模拟回应")).toBe(true);
  expect(html.includes("实际受控投入 0.9 小时")).toBe(true);
  expect(html.includes("候选未被选中；没有对应的回应调整投入事件")).toBe(true);
  expect(html.includes("关系调整未触发；本样本的中性投入仍见默认规划事件对照")).toBe(true);
  expect(html.includes("不是对方真实态度") && html.includes("不是预测概率")).toBe(true);
  expect(/sourceAgent|sourceEdge|rule-[0-9]|person-[0-9]|world_event_v2_|assumption_v2_/.test(html)).toBe(false);
});

it("keeps inactive and positive response quantities distinct without fabricating missing allocations", () => {
  const inactive = safeRelationshipResponseSchema.parse({ ...relationshipResultFixture(), status: "explicit_rate", samples: [{ ...relationshipResultFixture().samples[2], status: "inactive" }] });
  const html = renderToStaticMarkup(createElement(FrozenRelationshipResponseResult, { response: inactive }));
  expect(html.includes("保留背景资料中明确的每周期投入量")).toBe(true);
  expect(html.includes("不补写实际用量")).toBe(true);
  expect(html.includes("实际受控投入")).toBe(false);
  const positive = safeRelationshipResponseSchema.parse({ ...relationshipResultFixture(), signal: "positive", symbolicStatus: "off", symbolicAdditionalReduction: 0, negativeReduction: 0.05,
    samples: [{ ...relationshipResultFixture().samples[0], proposedAmount: 1, actualAmount: 1, appliedReduction: 0 }] });
  const positiveHtml = renderToStaticMarkup(createElement(FrozenRelationshipResponseResult, { response: positive }));
  expect(positiveHtml.includes("积极模拟回应")).toBe(true);
  expect(positiveHtml.includes("实际受控投入 1 小时")).toBe(true);
  expect(positiveHtml.includes("减少 0%")).toBe(true);
});

it("does not reconstruct any relationship response for legacy absence", () => {
  expect(renderToStaticMarkup(createElement(FrozenRelationshipResponseResult, {}))).toBe("");
  expect(() => safeRelationshipResponseSchema.parse({ ...relationshipResultFixture(), samples: [{ ...relationshipResultFixture().samples[0], actualAmount: null }] })).toThrow();
});
