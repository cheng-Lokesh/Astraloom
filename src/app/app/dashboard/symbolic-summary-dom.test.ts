import path from "node:path";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { build } from "vite";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { buildSymbolicFrame } from "@/lib/formal-symbolic-lens/frame";
import { buildSandboxOverview } from "@/lib/sandbox-overview/overview.server";
import { createEmptyRealityProfileDraft } from "@/lib/reality-profile/profile";

const runtime = process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const executablePath = process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
type Locator = { waitFor(): Promise<void>; count(): Promise<number>; click(): Promise<void>; focus(): Promise<void> };
type Page = { setDefaultTimeout(value: number): void; setContent(html: string): Promise<void>; addScriptTag(input: { content: string }): Promise<void>; evaluate<T, A>(fn: (arg: A) => T, arg: A): Promise<T>; getByRole(role: string, input: { name: string; exact?: boolean }): Locator; close(): Promise<void>; waitForFunction(fn: () => boolean): Promise<void> };
type Browser = { newPage(): Promise<Page>; close(): Promise<void> };
declare global { interface Window { symbolicFixture: { status: number; lens: unknown; hold?: boolean }; symbolicRequests: Array<{ url: string; cache?: string }>; releaseSymbolic?: () => void; } }
const frame = buildSymbolicFrame({ birthDate: "1991-06-15", birthTime: null }, 2, "2026-10-06T00:00:00Z");
const configured = { revision: 3, status: "active", sourceVersion: 2, snapshot: frame, consent: { storage: true, calculation: true, futureAttachment: false }, futureAttachmentStatus: "not_connected" };
const overview = buildSandboxOverview({ authenticated: true, seed: { submitted: true }, confirmedPeopleCount: 0, immutableAgentsCount: 0, graph: { exists: false, locked: false, edgeCount: 0 }, runningRun: null, latestCompletedRun: null, historyCount: 0, hasFeedback: false, realityProfile: createEmptyRealityProfileDraft(1) });

