import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ModelRulesDraftEditor } from "./model-rule-revision";
import path from "node:path";
import { createRequire } from "node:module";
import { build } from "vite";
import type { SaveDigitalLifeModelDraft } from "@/lib/digital-life/model-draft";
import type { DigitalLifeRules } from "@/lib/digital-life/model";

type Locator = { waitFor(): Promise<void>; selectOption(value: string): Promise<void>; fill(value: string): Promise<void>; check(): Promise<void>; click(): Promise<void>; count(): Promise<number>; inputValue(): Promise<string>; isDisabled(): Promise<boolean>; isChecked(): Promise<boolean>; nth(index: number): Locator; filter(value: { hasText: string }): Locator };
type Page = { setDefaultTimeout(value: number): void; on(event: string, handler: (error: Error) => void): void; setContent(html: string): Promise<void>; addScriptTag(value: { content?: string }): Promise<void>; waitForFunction(fn: () => boolean): Promise<void>; getByLabel(label: string | RegExp): Locator; getByRole(role: string, options?: { name: string | RegExp; exact?: boolean }): Locator; evaluate<T>(fn: () => T): Promise<T> };
declare global { interface Window { completeModel: { saves: SaveDigitalLifeModelDraft[]; runs: Array<{ digital_life_rules: DigitalLifeRules; idempotency_key: string }>; failSave: boolean; failRun: boolean; navigated: string; sourceReads: number }; } }

const context = { graphSnapshotId: "30000000-0000-4000-8000-000000000001", agentSnapshotId: "40000000-0000-4000-8000-000000000001", profileRevision: 2,
  agents: [{ key: "person-1", label: "本人", role: "user_core" as const }, { key: "person-2", label: "协作对象", role: "npc" as const }, { key: "person-3", label: "谨慎分身", role: "user_variant" as const }],
  relationships: [{ key: "relation-1", label: "本人与协作对象的协作关系", fromPersonKey: "person-1", toPersonKey: "person-2" }], resources: [] };
const draftRules = { version: "digital-life-rules-v1" as const, graphSnapshotId: context.graphSnapshotId, agentSnapshotId: context.agentSnapshotId, profileRevision: 2, actions: [], strategies: [] };

describe("complete current model rule editing", () => {
  it("offers action and strategy creation in an empty saved current model", () => {
    const html = renderToStaticMarkup(createElement(ModelRulesDraftEditor, { source: { modelContext: context, horizonDays: 30, draftRules }, currentModel: true, disabled: false, onChange: vi.fn() }));
    expect(html).toContain("添加行动规则");
    expect(html).toContain("添加平行分身策略");
    expect(html).toContain("尚未定义策略");
  });
  it("compares original resource rules by stable key after reordering, and leaves stale controls disabled", () => {
    const modelContext = { ...context, resources: [{ key: "resource-1", label: "可用时间", available: 20, minimum: 1, maximum: 20, unit: "小时", usePerTick: null, classification: "fact" as const, evidenceSummary: "本人登记" }] };
    const base = { pathKey: "main", actorKey: "person-1", when: { kind: "at_tick" as const, tickIndex: 0 }, classification: "assumption" as const, confirmedForSimulation: false as const, evidenceSummary: "本人拟定的条件" };
    const actions = [ { ...base, key: "rule-1", operation: { actionType: "allocate_resource" as const, resourceKey: "resource-1", amount: 1 } }, { ...base, key: "rule-2", operation: { actionType: "allocate_resource" as const, resourceKey: "resource-1", amount: 2 } } ];
    const originalRules = { ...draftRules, actions };
    const html = renderToStaticMarkup(createElement(ModelRulesDraftEditor, { source: { modelContext, horizonDays: 30, draftRules: { ...originalRules, actions: [...actions].reverse() } }, originalRules, currentModel: true, disabled: true, onChange: vi.fn() }));
    expect(html.indexOf("原草稿投入：可用时间 · 2")).toBeLessThan(html.indexOf("原草稿投入：可用时间 · 1"));
    expect(html).toContain("<fieldset disabled=");
  });
});

