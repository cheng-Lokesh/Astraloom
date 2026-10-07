import path from "node:path";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { build } from "vite";
import { describe, expect, it } from "vitest";

const runtime = process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const executablePath = process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
type Locator = { waitFor(): Promise<void>; click(): Promise<void>; check(): Promise<void>; fill(value: string): Promise<void>; selectOption(value: string): Promise<void>; isDisabled(): Promise<boolean>; isChecked(): Promise<boolean>; count(): Promise<number> };
type Page = { setDefaultTimeout(value: number): void; on(event: string, handler: (error: Error) => void): void; setContent(html: string): Promise<void>; addScriptTag(input: { content: string }): Promise<void>; getByLabel(name: string | RegExp): Locator; getByRole(role: string, input?: { name: string | RegExp; exact?: boolean }): Locator; evaluate<T>(fn: () => T): Promise<T>; waitForFunction(fn: () => boolean): Promise<void>; close(): Promise<void> };
type Browser = { newPage(options?: unknown): Promise<Page>; close(): Promise<void> };
declare global { interface Window { outcomeFixture: { mode: string; failRead: boolean; failWrite: boolean; holdRead: boolean; releaseRead?: () => void; readStarted: number; requests: Array<Record<string, unknown>>; navigation: string; mount: (mode: string) => void; }; } }

const target = { key: "target-1", label: "本人主路径投入条件", status: "not_observable", reason: "整组模拟含不可直接观察的内部状态", observationWindow: { startAt: "2026-01-01T00:00:00Z", horizonEnd: "2099-01-01T00:00:00Z" }, canRecordDidNotOccur: false, canRecordTypedObservation:true, correctionAllowed:true, criteriaStatus:"available", conditions: [{ key: "condition-1", label: "本人投入时间", kind: "allocate_resource", expectedValue: 2, ruleKey: "rule-1", correctable: true, requiresTime:true,measurement:"operation",actorLabel:"本人",resourceLabel:"时间",sequence:1 }, { key: "condition-2", label: "合作回应", kind: "update_relation_signal", expectedValue: "positive", ruleKey: "rule-2", correctable: true,requiresTime:true,measurement:"operation",actorLabel:"协作对象",resourceLabel:null,sequence:2 },{key:"condition-3",label:"实际投入总次数",kind:"allocate_resource",expectedValue:2,ruleKey:null,correctable:false,requiresTime:false,measurement:"event_count",actorLabel:null,resourceLabel:null,sequence:0 }] };
const projection = { lockStatus: "available", assessedAt: "2026-10-06T00:00:00Z", targets: [target], history: [], calibration: { status: "insufficient_data", sampleCount: 0, minimumSampleSize: 5 } };
const model = { graphSnapshotId: "00000000-0000-4000-8000-000000000001", agentSnapshotId: "00000000-0000-4000-8000-000000000002", profileRevision: 3, agents: [{ key: "person-1", label: "本人", role: "user_core" }], relationships: [], resources: [] };
const stableKey = `correction-v1-${"a".repeat(64)}`;
const calibration = { status: "available", profileRevision: 3, corrections: [{ key: stableKey, label: "本人投入修正", evidenceSummary: "本人观察后补充", ruleKey: "rule-1", kind: "allocate_resource", previousValue: 2, nextValue: 3, version: 1, status: "eligible", reason: null }, { key: `correction-v1-${"b".repeat(64)}`, label: "过期回应修正", evidenceSummary: "此前观察", ruleKey: "rule-2", kind: "update_relation_signal", previousValue: "positive", nextValue: "neutral", version: 1, status: "incompatible", reason: "绑定条件已过期或不适用于当前模型" }] };

