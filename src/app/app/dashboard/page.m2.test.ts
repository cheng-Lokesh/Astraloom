import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SandboxLedger } from "./sandbox-dashboard-client";

describe("My Sandbox dashboard behavior", () => {
  it("renders current people, ordinal relations, model boundaries and one current-chain action", () => {
    const html = renderToStaticMarkup(createElement(SandboxLedger, { overview: {
      authenticated: true,
      seed: { state: "submitted" }, reality: { state: "not_modeled" },
      people: { confirmedCount: 2, items: [{ key: "person-1", label: "Scenario owner", role: "self" }, { key: "person-2", label: "Current collaborator", role: "collaborator" }] },
      agents: { immutableCount: 2 },
      graph: { exists: true, locked: true, edgeCount: 1, relations: [{ key: "relation-1", fromPersonKey: "person-1", toPersonKey: "person-2", label: "collaboration" }] },
      running: { exists: false, href: null }, latestCompletedRun: { status: "completed", completedAt: "2026-09-08T08:00:00.000Z", href: "/app/simulation/result?run_id=opaque" },
      history: { count: 1 }, feedback: { exists: true }, lifeClimate: { state: "not_modeled" }, resources: { state: "not_modeled" }, constraints: { state: "not_modeled" }, nextChange: { state: "not_modeled" },
      nextAction: { kind: "start_next_run", href: "/app/new/graph" },
    } }));

    expect(html).toContain("当前人物");
    expect(html).toContain("Scenario owner");
    expect(html).toContain("当前关系");
    expect(html).toContain("person-1");
    expect(html).toContain("尚未建模");
    expect(html).toContain("开始下一次 Run");
    expect(html.match(/href="\/app\/new\/graph"/g)).toHaveLength(1);
    expect(html).not.toMatch(/[0-9a-f]{8}-[0-9a-f-]{27}/i);
  });
});
