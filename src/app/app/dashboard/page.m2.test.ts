import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("My Sandbox dashboard source contract", () => {
  it("uses the server overview and never restores a local Observatory", async () => {
    const page = await readFile(path.join(root, "src/app/app/dashboard/page.tsx"), "utf8");
    const source = await readFile(path.join(root, "src/app/app/dashboard/sandbox-dashboard-client.tsx"), "utf8");

    expect(page).toContain("createSupabaseServerClient");
    expect(page).toContain("登录后查看我的沙盘");
    expect(source).toContain("/api/sandbox-overview");
    expect(source).not.toMatch(/getRepositories|localStorage|Recent cases|Career|ONLINE|LIVE|READY/);
    expect(source).toContain("尚未建模");
    expect(source).toContain("role=\"status\"");
    expect(source).toContain("role=\"alert\"");
  });
});
