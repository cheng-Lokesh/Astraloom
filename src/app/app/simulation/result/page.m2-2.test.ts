import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("M2.2 result workbench source contract", () => {
  it("renders the typed safe projection with an honest four-layer boundary and no raw bundle fallback", async () => {
    const source = await readFile(path.join(root, "src/app/app/simulation/result/page.tsx"), "utf8");
    for (const expected of ["Frozen participants", "Frozen relationships", "User-provided facts", "Explicit assumptions", "Simulation steps", "Conditional claims", "stepKeys", "selectedClaim", "only calibrates the next Run"]) expect(source).toContain(expected);
    expect(source).not.toMatch(/Record<string,unknown>|bundle\.claims|report\.id|localStorage|sample|ONLINE|LIVE|READY/);
  });

  it("keeps feedback manual, note-capable, and safe on failure", async () => {
    const source = await readFile(path.join(root, "src/app/app/simulation/result/page.tsx"), "utf8");
    for (const expected of ["textarea", "crypto.randomUUID()", "409", "Feedback was not saved", "disabled={pending}", "comment", "Feedback already submitted"]) expect(source).toContain(expected);
    expect(source).not.toContain('setMessage("Feedback saved");');
  });
});
