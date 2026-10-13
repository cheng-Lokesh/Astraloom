import path from "node:path";
import { createRequire } from "node:module";
import { build } from "vite";
import { expect, it, vi } from "vitest";
import { defaultPlanningContextSchema, defaultPlanningRequestSchema } from "@/lib/formal-planning/contracts";
import { safeDigitalLifeContextSchema } from "@/lib/formal-sandbox/model-context";
import { safeRelationshipResponseSchema } from "@/lib/formal-planning/relationship-contracts";
import { tmpdir } from "node:os";
import { digitalLifeInput, digitalLifeRules } from "@/lib/digital-life/test-fixtures";
import { digitalLifeRulesSchema } from "@/lib/digital-life/model";
import { planningSource, relationshipRequest } from "@/lib/formal-planning/test-fixtures";
import { buildFormalSandboxRunV2 } from "@/lib/formal-sandbox/runtime";
import { projectFormalSandboxResult } from "@/lib/formal-sandbox/result-projection.server";

const modules = "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
type Locator = { waitFor(): Promise<void>; click(): Promise<void>; check(): Promise<void>; uncheck(): Promise<void>; fill(value: string): Promise<void>; selectOption(value: string): Promise<void>; isDisabled(): Promise<boolean>; isChecked(): Promise<boolean> };
type Page = { setContent(html: string): Promise<void>; addScriptTag(input: { content: string }): Promise<void>; on(event: string, fn: (error: Error) => void): void; getByLabel(name: string | RegExp): Locator; getByText(name: string, options?: { exact?: boolean }): Locator; getByRole(role: string, options: { name: string; exact?: boolean }): Locator; waitForFunction(fn: () => boolean): Promise<void>; evaluate<T>(fn: () => T): Promise<T>; screenshot(options: { path: string; fullPage: boolean }): Promise<unknown>; close(): Promise<void> };
declare global { interface Window { relationshipUI: { requests: Array<Record<string, unknown>>; reads: number; loseResponse: boolean; remount: () => void; rerender: (graphId: string) => void; showFrozen: () => void; showActualFrozen: () => void }; } }
const model = safeDigitalLifeContextSchema.parse({ graphSnapshotId: "00000000-0000-4000-8000-000000000001", agentSnapshotId: "00000000-0000-4000-8000-000000000002", profileRevision: 2,
  agents: [{ key: "person-1", label: "本人", role: "user_core" }, { key: "person-2", label: "协作对象", role: "npc" }],
  relationships: [{ key: "relation-1", label: "协作关系", fromPersonKey: "person-1", toPersonKey: "person-2" }],
  resources: [{ key: "resource-1", label: "时间", unit: "小时", available: 8, minimum: 1, maximum: 8, usePerTick: null, classification: "assumption", evidenceSummary: "本人确认模拟可用量" }] });
const planning = defaultPlanningContextSchema.parse({ version: "formal-default-planner-v1", consentContext: "a".repeat(64), profileRevision: 2,
  resources: [{ resourceKey: "resource-1", label: "时间", unit: "小时", available: 8, minimum: 1, declaredRate: null, explicitRulePresent: false }],
  symbolicFusion: { status: "eligible", classification: "hypothesis", relationshipEffect: "not_implemented" } });
const frozen = safeRelationshipResponseSchema.parse({ version: "formal-relationship-response-hypothesis-v1", pathKey: "main", status: "active",
  selfLabel: "本人", npcLabel: "协作对象", relationLabel: "协作关系", resourceLabel: "时间", unit: "小时", signal: "negative", baseNegativeReduction: 0.05,
  symbolicAdditionalReduction: 0.05, negativeReduction: 0.1, reductionCap: 0.1, symbolicStatus: "active", classification: "hypothesis", realWorldEvidence: false, scientificProbability: false,
  samples: [{ key: "sample-1", status: "selected", responseTickNumber: 2, allocationTickNumber: 3, neutralAmount: 1, proposedAmount: 0.9, actualAmount: 0.9, appliedReduction: 0.1, assumptionCategories: ["formal_relationship_response_v1"] },
    { key: "sample-2", status: "not_selected", responseTickNumber: 2, allocationTickNumber: null, neutralAmount: 1, proposedAmount: 0.9, actualAmount: null, appliedReduction: 0.1, assumptionCategories: ["formal_relationship_response_v1"] },
    { key: "sample-3", status: "not_triggered", responseTickNumber: null, allocationTickNumber: null, neutralAmount: 1, proposedAmount: null, actualAmount: null, appliedReduction: null, assumptionCategories: [] }] });

