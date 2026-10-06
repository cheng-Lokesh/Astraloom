import path from "node:path";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { build } from "vite";
import { beforeAll, describe, expect, it } from "vitest";
import { buildSymbolicFrame } from "@/lib/formal-symbolic-lens/frame";

const runtime = process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const executablePath = process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
type Locator = { waitFor(): Promise<void>; click(): Promise<void>; check(): Promise<void>; count(): Promise<number>; isDisabled(): Promise<boolean>; isChecked(): Promise<boolean> };
type Page = { setDefaultTimeout(value: number): void; setContent(html: string): Promise<void>; addScriptTag(input: { content: string }): Promise<void>; evaluate<T>(fn: () => T): Promise<T>; waitForFunction(fn: () => boolean): Promise<void>; getByRole(role: string, input: { name: string; exact?: boolean }): Locator; locator(selector: string): Locator; close(): Promise<void> };
type Browser = { newPage(): Promise<Page>; close(): Promise<void> };
declare global { interface Window { futureProbe: { requests: Array<{ method: string; body: Record<string, unknown> | null }>; futureReads: number; release?: () => void; released: boolean }; } }
const active = { revision: 1, status: "active", sourceVersion: 1, snapshot: buildSymbolicFrame({ birthDate: "1991-06-15", birthTime: null }, 1, "2026-10-06T00:00:00Z"), consent: { storage: true, calculation: true, futureAttachment: false }, futureAttachmentStatus: "connected" };
const scenarios = ["normal", "unknown", "stale", "withdrawn", "not_configured", "stale-enabled", "close-race", "withdraw-race", "mismatch", "refresh", "delayed-confirmation"] as const;
type Scenario = typeof scenarios[number];
const bundles = new Map<Scenario, string>();
function fixture(scenario: Scenario) {
  return `import React from 'react';import {createRoot} from 'react-dom/client';import {SymbolicLensClient} from '@/app/app/symbolic-lens/symbolic-lens-client';globalThis.React=React;
let lens=${JSON.stringify(active)};const mode=${JSON.stringify(scenario)};
if(mode==='stale'||mode==='stale-enabled')lens.status='stale';if(mode==='withdrawn'||mode==='not_configured'){lens.status=mode;lens.snapshot=null;lens.consent={storage:false,calculation:false,futureAttachment:false};if(mode==='not_configured')lens.sourceVersion=null;}
if(mode.endsWith('race')||mode==='stale-enabled'||mode==='refresh')lens.consent.futureAttachment=true;if(mode==='refresh')lens.status='stale';
window.futureProbe={requests:[],futureReads:0,released:false};let nextKey=0;Object.defineProperty(crypto,'randomUUID',{value:()=> '00000000-0000-4000-8000-'+String(++nextKey).padStart(12,'0')});
const attachment=()=>({revision:lens.revision,enabled:lens.consent.futureAttachment,eligible:lens.status==='active',status:lens.status});
window.fetch=async(url,init)=>{const method=init?.method||'GET';const body=init?.body?JSON.parse(init.body):null;window.futureProbe.requests.push({method,body});
if(url.endsWith('/future-attachment')){if(method==='PUT'){if(mode==='unknown')throw new Error('private diagnostic never rendered');lens={...lens,revision:lens.revision+1,consent:{...lens.consent,futureAttachment:body.enabled}};return new Response(JSON.stringify({ok:true,attachment:attachment()}));}
const value=attachment();const n=window.futureProbe.futureReads++;if((mode.endsWith('race')&&n===1)||(mode==='delayed-confirmation'&&n===1))await new Promise(resolve=>window.futureProbe.release=()=>{window.futureProbe.released=true;resolve()});if(mode==='mismatch')value.revision++;return new Response(JSON.stringify({ok:true,attachment:value}));}
if(method==='POST'){lens={...lens,revision:lens.revision+1,status:'withdrawn',snapshot:null,consent:{storage:false,calculation:false,futureAttachment:false}};return new Response(JSON.stringify({ok:true,lens}));}
if(method==='PUT'){lens={...lens,revision:lens.revision+1,status:'active',consent:{...lens.consent,futureAttachment:false}};return new Response(JSON.stringify({ok:true,lens}));}
return new Response(JSON.stringify({ok:true,lens}));};createRoot(document.getElementById('root')).render(React.createElement(SymbolicLensClient));`;
}
async function open(scenario: Scenario) {
  const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(input: unknown): Promise<Browser> } };
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage(); page.setDefaultTimeout(1800);
  await page.setContent('<html lang="zh"><body><div id="root"></div></body></html>');
  await page.addScriptTag({ content: bundles.get(scenario)! });
  return { page, close: async () => { await page.close(); await browser.close(); } };
}
const checkbox = (page: Page) => page.locator('input[name="future-attachment-consent"]');
const grant = (page: Page) => page.getByRole("button", { name: "保存后续推演授权", exact: true });
const closeGrant = (page: Page) => page.getByRole("button", { name: "关闭后续推演附加", exact: true });
const reload = (page: Page) => page.getByRole("button", { name: "重新读取", exact: true });
async function readComplete(page: Page) { await page.waitForFunction(() => document.body.textContent?.includes("读取完成") === true); }
describe.skipIf(!existsSync(path.join(runtime, "playwright")) || !existsSync(executablePath))("symbolic future attachment real React DOM", { timeout: 15_000 }, () => {
  beforeAll(async () => {
    for (const scenario of scenarios) {
      const output = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/link": "virtual:link" } }, plugins: [{ name: "symbolic-future-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture(scenario); if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "Fixture" } } } });
      const bundle = (Array.isArray(output) ? output[0] : output) as { output: Array<{ type: string; code?: string }> };
      bundles.set(scenario, bundle.output.find(item => item.type === "chunk")!.code!);
    }
  }, 30_000);
  it("starts unchecked and persists only explicit grant, then reloads and closes", async () => {
    const session = await open("normal"); const { page } = session;
    try {
      await readComplete(page); expect(await checkbox(page).isChecked()).toBe(false); expect(await grant(page).isDisabled()).toBe(true);
      expect(await page.locator('input[name="storage-consent"]').isChecked()).toBe(false); expect(await page.locator('input[name="calculation-consent"]').isChecked()).toBe(false);
      await checkbox(page).check(); await grant(page).click(); await closeGrant(page).waitFor();
      const body = await page.evaluate(() => window.futureProbe.requests.find(r => r.method === 'PUT')?.body);
      expect(Object.keys(body!)).toEqual(["revision", "enabled", "idempotency_key"]); expect(body?.revision).toBe(1); expect(body?.enabled).toBe(true); expect(body?.idempotency_key).toMatch(/^[a-f0-9-]{36}$/);
      await reload(page).click(); await closeGrant(page).waitFor(); await closeGrant(page).click(); await grant(page).waitFor(); expect(await checkbox(page).isChecked()).toBe(false);
      expect(await page.evaluate(() => window.futureProbe.requests.filter(r => r.method === 'PUT').map(r => r.body?.enabled))).toEqual([true, false]);
    } finally { await session.close(); }
  });
  it("unknown write blocks all writes until explicit reload, without success or automatic retry", async () => {
    const session = await open("unknown"); const { page } = session;
    try {
      await readComplete(page); await checkbox(page).check(); await grant(page).click();
      await page.waitForFunction(() => document.body.textContent?.includes("请先重新读取账户状态") === true);
      expect(await closeGrant(page).count()).toBe(0); expect(await grant(page).isDisabled()).toBe(true); expect(await page.locator('input[name="storage-consent"]').isDisabled()).toBe(true);
      expect(await page.evaluate(() => window.futureProbe.requests.filter(r => r.method === 'PUT').length)).toBe(1);
      expect(await page.evaluate(() => document.body.textContent?.includes('private diagnostic'))).toBe(false);
      await reload(page).click(); await readComplete(page); expect(await checkbox(page).isChecked()).toBe(false);
    } finally { await session.close(); }
  });
  it.each(["stale", "withdrawn", "not_configured"] as const)("does not permit enabling %s", async scenario => {
    const session = await open(scenario); const { page } = session;
    try { await readComplete(page); expect(await checkbox(page).isChecked()).toBe(false); expect(await checkbox(page).isDisabled()).toBe(true); expect(await grant(page).isDisabled()).toBe(true); }
    finally { await session.close(); }
  });
  it("allows closing a stale existing grant", async () => {
    const session = await open("stale-enabled"); const { page } = session;
    try { await readComplete(page); expect(await closeGrant(page).isDisabled()).toBe(false); await closeGrant(page).click(); await grant(page).waitFor(); expect(await checkbox(page).isDisabled()).toBe(true); }
    finally { await session.close(); }
  });
  it.each(["close-race", "withdraw-race"] as const)("ignores delayed future GET after %s", async scenario => {
    const session = await open(scenario); const { page } = session;
    try {
      await readComplete(page); await reload(page).click(); await page.waitForFunction(() => window.futureProbe.futureReads === 2);
      await reload(page).click(); await closeGrant(page).waitFor();
      if (scenario === "close-race") { await closeGrant(page).click(); await grant(page).waitFor(); }
      else { await page.getByRole("button", { name: "撤回后续使用", exact: true }).click(); await page.waitForFunction(() => document.body.textContent?.includes("已撤回，没有当前有效镜头") === true); }
      await page.evaluate(() => window.futureProbe.release?.()); await page.waitForFunction(() => window.futureProbe.released);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      expect(await closeGrant(page).count()).toBe(0); expect(await checkbox(page).isChecked()).toBe(false);
      if (scenario === "withdraw-race") expect(await page.locator('[data-symbolic-dimension]').count()).toBe(0);
    } finally { await session.close(); }
  });
  it("refuses mismatched shared revisions", async () => {
    const session = await open("mismatch"); const { page } = session;
    try { await page.waitForFunction(() => document.body.textContent?.includes("重新读取") === true); await page.waitForFunction(() => window.futureProbe.futureReads === 1); expect(await grant(page).isDisabled()).toBe(true); expect(await page.locator('input[name="storage-consent"]').isDisabled()).toBe(true); }
    finally { await session.close(); }
  });
  it("does not claim enabled before post-write GET confirms the account", async () => {
    const session = await open("delayed-confirmation"); const { page } = session;
    try { await readComplete(page); await checkbox(page).check(); await grant(page).click(); await page.waitForFunction(() => window.futureProbe.futureReads === 2); expect(await closeGrant(page).count()).toBe(0); await page.evaluate(() => window.futureProbe.release?.()); await closeGrant(page).waitFor(); }
    finally { await session.close(); }
  });
  it("requires a fresh explicit grant after period refresh", async () => {
    const session = await open("refresh"); const { page } = session;
    try { await readComplete(page); await page.getByRole("button", { name: "更新到当前时期", exact: true }).click(); await grant(page).waitFor(); expect(await checkbox(page).isChecked()).toBe(false); expect(await grant(page).isDisabled()).toBe(true); expect(await page.evaluate(() => window.futureProbe.requests.filter(r => r.method === 'PUT').length)).toBe(1); }
    finally { await session.close(); }
  });
});
