import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { defaultPlanningContextSchema } from "@/lib/formal-planning/contracts";
import { buildPlanningRequest, DefaultPlanningEditor, emptyPlanningDraft } from "./default-planning-editor";

const context = defaultPlanningContextSchema.parse({ version: "formal-default-planner-v1", consentContext: "a".repeat(64), profileRevision: 3,
  resources: [{ resourceKey: "resource-1", label: "时间", unit: "小时", available: 12, minimum: 2, declaredRate: null, explicitRulePresent: false }],
  symbolicFusion: { status: "eligible", classification: "hypothesis", relationshipEffect: "not_implemented" },
});
describe("separate explicit planning authorization", () => {
  it("defaults every authorization off and permits zero resource budgets", () => {
    const draft = emptyPlanningDraft();
    expect(buildPlanningRequest(context, draft)).toEqual({ version: context.version, consentContext: context.consentContext, resources: [], fusion: { enabled: false, confirmedForSimulation: false } });
    const html = renderToStaticMarkup(createElement(DefaultPlanningEditor, { context, draft, onChange: () => {}, disabled: false }));
    expect(html.includes('checked=""')).toBe(false);
    expect(html.includes("整次模拟预算上限 ·")).toBe(false);
    expect(html.includes(context.consentContext)).toBe(false);
    expect(html.includes("5%")).toBe(true);
    expect(html.includes("10%")).toBe(true);
  });
  it("requires separate confirmation, positive budget, eligible source and only current resource keys", () => {
    const draft = { ...emptyPlanningDraft(), resources: { "resource-1": { enabled: true, budget: "3", confirmed: false } } };
    expect(buildPlanningRequest(context, draft)).toBeNull();
    draft.resources["resource-1"].confirmed = true;
    expect(buildPlanningRequest(context, draft)?.resources[0].totalBudgetLimit).toBe(3);
    expect(buildPlanningRequest(context, { ...draft, fusionEnabled: true })).toBeNull();
    expect(buildPlanningRequest(context, { ...draft, fusionEnabled: true, fusionConfirmed: true })?.fusion.enabled).toBe(true);
    expect(buildPlanningRequest({ ...context, symbolicFusion: { ...context.symbolicFusion, status: "unavailable" } }, { ...draft, fusionEnabled: true, fusionConfirmed: true })).toBeNull();
    expect(buildPlanningRequest({ ...context, resources: [] }, draft)).toBeNull();
    expect(buildPlanningRequest(context, { ...draft, resources: { "resource-1": { enabled: true, budget: "0", confirmed: true } } })).toBeNull();
    expect(buildPlanningRequest(context, { ...draft, resources: { "resource-1": { enabled: true, budget: "Infinity", confirmed: true } } })).toBeNull();
  });
  it("discloses declared rate or manual rule conflicts without replacing them", () => {
    const html = renderToStaticMarkup(createElement(DefaultPlanningEditor, { context: { ...context, resources: [{ ...context.resources[0], declaredRate: 2 }] }, draft: emptyPlanningDraft(), onChange: () => {}, disabled: false }));
    expect(html.includes("明确每周期投入量 2 小时")).toBe(true);
    expect(html.includes("disabled")).toBe(true);
    const ruleHtml = renderToStaticMarkup(createElement(DefaultPlanningEditor, { context, draft: emptyPlanningDraft(), onChange: () => {}, disabled: false, explicitRuleResourceKeys: ["resource-1"] }));
    expect(ruleHtml.includes("已有明确行动规则")).toBe(true);
  });
});
