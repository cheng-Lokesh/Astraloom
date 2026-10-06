import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as archive from "./archive-history-client";
import type { FormalSandboxResultProjection as Projection } from "@/lib/formal-sandbox/client";
import { buildSymbolicFrame } from "@/lib/formal-symbolic-lens/frame";

export function richProjection(): Projection {
  return {
    participants: [{ key: "person-1", label: "本人", role: "scenario decision maker" }, { key: "person-2", label: "协作伙伴", role: "frozen participant" }],
    relationships: [{ key: "relation-1", fromPersonKey: "person-1", toPersonKey: "person-2", label: "协作" }],
    facts: [{ key: "fact-1", statement: "已确认安排", boundary: "user_provided_fact" }], assumptions: [{ key: "assumption-1", statement: "可能调整", boundary: "system_assumption" }],
    realityProfile: { status: "frozen", revision: 2, facts: [{ key: "fact-1", label: "时间", statement: "已确认", evidenceSummary: "本人记录" }], assumptions: [{ key: "assumption-1", label: "安排", statement: "可能变化", evidenceSummary: "本人假设" }], unknowns: [{ key: "unknown-1", label: "机会" }], structuredResources: [{ key: "study-time", label: "学习时间", resourceType: "time", available: 12, unit: "小时", minimum: 0, maximum: 24, usePerTick: 2, classification: "fact", evidenceSummary: "本人确认" }], structuredConstraints: [{ key: "constraint-1", label: "完成准备", resourceLabel: "学习时间", rule: { kind: "before_time", value: "2026-11-01T00:00:00.000Z" }, classification: "assumption", evidenceSummary: "计划" }], worldVariables: [{ key: "world-variable-1", category: "pressure", label: "协作压力", value: "需要协调", classification: "fact", evidenceSummary: "本人确认", state: "static_without_explicit_rule" }] },
    digitalLifeModel: { status: "frozen", version: "digital-life-model-v1", profileRevision: 2, background: Array.from({ length: 14 }, (_, i) => ({ key: `background-${i + 1}`, label: `背景维度 ${i + 1}`, value: i === 13 ? "" : "已记录", classification: i === 13 ? "unknown" as const : i % 2 ? "assumption" as const : "fact" as const, evidenceSummary: "本人记录", usage: "background_only" as const })), agents: [{ key: "person-1", label: "本人", role: "user_core", strategyStatus: "not_applicable", evidenceSummary: "本人确认" }, { key: "person-2", label: "协作伙伴", role: "npc", strategyStatus: "not_defined", evidenceSummary: "本人确认" }], rules: [{ key: "rule-1", actorKey: "person-1", pathKey: "main", when: { kind: "at_tick", tickIndex: 0 }, operation: { actionType: "request_information", targetPersonKey: "person-2", question: "确认协作安排" }, actionType: "request_information", evidenceSummary: "明确假设", boundary: "confirmed_simulation_assumption" }], limitations: ["背景不作为行动规则"] },
    resourceChanges: [{ key: "change-1", pathKey: "path-1", label: "学习时间", before: 12, after: 10, unit: "小时", minimum: 0, maximum: 24, boundary: "simulation_change" }],
    relationshipChanges: [{ key: "relation-change-1", stepKey: "step-1", relationshipKey: "relation-1", before: "neutral", after: "positive", boundary: "simulation_change" }],
    steps: [{ key: "step-1", order: 1, label: "模拟协调", kind: "sandbox_simulation", boundary: "simulation_step", participantKeys: ["person-1", "person-2"], relationshipKeys: ["relation-1"] }],
    claims: [{ key: "claim-1", statement: "在确认假设下可协调", uncertainty: "条件性结论", boundary: "conditional_claim", stepKeys: ["step-1"], supportingStepKeys: ["step-1"], participantKeys: ["person-2"], relationshipKeys: ["relation-1"] }],
    symbolicLens: { status: "attached", frozenAt: "2026-10-06T00:00:00.000Z", preferenceRevision: 2, frame: buildSymbolicFrame({ birthDate: "2000-01-01", birthTime: null }, 1, "2026-10-06T00:00:00.000Z"), causalUse: false },
    strategyPaths: [],
  };
}
type Category = { id: string; label: string; status: string; left: unknown; right: unknown };
function compare(left: Projection, right: Projection): Category[] {
  const fn = (archive as unknown as Record<string, unknown>).buildHistoryComparisonModel;
  expect(fn, "complete frozen comparison model must exist").toBeTypeOf("function");
  return (fn as (a: Projection, b: Projection) => Category[])(left, right);
}
describe("Complete frozen History comparison", () => {
  it("classifies every frozen category and detects changes without matching ordinals", () => {
    const a = richProjection(); const b = structuredClone(a);
    b.digitalLifeModel!.background[0].value = "不同背景";
    b.digitalLifeModel!.agents[0].label = "另一人物";
    b.digitalLifeModel!.rules[0].evidenceSummary = "不同来源";
    b.realityProfile.facts[0].statement = "不同事实";
    b.realityProfile.assumptions[0].statement = "不同假设";
    b.realityProfile.unknowns[0].label = "不同未知";
    b.realityProfile.structuredResources[0].available = 9;
    b.realityProfile.structuredConstraints[0].rule.value = "2026-12-01T00:00:00.000Z";
    b.realityProfile.worldVariables[0].value = "另一压力";
    b.resourceChanges[0].after = 8; b.relationshipChanges![0].after = "negative";
    b.steps[0].label = "另一模拟"; b.claims[0].statement = "另一结论";
    b.symbolicLens!.frame!.dimensions[0].value = "另一象征主题";
    const rows = compare(a, b);
    expect(rows.map(row => row.id)).toEqual(["background", "people", "rules", "facts", "assumptions", "unknowns", "resources", "constraints", "world", "resource-changes", "relationship-changes", "steps", "claims", "strategies", "symbolic"]);
    expect(rows.filter(row => row.id !== "strategies").every(row => row.status === "different")).toBe(true);
  });
  it("separates reorder-only content from different contents and preserves duplicates", () => {
    const a = richProjection(); a.participants.push({ key: "person-3", label: "协作伙伴", role: "frozen participant" });
    const b = structuredClone(a); b.digitalLifeModel!.background.reverse();
    expect(compare(a, b).find(row => row.id === "background")?.status).toBe("order_only");
    b.digitalLifeModel!.agents[1].label = "另一位同序号人物";
    expect(compare(a, b).find(row => row.id === "people")?.status).toBe("different");
    b.digitalLifeModel!.background.push({ ...b.digitalLifeModel!.background[0], key: "background-20" });
    expect(compare(a, b).find(row => row.id === "background")?.status).toBe("different");
  });
  it("marks legacy missing data honestly and never fills it from the other Run", () => {
    const a = richProjection(); const b = richProjection(); delete b.digitalLifeModel; delete b.symbolicLens; delete b.relationshipChanges; delete b.strategyPaths;
    b.realityProfile = { status: "not_recorded", revision: null, facts: [], assumptions: [], unknowns: [], structuredResources: [], structuredConstraints: [], worldVariables: [] };
    for (const id of ["background", "rules", "facts", "resources", "symbolic", "relationship-changes"]) expect(compare(a, b).find(row => row.id === id)?.status).toBe("not_recorded");
  });
  it("keeps strategy claim and support references local to each independent path", () => {
    const a = richProjection(); const child = structuredClone(a); delete child.strategyPaths;
    const second = structuredClone(child); second.steps[0].label = "策略乙支持步骤"; second.claims[0].statement = "策略乙结论";
    a.strategyPaths = [{ key: "path-1", label: "策略甲", projection: child }, { key: "path-2", label: "策略乙", projection: second }];
    const rows = compare(a, structuredClone(a));
    const text = JSON.stringify(rows.find(row => row.id === "strategies"));
    expect(text).toContain("策略乙支持步骤"); expect(text).toContain("策略乙结论"); expect(text).toContain("模拟协调");
    expect(text).not.toContain("claim-1"); expect(text).not.toContain("step-1");
  });
  it("renders summary, side-specific original values, accessible disclosures and Result entries without internal keys", () => {
    const a = richProjection(); const b = richProjection(); b.realityProfile.structuredResources[0].available = 9;
    const html = renderToStaticMarkup(createElement(archive.HistoryComparisonPanel, { columns: [{ run: { id: "private-left", status: "completed" }, projection: a }, { run: { id: "private-right", status: "completed" }, projection: b }] }));
    for (const text of ["分类差异摘要", "相同内容", "差异", "一侧未记录", "仅顺序不同", "查看左右原值", "反馈作为后续Run记录输入，真实校准效果未完成", "资源量", "上限", "周期消耗", "截止", "背景维度 14", "明确未知", "象征", "非因果"]) expect(html).toContain(text);
    expect(html).toContain("<details"); expect(html).toContain("/app/simulation/result?run_id=private-left");
    for (const key of ["person-1", "claim-1", "background-1", "relation-1", "study-time", "birthDate", "2000-01-01"]) expect(html).not.toContain(key);
  });
});
