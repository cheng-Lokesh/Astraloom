import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("My Sandbox navigation contract", () => {
  it("keeps server-backed account routes reachable on desktop and mobile without a Result dead end", async () => {
    const source = await readFile(path.join(root, "src/components/app-shell.tsx"), "utf8");

    for (const expected of [
      'href: "/app/dashboard", label: "My Sandbox"',
      'href: "/app/new/scene", label: "Start"',
      'href: "/app/new/people", label: "People"',
      'href: "/app/new/graph", label: "Graph"',
      'href: "/app/simulation/running", label: "Running"',
      'href: "/app/archive", label: "History"',
      "aria-label=\"Primary\"",
      "aria-label=\"Flow\"",
      "active:scale-95",
      "focus-visible:",
    ]) expect(source).toContain(expected);

    expect(source).not.toContain('href: "/app/simulation/result", label: "Result"');
  });
});
