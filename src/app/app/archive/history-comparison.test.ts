import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import * as archive from "./archive-history-client";
import type { FormalSandboxResultProjection } from "@/lib/formal-sandbox/client";

type HistoryRun = { id: string; status: string; time_horizon?: string; created_at?: string; completed_at?: string | null };
type ResultRead = { ok: true; data: { projection: FormalSandboxResultProjection } } | { ok: false; status: number; errorCode: string };
type ComparisonColumn = { run: HistoryRun; projection: FormalSandboxResultProjection };
type ComparisonTuple = readonly [HistoryRun, HistoryRun];
type ColumnTuple = readonly [ComparisonColumn, ComparisonColumn];

const firstRun: HistoryRun = { id: "private-run-key-first", status: "completed", time_horizon: "30_days", created_at: "2026-09-20T00:00:00.000Z", completed_at: "2026-09-20T00:03:00.000Z" };
const secondRun: HistoryRun = { id: "private-run-key-second", status: "completed", time_horizon: "90_days", created_at: "2026-09-21T00:00:00.000Z", completed_at: "2026-09-21T00:06:00.000Z" };
const draftRun: HistoryRun = { id: "private-run-key-draft", status: "draft", time_horizon: "30_days" };

function projection(realityProfile: FormalSandboxResultProjection["realityProfile"], statement: string): FormalSandboxResultProjection {
  return {
    participants: [],
    relationships: [],
    facts: [],
    assumptions: [],
    realityProfile,
    steps: [{ key: "step-1", order: 1, label: `${statement} step`, kind: "sandbox_simulation", boundary: "simulation_step", participantKeys: [], relationshipKeys: [] }],
    claims: [{ key: "claim-1", statement, uncertainty: "Conditional simulation claim.", boundary: "conditional_claim", stepKeys: ["step-1"], supportingStepKeys: ["step-1"], participantKeys: [], relationshipKeys: [] }],
  };
}

const firstProjection = projection({ status: "frozen", revision: 3, facts: [{ key: "fact-1", label: "生活安排", statement: "每周保留学习时间", evidenceSummary: "用户确认" }], assumptions: [{ key: "assumption-1", label: "项目节奏", statement: "下月可能有变化", evidenceSummary: "明确假设" }], unknowns: [{ key: "unknown-1", label: "资源" }] }, "First outcome");
const secondProjection = projection({ status: "not_recorded", revision: null, facts: [], assumptions: [], unknowns: [] }, "Second outcome");

function exported<T>(name: string): T {
  const value = (archive as unknown as Record<string, unknown>)[name];
  expect(value, `archive export ${name}`).toBeTypeOf("function");
  return value as T;
}

describe("History comparison", () => {
  it("selects completed entries only, caps selection at two, and allows deselection", () => {
    const toggle = exported<(selected: string[], runId: string, runs: HistoryRun[]) => string[]>("toggleHistoryRunSelection");
    expect(toggle([], draftRun.id, [draftRun])).toEqual([]);
    const two = toggle(toggle([], firstRun.id, [firstRun, secondRun]), secondRun.id, [firstRun, secondRun]);
    expect(two).toEqual([firstRun.id, secondRun.id]);
    expect(toggle(two, "a-third-run", [firstRun, secondRun, { id: "a-third-run", status: "completed" }])).toEqual(two);
    expect(toggle(two, firstRun.id, [firstRun, secondRun])).toEqual([secondRun.id]);
  });

  it("clears selections when the History filter or page changes", () => {
    const reducer = exported<(selected: string[], action: { type: "toggle"; runId: string; runs: HistoryRun[] } | { type: "history_view_changed" }) => string[]>("historySelectionReducer");
    const selected = [firstRun.id, secondRun.id];
    expect(reducer(selected, { type: "history_view_changed" })).toEqual([]);
    expect(reducer(selected, { type: "history_view_changed" })).toEqual([]);
  });

  it("loads both results independently and keeps the selected left/right order", async () => {
    const load = exported<(runs: ComparisonTuple, read: (runId: string) => Promise<ResultRead>) => Promise<{ ok: true; columns: ColumnTuple } | { ok: false }>>("loadHistoryComparison");
    const resolveFirst = vi.fn();
    const resolveSecond = vi.fn();
    const requests: string[] = [];
    const work = load([firstRun, secondRun], (runId) => {
      requests.push(runId);
      if (runId === firstRun.id) return new Promise<ResultRead>((resolve) => { resolveFirst.mockImplementation(() => resolve({ ok: true, data: { projection: firstProjection } })); });
      return new Promise<ResultRead>((resolve) => { resolveSecond.mockImplementation(() => resolve({ ok: true, data: { projection: secondProjection } })); });
    });
    resolveSecond();
    resolveFirst();
    await expect(work).resolves.toEqual({ ok: true, columns: [{ run: firstRun, projection: firstProjection }, { run: secondRun, projection: secondProjection }] });
    expect(requests).toEqual([firstRun.id, secondRun.id]);
  });

  it("returns no projection if either owner-scoped result request fails or is incomplete", async () => {
    const load = exported<(runs: ComparisonTuple, read: (runId: string) => Promise<ResultRead>) => Promise<{ ok: true; columns: ColumnTuple } | { ok: false }>>("loadHistoryComparison");
    const read = vi.fn(async (runId: string): Promise<ResultRead> => runId === firstRun.id
      ? { ok: true, data: { projection: firstProjection } }
      : { ok: false, status: 409, errorCode: "run_not_completed" });
    await expect(load([firstRun, secondRun], read)).resolves.toEqual({ ok: false });
    expect(read).toHaveBeenCalledTimes(2);
    await expect(load([draftRun, secondRun], read)).resolves.toEqual({ ok: false });
  });

  it("renders the frozen profile, explicit unknowns, steps, and conditional claims in two stable columns", () => {
    const Panel = exported<(props: { columns: ColumnTuple }) => React.ReactElement>("HistoryComparisonPanel");
    const html = renderToStaticMarkup(createElement(Panel, { columns: [{ run: firstRun, projection: firstProjection }, { run: secondRun, projection: secondProjection }] }));
    expect(html).toContain("Revision 3");
    expect(html).toContain("明确未知");
    expect(html).toContain("此历史 Run 未记录 Reality Profile 快照");
    expect(html).toContain("First outcome step");
    expect(html).toContain("Second outcome");
    expect(html).toContain("Seed 或 Relation Graph 可能不同");
    expect(html.indexOf("First outcome")).toBeLessThan(html.indexOf("Second outcome"));
    expect(html).not.toContain(firstRun.id);
    expect(html).not.toContain(secondRun.id);
  });
});
