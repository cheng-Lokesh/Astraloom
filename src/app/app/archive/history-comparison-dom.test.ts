import path from "node:path";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { build } from "vite";
import { describe, expect, it } from "vitest";

const runtime = process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const executablePath = process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
type Locator = { waitFor(): Promise<void>; count(): Promise<number>; click(): Promise<void>; focus(): Promise<void> };
type Page = { setDefaultTimeout(value: number): void; setContent(html: string): Promise<void>; addScriptTag(input: { content: string }): Promise<void>; evaluate<T>(fn: () => T): Promise<T>; getByRole(role: string, input: { name: string; exact?: boolean }): Locator; keyboard: { press(key: string): Promise<void> }; locator(selector: string): Locator; close(): Promise<void> };
type Browser = { newPage(input?: { viewport: { width: number; height: number } }): Promise<Page>; close(): Promise<void> };

describe.skipIf(!existsSync(path.join(runtime, "playwright")) || !existsSync(executablePath))("History comparison hydrated Chrome DOM", () => {
  it("filters same content and restores all categories; keyboard opens side-specific values", async () => {
    const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {HistoryComparisonDetails} from '@/app/app/archive/history-comparison-details';globalThis.React=React;
      const left={participants:[],relationships:[],facts:[],assumptions:[],realityProfile:{status:'frozen',revision:1,facts:[],assumptions:[],unknowns:[],structuredResources:[{key:'resource-1',label:'学习时间',resourceType:'time',available:12,unit:'小时',minimum:0,maximum:24,usePerTick:2,classification:'fact',evidenceSummary:'本人确认'}],structuredConstraints:[],worldVariables:[]},resourceChanges:[],relationshipChanges:[],strategyPaths:[],steps:[],claims:[]};const right=structuredClone(left);right.realityProfile.structuredResources[0].available=9;createRoot(document.getElementById('root')).render(React.createElement(HistoryComparisonDetails,{left,right}));`;
    const output = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src") } }, plugins: [{ name: "history-fixture", resolveId(id) { if (id === "virtual:history") return "\0virtual:history"; }, load(id) { if (id === "\0virtual:history") return fixture; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:history", output: { format: "iife", name: "HistoryFixture" } } } });
    const bundle = (Array.isArray(output) ? output[0] : output) as { output: Array<{ type: string; code?: string }> };
    const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(input: unknown): Promise<Browser> } };
    const browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(3000);
    try {
      await page.setContent('<html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>');
      await page.addScriptTag({ content: bundle.output.find(item => item.type === "chunk")!.code! });
      await page.getByRole("heading", { name: "分类差异摘要", exact: true }).waitFor();
      expect(await page.locator("details").count()).toBe(15);
      const filter = page.getByRole("checkbox", { name: "仅查看差异与未记录项", exact: true });
      await filter.click();
      expect(await page.locator("details").count()).toBe(4);
      expect(await page.getByRole("link", { name: "各自模拟步骤 · 相同内容", exact: true }).count()).toBe(0);
      await page.getByRole("link", { name: "资源量与上下限 · 差异", exact: true }).waitFor();
      const summary = page.locator('details[id$="-resources"] > summary');
      await summary.focus(); await page.keyboard.press("Enter");
      expect(await page.evaluate(() => [...document.querySelectorAll("details")].find(item => item.querySelector("summary")?.textContent?.includes("资源量与上下限"))?.open)).toBe(true);
      const text = await page.evaluate(() => document.body.textContent ?? "");
      expect(text).toContain("资源量：12 小时"); expect(text).toContain("资源量：9 小时");
      expect(text).not.toContain("resource-1");
      await filter.click(); expect(await page.locator("details").count()).toBe(15);
    } finally { await page.close(); await browser.close(); }
  }, 30_000);
});
