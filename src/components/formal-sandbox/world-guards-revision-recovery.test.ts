import { expect, it } from "vitest";
import { build } from "vite";
import path from "node:path";
import { createRequire } from "node:module";

it("keeps revised v3 rules after known no-actions and requires fresh confirmation with a new request key", async () => {
  const require = createRequire(import.meta.url);
  const { chromium } = require(path.join(process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules", "playwright"));
  const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {FormalRunStarter} from '@/components/formal-sandbox/run-starter';globalThis.React=React;
  const modelContext={graphSnapshotId:'30000000-0000-4000-8000-000000000001',agentSnapshotId:'40000000-0000-4000-8000-000000000001',profileRevision:2,agents:[{key:'person-1',label:'本人',role:'user_core'}],relationships:[],resources:[{key:'resource-1',label:'学习时间',available:8,minimum:0,maximum:20,unit:'小时',usePerTick:null,classification:'fact',evidenceSummary:'本人记录'}],variables:[]};
  const action={key:'rule-1',pathKey:'main',actorKey:'person-1',when:{kind:'at_tick',tickIndex:0},operation:{actionType:'update_commitment',commitmentKey:'commitment-1',label:'保留原沟通准备行动',status:'planned'},guard:{kind:'resource_balance',resourceKey:'resource-1',operator:'lte',value:4},classification:'assumption',confirmedForSimulation:false,evidenceSummary:'本人准备条件'};
  const draftRules={version:'digital-life-rules-v3',graphSnapshotId:modelContext.graphSnapshotId,agentSnapshotId:modelContext.agentSnapshotId,profileRevision:2,actions:[action],strategies:[]};
  const context={version:'digital-life-correction-context-v2',horizonDays:30,modelContext,frozenRules:{...draftRules,actions:[{...action,confirmedForSimulation:true}]},draftRules,permissionsReset:{planning:true,symbolic:true,outcomeCalibration:true,requestIdentity:true}};
  const row={ruleKey:'rule-1',tickIndex:0,label:'学习时间',unit:'小时',conditionDescription:'学习时间余额不高于4小时',schedule:'due',guard:false,candidate:null,before:8,after:8,stepKey:null};const samples=Array.from({length:3},(_,index)=>({key:'sample-'+(index+1),terminalStatus:'no_actions',executedTickCount:1,selectedEventCount:0}));const observed=samples.map(sample=>({key:sample.key,ticks:Array.from({length:3},(_,tickIndex)=>({tickIndex,occurredAt:tickIndex===0?'2026-10-16T01:00:00Z':null,observations:[tickIndex===0?row:{...row,tickIndex,schedule:'not_reached',guard:null,before:null,after:null}]}))}));
  const pathDiagnostics={version:'formal-path-diagnostics-v1',status:'not_saved',paths:[{key:'path-1',label:'本人主路径',status:'no_actions',samples,guardObservations:{version:'digital-life-guard-observations-v1',samples:observed}}]};
  window.revisedGuards={runs:[],navigated:''};let uuid=20;Object.defineProperty(crypto,'randomUUID',{value:()=>'50000000-0000-4000-8000-'+String(uuid++).padStart(12,'0')});window.fetch=async(url,init)=>{url=String(url);const ok=data=>new Response(JSON.stringify({ok:true,...data}));if(url.includes('correction-context'))return ok({context});if(url.includes('model-context'))return ok({context:modelContext});if(url==='/api/sandbox/runs'){window.revisedGuards.runs.push(JSON.parse(init.body));return new Response(JSON.stringify({ok:false,error_code:'no_eligible_actions',trace_id:'safe-test-response',pathDiagnostics}),{status:409})}return new Response(JSON.stringify({ok:false,error_code:'unavailable',trace_id:'safe-test-response'}),{status:500})};createRoot(document.getElementById('root')).render(React.createElement(FormalRunStarter,{revisionRunId:'60000000-0000-4000-8000-000000000001'}));`;
  const built = await build({ configFile: false, root: process.cwd(), logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/navigation": "virtual:navigation", "next/link": "virtual:link" } }, plugins: [{ name: "revision-guard-recovery-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:navigation") return "export function useRouter(){return {push:url=>window.revisedGuards.navigated=url}}"; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "RevisedGuardRecovery" } } } });
  const bundle = (Array.isArray(built) ? built[0] : built) as { output: Array<{ type: string; code?: string }> };
  const browser = await chromium.launch({ executablePath: process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); page.setDefaultTimeout(4000);
    await page.setContent('<html lang="zh"><style>body{margin:0;font-family:system-ui}#root{width:343px;padding:16px}input,select{box-sizing:border-box;max-width:100%}fieldset{min-width:0;margin:0}p{overflow-wrap:anywhere}</style><body><div id="root"></div></body></html>');
    await page.addScriptTag({ content: bundle.output.find(item => item.type === "chunk")!.code });
    await page.getByLabel("行动 1 条件阈值").waitFor();
    expect(await page.getByLabel("行动 1 条件阈值").inputValue()).toBe("4");
    await page.getByLabel("我重新确认行动 1 的模拟假设").check();
    await page.getByRole("button", { name: "开始 30 天运行", exact: true }).click();
    await page.waitForFunction("window.revisedGuards.runs.length===1");
    await page.getByRole("region", { name: "本次条件未形成完整运行", exact: true }).waitFor();
    expect(await page.getByRole("button", { name: "开始 30 天运行", exact: true }).isDisabled()).toBe(true);
    expect(await page.getByLabel("我重新确认行动 1 的模拟假设").isChecked()).toBe(false);
    expect(await page.getByLabel("本人承诺内容", { exact: true }).inputValue()).toBe("保留原沟通准备行动");
    expect(await page.getByLabel("行动 1 条件阈值").inputValue()).toBe("4");
    expect(await page.getByRole("button", { name: "恢复原运行请求", exact: true }).count()).toBe(0);
    await page.getByLabel("行动 1 条件阈值").fill("8");
    await page.getByLabel("我重新确认行动 1 的模拟假设").check();
    await page.getByRole("button", { name: "开始 30 天运行", exact: true }).click();
    await page.waitForFunction("window.revisedGuards.runs.length===2");
    const runs = await page.evaluate("window.revisedGuards.runs");
    expect(runs[0].digital_life_rules.version).toBe("digital-life-rules-v3");
    expect(runs[0].digital_life_rules.actions[0].guard.value).toBe(4); expect(runs[1].digital_life_rules.actions[0].guard.value).toBe(8);
    expect(runs[0].idempotency_key).not.toBe(runs[1].idempotency_key);
    expect(await page.evaluate("window.revisedGuards.navigated")).toBe("");
  } finally { await browser.close(); }
}, 60_000);