async function bundleFixture() {
  const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {OutcomeObservations} from '@/components/formal-sandbox/outcome-observations';import {FormalRunStarter} from '@/components/formal-sandbox/run-starter';globalThis.React=React;
  const base=${JSON.stringify(projection)},model=${JSON.stringify(model)},calibration=${JSON.stringify(calibration)};let uuid=9,mount=0;Object.defineProperty(crypto,'randomUUID',{value:()=> '00000000-0000-4000-8000-'+String(uuid++).padStart(12,'0')});const f=window.outcomeFixture={mode:'normal',failRead:false,failWrite:true,holdRead:true,readStarted:0,requests:[],navigation:'',mount:()=>{}};const root=createRoot(document.getElementById('root'));let history=[];
  function projected(mode){if(mode==='legacy')return {...base,lockStatus:'historical_lock_not_recorded',targets:[{...base.targets[0],status:'not_observable',canRecordTypedObservation:false,correctionAllowed:false,criteriaStatus:'not_recorded',conditions:[],reason:'历史运行未记录事前锁定条件'}],history:[]};if(mode==='empty')return {...base,targets:[],history:[]};return {...base,history}}
  window.fetch=async(url,init)=>{url=String(url);if(url.includes('model-context'))return new Response(JSON.stringify({ok:true,context:model}));if(url.includes('calibration-context'))return new Response(JSON.stringify({ok:true,context:calibration}));if(init?.method==='POST'){const body=JSON.parse(init.body);f.requests.push(body);if(f.failWrite)throw new Error('synthetic response lost');if(url.endsWith('/outcomes')){history=[{key:'observation-1',targetKey:body.target_key,observed:body.observed,recordedAt:'2026-10-06T00:00:00Z',occurredAt:body.occurred_at??null,source:'user_observation',evidenceSummary:body.evidence_summary,uncertainty:body.uncertainty,backtestStatus:'insufficient_data',correctionAvailable:Boolean(body.correction),observations:body.observations.map(o=>({key:o.key,value:o.value,occurredAt:o.occurred_at??null})),criteriaComparison:{status:'unknown',differences:[]}}];return new Response(JSON.stringify({ok:true,idempotent:true,outcomes:projected(f.mode)}))}return new Response(JSON.stringify({ok:true,idempotent:false,run:{id:'00000000-0000-4000-8000-000000000003',status:'completed'}}))}const mode=f.mode;f.readStarted++;if(f.holdRead)await new Promise(resolve=>f.releaseRead=resolve);if(f.failRead)return new Response(JSON.stringify({ok:false,error_code:'persistence_failed',trace_id:'safe'}),{status:500});return new Response(JSON.stringify({ok:true,outcomes:projected(mode)}))};f.mount=(mode)=>{f.mode=mode;root.render(mode==='starter'?React.createElement(FormalRunStarter,{key:++mount}):React.createElement(OutcomeObservations,{key:++mount,runId:'00000000-0000-4000-8000-000000000004'}))};f.mount('normal');`;
  const result = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/link": "virtual:link", "next/navigation": "virtual:navigation" } }, plugins: [{ name: "outcome-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; if (id === "\0virtual:navigation") return "export function useRouter(){return {push:url=>{window.outcomeFixture.navigation=url}}}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "Fixture" } } } });
  return ((Array.isArray(result) ? result[0] : result) as { output: Array<{ type: string; code?: string }> }).output.find(item => item.type === "chunk")!.code!;
}

describe.skipIf(!existsSync(path.join(runtime, "playwright")) || !existsSync(executablePath))("personal outcome and explicit calibration actual Chrome controls", () => {
  it("handles loading/errors, complete conditions, same-request recovery, history, legacy and stale reads", async () => {
    const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(input: unknown): Promise<Browser> } };
    const browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); page.setDefaultTimeout(4000);
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    try {
      await page.setContent('<html lang="zh"><body><div id="root"></div></body></html>');
      await page.addScriptTag({ content: await bundleFixture() });
      await page.waitForFunction(() => window.outcomeFixture.readStarted === 1);
      expect(await page.evaluate(() => document.body.textContent?.includes("正在读取事前锁定"))).toBe(true);
      await page.evaluate(() => { window.outcomeFixture.failRead = true; window.outcomeFixture.holdRead = false; window.outcomeFixture.releaseRead?.(); });
      await page.getByRole("alert").waitFor();
      await page.evaluate(() => { window.outcomeFixture.failRead = false; });
      await page.getByRole("button", { name: "重新读取观察记录", exact: true }).click();
      await page.getByLabel("实际观察 · 本人投入时间").waitFor();
      expect(await page.getByLabel("完整窗口结束后未发生").count()).toBe(0);
      expect(await page.getByLabel(/^我确认以上是本人观察/).isChecked()).toBe(false);
      await page.getByLabel("实际观察 · 本人投入时间").fill("3");
      await page.getByLabel("实际观察 · 合作回应").selectOption("neutral");
      await page.getByLabel("条件发生时间 · 本人投入时间").fill("2026-10-02T08:00");
      await page.getByLabel("条件发生时间 · 合作回应").fill("2026-10-02T09:00");
      expect(await page.evaluate(() => document.querySelector('input[aria-label="实际观察 · 实际投入总次数"]')?.getAttribute("step"))).toBe("1");
      await page.getByLabel("实际观察 · 实际投入总次数").fill("2");
      await page.getByLabel("观察依据简述").fill("本人观察到投入但仍需等待合作回应");
      expect(await page.getByRole("button", { name: "保存本人观察", exact: true }).isDisabled()).toBe(true);
      await page.getByLabel(/^我确认以上是本人观察/).check();
      await page.getByRole("button", { name: "保存本人观察", exact: true }).click();
      await page.getByRole("button", { name: "重试原观察保存", exact: true }).waitFor();
      expect(await page.getByLabel("观察依据简述").isDisabled()).toBe(true);
      expect(await page.evaluate(() => window.outcomeFixture.requests.length)).toBe(1);
      await page.evaluate(() => { window.outcomeFixture.failWrite = false; });
      await page.getByRole("button", { name: "重试原观察保存", exact: true }).click();
      await page.waitForFunction(() => window.outcomeFixture.requests.length === 2);
      expect(await page.evaluate(() => JSON.stringify(window.outcomeFixture.requests[0]) === JSON.stringify(window.outcomeFixture.requests[1]))).toBe(true);
      await page.waitForFunction(() => document.body.textContent?.includes("记录时间：") === true);
      expect(await page.getByLabel(/^我确认以上是本人观察/).isChecked()).toBe(false);
      expect(await page.evaluate(() => document.body.textContent?.includes("已发生率") || document.body.textContent?.includes("准确率"))).toBe(false);
      await page.evaluate(() => { window.outcomeFixture.mount("legacy"); });
      await page.waitForFunction(() => document.body.textContent?.includes("仅保存观察说明") === true);
      expect(await page.getByLabel("已发生",).count()).toBe(0);
      expect(await page.getByLabel("实际观察 · 本人投入时间").count()).toBe(0);
      // An old read resolving after a different component has mounted cannot restore the old form.
      await page.evaluate(() => { window.outcomeFixture.holdRead = true; window.outcomeFixture.mount("normal"); });
      await page.waitForFunction(() => document.body.textContent?.includes("正在读取事前锁定") === true);
      await page.evaluate(() => { window.outcomeFixture.holdRead = false; window.outcomeFixture.mount("empty"); });
      await page.waitForFunction(() => document.body.textContent?.includes("暂无可回填") === true);
      await page.evaluate(() => { window.outcomeFixture.releaseRead?.(); });
      expect(await page.getByLabel("实际观察 · 本人投入时间").count()).toBe(0);
      expect(errors).toEqual([]);
    } finally { await page.close(); await browser.close(); }
  }, 40_000);
  it("sends only a stable selected correction and version after explicit confirmation, preserving unknown start body", async () => {
    const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(input: unknown): Promise<Browser> } };
    const browser = await chromium.launch({ executablePath, headless: true }); const page = await browser.newPage(); page.setDefaultTimeout(4000);
    try {
      await page.setContent('<html lang="zh"><body><div id="root"></div></body></html>'); await page.addScriptTag({ content: await bundleFixture() });
      await page.evaluate(() => { window.outcomeFixture.holdRead = false; window.outcomeFixture.mount("starter"); });
      await page.getByLabel(/^本人投入修正/).waitFor();
      expect(await page.getByLabel(/^本人投入修正/).isChecked()).toBe(false);
      expect(await page.getByLabel(/^过期回应修正/).isDisabled()).toBe(true);
      await page.getByLabel(/^本人投入修正/).check();
      expect(await page.getByRole("button", { name: "开始 30 天运行", exact: true }).isDisabled()).toBe(true);
      await page.getByLabel("我确认将所选本人观察修正作为本次运行的条件假设").check();
      await page.getByRole("button", { name: "开始 30 天运行", exact: true }).click();
      await page.getByRole("button", { name: "恢复原运行请求", exact: true }).waitFor();
      expect(await page.getByLabel("运行时间窗口").isDisabled()).toBe(true);
      expect(await page.getByLabel(/^本人投入修正/).isDisabled()).toBe(true);
      await page.evaluate(() => { window.outcomeFixture.failWrite = false; });
      await page.getByRole("button", { name: "恢复原运行请求", exact: true }).click();
      await page.waitForFunction(() => Boolean(window.outcomeFixture.navigation));
      const evidence = await page.evaluate(() => ({ same: JSON.stringify(window.outcomeFixture.requests[0]) === JSON.stringify(window.outcomeFixture.requests[1]), selection: window.outcomeFixture.requests[0].outcome_calibration, visible: document.body.textContent?.includes("correction-v1-") }));
      expect(evidence.same).toBe(true);
      expect(evidence.selection).toEqual({ version: 1, correction_keys: [stableKey], confirmed: true });
      expect(evidence.visible).toBe(false);
    } finally { await page.close(); await browser.close(); }
  }, 35_000);
});
