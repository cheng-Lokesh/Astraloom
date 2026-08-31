import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

async function source(relativePath: string) {
  return readFile(path.join(root, relativePath), "utf8");
}

describe("M2.1 formal entry and legacy isolation", () => {
  it("frames the public hero as a personal digital-life sandbox and sends every CTA into a truthful path", async () => {
    const hero = await source("src/components/hero/cinematic-command-hero.tsx");

    expect(hero).toContain("个人数字生命沙盘");
    expect(hero).toContain("Seed");
    expect(hero).toContain("People");
    expect(hero).toContain("Agents");
    expect(hero).toContain("Graph");
    expect(hero).toContain("History");
    expect(hero).toContain('href="/app/new/scene"');
    expect(hero).toContain('href="/login"');
    expect(hero).not.toMatch(/Scenario Intelligence Observatory|AGENT GRAPH ONLINE|PATH BRANCHES LIVE|查看沙盘示例|\/app\/simulation\/result|Career/);
  });

  it("keeps old Start bookmarks on the formal scene route without loading a trial workspace", async () => {
    const start = await source("src/app/app/start/page.tsx");

    expect(start).toContain('redirect("/app/new/scene")');
    expect(start).not.toMatch(/TrialSampleButton|createTrialWorkspace|localStorage/);
  });

  it("offers only the current formal Track A intake from the new-scene route", async () => {
    const scene = await source("src/app/app/new/scene/page.tsx");

    expect(scene).toContain("Track A");
    expect(scene).toContain('href="/app/new/intake"');
    expect(scene).not.toMatch(/TrialSampleButton|localStorage|Track B|路径 B/);
  });

  it("keeps the public-to-formal Intake path free of sample, trial, and local-result shortcuts", async () => {
    const [hero, scene, intake] = await Promise.all([
      source("src/components/hero/cinematic-command-hero.tsx"),
      source("src/app/app/new/scene/page.tsx"),
      source("src/app/app/new/intake/page.tsx"),
    ]);

    expect(hero).toContain('href="/app/new/scene"');
    expect(scene).toContain('href="/app/new/intake"');
    expect(intake).not.toMatch(
      /TrialSampleButton|const sample\b|function useSample\b|Use sample text|Open sample sandbox|Open sample result|createTrialWorkspace|trial.*localStorage|localStorage.*trial/i,
    );
  });

  it("shows an honest no-run empty state while preserving the run-id status branch", async () => {
    const running = await source("src/app/app/simulation/running/page.tsx");

    expect(running).toContain("当前没有正在运行的沙盘");
    expect(running).toContain('href="/app/dashboard"');
    expect(running).toContain('href="/app/new/scene"');
    expect(running).toContain('href="/app/archive"');
    expect(running).toContain("params.get(\"run_id\")");
    expect(running).toContain("createFormalSandboxClient().status(runId)");
    expect(running).not.toContain("No formal Run id was provided.");
  });

  it("never substitutes a raw run UUID when the account-history time is unavailable", async () => {
    const archive = await source("src/app/app/archive/page.tsx");

    expect(archive).toContain("时间不可用");
    expect(archive).not.toContain(":run.id}");
  });

  it("keeps the formal primary navigation free of sample and standalone Result destinations", async () => {
    const shell = await source("src/components/app-shell.tsx");

    expect(shell).toContain('href: "/app/new/scene", label: "Start"');
    expect(shell).not.toMatch(/\/demo|trial|sample|href: "\/app\/simulation\/result"/i);
  });
});
