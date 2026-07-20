import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const directory = path.resolve(process.cwd(), "src/lib/v2/trajectory");
const productionFiles = () => fs.readdirSync(directory).filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts") && name !== "test-fixtures.ts");
const productionSource = () => productionFiles().map((name) => fs.readFileSync(path.join(directory, name), "utf8")).join("\n");

describe("Stage 4 boundaries", () => {
  it("does not use ambient randomness, UUIDs, or wall-clock reads", () => {
    expect(productionSource()).not.toMatch(/Math\.random|randomUUID|Date\.now/);
  });

  it("does not add later-stage analytics or output artifacts", () => {
    expect(productionSource()).not.toMatch(/\b(?:probability|likelihood|frequency|clustering|Claim|Report)\b/);
  });

  it("keeps all Stage 4 production files in the isolated trajectory namespace", () => {
    expect(productionFiles().length).toBeGreaterThan(0);
    expect(productionFiles().every((name) => path.dirname(path.join(directory, name)) === directory)).toBe(true);
  });
});
