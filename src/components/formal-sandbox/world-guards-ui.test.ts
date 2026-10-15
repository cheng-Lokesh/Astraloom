import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRequire } from "node:module";
import path from "node:path";
import { build } from "vite";
import { expect, it, vi } from "vitest";
import { ModelRulesDraftEditor } from "./model-rule-revision";

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
  } finally { await browser.close(); }
}, 60_000);
