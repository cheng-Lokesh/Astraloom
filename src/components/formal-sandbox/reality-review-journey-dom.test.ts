import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { build } from "vite";
import { describe, expect, it } from "vitest";

const runtime = process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const executablePath = process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
type Locator = { waitFor(): Promise<void>; click(): Promise<void>; check(): Promise<void>; fill(value: string): Promise<void>; selectOption(value: string): Promise<void>; isDisabled(): Promise<boolean>; isChecked(): Promise<boolean>; count(): Promise<number> };
type Page = { setDefaultTimeout(value: number): void; setContent(html: string): Promise<void>; addScriptTag(input: { content: string }): Promise<void>; getByLabel(name: string | RegExp): Locator; getByRole(role: string, input?: { name: string | RegExp; exact?: boolean }): Locator; evaluate<T>(fn: () => T): Promise<T>; waitForFunction(fn: () => boolean): Promise<void>; screenshot(input: { path: string; fullPage: boolean }): Promise<void> };
type Browser = { newPage(options: unknown): Promise<Page>; close(): Promise<void> };
declare global { interface Window { realityReview: { requests: Array<{ url: string; body: Record<string, unknown> }>; failWrite: boolean; navigation: string; phase: string; open: (mode: string) => Promise<void>; changeRun: () => void; closeWindow: () => void; }; } }