it("at 375px edits complete saved rules, explicitly cascades deletion, saves unchecked rules and exactly replays unknown Save and Run", async () => {
  const require = createRequire(import.meta.url);
  const { chromium } = require(path.join(process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules", "playwright")) as { chromium: { launch(options: unknown): Promise<{ newPage(options: unknown): Promise<Page>; close(): Promise<void> }> } };
  const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {FormalRunStarter} from '@/components/formal-sandbox/run-starter';globalThis.React=React;
  const context={graphSnapshotId:'30000000-0000-4000-8000-000000000001',agentSnapshotId:'40000000-0000-4000-8000-000000000001',profileRevision:2,agents:[{key:'person-1',label:'本人',role:'user_core'},{key:'person-2',label:'协作对象',role:'npc'},{key:'person-3',label:'谨慎分身',role:'user_variant'},{key:'person-4',label:'另一个协作对象',role:'npc'},{key:'person-5',label:'主动分身',role:'user_variant'}],relationships:[{key:'relation-1',label:'协作关系',fromPersonKey:'person-1',toPersonKey:'person-2'},{key:'relation-2',label:'另一个协作关系',fromPersonKey:'person-1',toPersonKey:'person-4'}],resources:[{key:'resource-1',label:'可用时间',available:10,minimum:1,maximum:20,unit:'小时',usePerTick:null,classification:'fact',evidenceSummary:'本人登记'},{key:'resource-2',label:'学习时间',available:8,minimum:2,maximum:20,unit:'小时',usePerTick:null,classification:'assumption',evidenceSummary:'本人暂定'}]};
  const sourceContext={signature:'a'.repeat(64),modelContext:context};const base={classification:'assumption',confirmedForSimulation:false,evidenceSummary:'本人暂定的模拟条件'};
  let draft={version:'digital-life-model-draft-v1',status:'current',currentRevision:2,horizonDays:30,sourceContext,currentSourceContext:sourceContext,draftRules:{version:'digital-life-rules-v1',graphSnapshotId:context.graphSnapshotId,agentSnapshotId:context.agentSnapshotId,profileRevision:2,strategies:[{participantKey:'person-3',label:'先谨慎沟通',confirmedForSimulation:false,evidenceSummary:'比较谨慎沟通的假设'}],actions:[{...base,key:'rule-1',pathKey:'main',actorKey:'person-1',when:{kind:'at_tick',tickIndex:0},operation:{actionType:'request_information',targetPersonKey:'person-2',question:'询问合作安排'}},{...base,key:'rule-2',pathKey:'main',actorKey:'person-2',when:{kind:'after_rule',ruleKey:'rule-1'},operation:{actionType:'update_relation_signal',relationKey:'relation-1',signal:'neutral'}},{...base,key:'rule-3',pathKey:'main',actorKey:'person-1',when:{kind:'at_tick',tickIndex:1},operation:{actionType:'update_commitment',commitmentKey:'commitment-3',label:'保留学习时间',status:'planned'}},{...base,key:'rule-4',pathKey:'person-3',actorKey:'person-3',when:{kind:'at_tick',tickIndex:0},operation:{actionType:'update_commitment',commitmentKey:'commitment-4',label:'谨慎准备',status:'planned'}}]}};
  window.completeModel={saves:[],runs:[],failSave:true,failRun:true,navigated:'',sourceReads:0};let uuid=20;Object.defineProperty(crypto,'randomUUID',{value:()=>'50000000-0000-4000-8000-'+String(uuid++).padStart(12,'0')});window.fetch=async(url,init)=>{url=String(url);if(url.includes('model-context')){window.completeModel.sourceReads++;return new Response(JSON.stringify({ok:true,context}))}if(url.includes('model-draft')){if(!init?.body)return new Response(JSON.stringify({ok:true,draft}));const input=JSON.parse(init.body);window.completeModel.saves.push(input);if(window.completeModel.failSave)return new Response(JSON.stringify({ok:false,error_code:'persistence_failed'}),{status:500});draft={...draft,currentRevision:3,draftRules:input.draftRules,horizonDays:input.horizonDays};return new Response(JSON.stringify({ok:true,idempotent:true,draft}))}if(url.includes('planning-context')||url.includes('calibration-context'))return new Response(JSON.stringify({ok:false,error_code:'unavailable'}),{status:500});if(url==='/api/sandbox/runs'){window.completeModel.runs.push(JSON.parse(init.body));if(window.completeModel.failRun)return new Response(JSON.stringify({ok:false,error_code:'persistence_failed'}),{status:500});return new Response(JSON.stringify({ok:true,idempotent:true,run:{id:'60000000-0000-4000-8000-000000000001',status:'completed'}}),{status:200})}throw Error('unexpected request')};createRoot(document.getElementById('root')).render(React.createElement(FormalRunStarter,{currentDraftMode:true}));`;
  const built = await build({ configFile: false, root: process.cwd(), logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/navigation": "virtual:navigation", "next/link": "virtual:link" } }, plugins: [{ name: "complete-model-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:navigation") return "export function useRouter(){return {push:url=>window.completeModel.navigated=url}}"; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "CompleteModel" } } } });
  const bundle = (Array.isArray(built) ? built[0] : built) as { output: Array<{ type: string; code?: string }> };
  const browser = await chromium.launch({ executablePath: process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    page.setDefaultTimeout(5000); const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.setContent('<html lang="zh"><style>body{margin:0;background:#101525;color:#f3f5fa;font-family:system-ui}#root{width:343px;padding:16px}input,select{box-sizing:border-box;max-width:100%;min-height:44px}button{min-height:44px}label{display:block}section,fieldset,div{min-width:0;box-sizing:border-box}fieldset{margin:0;width:100%}input[type=checkbox]{width:20px}p{overflow-wrap:anywhere}</style><body><div id="root"></div></body></html>');
    await page.addScriptTag({ content: bundle.output.find(item => item.type === "chunk")!.code });
    await page.getByLabel("本人承诺内容").nth(0).waitFor();
    expect(await page.getByRole("button", { name: "开始 30 天运行", exact: true }).isDisabled()).toBe(true);
    // Real intermediate empty values must remain editable without a throwing render.
    await page.getByLabel("本人承诺内容").nth(0).fill("");
    await page.getByLabel("本人承诺内容").nth(0).fill("修改后的学习承诺");
    await page.getByLabel("行动 1 询问对象").selectOption("person-4");
    await page.getByRole("alert").filter({ hasText: "原回应不会自动移给其他人物" }).waitFor();
    expect(await page.getByLabel("行动 2 回应人物").inputValue()).toBe("person-2");
    expect(await page.getByLabel("行动 2 已有只读关系").inputValue()).toBe("relation-1");
    await page.getByLabel("行动 2 回应人物").selectOption("person-4");
    await page.getByLabel("行动 2 已有只读关系").selectOption("relation-2");
    await page.getByLabel("行动 2 前置行动").selectOption("1");
    expect(await page.getByRole("alert").filter({ hasText: "原回应不会自动移给其他人物" }).count()).toBe(0);
    await page.getByLabel("行动 1 询问对象").selectOption("person-2");
    await page.getByLabel("行动 2 回应人物").selectOption("person-2");
    await page.getByLabel("行动 2 已有只读关系").selectOption("relation-1");
    await page.getByLabel("行动 2 前置行动").selectOption("1");
    await page.getByRole("button", { name: "删除行动 1 并查看后继影响" }).click();
    expect(await page.getByRole("button", { name: "确认删除列出的规则" }).count()).toBe(1);
    expect(await page.evaluate(() => document.querySelector('[aria-label="确认删除规则"]')?.textContent)).toContain("行动 2 · 协作对象 · 条件回应假设");
    await page.getByRole("button", { name: "取消删除" }).click();
    expect(await page.getByLabel(/^要询问的问题$/).count()).toBe(1);
    await page.getByRole("button", { name: "删除行动 1 并查看后继影响" }).click();
    await page.getByRole("button", { name: "确认删除列出的规则" }).click();
    expect(await page.getByLabel(/^要询问的问题$/).count()).toBe(0);
    await page.getByRole("button", { name: "删除行动 1 并查看后继影响" }).click();
    await page.getByRole("button", { name: "确认删除列出的规则" }).click();
    await page.getByLabel("新增行动人物").selectOption("person-1");
    await page.getByLabel("新增行动类型").selectOption("allocate_resource");
    await page.getByLabel("新增行动已登记资源").selectOption("resource-1");
    await page.getByLabel("新增行动投入量").fill("1");
    await page.getByLabel("新增行动来源与假设说明").fill("本人暂定的资源投入");
    await page.getByLabel("我独立确认将这条模拟假设加入草稿").check();
    await page.getByRole("button", { name: "添加行动规则", exact: true }).click();
    expect(await page.getByLabel("我重新确认行动 2 的模拟假设").isChecked()).toBe(false);
    await page.getByLabel("行动 2 已登记资源").selectOption("resource-2");
    await page.getByLabel("修订投入量").fill("");
    await page.getByLabel("修订投入量").fill("2");
    await page.getByLabel("策略分身").selectOption("person-5");
    await page.getByLabel("新增策略名称").fill("先主动准备");
    await page.getByLabel("新增策略来源与假设说明").fill("比较主动准备的假设");
    await page.getByRole("button", { name: "添加平行分身策略", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "本策略尚未定义分身行动" }).waitFor();
    await page.getByLabel("新增行动的策略路径").selectOption("person-5");
    await page.getByLabel("新增行动人物").selectOption("person-5");
    await page.getByLabel("新增行动类型").selectOption("update_commitment");
    await page.getByLabel("新增本人承诺内容").fill("主动准备沟通资料");
    await page.getByLabel("新增行动来源与假设说明").fill("本人准备行动的假设");
    await page.getByLabel("我独立确认将这条模拟假设加入草稿").check();
    await page.getByRole("button", { name: "添加行动规则", exact: true }).click();
    await page.getByRole("button", { name: "删除策略 1 及其关联行动" }).click();
    expect(await page.evaluate(() => document.querySelector('[aria-label="确认删除规则"]')?.textContent)).toContain("行动 1 · 谨慎分身");
    await page.getByRole("button", { name: "确认删除列出的规则" }).click();
    await page.getByRole("button", { name: "保存当前模型草稿", exact: true }).click();
    await page.getByRole("button", { name: "恢复原草稿保存请求" }).waitFor();
    expect(await page.getByLabel("运行时间窗口").isDisabled()).toBe(true);
    expect(await page.getByRole("button", { name: "添加行动规则", exact: true }).isDisabled()).toBe(true);
    expect(await page.getByRole("button", { name: "重新读取模型与规划来源", exact: true }).isDisabled()).toBe(true);
    expect(await page.getByRole("button", { name: "重新读取模型与观察修正", exact: true }).isDisabled()).toBe(true);
    const sourceReads = await page.evaluate(() => window.completeModel.sourceReads);
    await page.evaluate(() => { window.completeModel.failSave = false; });
    await page.getByRole("button", { name: "恢复原草稿保存请求" }).click();
    await page.getByRole("status").filter({ hasText: "模型草稿版本 3 已保存。尚未开始运行" }).waitFor();
    expect(await page.evaluate(() => JSON.stringify(window.completeModel.saves[0]) === JSON.stringify(window.completeModel.saves[1]))).toBe(true);
    expect(await page.evaluate(() => window.completeModel.sourceReads)).toBe(sourceReads);
    expect(await page.evaluate(() => window.completeModel.runs.length)).toBe(0);
    expect(await page.evaluate(() => window.completeModel.saves[0].draftRules.actions.every(action => !action.confirmedForSimulation) && window.completeModel.saves[0].draftRules.strategies.every(strategy => !strategy.confirmedForSimulation))).toBe(true);
    expect(await page.getByLabel("我重新确认行动 1 的模拟假设").isChecked()).toBe(false);
    await page.getByLabel("我重新确认行动 1 的模拟假设").check();
    await page.getByLabel("我重新确认行动 2 的模拟假设").check();
    await page.getByLabel("我重新确认策略 1 的模拟假设").check();
    await page.getByRole("button", { name: "开始 30 天运行", exact: true }).click();
    await page.getByRole("button", { name: "恢复原运行请求" }).waitFor();
    expect(await page.getByLabel("修订投入量").isDisabled()).toBe(true);
    expect(await page.getByRole("button", { name: "删除行动 1 并查看后继影响" }).isDisabled()).toBe(true);
    await page.evaluate(() => { window.completeModel.failRun = false; });
    await page.getByRole("button", { name: "恢复原运行请求" }).click();
    await page.waitForFunction(() => Boolean(window.completeModel.navigated));
    expect(await page.evaluate(() => JSON.stringify(window.completeModel.runs[0]) === JSON.stringify(window.completeModel.runs[1]))).toBe(true);
    expect(await page.evaluate(() => window.completeModel.runs[0].digital_life_rules.actions[0].operation)).toEqual({ actionType: "allocate_resource", resourceKey: "resource-2", amount: 2 });
    expect(await page.evaluate(() => window.completeModel.runs[0].digital_life_rules.actions.map(action => action.key))).toEqual(["rule-5", "rule-6"]);
    expect(await page.evaluate(() => window.completeModel.runs[0].digital_life_rules.strategies[0].participantKey)).toBe("person-5");
    expect(await page.evaluate(() => document.body.innerText)).not.toMatch(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}/i);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= 375)).toBe(true);
    expect(errors).toEqual([]);
  } finally { await browser.close(); }
}, 60_000);