describe.skipIf(!existsSync(path.join(runtime, "playwright")) || !existsSync(executablePath))("dashboard symbolic summary real DOM", () => {
  let browser: Browser;
  let code: string;
  beforeAll(async () => {
    const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {SandboxDashboardClient} from '@/app/app/dashboard/sandbox-dashboard-client';globalThis.React=React;window.symbolicRequests=[];window.fetch=async(url,init)=>{window.symbolicRequests.push({url:String(url),cache:init?.cache});if(String(url).includes('sandbox-overview'))return new Response(JSON.stringify({ok:true,overview:${JSON.stringify(overview)}}));if(window.symbolicFixture.hold)await new Promise(resolve=>window.releaseSymbolic=resolve);return new Response(JSON.stringify({ok:window.symbolicFixture.status===200,lens:window.symbolicFixture.lens}),{status:window.symbolicFixture.status})};createRoot(document.getElementById('root')).render(React.createElement(SandboxDashboardClient));`;
    const output = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/link": "virtual:link" } }, plugins: [{ name: "fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "Fixture" } } } });
    const bundle = (Array.isArray(output) ? output[0] : output) as { output: Array<{ type: string; code?: string }> };
    code = bundle.output.find(item => item.type === "chunk")!.code!;
    const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(input: unknown): Promise<Browser> } };
    browser = await chromium.launch({ executablePath, headless: true });
  }, 30_000);
  afterAll(async () => { await browser?.close(); });
  const cases = [
    { name: "connected authorized future runs", lens: { ...configured, consent: { ...configured.consent, futureAttachment: true }, futureAttachmentStatus: "connected" }, status: 200, text: "已授权后续新运行保存象征对照", rows: 5 },
    { name: "active five dimensions", lens: configured, status: 200, text: "已配置", rows: 5 },
    { name: "not configured", lens: { revision: 0, status: "not_configured", sourceVersion: null, snapshot: null, consent: { storage: false, calculation: false, futureAttachment: false }, futureAttachmentStatus: "not_connected" }, status: 200, text: "尚未配置", rows: 0 },
    { name: "withdrawn", lens: { ...configured, status: "withdrawn", snapshot: null, consent: { storage: false, calculation: false, futureAttachment: false } }, status: 200, text: "已撤回", rows: 0 },
    { name: "stale period", lens: { ...configured, status: "stale", snapshot: buildSymbolicFrame({ birthDate: "1991-06-15", birthTime: null }, 2, "2026-09-06T00:00:00Z") }, status: 200, text: "旧时期框架，需要更新", rows: 5 },
    { name: "server failure", lens: null, status: 500, text: "暂时无法读取", rows: 0 },
    { name: "session failure", lens: null, status: 401, text: "暂时无法读取", rows: 0 },
    { name: "malformed snapshot", lens: { ...configured, snapshot: {} }, status: 200, text: "暂时无法读取", rows: 0 },
    { name: "mismatched source", lens: { ...configured, sourceVersion: 9 }, status: 200, text: "暂时无法读取", rows: 0 },
    { name: "missing consent", lens: { ...configured, consent: {} }, status: 200, text: "暂时无法读取", rows: 0 },
  ];
  for (const scenario of cases) it(scenario.name, async () => {
    const page = await browser.newPage();
    page.setDefaultTimeout(2500);
    try {
      await page.setContent('<html lang="zh"><body><div id="root"></div></body></html>');
      await page.evaluate(value => { window.symbolicFixture = value; }, { status: scenario.status, lens: scenario.lens, hold: true });
      await page.addScriptTag({ content: code });
      await page.getByRole("heading", { name: "你的个人数字生命，先从已保存的事实开始。" }).waitFor();
      await page.getByRole("region", { name: "可选象征框架" }).waitFor();
      expect(await page.evaluate(() => document.body.textContent, undefined)).toContain("正在读取象征框架");
      await page.evaluate(() => { window.releaseSymbolic?.(); }, undefined);
      await page.waitForFunction(() => !document.body.textContent?.includes("正在读取象征框架"));
      const text = await page.evaluate(() => document.body.textContent ?? "", undefined);
      expect(text).toContain(scenario.text);
      expect(text).toContain("本人记录的现实近况");
      expect(text).toContain("唯一下一步");
      expect(text).toContain("不会改变人物行动、世界状态、推演结论或置信度");
      expect(text).toContain("不代表任何历史运行已附加框架");
      expect(text).not.toMatch(/1991-06-15|natal_stem_counts|initial_tendency|formal-symbolic-frame-v1/);
      expect(await page.evaluate(() => document.querySelectorAll('[data-dashboard-symbolic-dimension]').length, undefined)).toBe(scenario.rows);
      expect(await page.evaluate(() => [...document.querySelectorAll('a')].filter(a => a.getAttribute('href') === '/app/new/people').length, undefined)).toBe(1);
      const link = page.getByRole("link", { name: scenario.rows ? "管理象征框架" : "配置象征框架", exact: true });
      await link.focus();
      expect(await page.evaluate(() => document.activeElement?.getAttribute('href'), undefined)).toBe('/app/symbolic-lens');
      const requests = await page.evaluate(() => window.symbolicRequests.filter(r => r.url === '/api/symbolic-lens'), undefined);
      expect(requests).toHaveLength(1);
      expect(requests.every(r => r.cache === 'no-store')).toBe(true);
      if (scenario.rows) for (const dimension of frame.dimensions) expect(text).toContain(dimension.label);
      if (scenario.status !== 200 || scenario.text === "暂时无法读取") expect(text).not.toContain("尚未配置");
      if (scenario.name === "server failure") {
        await page.evaluate(value => { window.symbolicFixture = { status: 200, lens: value, hold: false }; }, configured);
        await page.getByRole("button", { name: "重新读取象征框架", exact: true }).click();
        await page.getByRole("link", { name: "管理象征框架", exact: true }).waitFor();
        expect(await page.evaluate(() => document.querySelectorAll('[data-dashboard-symbolic-dimension]').length, undefined)).toBe(5);
        expect(await page.evaluate(() => window.symbolicRequests.filter(r => r.url === '/api/sandbox-overview').length, undefined)).toBe(1);
      }
    } finally { await page.close(); }
  }, 15_000);
});
