import { describe, expect, it } from "vitest";
import { defaultPlanningContextSchema } from "@/lib/formal-planning/contracts";
import { relationshipResponseRequestSchema } from "@/lib/formal-planning/relationship-contracts";
import { digitalLifeRules, ids } from "@/lib/digital-life/test-fixtures";
import { digitalLifeRulesSchema } from "@/lib/digital-life/model";
import { buildPlanningRequest, emptyPlanningDraft } from "./default-planning-editor";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { safeDigitalLifeContextSchema } from "@/lib/formal-sandbox/model-context";
import { buildRelationshipResponseRequest, emptyRelationshipResponseDraft, listRelationshipResponsePairs, RelationshipResponseEditor } from "./relationship-response-editor";

const planning = defaultPlanningContextSchema.parse({ version: "formal-default-planner-v1", consentContext: "a".repeat(64), profileRevision: 2,
  resources: [{ resourceKey: "resource-1", label: "时间", unit: "小时", available: 8, minimum: 1, declaredRate: null, explicitRulePresent: false }],
  symbolicFusion: { status: "eligible", classification: "hypothesis", relationshipEffect: "not_implemented" } });
const rules = digitalLifeRulesSchema.parse(digitalLifeRules());
const model = safeDigitalLifeContextSchema.parse({ graphSnapshotId: ids.graph, agentSnapshotId: ids.snapshot, profileRevision: 2,
  agents: [{ key: "person-1", label: "本人", role: "user_core" }, { key: "person-2", label: "协作对象", role: "npc" }, { key: "person-3", label: "平行自我", role: "user_variant" }],
  relationships: [{ key: "relation-1", label: "协作关系", fromPersonKey: "person-1", toPersonKey: "person-2" }], resources: [] });
const budgets = { ...emptyPlanningDraft(), resources: { "resource-1": { enabled: true, budget: "3", confirmed: true } } };
const enabled = { ...emptyRelationshipResponseDraft(), enabled: true, pairKey: "main:rule-1:rule-2", resourceKey: "resource-1", confirmed: true };

describe("relationship response planning authorization", () => {
  it("includes the independently confirmed full request/response pair rather than silently retaining v1", () => {
    const relationshipResponse = relationshipResponseRequestSchema.parse({ version: "formal-relationship-response-hypothesis-v1", pathKey: "main", resourceKey: "resource-1", confirmedForSimulation: true,
      requestRule: rules.actions[0], responseRule: rules.actions[1], symbolicSensitivity: { enabled: false, confirmedForSimulation: false } });
    const draft = { ...emptyPlanningDraft(), resources: { "resource-1": { enabled: true, budget: "3", confirmed: true } }, relationshipResponse };
    const request = buildPlanningRequest(planning, draft);
    expect(request?.version).toBe("formal-default-planner-v2");
    expect(request?.version === "formal-default-planner-v2" && request.relationshipResponse).toEqual(relationshipResponse);
    expect(JSON.stringify(request).includes(ids.owner)).toBe(false);
  });
  it("offers only existing same-path self request to an NPC's confirmed response", () => {
    expect(listRelationshipResponsePairs(model, rules).map(pair => pair.label)).toEqual(["本人 → 协作对象：积极模拟回应"]);
    expect(listRelationshipResponsePairs(model, { ...rules, actions: [rules.actions[1]] })).toHaveLength(0);
    expect(listRelationshipResponsePairs(model, { ...rules, actions: [rules.actions[0], { ...rules.actions[1], pathKey: "person-3" }] })).toHaveLength(0);
    expect(listRelationshipResponsePairs({ ...model, agents: model.agents.map(item => item.key === "person-2" ? { ...item, role: "user_variant" } : item) }, rules)).toHaveLength(0);
  });
  it("keeps response and symbol authorization off and requires independent budget and sensitivity consent", () => {
    expect(buildRelationshipResponseRequest(model, rules, planning, budgets, emptyRelationshipResponseDraft())).toBeUndefined();
    expect(buildRelationshipResponseRequest(model, rules, planning, emptyPlanningDraft(), enabled)).toBeNull();
    expect(buildRelationshipResponseRequest(model, rules, planning, budgets, { ...enabled, confirmed: false })).toBeNull();
    expect(buildRelationshipResponseRequest(model, rules, planning, budgets, enabled)?.symbolicSensitivity.enabled).toBe(false);
    expect(buildRelationshipResponseRequest(model, rules, planning, budgets, { ...enabled, symbolicEnabled: true })).toBeNull();
    expect(buildRelationshipResponseRequest(model, rules, planning, budgets, { ...enabled, symbolicEnabled: true, symbolicConfirmed: true })?.symbolicSensitivity.enabled).toBe(true);
    expect(buildRelationshipResponseRequest(model, rules, { ...planning, symbolicFusion: { ...planning.symbolicFusion, status: "off" } }, budgets, { ...enabled, symbolicEnabled: true, symbolicConfirmed: true })).toBeNull();
    expect(buildRelationshipResponseRequest(model, { ...rules, actions: [] }, planning, budgets, enabled)).toBeNull();
  });
  it("keeps legacy v1 when off, and rejects a response resource without its own budget", () => {
    expect(buildPlanningRequest(planning, budgets)?.version).toBe("formal-default-planner-v1");
    const relationshipResponse = buildRelationshipResponseRequest(model, rules, planning, budgets, enabled);
    if (!relationshipResponse) throw new Error("invalid_fixture");
    expect(buildPlanningRequest(planning, { ...emptyPlanningDraft(), relationshipResponse })).toBeNull();
  });
  it("teaches the missing pair configuration and exposes semantic controls without private keys", () => {
    const html = renderToStaticMarkup(createElement(RelationshipResponseEditor, { context: model, rules: { actions: [], strategies: [] }, planning,
      budgets, draft: emptyRelationshipResponseDraft(), onChange: () => {} }));
    expect(html.includes("模拟回应 → 我的后续投入")).toBe(true);
    expect(html.includes('href="#formal-action-rules"')).toBe(true);
    expect(html.includes("不会自动补写对方回应")).toBe(true);
    expect(html.includes("<fieldset")).toBe(true);
    expect(html.includes("<legend")).toBe(true);
    expect(html.includes('checked=""')).toBe(false);
    expect(html.includes(planning.consentContext)).toBe(false);
  });
  it("discloses selected manual rate conflicts and retains the off control", () => {
    const html = renderToStaticMarkup(createElement(RelationshipResponseEditor, { context: model, rules,
      planning: { ...planning, resources: [{ ...planning.resources[0], declaredRate: 1 }] }, budgets, draft: enabled, onChange: () => {} }));
    expect(html.includes("回应调整将未生效，不会覆盖它")).toBe(true);
    expect(html.includes("你可以取消本项选择或关闭回应调整")).toBe(true);
    expect(html.includes("本人 → 协作对象：积极模拟回应")).toBe(true);
    expect(html.includes("5%") && html.includes("10%") && html.includes("不是科学权重、预测概率")).toBe(true);
  });
});
