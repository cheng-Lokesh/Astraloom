import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SandboxLedger } from "./sandbox-dashboard-client";
import { buildSandboxOverview } from "@/lib/sandbox-overview/overview.server";
import { createEmptyRealityProfileDraft } from "@/lib/reality-profile/profile";

describe("My Sandbox dashboard behavior", () => {
  it("renders current people, ordinal relations, model boundaries and one current-chain action", () => {
    const html = renderToStaticMarkup(createElement(SandboxLedger, { overview: {
      authenticated: true,
      seed: { state: "submitted" }, reality: { facts: [{ label: "正式现实情境已提交", evidenceSummary: "账户已保存的正式链状态" }], assumptions: [], unknowns: [{ label: "人生气候" }, { label: "资源" }, { label: "约束" }], dimensions: [
        { label: "目标", facts: 0, assumptions: 0, unknowns: 1 },
        { label: "价值观", facts: 0, assumptions: 0, unknowns: 1 },
        { label: "人生主题", facts: 0, assumptions: 0, unknowns: 1 },
        { label: "压力", facts: 0, assumptions: 0, unknowns: 1 },
        { label: "外部变量", facts: 0, assumptions: 0, unknowns: 1 },
      ] },
      people: { confirmedCount: 2, total: 2, items: [{ key: "person-1", label: "Scenario owner", relationship: "self", kind: "user_core" }, { key: "person-2", label: "Current collaborator", relationship: "collaborator", kind: "npc" }] },
      agents: { immutableCount: 2 },
      graph: { exists: true, locked: true, edgeCount: 1 }, relations: { total: 1, items: [{ key: "relation-1", fromPersonKey: "person-1", toPersonKey: "person-2", label: "collaboration" }] },
      running: { exists: false, href: null }, latestCompletedRun: { status: "completed", completedAt: "2026-09-08T08:00:00.000Z", href: "/app/simulation/result?run_id=opaque" },
      history: { count: 1 }, feedback: { exists: true }, lifeClimate: { state: "not_modeled" }, resources: { state: "not_modeled" }, constraints: { state: "not_modeled" }, nextChange: { state: "not_modeled" },
      nextAction: { kind: "start_next_run", href: "/app/new/graph" },
      world: { state: "locked_graph", changeNodes: [{ label: "协作变化", evidenceSummary: "来自当前正式运行的受控模拟事件" }], resources: [{ label: "可协调的支持有限", classification: "assumption", evidenceSummary: "仍待复核" }], constraints: [{ label: "尚未填写", classification: "unknown", evidenceSummary: "明确未知" }], goals: [{ label: "已确认目标", classification: "fact", evidenceSummary: "用户确认" }], values: [], lifeThemes: [], pressures: [], externalVariables: [] },
    } }));

    expect(html).toContain("当前人物");
    expect(html).toContain("Scenario owner");
    expect(html).toContain("当前关系");
    expect(html).toContain("person-1");
    expect(html).toContain("尚未建模");
    expect(html).toContain("开始下一次 Run");
    expect(html).toContain("Reality Profile");
    expect(html).toContain("目标");
    expect(html).toContain("价值观");
    expect(html).toContain("人生主题");
    expect(html).toContain("压力");
    expect(html).toContain("外部变量");
    expect(html).toContain("World State");
    expect(html).toContain("事实");
    expect(html).toContain("协作变化");
    expect(html).toContain("可协调的支持有限");
    expect(html).toContain("分类：假设");
    expect(html).toContain("分类：未知");
    expect(html).toContain("分类：事实");
    expect(html.match(/href="\/app\/new\/graph"/g)).toHaveLength(1);
    expect(html).not.toMatch(/[0-9a-f]{8}-[0-9a-f-]{27}/i);
  });

  it("renders saved resource values, bounds, per-run usage and bound deadlines", () => {
    const overview = buildSandboxOverview({
      authenticated: true,
      seed: { submitted: true },
      confirmedPeopleCount: 0,
      immutableAgentsCount: 0,
      graph: { exists: false, locked: false, edgeCount: 0 },
      runningRun: null,
      latestCompletedRun: null,
      historyCount: 0,
      hasFeedback: false,
      realityProfile: {
        ...createEmptyRealityProfileDraft(3),
        worldInputs: {
          version: 1,
          resources: [
            { key: "weekly-time", label: "每周可投入时间", resourceType: "time", available: 8, unit: "小时/周", minimum: 2, maximum: 16, usePerTick: 1, classification: "fact", evidenceSummary: "用户明确确认的每周时间" },
            { key: "monthly-budget", label: "每月预算", resourceType: "budget", available: 1200, unit: "元/月", minimum: 0, maximum: 2500, usePerTick: null, classification: "assumption", evidenceSummary: "预算仍待复核" },
          ],
          constraints: [{ key: "project-deadline", label: "项目截止期限", resourceKey: "weekly-time", rule: { kind: "before_time", value: "2026-12-01T00:00:00.000Z" }, classification: "fact", evidenceSummary: "用户确认的项目期限" }],
        },
      },
    });
    const html = renderToStaticMarkup(createElement(SandboxLedger, { overview }));

    expect(html).toContain("8 小时/周");
    expect(html).toContain("2–16");
    expect(html).toContain("每周期使用 1");
    expect(html).toContain("1200 元/月");
    expect(html).toContain("关联资源：每周可投入时间");
    expect(html).toContain("截止时间：2026-12-01T00:00:00.000Z");
    expect(html).not.toMatch(/weekly-time|monthly-budget|project-deadline/);
    expect(html).toContain("目前没有当前正式链的已确认资料或受控事件支持");
  });
});
