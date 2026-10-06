import path from "node:path";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { build } from "vite";
import { describe, expect, it } from "vitest";
import { buildSymbolicFrame } from "@/lib/formal-symbolic-lens/frame";
const runtime = process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const executablePath = process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
type Locator = { waitFor(): Promise<void>; click(): Promise<void>; count(): Promise<number>; isDisabled(): Promise<boolean> };
type Page = { setDefaultTimeout(value: number): void; setContent(html: string): Promise<void>; addScriptTag(input: { content: string }): Promise<void>; evaluate<T>(fn: () => T): Promise<T>; waitForFunction(fn: () => boolean): Promise<void>; getByRole(role: string, input: { name: string; exact?: boolean }): Locator; close(): Promise<void> };
type Browser = { newPage(): Promise<Page>; close(): Promise<void> };
declare global { interface Window { symbolicRaceTrace: string[]; releaseSymbolicRace?: () => void; symbolicRaceGets: number; } }
const active = { revision: 1, status: "active", sourceVersion: 1, snapshot: buildSymbolicFrame({ birthDate: "1991-06-15", birthTime: null }, 1, "2026-10-06T00:00:00Z"), consent: { storage: true, calculation: true, futureAttachment: false }, futureAttachmentStatus: "not_connected" };
const withdrawn = { ...active, revision: 2, status: "withdrawn", snapshot: null, consent: { storage: false, calculation: false, futureAttachment: false } };
describe.skipIf(!existsSync(path.join(runtime, "playwright")) || !existsSync(executablePath))("symbolic lens real React DOM read/withdraw ordering", () => {
  it("ignores an old manual GET arriving after a newer GET and successful withdrawal", async () => {
    const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {SymbolicLensClient} from '@/app/app/symbolic-lens/symbolic-lens-client';globalThis.React=React;window.symbolicRaceTrace=[];window.symbolicRaceGets=0;let lens=${JSON.stringify(active)};Object.defineProperty(crypto,'randomUUID',{value:()=> '00000000-0000-4000-8000-00000000d999'});window.fetch=async(url,init)=>{if(url.endsWith('/future-attachment'))return new Response(JSON.stringify({ok:true,attachment:{revision:lens.revision,enabled:lens.consent.futureAttachment,eligible:lens.status==='active',status:lens.status}}));if(init?.method==='POST'){window.symbolicRaceTrace.push('withdraw done');lens=${JSON.stringify(withdrawn)};return new Response(JSON.stringify({ok:true,lens}))}const value=lens;const n=window.symbolicRaceGets++;window.symbolicRaceTrace.push('GET'+n+' start');if(n===1)await new Promise(resolve=>window.releaseSymbolicRace=resolve);window.symbolicRaceTrace.push('GET'+n+(n===1?' returned':' active'));return new Response(JSON.stringify({ok:true,lens:value}))};createRoot(document.getElementById('root')).render(React.createElement(SymbolicLensClient));`;
    const output = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/link": "virtual:link" } }, plugins: [{ name: "symbolic-race-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "Fixture" } } } });
    const bundle = (Array.isArray(output) ? output[0] : output) as { output: Array<{ type: string; code?: string }> };
    const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(input: unknown): Promise<Browser> } };
    const browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage(); page.setDefaultTimeout(3000);
    try {
      await page.setContent('<html lang="zh"><body><div id="root"></div></body></html>');
      await page.addScriptTag({ content: bundle.output.find(item => item.type === "chunk")!.code! });
      await page.getByRole("button", { name: "撤回后续使用", exact: true }).waitFor();
      await page.getByRole("button", { name: "重新读取", exact: true }).click();
      await page.waitForFunction(() => window.symbolicRaceGets === 2);
      await page.getByRole("button", { name: "重新读取", exact: true }).click();
      await page.getByRole("button", { name: "撤回后续使用", exact: true }).waitFor();
      await page.getByRole("button", { name: "撤回后续使用", exact: true }).click();
      await page.waitForFunction(() => document.body.textContent?.includes("已撤回，没有当前有效镜头") === true);
      expect(await page.evaluate(() => document.querySelectorAll('[data-symbolic-dimension]').length)).toBe(0);
      await page.evaluate(() => { window.releaseSymbolicRace?.(); });
      await page.waitForFunction(() => window.symbolicRaceTrace.includes("GET1 returned"));
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const probe = await page.evaluate(() => { const accepted = document.querySelectorAll('[data-symbolic-dimension]').length > 0;window.symbolicRaceTrace.push(accepted ? 'GET1 stale accepted' : 'GET1 stale ignored');return { accepted, trace: window.symbolicRaceTrace, withdrawn: document.body.textContent?.includes('已撤回，没有当前有效镜头') === true }; });
      console.info(`[hunt:symbolic-order] ${probe.trace.join(" -> ")}`);
      expect(probe.trace.slice(2, 6)).toEqual(["GET1 start", "GET2 start", "GET2 active", "withdraw done"]);
      expect(probe.accepted).toBe(false); expect(probe.withdrawn).toBe(true);
      expect(await page.getByRole("button", { name: "撤回后续使用", exact: true }).count()).toBe(0);
    } finally { await page.close(); await browser.close(); }
  }, 30_000);
});
