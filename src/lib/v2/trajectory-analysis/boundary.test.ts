import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Stage 5 scope boundary", () => {
  it("contains no later-stage, infrastructure, network, destiny, or birth implementation", () => {
    const root = path.join(process.cwd(), "src/lib/v2/trajectory-analysis");
    const production = fs.readdirSync(root)
      .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts") && name !== "test-fixtures.ts")
      .map((name) => fs.readFileSync(path.join(root, name), "utf8"))
      .join("\n");
    expect(production).not.toMatch(/\b(Claim|Report|fetch|axios|database|persistence|Destiny|birthDate|astrology|likelihood|calibratedConfidence)\b/);
    expect(fs.existsSync(path.join(process.cwd(), "src/app/api/v2/trajectory-analysis"))).toBe(false);
  });
});