async function openFixture() {
  const actual = await actualFrozenPlanning();
  const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {FormalRunStarter} from '@/components/formal-sandbox/run-starter';import {FrozenRelationshipResponseResult} from '@/app/app/simulation/result/frozen-relationship-response';import {FrozenDefaultPlanningResult} from '@/app/app/simulation/result/frozen-default-planning';import '@/app/globals.css';globalThis.React=React;
  const model=${JSON.stringify(model)},planning=${JSON.stringify(planning)};let counter=7,mount=1;const root=createRoot(document.getElementById('root'));Object.defineProperty(crypto,'randomUUID',{value:()=> '00000000-0000-4000-8000-'+String(counter++).padStart(12,'0')});const f=window.relationshipUI={requests:[],reads:0,loseResponse:true,remount:()=>root.render(React.createElement(FormalRunStarter,{key:++mount})),rerender:graphId=>root.render(React.createElement(FormalRunStarter,{key:mount,graphId})),showFrozen:()=>root.render(React.createElement(FrozenRelationshipResponseResult,{response:${JSON.stringify(frozen)}})),showActualFrozen:()=>root.render(React.createElement(FrozenDefaultPlanningResult,{planning:${JSON.stringify(actual)}}))};
  window.fetch=async(url,init)=>{url=String(url);if(init?.method==='POST'){f.requests.push(JSON.parse(init.body));if(f.loseResponse)throw new Error('synthetic unknown receipt');return new Response(JSON.stringify({ok:true,idempotent:true,run:{id:'00000000-0000-4000-8000-000000000003',status:'completed'}}))}f.reads++;if(url.includes('model-context'))return new Response(JSON.stringify({ok:true,context:model}));if(url.includes('planning-context'))return new Response(JSON.stringify({ok:true,context:planning}));if(url.includes('calibration-context'))return new Response(JSON.stringify({ok:true,context:{status:'available',profileRevision:2,corrections:[]}}));throw new Error('unexpected fixture request')};root.render(React.createElement(FormalRunStarter,{key:mount}));`;
  const result = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/link": "virtual:link", "next/navigation": "virtual:navigation" } },
    plugins: [{ name: "relationship-ui", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; if (id === "\0virtual:navigation") return "export function useRouter(){return {push:()=>{}}}"; } }],
    build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "Fixture" } } } });
  const output = ((Array.isArray(result) ? result[0] : result) as { output: Array<{ type: string; code?: string; source?: string; fileName: string }> }).output;
  const { chromium } = createRequire(import.meta.url)(path.join(modules, "playwright")) as { chromium: { launch(options: unknown): Promise<{ newPage(options: unknown): Promise<Page>; close(): Promise<void> }> } };
  const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setContent(`<html lang="zh"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${output.filter(item => item.fileName.endsWith(".css")).map(item => item.source).join("\n")}</style></head><body><main class="p-4"><div id="root"></div></main></body></html>`);
  await page.addScriptTag({ content: output.find(item => item.type === "chunk")!.code! });
  await page.getByLabel("启用本次模拟回应后的投入调整").waitFor();
  return { page, browser, errors };
}
async function actualFrozenPlanning() {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-06T00:00:01.000Z"));
  try {
    const source = planningSource();
    const request = defaultPlanningRequestSchema.parse(relationshipRequest());
    if (request.version !== "formal-default-planner-v2") throw new Error("invalid_fixture");
    const rules = digitalLifeRulesSchema.parse({ ...digitalLifeRules(), strategies: [], actions: [request.relationshipResponse.requestRule, request.relationshipResponse.responseRule] });
    const run = await buildFormalSandboxRunV2({ ...digitalLifeInput(), realityProfileSnapshot: source.realityProfileSnapshot, symbolicLens: source.symbolicLens,
      acceptedAt: source.acceptedAt, startedAt: "2026-10-06T00:05:00.000Z", graphLockedAt: source.acceptedAt, digitalLifeRules: rules,
      defaultPlanning: request, planningConsentContext: source.consentContext });
    if (!run.ok) throw new Error(run.errorCode);
    const result = projectFormalSandboxResult(JSON.parse(JSON.stringify(run.bundle)))?.defaultPlanning;
    if (!result?.relationshipResponse) throw new Error("invalid_actual_result");
    expect(result.relationshipResponse.samples).toHaveLength(3);
    for (const sample of result.relationshipResponse.samples) {
      expect(sample.status).toBe("selected");
      expect(sample.actualAmount).toBeCloseTo(0.9, 10);
    }
    return result;
  } finally { vi.useRealTimers(); }
}
async function addPair(page: Page) {
  await page.getByLabel("行动人物").selectOption("person-1");
  await page.getByLabel("询问对象").selectOption("person-2");
  await page.getByLabel("要询问的问题").fill("确认双方可投入时间");
  await page.getByLabel("来源与假设说明").fill("本人选择的模拟询问");
  await page.getByLabel("我确认这是用于本次运行的模拟假设").check();
  await page.getByRole("button", { name: "加入本次规则", exact: true }).click();
  await page.getByLabel("行动人物").selectOption("person-2");
  await page.getByLabel(/^前置行动/).selectOption("rule-1");
  await page.getByLabel("已锁定关系").selectOption("relation-1");
  await page.getByLabel("假设的回应方向").selectOption("cancelled");
  await page.getByLabel("来源与假设说明").fill("本人确认的消极回应假设，不是对方真实态度");
  await page.getByLabel("我确认这是用于本次运行的模拟假设").check();
  await page.getByRole("button", { name: "加入本次规则", exact: true }).click();
}
async function authorize(page: Page) {
  await page.getByLabel("授权默认规划 · 时间").check();
  await page.getByLabel("整次模拟预算上限 · 时间（小时）").fill("3");
  await page.getByLabel("我确认 时间 的上述预算仅用于本次整次模拟").check();
  await page.getByLabel("启用本次模拟回应后的投入调整").check();
  await page.getByLabel("已确认的询问与模拟回应").selectOption("main:rule-1:rule-2");
  await page.getByLabel("我的后续投入资源").selectOption("resource-1");
  await page.getByLabel("我确认此模拟回应组合与本人资源的后续投入调整").check();
}

it("uses actual Starter controls at 375px and preserves the complete relationship request during unknown recovery", async () => {
  const { page, browser, errors } = await openFixture();
  try {
    expect(await page.getByLabel("启用本次模拟回应后的投入调整").isDisabled()).toBe(true);
    expect(await page.getByLabel("启用本次模拟回应后的投入调整").isChecked()).toBe(false);
    await addPair(page); await authorize(page);
    expect(await page.getByLabel("独立启用象征关系敏感假设（最多额外减少 5%）").isChecked()).toBe(false);
    expect(await page.getByRole("button", { name: "开始 30 天运行", exact: true }).isDisabled()).toBe(false);
    const layout = await page.evaluate(() => ({ noOverflow: document.documentElement.scrollWidth <= 375,
      minTouch: Array.from(document.querySelectorAll("fieldset label")).filter(label => label.querySelector('input[type="checkbox"]')).every(label => label.getBoundingClientRect().height >= 44) }));
    expect(layout).toEqual({ noOverflow: true, minTouch: true });
    await page.getByRole("button", { name: "开始 30 天运行", exact: true }).click();
    await page.getByRole("button", { name: "恢复原运行请求", exact: true }).waitFor();
    const reads = await page.evaluate(() => window.relationshipUI.reads);
    await page.evaluate(() => window.relationshipUI.rerender("00000000-0000-4000-8000-000000000004"));
    expect(await page.getByLabel("启用本次模拟回应后的投入调整").isDisabled()).toBe(true);
    await page.getByRole("button", { name: "恢复原运行请求", exact: true }).click();
    const transport = await page.evaluate(() => ({ requests: window.relationshipUI.requests, reads: window.relationshipUI.reads }));
    expect(transport.requests).toHaveLength(2);
    expect(JSON.stringify(transport.requests[0]) === JSON.stringify(transport.requests[1])).toBe(true);
    expect(transport.reads).toBe(reads);
    const request = transport.requests[0].default_planning as { version: string; relationshipResponse: { responseRule: { operation: { signal: string } }; symbolicSensitivity: { enabled: boolean } } };
    expect(request.version).toBe("formal-default-planner-v2");
    expect(request.relationshipResponse.responseRule.operation.signal).toBe("negative");
    expect(request.relationshipResponse.symbolicSensitivity.enabled).toBe(false);
    expect(errors).toHaveLength(0);
    await page.evaluate(() => window.relationshipUI.remount());
    await addPair(page); await authorize(page);
    await page.getByLabel("运行时间窗口").selectOption("90");
    expect(await page.getByLabel("启用本次模拟回应后的投入调整").isChecked()).toBe(false);
    expect(await page.getByLabel("授权默认规划 · 时间").isChecked()).toBe(false);
    await page.evaluate(() => window.relationshipUI.showFrozen());
    await page.getByRole("heading", { name: "模拟回应 → 我的后续投入", exact: true }).waitFor();
    await page.getByText("查看冻结假设与上限", { exact: true }).click();
    const frozenLayout = await page.evaluate(() => ({ noOverflow: document.documentElement.scrollWidth <= 375,
      selected: document.body.textContent?.includes("实际受控投入 0.9 小时") === true,
      unselected: document.body.textContent?.includes("候选未被选中；没有对应的回应调整投入事件") === true,
      notTriggered: document.body.textContent?.includes("关系调整未触发；本样本的中性投入仍见默认规划事件对照") === true }));
    expect(frozenLayout).toEqual({ noOverflow: true, selected: true, unselected: true, notTriggered: true });
    await page.screenshot({ path: path.join(tmpdir(), "astraloom-relationship-response-375.png"), fullPage: true });
    await page.evaluate(() => window.relationshipUI.showActualFrozen());
    await page.getByRole("heading", { name: "本次冻结的默认规划", exact: true }).waitFor();
    await page.getByRole("heading", { name: "模拟回应 → 我的后续投入", exact: true }).waitFor();
    const actualLayout = await page.evaluate(() => ({ noOverflow: document.documentElement.scrollWidth <= 375,
      selectedCount: document.querySelector('[data-frozen-relationship-response]')?.textContent?.split("实际受控投入 0.9 小时").length === 4,
      hypothesis: document.querySelector('[data-frozen-relationship-response]')?.textContent?.includes("条件假设（Hypothesis）") === true,
      noPrivateIds: !/sourceAgent|rule-[0-9]|person-[0-9]|world_event_v2_|[0-9a-f]{8}-[0-9a-f]{4}-/.test(document.body.textContent ?? "") }));
    expect(actualLayout).toEqual({ noOverflow: true, selectedCount: true, hypothesis: true, noPrivateIds: true });
    await page.screenshot({ path: path.join(tmpdir(), "astraloom-relationship-actual-result-375.png"), fullPage: true });
    expect(errors).toHaveLength(0);
  } finally { await page.close(); await browser.close(); }
}, 45_000);
