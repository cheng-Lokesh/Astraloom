import path from "node:path";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { build } from "vite";
import { describe, expect, it } from "vitest";
import { safeDigitalLifeContextSchema } from "@/lib/formal-sandbox/model-context";
import { defaultPlanningContextSchema } from "@/lib/formal-planning/contracts";

const runtime = process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const executablePath = process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
type Locator = { waitFor(): Promise<void>; click(): Promise<void>; check(): Promise<void>; uncheck(): Promise<void>; fill(value: string): Promise<void>; selectOption(value: string): Promise<void>; isDisabled(): Promise<boolean>; isChecked(): Promise<boolean>; count(): Promise<number> };
type Page = { setDefaultTimeout(value: number): void; on(event: string, handler: (error: Error) => void): void; setContent(html: string): Promise<void>; addScriptTag(input: { content: string }): Promise<void>; getByLabel(name: string | RegExp): Locator; getByRole(role: string, input?: { name: string | RegExp; exact?: boolean }): Locator; evaluate<T>(fn: () => T): Promise<T>; waitForFunction(fn: () => boolean): Promise<void>; close(): Promise<void> };
type Browser = { newPage(options?: unknown): Promise<Page>; close(): Promise<void> };
type Fixture = { context: Record<string, unknown>; revision: number; failWrite: boolean; staleWrite: boolean; requests: Array<Record<string, unknown>>; planningReads: number; navigation: string; holdRead: boolean; releaseRead?: () => void; mount: () => void };
declare global { interface Window { planningFixture: Fixture; } }

const model = safeDigitalLifeContextSchema.parse({ graphSnapshotId: "00000000-0000-4000-8000-000000000001", agentSnapshotId: "00000000-0000-4000-8000-000000000002", profileRevision: 3,
  agents: [{ key: "person-1", label: "本人", role: "user_core" }], relationships: [], resources: [{ key: "resource-1", label: "时间", unit: "小时", available: 12, minimum: 2, maximum: 12, usePerTick: null, classification: "assumption", evidenceSummary: "本人确认模拟可用量" }] });
const context = defaultPlanningContextSchema.parse({ version: "formal-default-planner-v1", consentContext: "a".repeat(64), profileRevision: 3,
  resources: [{ resourceKey: "resource-1", label: "时间", unit: "小时", available: 12, minimum: 2, declaredRate: null, explicitRulePresent: false }],
  symbolicFusion: { status: "eligible", classification: "hypothesis", relationshipEffect: "not_implemented" } });

