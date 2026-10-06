import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createEmptyRealityProfileDraft } from "@/lib/reality-profile/profile";
import { SandboxLedger } from "@/app/app/dashboard/sandbox-dashboard-client";
import { buildSandboxOverview, sandboxOverviewSchema, type SandboxOverviewSource } from "./overview.server";

const now = "2026-10-06T00:00:00.000Z";
const profile = () => ({
  ...createEmptyRealityProfileDraft(7),
  lifeClimate: { value: "近期安排较紧", classification: "assumption" as const, evidenceSummary: "本人记录，尚待复核" },
  resources: { value: "有同伴支持", classification: "fact" as const, evidenceSummary: "本人已确认" },
  worldInputs: {
    version: 1 as const,
    resources: [{ key: "weekly-time", label: "可用时间", resourceType: "time" as const, available: 8, unit: "小时", minimum: 0, maximum: 10, usePerTick: null, classification: "fact" as const, evidenceSummary: "本人记录的时间" }],
    constraints: [
      { key: "later", label: "稍后复核", resourceKey: "weekly-time", rule: { kind: "before_time" as const, value: "2026-10-08T00:00:00.000Z" }, classification: "assumption" as const, evidenceSummary: "假设期限" },
      { key: "past", label: "先前期限", resourceKey: "weekly-time", rule: { kind: "before_time" as const, value: "2026-10-05T00:00:00.000Z" }, classification: "fact" as const, evidenceSummary: "本人确认期限" },
      { key: "next", label: "最近期限", resourceKey: "weekly-time", rule: { kind: "before_time" as const, value: "2026-10-07T00:00:00.000Z" }, classification: "fact" as const, evidenceSummary: "本人确认期限" },
      { key: "equal", label: "此刻期限", resourceKey: "weekly-time", rule: { kind: "before_time" as const, value: now }, classification: "assumption" as const, evidenceSummary: "假设期限" },
    ],
  },
});
const source = (overrides: Partial<SandboxOverviewSource> = {}): SandboxOverviewSource => ({ authenticated: true, seed: { submitted: true }, confirmedPeopleCount: 2, immutableAgentsCount: 3, graph: { exists: true, locked: true, edgeCount: 2 }, runningRun: null, latestCompletedRun: null, historyCount: 3, hasFeedback: false, realityProfile: profile(), changeNodeTypes: ["cooperation"], ...overrides });
afterEach(() => vi.restoreAllMocks());

describe("current saved reality and observation deadlines", () => {
  it("projects the authored near-term description separately with its classification and profile revision", () => {
    const overview = buildSandboxOverview(source());
    expect(overview.lifeClimate).toEqual({ state: "saved_profile", source: "current_reality_profile", profileRevision: 7, items: [{ label: "近期安排较紧", classification: "assumption", evidenceSummary: "本人记录，尚待复核" }] });
    expect(overview.resources).toMatchObject({ state: "saved_profile", source: "current_reality_profile", profileRevision: 7, items: overview.world.resources });
    expect(overview.constraints).toMatchObject({ state: "saved_profile", source: "current_reality_profile", profileRevision: 7, items: overview.world.constraints });
    expect(overview.nextAction.kind).toBe("start_run");
  });

  it("sorts actual saved deadlines using server time and treats equality and past dates as unverified expired", () => {
    const overview = buildSandboxOverview(source(), Date.parse(now));
    expect(overview.nextChange).toMatchObject({ state: "recorded_deadlines", source: "current_reality_profile", profileRevision: 7, assessedAt: now, upcoming: [{ label: "最近期限", classification: "fact" }, { label: "稍后复核", classification: "assumption" }], expired: [{ label: "先前期限" }, { label: "此刻期限" }] });
    expect(JSON.stringify(overview.nextChange)).not.toMatch(/weekly-time|fulfilled|cooperation|probability/);
    expect(sandboxOverviewSchema.safeParse({ ...overview, nextChange: { ...overview.nextChange, fulfilled: true } }).success).toBe(false);
  });

  it("sorts timezone offsets by instant, remains bounded, and retains an expired-only ledger", () => {
    const saved = profile();
    saved.worldInputs.constraints = [
      { ...saved.worldInputs.constraints[0]!, rule: { kind: "before_time", value: "2026-10-07T01:00:00+08:00" } },
      { ...saved.worldInputs.constraints[2]!, rule: { kind: "before_time", value: "2026-10-06T20:00:00Z" } },
    ];
    const overview = buildSandboxOverview(source({ realityProfile: saved }), Date.parse(now));
    expect(overview.nextChange).toMatchObject({ upcoming: [{ label: "稍后复核" }, { label: "最近期限" }], expired: [] });
    expect(buildSandboxOverview(source({ realityProfile: saved }), Date.parse("2026-10-09T00:00:00Z")).nextChange).toMatchObject({ upcoming: [], expired: [{ label: "稍后复核" }, { label: "最近期限" }] });
    saved.worldInputs.constraints[1]!.rule.value = "2026-10-06T17:00:00Z";
    expect(buildSandboxOverview(source({ realityProfile: saved }), Date.parse(now)).nextChange).toMatchObject({ upcoming: [{ label: "稍后复核" }, { label: "最近期限" }] });
    expect(buildSandboxOverview(source({ realityProfile: saved }), Date.parse("2026-10-06T17:00:00Z")).nextChange).toMatchObject({ upcoming: [], expired: [{ label: "稍后复核" }, { label: "最近期限" }] });
    saved.worldInputs.constraints = Array.from({ length: 9 }, (_, index) => ({ ...saved.worldInputs.constraints[0]!, key: `limit-${index}` }));
    expect(() => buildSandboxOverview(source({ realityProfile: saved }))).toThrow();
  });

  it("rejects unsafe authored descriptions rather than returning identifiers or secrets", () => {
    const saved = profile();
    saved.lifeClimate.value = "raw scenario";
    expect(() => buildSandboxOverview(source({ realityProfile: saved }))).toThrow();
  });

  it("keeps no profile and no recorded deadlines honest, without promoting simulation events", () => {
    const absent = buildSandboxOverview(source({ realityProfile: null }));
    expect(absent.lifeClimate).toEqual({ state: "not_modeled" });
    expect(absent.nextChange).toEqual({ state: "not_modeled" });
    const unknown = buildSandboxOverview(source({ realityProfile: createEmptyRealityProfileDraft(9) }));
    expect(unknown.lifeClimate).toMatchObject({ state: "saved_profile", profileRevision: 9, items: [{ classification: "unknown", evidenceSummary: "明确未知" }] });
    expect(unknown.nextChange).toEqual({ state: "not_modeled" });
    const html = renderToStaticMarkup(createElement(SandboxLedger, { overview: unknown }));
    expect(html).toContain("尚未填写");
    expect(html).toContain("分类：未知");
    expect(html).toContain("下一次现实变化明确未知");
  });

  it("renders readable real observation status and keeps simulated changes explicitly separate", () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse(now));
    const html = renderToStaticMarkup(createElement(SandboxLedger, { overview: buildSandboxOverview(source()) }));
    for (const label of ["本人记录的现实近况", "现实观察期限", "尚未到期", "已到期，结果待核实", "模拟中出现的变化", "资料版本：7", "本人记录，尚待复核"]) expect(html).toContain(label);
    expect(html).not.toMatch(/weekly-time|fulfilled|Destiny|Symbolic/);
  });
});
