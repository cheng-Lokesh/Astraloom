import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import { describe, expect, it } from "vitest";

import { FormalIntakeClient } from "./app/new/intake/formal-intake-client";
import { projectRunningPhase, readRunningStatus } from "./app/simulation/running/page";
import { createFormalSandboxClient } from "@/lib/formal-sandbox/client";

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

  it("sends the public legacy /intake bookmark to the formal scene without rendering legacy navigation or formal-chain CTAs", async () => {
    const [legacyRoute, legacyIntake, hero, scene] = await Promise.all([
      source("src/app/intake/page.tsx"),
      source("src/components/legacy/local-intake-page.tsx"),
      source("src/components/hero/cinematic-command-hero.tsx"),
      source("src/app/app/new/scene/page.tsx"),
    ]);

    expect(legacyRoute).toContain('redirect("/app/new/scene")');
    expect(legacyRoute).not.toMatch(/LocalIntakePage|AppShell/);
    expect(legacyIntake).toMatch(/Track B|Confirm people|\/app\/new\/people|Submit formal Track A version/);
    expect(hero).toContain('href="/app/new/scene"');
    expect(scene).toContain('href="/app/new/intake"');
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

  it("keeps the formal Intake as a server-backed Track A-only component until submission succeeds", async () => {
    const [page, intake] = await Promise.all([
      source("src/app/app/new/intake/page.tsx"),
      source("src/app/app/new/intake/formal-intake-client.tsx"),
    ]);

    expect(page).toContain("createSupabaseServerClient");
    expect(page).toContain("登录后继续正式录入");
    expect(intake).toContain('"30_days"');
    expect(intake).toContain('"90_days"');
    expect(intake).toContain('fetch("/api/seed-context"');
    expect(intake).toContain("crypto.randomUUID()");
    expect(intake).toContain('href="/app/new/people"');
    expect(intake).not.toMatch(/Track B|1_year|3_years|5_years|localStorage|getRepositories|repository-provider|saveLocalDraft|local-first|remains on this device|Confirm people/i);
  });

  it("renders the formal privacy acknowledgement checkbox as a real 44px keyboard-focusable target", () => {
    const markup = renderToStaticMarkup(createElement(FormalIntakeClient));

    expect(markup).toMatch(/<input[^>]+type="checkbox"[^>]+style="[^"]*min-height:44px;[^"]*min-width:44px"[^>]*>/);
    expect(markup).toMatch(/<input[^>]+type="checkbox"[^>]+class="[^"]*focus-visible:outline[^"]*"[^>]*>/);
  });

  it("projects a completed server Run in natural language without exposing ready as a user-visible state", async () => {
    const running = await source("src/app/app/simulation/running/page.tsx");

    expect(running).toContain("结果已生成");
    expect(running).not.toMatch(/Bundle is ready|>ready<|>\{phase\}<\/p>/i);
    expect(running).toContain(">{statusLabel}</p>");
  });

  it("keeps the loading, running, completed, and unreadable Run projections distinct", () => {
    expect(projectRunningPhase("loading")).toMatchObject({ statusLabel: "正在读取服务器状态", title: "正在读取服务器状态" });
    expect(projectRunningPhase("running")).toMatchObject({ statusLabel: "沙盘运行中", title: "正在梳理可能路径。" });
    expect(projectRunningPhase("completed")).toMatchObject({ statusLabel: "结果已生成", title: "结果已生成" });
    expect(projectRunningPhase("error")).toMatchObject({ statusLabel: "状态暂不可用", title: "暂时无法读取本次沙盘状态。" });
  });

  it("uses persisted server statuses for both the first status read and a manual reread without treating every non-completed Run as running", async () => {
    const runId = "11111111-1111-4111-8111-111111111111";
    const read = async (status: string) => {
      const fetcher = async () => new Response(JSON.stringify({ ok: true, run: { id: runId, status } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
      return readRunningStatus(runId, createFormalSandboxClient(fetcher));
    };

    let reads = 0;
    const firstAndManualReread = createFormalSandboxClient(async () => new Response(JSON.stringify({
      ok: true,
      run: { id: runId, status: reads++ === 0 ? "draft" : "blocked" },
    }), { status: 200, headers: { "content-type": "application/json" } }));
    await expect(readRunningStatus(runId, firstAndManualReread)).resolves.toMatchObject({ phase: "draft", statusLabel: "尚未开始运行" });
    await expect(readRunningStatus(runId, firstAndManualReread)).resolves.toMatchObject({ phase: "blocked", statusLabel: "服务端已阻断" });

    await expect(read("queued")).resolves.toMatchObject({ phase: "queued", statusLabel: "等待运行" });
    await expect(read("running")).resolves.toMatchObject({ phase: "running", statusLabel: "沙盘运行中" });
    await expect(read("completed")).resolves.toMatchObject({ phase: "completed", statusLabel: "结果已生成", canOpenResult: true });
    await expect(read("blocked")).resolves.toMatchObject({ phase: "blocked", statusLabel: "服务端已阻断" });
    await expect(read("failed")).resolves.toMatchObject({ phase: "failed", statusLabel: "服务端运行失败" });
    await expect(read("unexpected_future_state")).resolves.toMatchObject({ phase: "error", statusLabel: "状态暂不可用" });
    await expect(readRunningStatus(runId, createFormalSandboxClient(async () => { throw new Error("private transport detail"); }))).resolves.toMatchObject({ phase: "error", statusLabel: "状态暂不可用" });
  });

  it("shows an honest no-run empty state while preserving the run-id status branch", async () => {
    const running = await source("src/app/app/simulation/running/page.tsx");

    expect(running).toContain("当前没有正在运行的沙盘");
    expect(running).toContain('href="/app/dashboard"');
    expect(running).toContain('href="/app/new/scene"');
    expect(running).toContain('href="/app/archive"');
    expect(running).toContain("params.get(\"run_id\")");
    expect(running).toContain("readRunningStatus(runId)");
    expect(running).not.toContain("No formal Run id was provided.");
  });

  it("never substitutes a raw run UUID when the account-history time is unavailable", async () => {
    const archive = await source("src/app/app/archive/page.tsx");

    expect(archive).toContain("时间不可用");
    expect(archive).not.toContain(":run.id}");
  });

  it("places the Archive authentication boundary on the server before its History client mounts", async () => {
    const [page, client] = await Promise.all([
      source("src/app/app/archive/page.tsx"),
      source("src/app/app/archive/archive-history-client.tsx"),
    ]);

    expect(page).toContain("createSupabaseServerClient");
    expect(page).toContain("登录后查看账户历史");
    expect(page).toContain("ArchiveHistoryClient");
    expect(page).not.toMatch(/"use client"|createFormalSandboxClient|useEffect/);
    expect(client).toContain("createFormalSandboxClient().history(12)");
  });

  it("keeps the formal primary navigation free of sample and standalone Result destinations", async () => {
    const shell = await source("src/components/app-shell.tsx");

    expect(shell).toContain('href: "/app/new/scene", label: "Start"');
    expect(shell).not.toMatch(/\/demo|trial|sample|href: "\/app\/simulation\/result"/i);
  });
});