const sourceRun = "60000000-0000-4000-8000-000000000001";
const stableKey = `correction-v1-${"a".repeat(64)}`;
const fixture = `
import React from 'react'; import {createRoot} from 'react-dom/client';
import {OutcomeObservations} from '@/components/formal-sandbox/outcome-observations';
import {FormalRunStarter} from '@/components/formal-sandbox/run-starter';
import {CalibrationSelection} from '@/components/formal-sandbox/calibration-selection';
import {FrozenUsedCorrections} from '@/app/app/simulation/result/frozen-used-corrections';
import {createFormalSandboxClient} from '@/lib/formal-sandbox/client';
globalThis.React=React;
const sourceRun='${sourceRun}', newRun='60000000-0000-4000-8000-000000000002';
const modelContext={graphSnapshotId:'30000000-0000-4000-8000-000000000001',agentSnapshotId:'40000000-0000-4000-8000-000000000001',profileRevision:2,agents:[{key:'person-1',label:'本人',role:'user_core'}],relationships:[],resources:[{key:'resource-1',label:'学习时间',available:8,minimum:0,maximum:20,unit:'小时',usePerTick:null,classification:'fact',evidenceSummary:'本人记录'}]};
const action={key:'rule-1',pathKey:'main',actorKey:'person-1',when:{kind:'at_tick',tickIndex:0},operation:{actionType:'allocate_resource',resourceKey:'resource-1',amount:2},classification:'assumption',confirmedForSimulation:false,evidenceSummary:'本人准备条件'};
const draftRules={version:'digital-life-rules-v1',graphSnapshotId:modelContext.graphSnapshotId,agentSnapshotId:modelContext.agentSnapshotId,profileRevision:2,actions:[action],strategies:[]};
const correctionContext={version:'digital-life-correction-context-v1',horizonDays:30,modelContext,frozenRules:{...draftRules,actions:[{...action,confirmedForSimulation:true}]},draftRules,permissionsReset:{planning:true,symbolic:true,outcomeCalibration:true,requestIdentity:true}};
const condition=(key,label,kind,expectedValue,measurement,sequence,extra={})=>({key,label,kind,expectedValue,measurement,sequence,ruleKey:null,correctable:false,requiresTime:false,actorLabel:null,resourceLabel:null,...extra});
const conditions=[condition('condition-1','本人是否询问安排','request_information',true,'operation',1,{requiresTime:true}),condition('condition-2','实际询问者是本人','scope_confirmation',true,'actor_scope',1),condition('condition-3','可见合作回应','update_relation_signal','positive','operation',2,{requiresTime:true,correctable:true,ruleKey:'rule-2'}),condition('condition-4','回应来自对应协作关系','scope_confirmation',true,'relationship_scope',2),condition('condition-5','本人直接看到回应','scope_confirmation',true,'response_source',2),condition('condition-6','本人学习投入','allocate_resource',2,'operation',3,{requiresTime:true,correctable:true,ruleKey:'rule-1'}),condition('condition-7','实际投入者是本人','scope_confirmation',true,'actor_scope',3),condition('condition-8','实际投入的是学习时间','scope_confirmation',true,'resource_scope',3),condition('condition-9','整个窗口投入总次数','allocate_resource',1,'event_count',0)];
const target={key:'target-1',label:'本人询问、回应与资源投入',status:'not_observable',reason:'整组模拟不具备现实评分依据',observationWindow:{startAt:'2026-01-01T00:00:00Z',horizonEnd:'2099-01-01T00:00:00Z'},canRecordDidNotOccur:false,canRecordTypedObservation:true,correctionAllowed:true,criteriaStatus:'available',criteriaVersion:'formal-reality-criteria-v2',conditions,review:{kind:'relationship_resource_chain',title:'逐项复盘询问、可见回应与资源投入',stepKeys:['step-1','step-2'],groups:[{key:'review-group-1',label:'本人询问',conditionKeys:['condition-1','condition-2']},{key:'review-group-2',label:'可见回应',conditionKeys:['condition-3','condition-4','condition-5']},{key:'review-group-3',label:'资源投入',conditionKeys:['condition-6','condition-7','condition-8']},{key:'review-group-4',label:'完整窗口',conditionKeys:['condition-9']}]}};
target.correctionRequirements=[{ruleKey:'rule-1',conditionKey:'condition-6',requiredTrueConditionKeys:['condition-7','condition-8'],requestConditionKey:null}];
const base={lockStatus:'available',assessedAt:'2026-10-19T00:00:00Z',targets:[target],history:[],calibration:{status:'insufficient_data',sampleCount:0,minimumSampleSize:5}};
let history=[],uuid=20;Object.defineProperty(crypto,'randomUUID',{value:()=>'50000000-0000-4000-8000-'+String(uuid++).padStart(12,'0')});
const correction={key:'${stableKey}',label:'本人学习投入修正',evidenceSummary:'本人实际记录',ruleKey:'rule-1',kind:'allocate_resource',previousValue:2,nextValue:3,version:1,status:'eligible',reason:null,sourceRunId:sourceRun,recordedAt:'2026-10-18T02:00:00Z'};
const receipt={version:'formal-used-corrections-v1',status:'recorded',items:[{key:'correction-1',sourceRunId:sourceRun,ruleKey:'rule-1',label:'本人学习投入修正',previousValue:2,nextValue:3,evidenceSummary:'本人实际记录',recordedAt:'2026-10-18T02:00:00Z',samples:[{sampleKey:'sample-1',status:'executed',stepKeys:['step-1']},{sampleKey:'sample-2',status:'not_executed',stepKeys:[]},{sampleKey:'sample-3',status:'executed',stepKeys:['step-2']}]}]};
const resultProjection={participants:[],relationships:[],facts:[],assumptions:[],realityProfile:{status:'not_recorded',revision:null,facts:[],assumptions:[],unknowns:[],structuredResources:[],structuredConstraints:[],worldVariables:[]},resourceChanges:[],steps:[{key:'step-1',order:1,label:'首次学习投入',kind:'sandbox_simulation',boundary:'simulation_step',participantKeys:[],relationshipKeys:[]},{key:'step-2',order:2,label:'另一重复样本的学习投入',kind:'sandbox_simulation',boundary:'simulation_step',participantKeys:[],relationshipKeys:[]}],claims:[],usedCorrections:receipt};
const f=window.realityReview={requests:[],failWrite:true,navigation:'',phase:'observations',open:async()=>{},changeRun:()=>{}};
const root=createRoot(document.getElementById('root'));
const ok=data=>new Response(JSON.stringify({ok:true,...data}));
window.fetch=async(url,init)=>{url=String(url);if(init?.method==='POST'){const body=JSON.parse(init.body);f.requests.push({url,body});if(f.failWrite)throw new Error('synthetic ambiguous response');if(url.endsWith('/outcomes')){history=[{key:'observation-1',targetKey:body.target_key,observed:body.observed,recordedAt:'2026-10-19T00:00:00Z',occurredAt:null,source:'user_observation',evidenceSummary:body.evidence_summary,uncertainty:body.uncertainty,backtestStatus:'not_observable',correctionAvailable:Boolean(body.correction),observations:body.observations.map(item=>({key:item.key,value:item.value,occurredAt:item.occurred_at??null})),criteriaComparison:{status:'unknown',differences:['condition-6']}}];return ok({idempotent:true,outcomes:{...base,history}})}return ok({idempotent:false,run:{id:newRun,status:'completed'}})}
if(url.endsWith('/result'))return ok({completed_at:'2026-10-19T00:00:00Z',projection:resultProjection});if(url.includes('correction-context'))return ok({context:correctionContext});if(url.includes('model-context'))return ok({context:modelContext});if(url.includes('calibration-context'))return ok({context:{status:'available',profileRevision:2,corrections:[correction,{...correction,key:'correction-v1-'+ 'c'.repeat(64),label:'另一份学习投入修正',nextValue:4}]}});if(url.endsWith('/outcomes'))return ok({outcomes:{...base,history}});return new Response(JSON.stringify({ok:false,error_code:'unavailable',trace_id:'fixture'}),{status:500});};
function Selection(){const [keys,setKeys]=React.useState([]),[confirmed,setConfirmed]=React.useState(false);const corrections=Array.from({length:8},(_,i)=>({...correction,key:'correction-v1-'+String(i+1).padStart(64,'a'),ruleKey:'rule-'+(i+1),label:'选择第'+(i+1)+'项',sourceRunId:i===7?newRun:sourceRun}));return React.createElement(CalibrationSelection,{context:{status:'available',profileRevision:2,corrections},selectedKeys:keys,confirmed,onChange:setKeys,onConfirm:setConfirmed,disabled:false})}
f.open=async mode=>{f.phase=mode;if(mode==='selection')root.render(React.createElement(Selection));else if(mode==='starter')root.render(React.createElement(FormalRunStarter,{revisionRunId:sourceRun}));else if(mode==='result'){const response=await createFormalSandboxClient().result(newRun);if(!response.ok)throw new Error('result fixture rejected');root.render(React.createElement(FrozenUsedCorrections,{receipt:response.data.projection.usedCorrections,steps:response.data.projection.steps}))}else root.render(React.createElement(OutcomeObservations,{runId:sourceRun}));};
f.changeRun=()=>root.render(React.createElement(OutcomeObservations,{runId:newRun}));f.closeWindow=()=>{target.observationWindow.horizonEnd='2026-10-18T00:00:00Z';f.changeRun()};f.open('observations');
`;

