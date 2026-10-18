import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRequire } from "node:module";
import path from "node:path";
import { build } from "vite";
import { expect, it, vi } from "vitest";
import { ModelRulesDraftEditor } from "./model-rule-revision";
import { FrozenWorldGuards, type GuardObservations } from "@/app/app/simulation/result/frozen-world-guards";
import { NoEligibleActions } from "./no-eligible-actions";
import { confirmedDraftRules, normalizeDraftForSave, setDraftActionConfirmation, updateDraftAction, type RevisionDraft } from "./model-rule-draft-operations";

const context = {
  graphSnapshotId: "30000000-0000-4000-8000-000000000001", agentSnapshotId: "40000000-0000-4000-8000-000000000001", profileRevision: 2,
  agents: [{ key: "person-1", label: "本人", role: "user_core" as const }, { key: "person-2", label: "谨慎分身", role: "user_variant" as const }], relationships: [],
  resources: [{ key: "resource-1", label: "学习时间", available: 8, minimum: 0, maximum: 20, unit: "小时", usePerTick: null, classification: "fact" as const, evidenceSummary: "本人记录" }],
  variables: [{ key: "pressure-1", category: "pressure" as const, label: "协作条件", value: "需要协调", classification: "fact" as const, evidenceSummary: "本人记录" }],
};
const draftRules = {
  version: "digital-life-rules-v2" as const, graphSnapshotId: context.graphSnapshotId, agentSnapshotId: context.agentSnapshotId, profileRevision: 2, strategies: [],
  actions: [{ key: "rule-1", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick" as const, tickIndex: 1 }, operation: { actionType: "update_commitment" as const, commitmentKey: "commitment-1", label: "准备沟通材料", status: "planned" as const }, classification: "assumption" as const, confirmedForSimulation: false as const, evidenceSummary: "本人准备条件" }],
};

it("keeps an old disabled model review and its unconfirmed action locked", () => {
  const html = renderToStaticMarkup(createElement(ModelRulesDraftEditor, { source: { modelContext: context, horizonDays: 30, draftRules }, currentModel: true, disabled: true, onChange: vi.fn() }));
  expect(html).toContain("准备沟通材料");
  expect(html).toContain("<fieldset disabled=");
  expect(html).toContain("我重新确认行动 1 的模拟假设");
  expect(html).not.toContain('type="checkbox" checked');
});

it("revokes dependent confirmation on guard edits and retains v3 after explicit removal", () => {
  const source = { modelContext: context, horizonDays: 30 as const };
  const rules: RevisionDraft = { ...draftRules, version: "digital-life-rules-v3", actions: [{ ...draftRules.actions[0], confirmedForSimulation: true, guard: { kind: "resource_balance", resourceKey: "resource-1", operator: "lte", value: 4 } }, { ...draftRules.actions[0], key: "rule-2", confirmedForSimulation: true, when: { kind: "after_rule", ruleKey: "rule-1" }, operation: { actionType: "update_commitment", commitmentKey: "commitment-2", label: "准备另一材料", status: "planned" } }] };
  const invalid = updateDraftAction(source, rules, "rule-1", { guard: { kind: "resource_balance", resourceKey: "resource-1", operator: "gte", value: NaN } });
  expect(invalid.ok).toBe(true); if (!invalid.ok) return;
  expect(invalid.draft.actions.every(action => !action.confirmedForSimulation)).toBe(true);
  expect(setDraftActionConfirmation(source, invalid.draft, "rule-1", true).ok).toBe(false);
  expect(normalizeDraftForSave(source, invalid.draft)).toBeNull(); expect(confirmedDraftRules(source, invalid.draft)).toBeNull();
  const removed = updateDraftAction(source, invalid.draft, "rule-1", { guard: undefined });
  expect(removed.ok).toBe(true); if (!removed.ok) return;
  expect(removed.draft.actions[0]).not.toHaveProperty("guard");
  expect(removed.draft.version).toBe("digital-life-rules-v3");
  expect(normalizeDraftForSave(source, removed.draft)?.version).toBe("digital-life-rules-v3");
});

it("uses actual tick indices and sample-local selected events without inventing unreachable metrics", () => {
  const observation = { ruleKey: "rule-1", label: "学习时间", unit: "小时", conditionDescription: "学习时间余额不高于4小时", tickIndex: 0, schedule: "due" as const, guard: false, candidate: "ineligible" as const, before: 8, after: 8, stepKey: null };
  const observations: GuardObservations = { version: "digital-life-guard-observations-v1", samples: [
    { key: "sample-1", ticks: [{ tickIndex: 0, occurredAt: "2026-10-16T01:00:00Z", observations: [observation] }, { tickIndex: 2, occurredAt: null, observations: [{ ...observation, tickIndex: 2, schedule: "not_reached", guard: null, candidate: null, before: null, after: null }] }] },
    { key: "sample-2", ticks: [{ tickIndex: 1, occurredAt: "2026-10-16T02:00:00Z", observations: [{ ...observation, tickIndex: 1, guard: true, candidate: "selected", before: 4, after: 3, stepKey: "step-5" }] }] },
  ] };
  const html = renderToStaticMarkup(createElement(FrozenWorldGuards, { observations, steps: [{ key: "step-5", order: 5, label: "保留学习时间" }] }));
  expect(html).toContain("模拟周期 3"); expect(html).toContain("指定模拟周期未到达");
  expect(html).toContain("学习时间：8 → 8 小时"); expect(html).toContain("学习时间：4 → 3 小时");
  expect(html).toContain("学习时间余额不高于4小时");
  expect(html).toContain("实际事件依据：模拟步骤 5"); expect(html).not.toContain("模拟周期 5");
  expect(html).toContain("条件观察样本 1"); expect(html).toContain("条件观察样本 2");
  expect(html).not.toMatch(/rule-1|step-5|sample-1|sample-2/);
  const noActions = renderToStaticMarkup(createElement(NoEligibleActions, { diagnostics: { version: "formal-path-diagnostics-v1", status: "not_saved", paths: [{ key: "path-1", label: "本人主路径", status: "no_actions", samples: [{ key: "sample-1", terminalStatus: "no_actions", executedTickCount: 1, selectedEventCount: 0 }], guardObservations: { ...observations, samples: [observations.samples[0]] } }, { key: "path-2", label: "谨慎准备", status: "has_events", samples: [{ key: "sample-1", terminalStatus: "completed", executedTickCount: 2, selectedEventCount: 2 }], guardObservations: { ...observations, samples: [] } }] } }));
  expect(noActions).toContain("本次未形成可保存的完整运行"); expect(noActions).toContain("本人主路径 · 无可引用事件");
  expect(noActions).toContain("谨慎准备 · 本路径有模拟事件，但未保存为完整运行");
  expect(noActions).not.toContain("恢复原运行请求");
});

it("explicitly enables world guards before editing, then saves unchecked and replays exact unknown requests at 375px", async () => {
  const require = createRequire(import.meta.url);
  const { chromium } = require(path.join(process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules", "playwright"));
  // Import only the existing production entry. RED must prove missing behavior,
  // not a missing future component or helper import.
  const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {FormalRunStarter} from '@/components/formal-sandbox/run-starter';globalThis.React=React;
  const context=${JSON.stringify(context)};const sourceContext={version:'digital-life-model-draft-source-v2',signature:'b'.repeat(64),modelContext:context};
  let draft={version:'digital-life-model-draft-v2',status:'current',currentRevision:2,horizonDays:30,sourceContext,currentSourceContext:sourceContext,draftRules:${JSON.stringify(draftRules)}};
  const preparedProtocol={version:'digital-life-model-draft-protocol-v3',draftVersion:'digital-life-model-draft-v3',rulesVersion:'digital-life-rules-v3'};
  window.guardTest={saves:[],runs:[],reads:[],failSave:true,failRun:true,navigated:''};let uuid=20;Object.defineProperty(crypto,'randomUUID',{value:()=>'50000000-0000-4000-8000-'+String(uuid++).padStart(12,'0')});
  window.fetch=async(url,init)=>{url=String(url);const ok=data=>new Response(JSON.stringify({ok:true,...data}));if(url.includes('model-context'))return ok({context});if(url.includes('model-draft')){if(!init?.body){window.guardTest.reads.push(url);return ok(url.includes('prepare_version=v3')?{draft,preparedSourceContext:sourceContext,preparedProtocol}:{draft})}const input=JSON.parse(init.body);window.guardTest.saves.push(input);if(window.guardTest.failSave)return new Response(JSON.stringify({ok:false,error_code:'persistence_failed'}),{status:500});draft={...draft,version:input.version,currentRevision:3,sourceContext:input.sourceContext,currentSourceContext:input.sourceContext,draftRules:input.draftRules};return ok({draft,idempotent:true})}if(url==='/api/sandbox/runs'){window.guardTest.runs.push(JSON.parse(init.body));if(window.guardTest.failRun)return new Response(JSON.stringify({ok:false,error_code:'persistence_failed'}),{status:500});return ok({idempotent:true,run:{id:'60000000-0000-4000-8000-000000000001',status:'completed'}})}return new Response(JSON.stringify({ok:false,error_code:'unavailable'}),{status:500})};createRoot(document.getElementById('root')).render(React.createElement(FormalRunStarter,{currentDraftMode:true}));`;
  const built = await build({ configFile: false, root: process.cwd(), logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/navigation": "virtual:navigation", "next/link": "virtual:link" } }, plugins: [{ name: "world-guards-ui-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:navigation") return "export function useRouter(){return {push:url=>window.guardTest.navigated=url}}"; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "WorldGuards" } } } });
  const bundle = (Array.isArray(built) ? built[0] : built) as { output: Array<{ type: string; code?: string }> };
  const browser = await chromium.launch({ executablePath: process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); page.setDefaultTimeout(5000);
    const errors: string[] = []; page.on("pageerror", (error: Error) => errors.push(error.message));
    await page.setContent('<html lang="zh"><style>body{margin:0;background:#101525;color:#f3f5fa;font-family:system-ui}#root{width:343px;padding:16px}input,select{box-sizing:border-box;max-width:100%;min-height:44px}button{min-height:44px}label{display:block}section,fieldset,div{min-width:0;box-sizing:border-box}fieldset{margin:0;width:100%}p{overflow-wrap:anywhere}</style><body><div id="root"></div></body></html>');
    await page.addScriptTag({ content: bundle.output.find(item => item.type === "chunk")!.code });
    await page.getByLabel("本人承诺内容", { exact: true }).waitFor();
    expect(await page.getByLabel("我重新确认行动 1 的模拟假设").isChecked()).toBe(false);
    expect(await page.getByRole("button", { name: "开始 30 天运行", exact: true }).isDisabled()).toBe(true);
    expect(await page.evaluate("window.guardTest.saves.length+window.guardTest.runs.length")).toBe(0);
    // Intended runtime RED: the current real React entry has no v3 opt-in.
    expect(await page.getByRole("button", { name: "开启条件规则", exact: true }).count()).toBe(1);
    await page.getByRole("button", { name: "开启条件规则", exact: true }).click();
    await page.getByLabel("行动 1 条件类型").selectOption("resource_balance");
    expect(await page.getByLabel("行动 1 条件资源").inputValue()).toBe("");
    await page.getByLabel("行动 1 条件资源").selectOption("resource-1");
    await page.getByLabel("行动 1 条件比较").selectOption("lte");
    await page.getByLabel("行动 1 条件阈值").fill("4");
    expect(await page.getByLabel("我重新确认行动 1 的模拟假设").isChecked()).toBe(false);
    await page.getByRole("button", { name: "保存当前模型草稿", exact: true }).click();
    await page.getByRole("button", { name: "恢复原草稿保存请求", exact: true }).waitFor();
    expect(await page.getByLabel("行动 1 条件阈值").isDisabled()).toBe(true);
    expect(await page.getByRole("button", { name: "重新读取模型与规划来源", exact: true }).isDisabled()).toBe(true);
    await page.evaluate("window.guardTest.failSave=false");
    await page.getByRole("button", { name: "恢复原草稿保存请求", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "模型草稿版本 3 已保存。尚未开始运行" }).waitFor();
    const saves = await page.evaluate("window.guardTest.saves");
    expect(saves[0]).toEqual(saves[1]);
    expect(saves[0].version).toBe("digital-life-model-draft-v3");
    expect(saves[0].sourceContext.version).toBe("digital-life-model-draft-source-v2");
    expect(saves[0].draftRules.version).toBe("digital-life-rules-v3");
    expect(saves[0].draftRules.actions[0].guard).toEqual({ kind: "resource_balance", resourceKey: "resource-1", operator: "lte", value: 4 });
    expect(saves[0].draftRules.actions.every((action: { confirmedForSimulation: boolean }) => !action.confirmedForSimulation)).toBe(true);
    expect(await page.evaluate("window.guardTest.reads.filter(url=>!url.includes('prepare_version')).length")).toBeGreaterThan(1);
    expect(await page.getByLabel("我重新确认行动 1 的模拟假设").isChecked()).toBe(false);
    await page.getByLabel("我重新确认行动 1 的模拟假设").check();
    await page.getByRole("button", { name: "开始 30 天运行", exact: true }).click();
    await page.getByRole("button", { name: "恢复原运行请求", exact: true }).waitFor();
    expect(await page.getByLabel("行动 1 条件阈值").isDisabled()).toBe(true);
    await page.evaluate("window.guardTest.failRun=false");
    await page.getByRole("button", { name: "恢复原运行请求", exact: true }).click();
    await page.waitForFunction("Boolean(window.guardTest.navigated)");
    const runs = await page.evaluate("window.guardTest.runs"); expect(runs[0]).toEqual(runs[1]);
    expect(runs[0].digital_life_rules.actions[0].guard).toEqual(saves[0].draftRules.actions[0].guard);
    expect(await page.evaluate("document.documentElement.scrollWidth<=375")).toBe(true);
    expect(errors).toEqual([]);
    await page.getByLabel("行动 1 条件类型").selectOption("environment_equals");
    expect(await page.getByLabel("行动 1 条件环境项目").inputValue()).toBe("");
    await page.getByLabel("行动 1 条件环境项目").selectOption("pressure-1");
    expect(await page.getByLabel("行动 1 条件环境值").inputValue()).toBe("");
    await page.getByLabel("行动 1 条件环境值").selectOption("需要协调");
    expect(await page.getByLabel("我重新确认行动 1 的模拟假设").isChecked()).toBe(false);
    await page.getByLabel("行动 1 条件类型").selectOption("");
    await page.getByRole("button", { name: "保存当前模型草稿", exact: true }).click();
    await page.waitForFunction("window.guardTest.saves.length===3");
    const removedGuard = await page.evaluate("window.guardTest.saves[2]");
    expect(removedGuard.version).toBe("digital-life-model-draft-v3");
    expect(removedGuard.draftRules.actions[0]).not.toHaveProperty("guard");
    const known = await browser.newPage({ viewport: { width: 375, height: 812 } }); known.setDefaultTimeout(5000);
    await known.setContent('<html lang="zh"><body><div id="root"></div></body></html>');
    await known.addScriptTag({ content: bundle.output.find(item => item.type === "chunk")!.code });
    await known.getByRole("button", { name: "开启条件规则", exact: true }).click();
    await known.getByLabel("行动 1 条件类型").selectOption("resource_balance");
    await known.getByLabel("行动 1 条件资源").selectOption("resource-1");
    await known.getByLabel("行动 1 条件阈值").fill("4");
    await known.getByLabel(/^模拟周期/).selectOption("0");
    await known.evaluate(`{const original=window.fetch;window.fetch=async(url,init)=>{if(String(url)==='/api/sandbox/runs'){
      window.guardTest.runs.push(JSON.parse(init.body));
      const row={ruleKey:'rule-1',label:'学习时间',unit:'小时',conditionDescription:'学习时间余额不高于4小时',tickIndex:0,schedule:'due',guard:false,candidate:null,before:8,after:8,stepKey:null};
      const samples=Array.from({length:3},(_,index)=>({key:'sample-'+(index+1),terminalStatus:'no_actions',executedTickCount:1,selectedEventCount:0}));
      const observed=samples.map(sample=>({key:sample.key,ticks:Array.from({length:3},(_,tickIndex)=>({tickIndex,occurredAt:tickIndex===0?'2026-10-16T01:00:00Z':null,observations:[tickIndex===0?row:{...row,tickIndex,schedule:'not_reached',guard:null,before:null,after:null}]}))}));
      return new Response(JSON.stringify({ok:false,error_code:'no_eligible_actions',trace_id:'test-response',pathDiagnostics:{version:'formal-path-diagnostics-v1',status:'not_saved',paths:[{key:'path-1',label:'本人主路径',status:'no_actions',samples,guardObservations:{version:'digital-life-guard-observations-v1',samples:observed}}]}}),{status:409})}return original(url,init)}}`);
    await known.getByLabel("我重新确认行动 1 的模拟假设").check();
    await known.getByRole("button", { name: "开始 30 天运行", exact: true }).click();
    await known.getByRole("region", { name: "本次条件未形成完整运行", exact: true }).waitFor();
    expect(await known.getByRole("button", { name: "恢复原运行请求", exact: true }).count()).toBe(0);
    expect(await known.getByLabel("行动 1 条件阈值").isDisabled()).toBe(false);
    expect(await known.getByLabel("我重新确认行动 1 的模拟假设").isChecked()).toBe(false);
    expect(await known.getByRole("button", { name: "开始 30 天运行", exact: true }).isDisabled()).toBe(true);
    expect(await known.getByRole("region", { name: "本次条件未形成完整运行", exact: true }).textContent()).toContain("学习时间余额不高于4小时");
    await known.getByLabel("行动 1 条件阈值").fill("8");
    await known.getByLabel("我重新确认行动 1 的模拟假设").check();
    await known.getByRole("button", { name: "开始 30 天运行", exact: true }).click();
    await known.waitForFunction("window.guardTest.runs.length===2");
    const knownRuns = await known.evaluate("window.guardTest.runs");
    expect(knownRuns[0].idempotency_key).not.toBe(knownRuns[1].idempotency_key);
    expect(knownRuns[0].digital_life_rules.actions[0].guard.value).toBe(4);
    expect(knownRuns[1].digital_life_rules.actions[0].guard.value).toBe(8);
    expect(await known.evaluate("window.guardTest.navigated")).toBe("");
  } finally { await browser.close(); }
}, 60_000);

it("reconciles operation and guard resources independently and previews dependent cascades without applying on cancel", async () => {
  const require = createRequire(import.meta.url);
  const { chromium } = require(path.join(process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules", "playwright"));
  const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {ModelGuardReconciliationPanel} from '@/components/formal-sandbox/model-guard-reconciliation-panel';globalThis.React=React;
  const current=${JSON.stringify(context)};current.resources.push({...current.resources[0],key:'resource-2',label:'休息时间'});const old={...current,profileRevision:1};const preparedSourceContext={version:'digital-life-model-draft-source-v2',signature:'b'.repeat(64),modelContext:current};const sourceContext={version:'digital-life-model-draft-source-v2',signature:'a'.repeat(64),modelContext:old};const base={classification:'assumption',confirmedForSimulation:false,evidenceSummary:'本人准备条件'};
  const sourceRules={version:'digital-life-rules-v3',graphSnapshotId:old.graphSnapshotId,agentSnapshotId:old.agentSnapshotId,profileRevision:1,strategies:[{participantKey:'person-2',label:'谨慎准备',confirmedForSimulation:false,evidenceSummary:'独立策略条件'}],actions:[{...base,key:'rule-1',pathKey:'main',actorKey:'person-1',when:{kind:'at_tick',tickIndex:0},operation:{actionType:'allocate_resource',resourceKey:'resource-1',amount:2},guard:{kind:'resource_balance',resourceKey:'resource-2',operator:'gte',value:3}},{...base,key:'rule-2',pathKey:'main',actorKey:'person-1',when:{kind:'after_rule',ruleKey:'rule-1'},operation:{actionType:'update_commitment',commitmentKey:'commitment-2',label:'准备沟通材料',status:'planned'}},{...base,key:'rule-3',pathKey:'person-2',actorKey:'person-2',when:{kind:'at_tick',tickIndex:0},operation:{actionType:'update_commitment',commitmentKey:'commitment-3',label:'谨慎准备资料',status:'planned'}}]};
  const reconciliation={version:'digital-life-model-reconciliation-v2',draftRevision:2,horizonDays:30,sourceRules,requirements:[{requirementKey:'rule-1:operation',ruleKey:'rule-1',role:'operation',kind:'resource',previousSelector:'resource-1',previousLabel:'学习时间'},{requirementKey:'rule-1:guard',ruleKey:'rule-1',role:'guard',kind:'resource',previousSelector:'resource-2',previousLabel:'休息时间'}],permissionsReset:{planning:true,symbolic:true,outcomeCalibration:true,requestIdentity:true}};
  const draft={version:'digital-life-model-draft-v3',status:'stale',currentRevision:2,horizonDays:30,sourceContext,currentSourceContext:preparedSourceContext,draftRules:sourceRules};window.guardReconcile={applied:null,cancelled:false};createRoot(document.getElementById('root')).render(React.createElement(ModelGuardReconciliationPanel,{plan:{draft,reconciliation,preparedSourceContext},disabled:false,onApply:result=>window.guardReconcile.applied=result,onCancel:()=>window.guardReconcile.cancelled=true}));`;
  const built = await build({ configFile: false, root: process.cwd(), logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src") } }, plugins: [{ name: "guard-reconcile-fixture", resolveId(id) { if (id === "virtual:fixture") return "\0virtual:fixture"; }, load(id) { if (id === "\0virtual:fixture") return fixture; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "GuardReconcile" } } } });
  const bundle = (Array.isArray(built) ? built[0] : built) as { output: Array<{ type: string; code?: string }> };
  const browser = await chromium.launch({ executablePath: process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); page.setDefaultTimeout(5000);
    await page.setContent('<html lang="zh"><style>body{margin:0;font-family:system-ui}#root{width:343px;padding:16px}input,select{max-width:100%;box-sizing:border-box}fieldset{min-width:0;margin:0}p{overflow-wrap:anywhere}</style><body><div id="root"></div></body></html>');
    await page.addScriptTag({ content: bundle.output.find(item => item.type === "chunk")!.code });
    expect(await page.getByLabel("行动 1 行动内容当前资源").inputValue()).toBe("");
    expect(await page.getByLabel("行动 1 附加条件当前资源").inputValue()).toBe("");
    await page.getByLabel("行动 1 行动内容当前资源").selectOption("resource-1");
    expect(await page.getByLabel("行动 1 附加条件当前资源").inputValue()).toBe("");
    expect(await page.getByRole("button", { name: "应用核对结果到当前草稿", exact: true }).isDisabled()).toBe(true);
    await page.getByLabel("行动 1 附加条件当前资源").selectOption("resource-2");
    await page.getByLabel("行动 1 附加条件核对阈值").fill("");
    expect(await page.getByRole("button", { name: "应用核对结果到当前草稿", exact: true }).isDisabled()).toBe(true);
    await page.getByLabel("行动 1 附加条件核对阈值").fill("4");
    await page.getByRole("button", { name: "核对时删除行动 1 并查看后继影响", exact: true }).click();
    const preview = page.getByRole("region", { name: "核对规则删除影响", exact: true });
    expect(await preview.textContent()).toContain("行动 1"); expect(await preview.textContent()).toContain("行动 2");
    await page.getByRole("button", { name: "取消此次移除", exact: true }).click();
    expect(await page.getByLabel("行动 1 附加条件核对阈值").inputValue()).toBe("4");
    await page.getByRole("button", { name: "核对时删除行动 3 并查看后继影响", exact: true }).click();
    expect(await preview.textContent()).toContain("策略：谨慎准备");
    await page.getByRole("button", { name: "取消此次移除", exact: true }).click();
    await page.getByRole("button", { name: "应用核对结果到当前草稿", exact: true }).click();
    const result = await page.evaluate("window.guardReconcile.applied");
    expect(result?.ok).toBe(true); expect(result.draftRules.version).toBe("digital-life-rules-v3");
    expect(result.draftRules.actions[0].operation.resourceKey).toBe("resource-1"); expect(result.draftRules.actions[0].guard.resourceKey).toBe("resource-2");
    expect(result.draftRules.actions[0].guard.value).toBe(4);
    expect(result.draftRules.actions.every((action: { confirmedForSimulation: boolean }) => !action.confirmedForSimulation)).toBe(true);
    await page.getByRole("button", { name: "核对时删除行动 1 并查看后继影响", exact: true }).click();
    await page.getByRole("button", { name: "确认移除列出的规则", exact: true }).click();
    await page.getByRole("button", { name: "应用核对结果到当前草稿", exact: true }).click();
    const cascaded = await page.evaluate("window.guardReconcile.applied");
    expect(cascaded.draftRules.actions.map((action: { key: string }) => action.key)).toEqual(["rule-3"]);
    expect(cascaded.draftRules.strategies[0].label).toBe("谨慎准备");
    expect(await page.evaluate("document.documentElement.scrollWidth<=375")).toBe(true);
    expect(await page.evaluate("document.body.innerText")).not.toMatch(/rule-\d|resource-\d|person-\d/);
  } finally { await browser.close(); }
}, 60_000);

it("renders typed HTTP guard results at 375px with separate main, variant, sample and actual tick evidence", async () => {
  const require = createRequire(import.meta.url);
  const { chromium } = require(path.join(process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules", "playwright"));
  const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {createFormalSandboxClient} from '@/lib/formal-sandbox/client';import {StrategyPathsCard} from '@/app/app/simulation/result/result-workbench';import {FrozenWorldGuards} from '@/app/app/simulation/result/frozen-world-guards';globalThis.React=React;
  const empty={participants:[],relationships:[],facts:[],assumptions:[],realityProfile:{status:'frozen',revision:2,facts:[],assumptions:[],unknowns:[],structuredResources:[],structuredConstraints:[],worldVariables:[]},resourceChanges:[],steps:[],claims:[]};
  const guards=(label,stepKey)=>({version:'digital-life-guard-observations-v1',samples:Array.from({length:3},(_,sample)=>({key:'sample-'+(sample+1),ticks:Array.from({length:3},(_,tickIndex)=>({tickIndex,occurredAt:sample===2?null:'2026-10-16T01:00:00Z',observations:[{ruleKey:'rule-1',tickIndex,label,unit:'小时',conditionDescription:label+'余额不高于4小时',schedule:sample===2?'not_reached':tickIndex===1?'due':'not_due',guard:sample===2||tickIndex!==1?null:true,candidate:sample===2||tickIndex!==1?null:sample===0?'selected':'not_selected',before:sample===2?null:4,after:sample===2?null:sample===0&&tickIndex===1?3:4,stepKey:sample===0&&tickIndex===1?stepKey:null}]}))}))});
  const step=(key,order,label)=>({key,order,label,kind:'sandbox_simulation',boundary:'simulation_step',participantKeys:[],relationshipKeys:[]});
  const projection={...empty,steps:[step('step-5',5,'本人实际准备事件')],guardObservations:guards('学习时间','step-5'),strategyPaths:[{key:'path-2',label:'谨慎分身',projection:{...empty,steps:[step('step-1',1,'分身独立准备事件')],guardObservations:guards('休息时间','step-1')}}]};
  window.fetch=async()=>new Response(JSON.stringify({ok:true,completed_at:'2026-10-16T01:00:00Z',projection}));createFormalSandboxClient().result('60000000-0000-4000-8000-000000000001').then(result=>{if(!result.ok)throw Error(result.errorCode);const p=result.data.projection;createRoot(document.getElementById('root')).render(React.createElement(React.Fragment,null,React.createElement('section',{'aria-label':'本人主路径条件观察'},React.createElement(FrozenWorldGuards,{observations:p.guardObservations,steps:p.steps})),React.createElement(StrategyPathsCard,{paths:p.strategyPaths})))})`;
  const built = await build({ configFile: false, root: process.cwd(), logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/link": "virtual:link", "next/navigation": "virtual:navigation" } }, plugins: [{ name: "guard-result-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; if (id === "\0virtual:navigation") return "export function useRouter(){return {push(){}}}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "GuardResult" } } } });
  const bundle = (Array.isArray(built) ? built[0] : built) as { output: Array<{ type: string; code?: string }> };
  const browser = await chromium.launch({ executablePath: process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); page.setDefaultTimeout(5000);
    const errors: string[] = []; page.on("pageerror", (error: Error) => errors.push(error.message));
    await page.setContent('<html lang="zh"><style>body{margin:0;font-family:system-ui}#root{width:343px;padding:16px}p{overflow-wrap:anywhere}section,div{min-width:0;box-sizing:border-box}</style><body><div id="root"></div></body></html>');
    await page.addScriptTag({ content: bundle.output.find(item => item.type === "chunk")!.code });
    const main = page.getByRole("region", { name: "本人主路径条件观察", exact: true });
    await main.waitFor();
    const mainSample = main.getByRole("region", { name: "条件观察样本 1", exact: true });
    expect(await mainSample.textContent()).toContain("学习时间余额不高于4小时");
    expect(await mainSample.textContent()).toContain("学习时间：4 → 3 小时");
    expect(await mainSample.textContent()).toContain("模拟周期 2");
    expect(await mainSample.textContent()).toContain("实际事件依据：模拟步骤 5 · 本人实际准备事件");
    expect(await main.getByRole("region", { name: "条件观察样本 2", exact: true }).textContent()).toContain("候选未被选中");
    const notReached = await main.getByRole("region", { name: "条件观察样本 3", exact: true }).textContent();
    expect(notReached).toContain("指定模拟周期未到达"); expect(notReached).not.toContain("→");
    expect(await main.textContent()).not.toContain("分身独立准备事件");
    expect(await page.getByText("休息时间：4 → 3 小时", { exact: true }).count()).toBe(1);
    expect(await page.getByText("实际事件依据：模拟步骤 1 · 分身独立准备事件", { exact: true }).count()).toBe(1);
    expect(await page.evaluate("document.documentElement.scrollWidth<=375")).toBe(true);
    expect(await page.evaluate("document.body.innerText")).not.toMatch(/rule-\d|step-\d|sample-\d|path-\d/);
    expect(errors).toEqual([]);
  } finally { await browser.close(); }
}, 60_000);
