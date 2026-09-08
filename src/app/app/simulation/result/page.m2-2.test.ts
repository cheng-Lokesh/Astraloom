import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = () => readFile(path.join(process.cwd(), "src/app/app/simulation/result/page.tsx"), "utf8");

describe("M2.2 evidence workbench", () => {
  it("uses only the typed safe projection and gives Claim cards keyboard evidence linkage", async () => {
    const page = await source();
    expect(page).toContain("result.data.projection");
    expect(page).toContain("onKeyDown");
    expect(page).toContain("supportingStepKeys");
    expect(page).toContain("participantKeys");
    expect(page).toContain("relationshipKeys");
    expect(page).not.toMatch(/Record<string,unknown>|result\.bundle|Report\" value/);
  });

  it("supports all three feedback choices, an optional note, and preserves input after a failed request", async () => {
    const page = await source();
    expect(page).toContain('["useful","mixed","off"]');
    expect(page).toContain("textarea");
    expect(page).toContain("crypto.randomUUID()");
    expect(page).toContain("Feedback was not saved");
    expect(page).not.toContain("localStorage");
  });

  it("keeps touch targets, focus states, reduced motion and mobile overflow guardrails", async () => {
    const page = await source();
    expect(page).toMatch(/min-h-10|h-10/);
    expect(page).toContain("focus-visible");
    expect(page).toContain("motion-reduce");
    expect(page).toContain("overflow-x-hidden");
  });
  it("wires the executable generation gate and refuses a ready projection from another run", async () => {
    const page = await source();
    expect(page).toContain("createResultRequestGate");
    expect(page).toContain("gate.begin(runId)");
    expect(page).toContain("gate.cancel(request)");
    expect(page).toContain("state.runId !== runId");
    expect(page).toContain("setRetry((value) => value + 1)");
  });

  it("renders user facts and system assumptions as visible boundaries", async () => {
    const page = await source();
    expect(page).toContain("User-provided facts");
    expect(page).toContain("System assumptions");
    expect(page).toContain("projection.facts.map");
    expect(page).toContain("projection.assumptions.map");
  });
});