async function bundleFixture() {
  const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {FormalRunStarter} from '@/components/formal-sandbox/run-starter';import '@/app/globals.css';globalThis.React=React;
  const model=${JSON.stringify(model)},context=${JSON.stringify(context)};let uuid=9,mount=0;Object.defineProperty(crypto,'randomUUID',{value:()=> '00000000-0000-4000-8000-'+String(uuid++).padStart(12,'0')});const f=window.planningFixture={context,revision:3,failWrite:true,staleWrite:false,requests:[],planningReads:0,navigation:'',holdRead:false,mount:()=>{}};const root=createRoot(document.getElementById('root'));
  window.fetch=async(url,init)=>{url=String(url);if(url.includes('model-context'))return new Response(JSON.stringify({ok:true,context:{...model,profileRevision:f.revision}}));if(url.includes('planning-context')){f.planningReads++;const snapshot=structuredClone(f.context);if(f.holdRead)await new Promise(resolve=>f.releaseRead=resolve);return new Response(JSON.stringify({ok:true,context:snapshot}))}if(url.includes('calibration-context'))return new Response(JSON.stringify({ok:true,context:{status:'available',profileRevision:f.revision,corrections:[]}}));if(init?.method==='POST'){const body=JSON.parse(init.body);f.requests.push(body);if(f.failWrite)throw new Error('synthetic response lost');if(f.staleWrite)return new Response(JSON.stringify({ok:false,error_code:'planning_context_stale',trace_id:'safe'}),{status:409});return new Response(JSON.stringify({ok:true,idempotent:false,run:{id:'00000000-0000-4000-8000-000000000003',status:'completed'}}))}throw new Error('unexpected fixture request')};f.mount=()=>root.render(React.createElement(FormalRunStarter,{key:++mount}));f.mount();`;
  const result = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/link": "virtual:link", "next/navigation": "virtual:navigation" } }, plugins: [{ name: "planning-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; if (id === "\0virtual:navigation") return "export function useRouter(){return {push:url=>{window.planningFixture.navigation=url}}}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "Fixture" } } } });
  const output = ((Array.isArray(result) ? result[0] : result) as { output: Array<{ type: string; code?: string; source?: string; fileName: string }> }).output;
  return { script: output.find(item => item.type === "chunk")!.code!, css: output.filter(item => item.fileName.endsWith(".css")).map(item => item.source).join("\n") };
}
async function openFixture() {
  const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(input: unknown): Promise<Browser> } };
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); page.setDefaultTimeout(5000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const bundle = await bundleFixture();
  await page.setContent(`<html lang="zh"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${bundle.css}</style></head><body><main class="p-4"><div id="root"></div></main></body></html>`);
  await page.addScriptTag({ content: bundle.script });
  await page.getByLabel("授权默认规划 · 时间").waitFor();
  return { browser, page, errors };
}
async function authorize(page: Page) {
  await page.getByLabel("授权默认规划 · 时间").check();
  await page.getByLabel("整次模拟预算上限 · 时间（小时）").fill("3");
  await page.getByLabel("我确认 时间 的上述预算仅用于本次整次模拟").check();
}

describe.skipIf(!existsSync(path.join(runtime, "playwright")) || !existsSync(executablePath))("source-bound planner actual Chrome at 375px", () => {
  it("keeps default-off requests legacy, requires separate consents and recovers the exact frozen body", async () => {
    const { browser, page, errors } = await openFixture();
    try {
      expect(await page.getByLabel("授权默认规划 · 时间").isChecked()).toBe(false);
      expect(await page.getByLabel("启用本次独立初始倾向假设").isChecked()).toBe(false);
      await page.evaluate(() => { window.planningFixture.failWrite = false; });
      await page.getByRole("button", { name: "开始 30 天运行", exact: true }).click();
      await page.waitForFunction(() => Boolean(window.planningFixture.navigation));
      expect(await page.evaluate(() => "default_planning" in window.planningFixture.requests[0])).toBe(false);
      await page.evaluate(() => { window.planningFixture.failWrite = true; window.planningFixture.navigation = ""; window.planningFixture.mount(); });
      await page.getByLabel("授权默认规划 · 时间").waitFor();
      await page.getByLabel("授权默认规划 · 时间").check();
      await page.getByLabel("整次模拟预算上限 · 时间（小时）").fill("3");
      expect(await page.getByRole("button", { name: "开始 30 天运行", exact: true }).isDisabled()).toBe(true);
      await page.getByLabel("我确认 时间 的上述预算仅用于本次整次模拟").check();
      await page.getByLabel("启用本次独立初始倾向假设").check();
      expect(await page.getByRole("button", { name: "开始 30 天运行", exact: true }).isDisabled()).toBe(true);
      await page.getByLabel("我单独确认本次仅将上述产品假设用于首轮候选用量").check();
      await page.getByRole("button", { name: "开始 30 天运行", exact: true }).click();
      await page.getByRole("button", { name: "恢复原运行请求", exact: true }).waitFor();
      expect(await page.getByLabel("授权默认规划 · 时间").isDisabled()).toBe(true);
      expect(await page.getByLabel("整次模拟预算上限 · 时间（小时）").isDisabled()).toBe(true);
      expect(await page.getByRole("button", { name: "重新读取模型与规划来源", exact: true }).isDisabled()).toBe(true);
      const before = await page.evaluate(() => window.planningFixture.planningReads);
      await page.evaluate(() => { window.planningFixture.failWrite = false; window.planningFixture.context = { ...window.planningFixture.context, consentContext: "b".repeat(64) }; });
      await page.getByRole("button", { name: "恢复原运行请求", exact: true }).click();
      await page.waitForFunction(() => Boolean(window.planningFixture.navigation));
      expect(await page.evaluate(() => JSON.stringify(window.planningFixture.requests[1]) === JSON.stringify(window.planningFixture.requests[2]))).toBe(true);
      expect(await page.evaluate(() => window.planningFixture.planningReads)).toBe(before);
      const planning = await page.evaluate(() => window.planningFixture.requests[1].default_planning);
      expect(planning).toEqual({ version: context.version, consentContext: context.consentContext, resources: [{ resourceKey: "resource-1", totalBudgetLimit: 3, confirmedForSimulation: true }], fusion: { enabled: true, confirmedForSimulation: true } });
      expect(await page.evaluate(() => /[0-9a-f]{8}-[0-9a-f]{4}-|ownerId|sourceRefs|birthDate|consentContext/.test(document.body.textContent ?? ""))).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= 375)).toBe(true);
      expect(errors.length).toBe(0);
    } finally { await page.close(); await browser.close(); }
  }, 45_000);
  it("clears authorization on source reorder, rejects stale responses and recovers a business source conflict", async () => {
    const { browser, page, errors } = await openFixture();
    try {
      await authorize(page);
      await page.evaluate(() => { window.planningFixture.context = { ...window.planningFixture.context, consentContext: "b".repeat(64), resources: [{ resourceKey: "resource-1", label: "费用", unit: "模拟点", available: 5, minimum: 0, declaredRate: 1, explicitRulePresent: false }, { resourceKey: "resource-2", label: "时间", unit: "小时", available: 12, minimum: 2, declaredRate: null, explicitRulePresent: false }], symbolicFusion: { status: "unavailable", classification: "hypothesis", relationshipEffect: "not_implemented" } }; });
      await page.getByRole("button", { name: "重新读取模型与规划来源", exact: true }).click();
      await page.getByLabel("授权默认规划 · 费用").waitFor();
      expect(await page.getByLabel("授权默认规划 · 时间").isChecked()).toBe(false);
      expect(await page.getByLabel("授权默认规划 · 费用").isDisabled()).toBe(true);
      expect(await page.getByLabel("启用本次独立初始倾向假设").isDisabled()).toBe(true);
      expect(await page.getByLabel("整次模拟预算上限 · 时间（小时）").count()).toBe(0);
      await authorize(page);
      await page.evaluate(() => { window.planningFixture.failWrite = false; window.planningFixture.staleWrite = true; });
      await page.getByRole("button", { name: "开始 30 天运行", exact: true }).click();
      await page.getByRole("alert").waitFor();
      expect(await page.evaluate(() => document.body.textContent?.includes("旧规划授权已清空"))).toBe(true);
      expect(await page.getByLabel("授权默认规划 · 时间").count()).toBe(0);
      await page.evaluate(() => { window.planningFixture.holdRead = true; });
      await page.getByRole("button", { name: "重新读取模型与规划来源", exact: true }).click();
      await page.waitForFunction(() => Boolean(window.planningFixture.releaseRead));
      await page.evaluate(() => { window.planningFixture.holdRead = false; window.planningFixture.context = { ...window.planningFixture.context, consentContext: "c".repeat(64), resources: [], symbolicFusion: { status: "off", classification: "hypothesis", relationshipEffect: "not_implemented" } }; window.planningFixture.mount(); });
      await page.waitForFunction(() => document.body.textContent?.includes("当前没有可授权的资源") === true);
      await page.evaluate(() => { window.planningFixture.releaseRead?.(); });
      expect(await page.getByLabel("授权默认规划 · 时间").count()).toBe(0);
      expect(await page.getByLabel("启用本次独立初始倾向假设").isChecked()).toBe(false);
      expect(errors.length).toBe(0);
    } finally { await page.close(); await browser.close(); }
  }, 45_000);
});
