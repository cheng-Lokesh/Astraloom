import { createRequire } from "node:module";
import path from "node:path";
import { build } from "vite";
import { describe, expect, it } from "vitest";
import { businessFixture, sourceFixture } from "@/lib/life-climate/b3/business.test-fixtures";
import { hashLifeClimateB3Value } from "@/lib/life-climate/b3/context";
import { buildLifeClimateB3Run } from "@/lib/life-climate/b3/engine";
import { projectLifeClimateB3Run, type LifeClimateB3Request } from "@/lib/life-climate/b3/contracts";

type Locator = { waitFor(): Promise<void>; count(): Promise<number>; click(): Promise<void>; check(): Promise<void>; fill(value: string): Promise<void>; selectOption(value: string | { label: string }): Promise<void>; isDisabled(): Promise<boolean>; inputValue(): Promise<string>; all(): Promise<Locator[]>; allTextContents(): Promise<string[]> };
type Page = { getByRole(role: string, options?: { name: string | RegExp; exact?: boolean }): Locator; getByText(label: string, options?: { exact: boolean }): Locator; getByLabel(label: string | RegExp): Locator; locator(selector: string): Locator; goto(url: string): Promise<unknown>; reload(): Promise<unknown>; addScriptTag(input: { content: string }): Promise<unknown>; waitForFunction(fn: () => unknown): Promise<unknown>; evaluate(fn: () => unknown): Promise<unknown>; on(event: string, fn: (arg: { accept(): Promise<void> }) => void): void };
type State = { requests: string[]; mode: string; body: { idempotency_key: string; request: LifeClimateB3Request } | null; result: unknown; engineError?: string };
let bundlePromise: Promise<string> | undefined;
async function bundle() {
  bundlePromise ??= (async () => {
    const fixture = "import React from 'react';import{createRoot}from'react-dom/client';import{B3Client}from'@/components/life-climate/b3/b3-client';globalThis.React=React;createRoot(document.getElementById('root')).render(React.createElement(B3Client));";
    const built = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/link": "virtual:link" } }, plugins: [{ name: "b3-full-journey", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:link") return "import React from'react';export default function Link(p){return React.createElement('a',p)}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife" } } } });
    return ((Array.isArray(built) ? built[0] : built) as { output: { type: string; code: string }[] }).output.find(item => item.type === "chunk")!.code;
  })(); return bundlePromise;
}
async function mounted(width: number, action: (page: Page, state: State) => Promise<void>, emptyResources = false) {
  const { chromium } = createRequire(import.meta.url)("C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
  const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const defaultSource = sourceFixture();
  const source = emptyResources ? sourceFixture({ ...defaultSource.view.profile, worldInputs: { version: 1, resources: [], constraints: [] } }) : defaultSource;
  const state: State = { requests: [], mode: "success", body: null, result: null };
  try {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.setDefaultTimeout(5000);
    await page.route("https://b3.test/**", async (route: { request(): { url(): string; method(): string; postData(): string }; fulfill(input: { status?: number; contentType: string; body: string }): Promise<void>; abort(): Promise<void> }) => {
      const url = new URL(route.request().url());
      const ok = async (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
      if (!url.pathname.startsWith("/api/")) return route.fulfill({ contentType: "text/html", body: '<html><body><div id="root"></div></body></html>' });
      if (url.pathname.endsWith("/source")) return ok({ ok: true, source: { view: source.view, sourceContext: source.sourceContext, symbolic: null } });
      if (url.pathname.endsWith("/intents")) {
        const intent = state.body ? { id: "10000000-0000-4000-8000-000000000001", created_at: "2026-10-20T00:00:00Z", status: state.result ? "completed" : "pending", originalBody: state.body, receipt: state.result ? { status: "completed", run: state.result } : null } : null;
        return ok(url.searchParams.has("key") ? { ok: true, intent } : { ok: true, items: intent ? [intent] : [] });
      }
      if (state.mode === "two-history" && url.pathname.endsWith("/runs")) {
        const business = businessFixture();
        const result = projectLifeClimateB3Run(await buildLifeClimateB3Run(business.source, business.request));
        return ok({ ok: true, items: [1, 2].map(index => ({ id: `20000000-0000-4000-8000-00000000000${index}`, created_at: "2026-10-20T00:00:00Z", profile_revision: business.source.view.profile.revision, result })) });
      }
      if (route.request().method() === "POST") {
        const text = route.request().postData(); state.requests.push(text);
        const submitted = JSON.parse(text);
        if (state.mode === "not-registered" || state.mode === "false-proof") return ok({ ok: false, error_code: "b3_source_stale", outcome: "not_registered", idempotency_key: submitted.idempotency_key, request_digest: state.mode === "not-registered" ? await hashLifeClimateB3Value(submitted.request) : "0".repeat(64) }, 409);
        state.body = submitted;
        if (state.mode === "network") return route.abort();
        if (state.mode === "unauthorized") return ok({ ok: false, error_code: "unauthenticated" }, 401);
        let result;
        try { result = await buildLifeClimateB3Run(source, state.body!.request); }
        catch (error) { state.engineError = error instanceof Error ? error.message : String(error); return ok({ ok: false, error_code: state.engineError }, 422); }
        state.result = { id: "20000000-0000-4000-8000-000000000001", created_at: "2026-10-20T00:00:00Z", profile_revision: source.view.profile.revision, result: projectLifeClimateB3Run(result) };
        if (state.mode === "invalid-envelope") { const run = state.result; state.result = null; return ok({ ok: true, run }, 201); }
        return ok({ ok: true, error_code: null, trace_id: "synthetic-ui-only", idempotent: false, run: state.result }, 201);
      }
      return ok({ ok: true, items: state.result ? [state.result] : [] });
    });
    await page.goto("https://b3.test/"); await page.addScriptTag({ content: await bundle() });
    await page.getByRole("heading", { name: "核对完整十四维起点", exact: true }).waitFor();
    await action(page, state);
  } finally { await browser.close(); }
}
async function flow(page: Page, label = "必要生活支出", predecessor?: string) {
  await page.getByLabel("条件类型").selectOption("recurring_resource_flow");
  await page.getByLabel("适用路径").selectOption("common");
  await page.getByLabel("这项条件的名称").fill(label);
  await page.getByLabel("使用的资源").selectOption("cash");
  await page.getByLabel("第 1 季度的明确数量").fill("100.123456");
  if (predecessor) {
    await page.getByText("阶段前提（结构变化必须设置）", { exact: true }).click();
    await page.getByLabel("前提已执行条件").selectOption({ label: predecessor });
  }
  await page.getByRole("button", { name: "添加这项条件", exact: true }).click();
}
async function confirm(page: Page) { for (const check of await page.getByRole("checkbox").all()) await check.check(); }
describe("B3 human form and server-intent recovery in mounted Chrome", () => {
  it("submits valid consecutive rule order after deleting a middle rule and adding another", async () => {
    await mounted(1280, async (page, state) => {
      page.on("dialog", dialog => { void dialog.accept(); });
      await flow(page, "支出一"); await flow(page, "支出二"); await flow(page, "支出三");
      await confirm(page);
      await (await page.getByRole("button", { name: "移除此条件及依赖", exact: true }).all())[1].click();
      expect(await page.getByRole("button", { name: "登记并保存多领域对照", exact: true }).isDisabled()).toBe(true);
      await flow(page, "支出四"); await confirm(page);
      await page.getByRole("button", { name: "登记并保存多领域对照", exact: true }).click();
      await page.waitForFunction(() => [...document.querySelectorAll('p[role="status"]')].some(item => /对照已保存|原请求仍在服务端/.test(item.textContent ?? "")));
      expect(state.body?.request.model.commonRules.map(rule => rule.order)).toEqual([0, 1, 2]);
      expect(state.engineError).toBeUndefined();
      expect(await page.getByRole("region", { name: "已保存的多领域对照", exact: true }).count()).toBe(1);
    });
  }, 40_000);
  it("adds a fresh rule after refreshing source while an older rule was being edited", async () => {
    await mounted(375, async (page, state) => {
      page.on("dialog", dialog => { void dialog.accept(); });
      await flow(page);
      await page.getByRole("button", { name: "修改这项条件", exact: true }).click();
      await page.getByRole("button", { name: "重新读取当前资料", exact: true }).click();
      await page.getByRole("heading", { name: "核对完整十四维起点", exact: true }).waitFor();
      await flow(page, "刷新后新支出");
      expect(await page.getByRole("checkbox", { name: "确认规则：刷新后新支出", exact: true }).count()).toBe(1);
      await confirm(page); await page.getByRole("button", { name: "登记并保存多领域对照", exact: true }).click();
      await page.getByRole("region", { name: "已保存的多领域对照", exact: true }).waitFor();
      expect(state.engineError).toBeUndefined();
      expect(state.body?.request.model.commonRules[0].label).toBe("刷新后新支出");
    });
  }, 40_000);
  it("renumbers surviving rules after dependency cascade without rebinding their editors", async () => {
    await mounted(1280, async (page, state) => {
      page.on("dialog", dialog => { void dialog.accept(); });
      await flow(page, "保留一"); await flow(page, "删除前提"); await flow(page, "随同删除", "删除前提"); await flow(page, "保留二");
      await confirm(page);
      await (await page.getByRole("button", { name: "移除此条件及依赖", exact: true }).all())[1].click();
      expect(await page.getByRole("checkbox", { name: /^确认规则：/ }).count()).toBe(2);
      await (await page.getByRole("button", { name: "修改这项条件", exact: true }).all())[1].click();
      expect(await page.getByLabel("这项条件的名称").inputValue()).toBe("保留二");
      await page.getByRole("button", { name: "添加这项条件", exact: true }).click();
      await flow(page, "删除后新添"); await confirm(page);
      await page.getByRole("button", { name: "登记并保存多领域对照", exact: true }).click();
      await page.getByRole("region", { name: "已保存的多领域对照", exact: true }).waitFor();
      expect(state.body?.request.model.commonRules.map(rule => [rule.label, rule.order])).toEqual([["保留一", 0], ["保留二", 1], ["删除后新添", 2]]);
      expect(state.engineError).toBeUndefined();
    });
  }, 40_000);
  for (const width of [375, 1280]) it(`reviews 14 dimensions, exact decimal assumptions and full stage result at ${width}px`, async () => {
    await mounted(width, async (page, state) => {
      await flow(page); await confirm(page);
      await page.getByRole("button", { name: "登记并保存多领域对照", exact: true }).click();
      await page.getByRole("region", { name: "已保存的多领域对照", exact: true }).waitFor();
      expect(state.requests).toHaveLength(1);
      expect(state.body?.request.model.assumptions[0]).toMatchObject({ value: "100.123456", periodUnit: "quarter" });
      expect(state.body?.request.model.alternatives).toHaveLength(2);
      expect(state.body?.request.symbolic).toEqual({ enabled: false });
      expect((await page.locator("h3").allTextContents()).filter(value => value === "补给与义务")).toHaveLength(4);
      expect(await page.locator("body").allTextContents()).not.toEqual(expect.arrayContaining([expect.stringMatching(/sourceEntryKey|sourceContext|seedContextId/)]));
    });
  }, 40_000);
  it("freezes an unknown request and restores the exact server-registered body after navigation", async () => {
    await mounted(375, async (page, state) => {
      state.mode = "network"; await flow(page); await confirm(page);
      await page.getByRole("button", { name: "登记并保存多领域对照", exact: true }).click();
      await page.getByRole("button", { name: "精确重试原请求", exact: true }).waitFor();
      expect(await page.getByLabel("选择 1 名称").isDisabled()).toBe(true);
      await page.reload(); await page.addScriptTag({ content: await bundle() });
      await page.getByRole("button", { name: "精确重试原请求", exact: true }).waitFor();
      state.mode = "unauthorized";
      await page.getByRole("button", { name: "精确重试原请求", exact: true }).click();
      await page.getByRole("button", { name: "精确重试原请求", exact: true }).waitFor();
      expect(await page.getByLabel("选择 1 名称").isDisabled()).toBe(true);
      state.mode = "success";
      await page.getByRole("button", { name: "精确重试原请求", exact: true }).click();
      await page.getByRole("region", { name: "已保存的多领域对照", exact: true }).waitFor();
      expect(state.requests).toHaveLength(3);
      expect(new Set(state.requests).size).toBe(1);
    });
  }, 40_000);
  it("clears quarterly flows and confirmations when changing to yearly units", async () => {
    await mounted(1280, async page => {
      await flow(page); await confirm(page); page.on("dialog", dialog => { void dialog.accept(); });
      await page.getByLabel("推演时间范围").selectOption("3_years");
      await page.getByRole("heading", { name: "核对完整十四维起点", exact: true }).waitFor();
      expect(await page.getByRole("checkbox", { name: /^确认假设/ }).count()).toBe(0);
      expect(await page.getByRole("button", { name: "登记并保存多领域对照", exact: true }).isDisabled()).toBe(true);
    });
  }, 40_000);
  it("freezes synchronously before hashing so two clicks cannot produce two requests", async () => {
    await mounted(1280, async (page, state) => {
      state.mode = "network"; await flow(page); await confirm(page);
      await page.evaluate(() => { const button = [...document.querySelectorAll('button')].find(item => item.textContent === '登记并保存多领域对照')!; button.click(); button.click(); });
      await page.getByRole("button", { name: "精确重试原请求", exact: true }).waitFor();
      expect(state.requests).toHaveLength(1);
      expect(await page.getByLabel("选择 1 名称").isDisabled()).toBe(true);
    });
  }, 40_000);
  for (const mode of ["not-registered", "false-proof"]) it(`only releases an initial rejected request with a matching authoritative proof: ${mode}`, async () => {
    await mounted(1280, async (page, state) => {
      state.mode = mode; await flow(page); await confirm(page);
      await page.getByRole("button", { name: "登记并保存多领域对照", exact: true }).click();
      if (mode === "not-registered") {
        await page.getByRole("link", { name: "检查现实资料", exact: true }).waitFor();
        expect(await page.getByLabel("推演时间范围").isDisabled()).toBe(false);
        expect(await page.getByRole("button", { name: "精确重试原请求", exact: true }).count()).toBe(0);
      } else {
        await page.getByRole("button", { name: "精确重试原请求", exact: true }).waitFor();
        expect(await page.getByLabel("推演时间范围").isDisabled()).toBe(true);
      }
    });
  }, 40_000);
  it("can start with no Profile resources using a separately confirmed resource quantity", async () => {
    await mounted(375, async (page, state) => {
      await page.getByText("声明独立资源", { exact: true }).click();
      await page.getByLabel("独立资源名称").fill("新储备"); await page.getByLabel("独立资源单位").fill("元");
      await page.getByLabel("独立资源下界").fill("0"); await page.getByLabel("独立资源上界").fill("1000");
      await page.getByLabel("初始数量来源").selectOption("assumption"); await page.getByLabel("独立资源初始数量").fill("50.123456");
      await page.getByRole("button", { name: "加入独立资源", exact: true }).click();
      await page.getByLabel("条件类型").selectOption("recurring_resource_flow"); await page.getByLabel("适用路径").selectOption("common");
      await page.getByLabel("这项条件的名称").fill("独立支出假设"); await page.getByLabel("使用的资源").selectOption({ label: "新储备（元）" });
      await page.getByLabel("第 1 季度的明确数量").fill("10"); await page.getByRole("button", { name: "添加这项条件", exact: true }).click();
      await confirm(page); await page.getByRole("button", { name: "登记并保存多领域对照", exact: true }).click();
      await page.getByRole("region", { name: "已保存的多领域对照", exact: true }).waitFor();
      expect(state.body?.request.model.resources[0].initial.kind).toBe("assumption");
      expect(state.body?.request.model.assumptions[0]).toMatchObject({ value: "50.123456", periodUnit: "once" });
    }, true);
  }, 40_000);
  it("isolates two historical event-anchor sets even when their stable Event digests match", async () => {
    await mounted(1280, async (page, state) => {
      state.mode = "two-history"; await page.getByRole("button", { name: "重新读取账户请求", exact: true }).click();
      await page.getByRole("button", { name: "打开多领域历史 2", exact: true }).waitFor();
      await page.getByRole("button", { name: "打开多领域历史 1", exact: true }).click();
      await page.getByRole("button", { name: "打开多领域历史 2", exact: true }).click();
      expect(await page.getByRole("region", { name: "已保存的多领域对照", exact: true }).count()).toBe(2);
      expect(await page.evaluate(() => { const articles = [...document.querySelectorAll('article[id]')]; const ids = articles.map(item => item.id); const links = [...document.querySelectorAll('a[href^="#b3-"]')]; return ids.length > 0 && new Set(ids).size === ids.length && links.length > 0 && links.every(link => { const target = document.getElementById(link.getAttribute('href')!.slice(1)); return target && target.closest('section[aria-label="已保存的多领域对照"]') === link.closest('section[aria-label="已保存的多领域对照"]'); }); })).toBe(true);
    });
  }, 40_000);
  it("keeps a malformed success envelope unknown until a strict matching receipt is recovered", async () => {
    await mounted(1280, async (page, state) => {
      state.mode = "invalid-envelope"; await flow(page); await confirm(page);
      await page.getByRole("button", { name: "登记并保存多领域对照", exact: true }).click();
      await page.getByRole("button", { name: "精确重试原请求", exact: true }).waitFor();
      expect(await page.getByLabel("推演时间范围").isDisabled()).toBe(true);
      expect(await page.getByRole("region", { name: "已保存的多领域对照", exact: true }).count()).toBe(0);
      state.mode = "success"; await page.getByRole("button", { name: "精确重试原请求", exact: true }).click();
      await page.getByRole("region", { name: "已保存的多领域对照", exact: true }).waitFor();
      expect(new Set(state.requests).size).toBe(1);
    });
  }, 40_000);
});