async function bundleFixture() {
  const built = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/navigation": "virtual:navigation", "next/link": "virtual:link" } }, plugins: [{ name: "reality-review-journey", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:navigation") return "export function useRouter(){return {push:async url=>{window.realityReview.navigation=url;await window.realityReview.open('result')}}}"; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',{...props,onClick:e=>{if(props.href.startsWith('/app/start?revise_run=')){e.preventDefault();window.realityReview.navigation=props.href;window.realityReview.open('starter')}}})}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "RealityReviewJourney" } } } });
  return ((Array.isArray(built) ? built[0] : built) as { output: Array<{ type: string; code?: string }> }).output.find(item => item.type === "chunk")!.code!;
}

describe.skipIf(!existsSync(path.join(runtime, "playwright")) || !existsSync(executablePath))("reality review complete mounted journey with typed mock HTTP", () => {
  it("uses the assessed observation window rather than Core scoring permission for the review boundary", async () => {
    const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(input: unknown): Promise<Browser> } };
    const browser = await chromium.launch({ executablePath, headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); page.setDefaultTimeout(5000);
      await page.setContent('<html lang="zh"><body><div id="root"></div></body></html>'); await page.addScriptTag({ content: await bundleFixture() });
      await page.getByLabel("实际观察 · 本人是否询问安排").waitFor();
      await page.evaluate(() => window.realityReview.closeWindow());
      await page.waitForFunction(() => document.body.textContent?.includes(new Date("2026-10-18T00:00:00Z").toLocaleString()) === true);
      await page.getByRole("button", { name: "完整窗口", exact: true }).click();
      await page.getByRole("button", { name: "核对本次复盘", exact: true }).click();
      expect(await page.evaluate(() => document.body.textContent?.includes("观察窗口尚未结束，整体对照仍为未知"))).toBe(false);
      expect(await page.evaluate(() => document.body.textContent?.includes("以下仅核对具体观察条件，不证明整组模拟情景在现实发生"))).toBe(true);
    } finally { await browser.close(); }
  }, 30_000);
  it("caps different rules at six and replaces all old-source choices when another source is chosen", async () => {
    const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(input: unknown): Promise<Browser> } };
    const browser = await chromium.launch({ executablePath, headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); page.setDefaultTimeout(5000);
      await page.setContent('<html lang="zh"><body><div id="root"></div></body></html>'); await page.addScriptTag({ content: await bundleFixture() });
      await page.evaluate(() => window.realityReview.open("selection"));
      for (let index = 1; index <= 6; index++) await page.getByLabel(new RegExp(`^选择第${index}项`)).check();
      expect(await page.getByLabel(/^选择第7项/).isDisabled()).toBe(true);
      await page.getByLabel("我确认将所选本人观察修正作为本次运行的条件假设").check();
      expect(await page.getByLabel(/^选择第8项/).isDisabled()).toBe(false);
      await page.getByLabel(/^选择第8项/).check();
      for (let index = 1; index <= 6; index++) expect(await page.getByLabel(new RegExp(`^选择第${index}项`)).isChecked()).toBe(false);
      expect(await page.getByLabel("我确认将所选本人观察修正作为本次运行的条件假设").isChecked()).toBe(false);
    } finally { await browser.close(); }
  }, 30_000);
  it("isolates a changed Run prop from the previous unknown request, values and saved continuation", async () => {
    const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(input: unknown): Promise<Browser> } };
    const browser = await chromium.launch({ executablePath, headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); page.setDefaultTimeout(5000);
      await page.setContent('<html lang="zh"><body><div id="root"></div></body></html>'); await page.addScriptTag({ content: await bundleFixture() });
      await page.getByLabel("实际观察 · 本人是否询问安排").waitFor();
      await page.getByLabel("实际观察 · 本人是否询问安排").selectOption("false");
      await page.getByRole("button", { name: "完整窗口", exact: true }).click();
      await page.getByRole("button", { name: "核对本次复盘", exact: true }).click();
      await page.getByLabel("观察依据简述").fill("旧运行的本人记录");
      await page.getByLabel(/^我确认以上是本人观察/).check();
      await page.getByRole("button", { name: "保存本人观察", exact: true }).click();
      await page.getByRole("button", { name: "重试原观察保存", exact: true }).waitFor();
      await page.evaluate(() => window.realityReview.changeRun());
      await page.getByLabel("实际观察 · 本人是否询问安排").waitFor();
      expect(await page.getByRole("button", { name: "重试原观察保存", exact: true }).count()).toBe(0);
      expect(await page.getByRole("link", { name: "准备下一次运行，核对并选择观察修正" }).count()).toBe(0);
      expect(await page.evaluate(() => (document.querySelector('textarea') as HTMLTextAreaElement).value)).toBe("");
      expect(await page.evaluate(() => document.body.textContent?.includes("已填 0 项 · 未知 0 项 · 待观察 9 项"))).toBe(true);
      expect(await page.evaluate(() => window.realityReview.requests.length)).toBe(1);
    } finally { await browser.close(); }
  }, 30_000);
  for (const width of [375, 1280]) it(`keeps partial unknowns, recovers the exact save and explicitly starts a corrected Run at ${width}px`, async () => {
    const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(input: unknown): Promise<Browser> } };
    const browser = await chromium.launch({ executablePath, headless: true });
    try {
      const page = await browser.newPage({ viewport: { width, height: 812 } }); page.setDefaultTimeout(5000);
      const chunks = path.resolve(".next/static/chunks");
      const styles = existsSync(chunks) ? readdirSync(chunks).filter(file => file.endsWith(".css")).map(file => readFileSync(path.join(chunks, file), "utf8")).join("\n") : "";
      await page.setContent(`<html lang="zh-CN"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${styles}\nbody{margin:0;background:var(--bg-base,#050505);color:var(--text-primary,#f5f7fa);font-family:Arial,sans-serif}#root{max-width:1000px;margin:auto;padding:16px}input,select,textarea{box-sizing:border-box;max-width:100%}fieldset{min-width:0}</style><body><div id="root"></div></body></html>`);
      await page.addScriptTag({ content: await bundleFixture() });
      await page.getByLabel("实际观察 · 本人是否询问安排").waitFor();
      expect(await page.evaluate(() => document.body.textContent?.includes("已填 0 项 · 未知 0 项 · 待观察 9 项"))).toBe(true);
      await page.getByLabel("实际观察 · 本人是否询问安排").selectOption("false");
      expect(await page.getByLabel("条件发生时间 · 本人是否询问安排").count()).toBe(0);
      await page.getByRole("button", { name: "可见回应", exact: true }).click();
      await page.getByLabel("实际观察 · 可见合作回应").selectOption("negative");
      expect(await page.getByLabel(/供下一次运行参考的条件修正/).count()).toBe(0);
      await page.getByLabel("实际观察 · 可见合作回应").selectOption("unknown");
      await page.getByRole("button", { name: "资源投入", exact: true }).click();
      await page.getByLabel("实际观察 · 本人学习投入").fill("3");
      expect(await page.getByLabel(/供下一次运行参考的条件修正/).count()).toBe(0);
      await page.getByLabel("条件发生时间 · 本人学习投入").fill("2026-10-18T10:00");
      await page.getByLabel("实际观察 · 实际投入者是本人").selectOption("true");
      await page.getByLabel("实际观察 · 实际投入的是学习时间").selectOption("true");
      await page.getByLabel(/供下一次运行参考的条件修正/).selectOption("rule-1");
      await page.getByLabel("我单独确认建立所选条件修正，仅供下一次运行参考").check();
      await page.getByRole("button", { name: "完整窗口", exact: true }).click();
      await page.getByRole("button", { name: "核对本次复盘", exact: true }).click();
      expect(await page.evaluate(() => document.body.textContent?.includes("整体对照仍为未知"))).toBe(true);
      await page.getByLabel("观察依据简述").fill("本人未询问，已实际投入学习时间，回应仍不清楚");
      await page.getByLabel(/^我确认以上是本人观察/).check();
      const output = path.resolve("output/playwright/reality-review"); mkdirSync(output, { recursive: true });
      await page.screenshot({ path: path.join(output, `review-${width}.png`), fullPage: true });
      await page.getByRole("button", { name: "保存本人观察", exact: true }).click();
      await page.getByRole("button", { name: "重试原观察保存", exact: true }).waitFor();
      expect(await page.getByRole("button", { name: "本人询问", exact: true }).isDisabled()).toBe(true);
      expect(await page.getByRole("link", { name: "准备下一次运行，核对并选择观察修正" }).count()).toBe(0);
      await page.evaluate(() => { window.realityReview.failWrite = false; });
      await page.getByRole("button", { name: "重试原观察保存", exact: true }).click();
      await page.getByRole("link", { name: "准备下一次运行，核对并选择观察修正" }).waitFor();
      const requests = await page.evaluate(() => window.realityReview.requests);
      expect(requests[0]).toEqual(requests[1]);
      expect(requests[0].body.observations).toHaveLength(9);
      expect((requests[0].body.observations as Array<{ key: string; value: unknown; occurred_at?: string }>).find(item => item.key === "condition-1")).toEqual({ key: "condition-1", value: false });
      expect((requests[0].body.observations as Array<{ key: string; value: unknown }>).find(item => item.key === "condition-9")?.value).toBeNull();
      // A successful save clears both the draft and review navigation.
      await page.getByLabel("实际观察 · 本人是否询问安排").waitFor();
      expect(await page.getByLabel(/^我确认以上是本人观察/).isChecked()).toBe(false);
      await page.getByRole("link", { name: "准备下一次运行，核对并选择观察修正" }).click();
      await page.getByLabel(/^本人学习投入修正/).waitFor();
      expect(await page.getByLabel(/^本人学习投入修正/).isChecked()).toBe(false);
      expect(await page.getByRole("button", { name: "开始 30 天运行", exact: true }).isDisabled()).toBe(true);
      await page.getByLabel("我重新确认行动 1 的模拟假设").check();
      await page.getByLabel(/^本人学习投入修正/).check();
      await page.getByLabel("我确认将所选本人观察修正作为本次运行的条件假设").check();
      await page.getByRole("button", { name: "开始 30 天运行", exact: true }).click();
      await page.getByRole("region", { name: "本次已采用的观察修正", exact: true }).waitFor();
      expect(await page.evaluate(() => document.body.textContent?.includes("原条件：2 → 本次条件：3"))).toBe(true);
      expect(await page.evaluate(() => document.body.textContent?.includes("本样本未执行该条件行动"))).toBe(true);
      expect(await page.evaluate(() => document.body.textContent?.includes("支持步骤 1：首次学习投入"))).toBe(true);
      expect(await page.evaluate(() => document.body.textContent?.includes("60000000-") || document.body.textContent?.includes("rule-1"))).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: path.join(output, `receipt-${width}.png`), fullPage: true });
    } finally { await browser.close(); }
  }, 45_000);
});
