import { createRequire } from "node:module";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { build } from "vite";
import { describe, expect, it } from "vitest";

const runtime = process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const executablePath = process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
type Locator = { waitFor(): Promise<void>; click(): Promise<void>; check(): Promise<void>; fill(value: string): Promise<void>; count(): Promise<number>; isDisabled(): Promise<boolean> };
type Page = { setDefaultTimeout(value: number): void; setContent(html: string): Promise<void>; addScriptTag(input: { content: string }): Promise<void>; getByLabel(name: string | RegExp): Locator; getByRole(role: string, input?: { name: string | RegExp; exact?: boolean }): Locator; evaluate<T>(fn: () => T): Promise<T>; waitForFunction(fn: () => boolean): Promise<void>; screenshot(input: { path: string; fullPage: boolean }): Promise<void> };
type Browser = { newPage(options: unknown): Promise<Page>; close(): Promise<void> };
declare global { interface Window { profileContinuation: { requests: string[]; failure: string; open(mode: string): void } } }

const fixture = `
import React from 'react';import {createRoot} from 'react-dom/client';
import {FormalIntakeClient} from '@/app/app/new/intake/formal-intake-client';
import ScenePage from '@/app/app/new/scene/page';
globalThis.React=React;
let uuid=1;
Object.defineProperty(crypto,'randomUUID',{value:()=> '50000000-0000-4000-8000-'+String(uuid++).padStart(12,'0')});
const root=createRoot(document.getElementById('root'));
const state=window.profileContinuation={requests:[],failure:'network',open(mode){root.render(React.createElement(mode==='scene'?ScenePage:FormalIntakeClient));}};
window.fetch=async(url,init)=>{
 if(init?.method!=='POST')return new Response(JSON.stringify({errorCode:'reality_profile_required'}),{status:409});
 state.requests.push(init.body);
 if(state.failure==='network')throw new Error('synthetic lost response after write');
 if(state.failure==='server')return new Response(JSON.stringify({errorCode:'seed_context_write_failed'}),{status:500});
 if(state.failure==='invalid-success')return new Response(JSON.stringify({seedContext:{}}),{status:201});
 return new Response(JSON.stringify({seedContext:{id:'60000000-0000-4000-8000-000000000001',version:'submitted-seed-context-v1',submittedAt:'2026-10-19T00:00:00.000Z',frozenAt:'2026-10-19T00:00:00.000Z'},idempotent:true}),{status:200});
};
state.open('intake');
`;

async function bundleFixture() {
  const built = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@/components/app-shell": "virtual:shell", "@/components/language-provider": "virtual:language", "@": path.join(process.cwd(), "src"), "next/link": "virtual:link" } }, plugins: [{ name: "profile-continuation-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; if (id === "\0virtual:shell") return "export function AppShell({children}){return children}"; if (id === "\0virtual:language") return "export function useLanguage(){return {locale:'zh'}}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "ProfileContinuationFixture" } } } });
  return ((Array.isArray(built) ? built[0] : built) as { output: Array<{ type: string; code?: string }> }).output.find(item => item.type === "chunk")!.code!;
}

async function withMountedIntake(run: (page: Page) => Promise<void>) {
  if (!existsSync(path.join(runtime, "playwright")) || !existsSync(executablePath)) throw new Error("Mounted business RED requires the installed Playwright runtime and Chrome");
  const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(input: unknown): Promise<Browser> } };
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    page.setDefaultTimeout(4000);
    await page.setContent('<html lang="zh-CN"><meta name="viewport" content="width=device-width, initial-scale=1"><body><div id="root"></div></body></html>');
    await page.addScriptTag({ content: await bundleFixture() });
    await page.getByRole("textbox", { name: /^Situation summary/ }).waitFor();
    await run(page);
  } finally { await browser.close(); }
}

async function fillNewSituation(page: Page) {
  await page.getByRole("textbox", { name: /^Situation summary/ }).fill("最近团队协作安排发生变化，我希望梳理接下来三个月可观察的变化与个人准备。");
  await page.getByRole("textbox", { name: /^Main question/ }).fill("怎样安排下一阶段沟通与个人学习时间？");
  await page.getByLabel(/^我了解提交内容/).check();
}

async function submitOrRetry(page: Page) {
  await page.getByRole("button", { name: /^(提交正式 Track A Seed|重试原处境提交)$/ }).click();
}

describe("new-situation continuation mounted React business boundaries", () => {
  it("offers an explicit saved-reality entry alongside blank intake on the new-situation page", async () => {
    await withMountedIntake(async page => {
      await page.evaluate(() => window.profileContinuation.open("scene"));
      await page.getByRole("heading", { name: "开始一个属于你的个人数字生命沙盘。" }).waitFor();
      expect(await page.getByRole("link", { name: "沿用我的现实资料", exact: true }).count()).toBe(1);
    });
  }, 30_000);

  for (const failure of ["network", "server", "invalid-success"]) {
    it(`locks all editable new-situation fields after an unknown ${failure} response`, async () => {
      await withMountedIntake(async page => {
        await fillNewSituation(page);
        await page.evaluate(() => { window.profileContinuation.failure = "network"; });
        if (failure === "server") await page.evaluate(() => { window.profileContinuation.failure = "server"; });
        if (failure === "invalid-success") await page.evaluate(() => { window.profileContinuation.failure = "invalid-success"; });
        await submitOrRetry(page);
        await page.waitForFunction(() => window.profileContinuation.requests.length === 1 && Boolean(document.querySelector('[role="status"]')?.textContent));
        const output = path.resolve("output/playwright/profile-continuation"); mkdirSync(output, { recursive: true });
        await page.screenshot({ path: path.join(output, `red-${failure}.png`), fullPage: true });
        expect(await page.getByRole("textbox", { name: /^Situation summary/ }).isDisabled()).toBe(true);
        expect(await page.getByRole("textbox", { name: /^Main question/ }).isDisabled()).toBe(true);
        expect(await page.getByLabel(/^我了解提交内容/).isDisabled()).toBe(true);
        expect(await page.getByRole("button", { name: "30 days", exact: true }).isDisabled()).toBe(true);
        expect(await page.getByRole("link", { name: "进入 People", exact: true }).count()).toBe(0);
      });
    }, 30_000);
  }

  it("replays the exact original complete body and submission key after a lost response", async () => {
    await withMountedIntake(async page => {
      await fillNewSituation(page);
      await submitOrRetry(page);
      await page.waitForFunction(() => window.profileContinuation.requests.length === 1 && Boolean(document.querySelector('[role="status"]')?.textContent));
      await page.evaluate(() => { window.profileContinuation.failure = ""; });
      await submitOrRetry(page);
      await page.waitForFunction(() => window.profileContinuation.requests.length === 2);
      const requests = await page.evaluate(() => window.profileContinuation.requests);
      expect(JSON.parse(requests[0]).draft.createdAt).toBeTruthy();
      expect(requests[1]).toBe(requests[0]);
      await page.getByRole("link", { name: "进入 People", exact: true }).waitFor();
    });
  }, 30_000);
});
