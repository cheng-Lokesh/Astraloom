import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AccountExploration } from "./account-exploration";

const view = {
  people: [{ label: "Mei", relationship: "self", kind: "user_core" as const }],
  agents: [
    { label: "Mei", kind: "user_core" as const, confidence: "high", missing: "No material gaps" },
    { label: "Careful Mei", kind: "user_variant" as const, confidence: "bounded", missing: "No material gaps" },
    { label: "Team lead", kind: "npc" as const, confidence: "bounded", missing: "Context remains incomplete" },
  ],
  graph: { locked: true, edges: [{ from: "Mei", to: "Team lead", relationship: "professional", confidence: "bounded", strength: "moderate", pressure: "conflict pressure", gap: "information gap" }] },
};

describe("AccountExploration", () => {
  it("renders current People, immutable Agents, and a locked read-only Graph without internal identifiers or raw references", () => {
    const html = renderToStaticMarkup(createElement(AccountExploration, { mode: "graph", view }));

    expect(html).toContain("Locked relationship ledger");
    expect(html).toContain("Team lead");
    expect(html).toContain("conflict pressure");
    expect(html).toContain("information gap");
    expect(html).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    expect(html).not.toMatch(/evidence[_ -]?ref|trace[_ -]?id|raw scenario/i);
  });

  it("keeps account browsing separate from the Start confirmation path and preserves the Running empty state", () => {
    const html = renderToStaticMarkup(createElement(AccountExploration, { mode: "people", view, runningHref: null }));

    expect(html).toContain('href="/app/new/intake"');
    expect(html).toContain("No current Run");
    expect(html).not.toContain("localStorage");
  });
});
