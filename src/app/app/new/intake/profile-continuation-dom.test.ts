import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { build } from "vite";
import { describe, expect, it } from "vitest";

const runtime = process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const executablePath = process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
type Locator = { waitFor(): Promise<void>; click(): Promise<void>; check(): Promise<void>; fill(value: string): Promise<void>; count(): Promise<number>; isDisabled(): Promise<boolean>; isChecked(): Promise<boolean>; selectOption(value: string): Promise<void>; inputValue(): Promise<string>; all(): Promise<Locator[]>; getAttribute(name: string): Promise<string | null> };
type Page = { setDefaultTimeout(value: number): void; setContent(html: string): Promise<void>; addScriptTag(input: { content: string }): Promise<void>; getByLabel(name: string | RegExp): Locator; getByRole(role: string, input?: { name: string | RegExp; exact?: boolean }): Locator; evaluate<T>(fn: () => T): Promise<T>; waitForFunction(fn: () => boolean): Promise<void>; screenshot(input: { path: string; fullPage: boolean }): Promise<void> };
type Browser = { newPage(options: unknown): Promise<Page>; close(): Promise<void> };
declare global { interface Window { profileContinuation: { requests: string[]; operations: Array<{ url: string; method: string }>; failure: string; sourceRevision: number; prepareFailure: string; locale: string; open(mode: string): void } } }

const fixture = `
import React from 'react';import {createRoot} from 'react-dom/client';
import {FormalIntakeClient} from '@/app/app/new/intake/formal-intake-client';
import ScenePage from '@/app/app/new/scene/page';
import {RealityProfileClient} from '@/app/app/reality-profile/reality-profile-client';
import {SandboxLedger} from '@/app/app/dashboard/sandbox-dashboard-client';
import {createEmptyRealityProfileDraft} from '@/lib/reality-profile/profile';
import {prepareRealityProfileContinuation,listExpiredRealityContinuationConstraintKeys} from '@/lib/reality-profile/continuation';
globalThis.React=React;
let uuid=1;
Object.defineProperty(crypto,'randomUUID',{value:()=> '50000000-0000-4000-8000-'+String(uuid++).padStart(12,'0')});
const root=createRoot(document.getElementById('root'));
const sourceProfile=createEmptyRealityProfileDraft(3);
sourceProfile.lifeClimate={value:'正在重新安排个人学习与团队协作',classification:'fact',evidenceSummary:'本人近期记录'};
sourceProfile.goals=[{value:'保留个人学习时间',classification:'assumption',evidenceSummary:'本人计划'},sourceProfile.goals[0]];
sourceProfile.worldInputs={version:1,resources:[{key:'source-time',label:'学习时间',resourceType:'time',available:8,unit:'小时',minimum:0,maximum:20,usePerTick:2,classification:'fact',evidenceSummary:'本人时间记录'},{key:'source-budget',label:'准备预算',resourceType:'budget',available:100,unit:'元',minimum:0,maximum:200,usePerTick:10,classification:'assumption',evidenceSummary:'本人预算计划'}],constraints:[{key:'source-deadline',label:'旧协作确认时间',resourceKey:'source-time',rule:{kind:'before_time',value:'2020-01-01T00:00:00.000Z'},classification:'fact',evidenceSummary:'本人旧安排'}]};
const overview={authenticated:true,seed:{state:'submitted'},reality:{facts:[],assumptions:[],unknowns:[],dimensions:[]},people:{confirmedCount:0,total:0,items:[]},agents:{immutableCount:0},graph:{exists:false,locked:false,edgeCount:0},relations:{total:0,items:[]},running:{exists:false,href:null},latestCompletedRun:null,history:{count:0},feedback:{exists:false},lifeClimate:{state:'not_modeled'},resources:{state:'not_modeled'},constraints:{state:'not_modeled'},nextChange:{state:'not_modeled'},nextAction:{kind:'review_people',href:'/app/new/people'},world:{state:'submitted',changeNodes:[],resources:[],constraints:[],goals:[],values:[],lifeThemes:[],pressures:[],externalVariables:[]}};
const state=window.profileContinuation={requests:[],operations:[],failure:'network',sourceRevision:3,prepareFailure:'',locale:'zh',open(mode){root.render(mode==='dashboard'?React.createElement(SandboxLedger,{overview}):React.createElement(mode==='scene'?ScenePage:mode==='profile'?RealityProfileClient:FormalIntakeClient));}};
window.fetch=async(url,init)=>{
 state.operations.push({url:String(url),method:init?.method??'GET'});
 if(String(url).includes('prepare_continuation=1')){
  if(state.prepareFailure)return new Response(JSON.stringify({errorCode:state.prepareFailure}),{status:state.prepareFailure==='network'?500:409});
  const profile=prepareRealityProfileContinuation({...sourceProfile,revision:state.sourceRevision});const preparedAt=new Date().toISOString();
  return new Response(JSON.stringify({continuation:{version:'reality-profile-continuation-v1',sourceSeedContextId:'70000000-0000-4000-8000-000000000001',sourceRevision:state.sourceRevision,preparedAt,profile,expiredConstraintKeys:listExpiredRealityContinuationConstraintKeys(profile,preparedAt)}}));
 }
 if(String(url)==='/api/reality-profile')return new Response(JSON.stringify({profile:sourceProfile}));
 if(init?.method!=='POST')return new Response(JSON.stringify({errorCode:'reality_profile_required'}),{status:409});
 state.requests.push(init.body);
 if(state.failure==='network')throw new Error('synthetic lost response after write');
 if(state.failure==='server')return new Response(JSON.stringify({errorCode:'seed_context_write_failed'}),{status:500});
 if(state.failure==='invalid-success')return new Response(JSON.stringify({seedContext:{}}),{status:201});
 if(state.failure==='unauthorized')return new Response(JSON.stringify({errorCode:'authentication_required'}),{status:401});
 if(state.failure==='forbidden')return new Response(JSON.stringify({errorCode:'access_denied'}),{status:403});
 if(state.failure==='stale')return new Response(JSON.stringify({errorCode:'reality_continuation_source_stale'}),{status:409});
 const body=JSON.parse(init.body);
 return new Response(JSON.stringify({seedContext:{id:'60000000-0000-4000-8000-000000000001',version:state.failure==='wrong-version'?'unsupported-seed-v99':'phase2-submitted-v1',submittedAt:'2026-10-19T00:00:00.000Z',frozenAt:'2026-10-19T00:00:00.000Z'},idempotent:true,...(body.realityContinuation&&state.failure!=='missing-profile-receipt'?{realityContinuation:{version:'reality-profile-continuation-v1',profileRevision:1}}:{})}),{status:200});
};
state.open('intake');
`;

async function bundleFixture() {
  const built = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@/components/app-shell": "virtual:shell", "@/components/language-provider": "virtual:language", "@": path.join(process.cwd(), "src"), "next/link": "virtual:link" } }, plugins: [{ name: "profile-continuation-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; if (id === "\0virtual:shell") return "export function AppShell({children}){return children}"; if (id === "\0virtual:language") return "export function useLanguage(){return {locale:window.profileContinuation.locale}}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "ProfileContinuationFixture" } } } });
  return ((Array.isArray(built) ? built[0] : built) as { output: Array<{ type: string; code?: string }> }).output.find(item => item.type === "chunk")!.code!;
}

async function withMountedIntake(run: (page: Page) => Promise<void>, width = 375) {
  if (!existsSync(path.join(runtime, "playwright")) || !existsSync(executablePath)) throw new Error("Mounted business RED requires the installed Playwright runtime and Chrome");
  const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(input: unknown): Promise<Browser> } };
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width, height: 812 } });
    page.setDefaultTimeout(4000);
    const chunks = path.resolve(".next/static/chunks");
    const css = existsSync(chunks) ? readdirSync(chunks).filter(file => file.endsWith(".css")).map(file => readFileSync(path.join(chunks, file), "utf8")).join("\n") : "";
    await page.setContent(`<html lang="zh-CN"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}\nbody{margin:0;background:var(--bg-base,#080a0c);color:var(--text-primary,#f5f7fa);font-family:Arial,sans-serif}#root{max-width:1100px;margin:auto;padding:16px}</style><body><div id="root"></div></body></html>`);
    await page.addScriptTag({ content: await bundleFixture() });
    await page.getByRole("textbox", { name: /^Situation summary/ }).waitFor();
    await run(page);
  } finally { await browser.close(); }
}

async function fillNewSituation(page: Page) {
  await page.getByRole("textbox", { name: /^Situation summary/ }).fill("最近团队协作安排发生变化，我希望梳理接下来三个月可观察的变化与个人准备。");
  await page.getByRole("textbox", { name: /^Main question/ }).fill("怎样安排下一阶段沟通与个人学习时间？");
  await page.getByLabel(/^我了解提交内容/).check();
}

async function submitOrRetry(page: Page) {
  await page.getByRole("button", { name: /^(提交正式 Track A Seed|重试原处境提交)$/ }).click();
}

async function prepareAndReview(page: Page) {
  await page.getByRole("button", { name: "沿用我的现实资料", exact: true }).click();
  await page.getByLabel("资源 1 名称").waitFor();
  await page.getByLabel("限制 1 截止时间").fill("2099-01-01T10:00");
  await fillNewSituation(page);
  for (const checkbox of await page.getByLabel(/^已核对：/).all()) await checkbox.check();
  await page.getByLabel(/^我确认逐项核对后的现实资料/).check();
  await page.getByLabel(/^我了解提交内容/).check();
}

describe("new-situation continuation mounted React business boundaries", () => {
  for (const width of [768, 1024]) it(`contains all three English Scene entries within the card at ${width}px`, async () => {
    await withMountedIntake(async page => {
      await page.evaluate(() => { window.profileContinuation.locale = "en"; window.profileContinuation.open("scene"); });
      await page.getByRole("link", { name: "Use my saved reality profile", exact: true }).waitFor();
      expect(await page.evaluate(() => Array.from(document.querySelectorAll('a')).every(link => link.getBoundingClientRect().right <= (link.closest('section')?.getBoundingClientRect().right ?? innerWidth) + 1))).toBe(true);
    }, width);
  }, 30_000);
  for (const width of [375, 1280]) {
    it(`shows Scene and My Sandbox continuation entries without horizontal overflow at ${width}px`, async () => {
      await withMountedIntake(async page => {
        for (const mode of ["scene", "dashboard"]) {
          if (mode === "scene") await page.evaluate(() => window.profileContinuation.open("scene"));
          else await page.evaluate(() => window.profileContinuation.open("dashboard"));
          await page.getByRole("link", { name: "沿用我的现实资料", exact: true }).waitFor();
          expect(await page.getByRole("link", { name: "沿用我的现实资料", exact: true }).getAttribute("href")).toBe("/app/new/intake?reality=continue");
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          expect(await page.evaluate(() => Array.from(document.querySelectorAll('a')).every(link => link.getBoundingClientRect().right <= innerWidth + 1))).toBe(true);
          const output = path.resolve("output/playwright/profile-continuation"); mkdirSync(output, { recursive: true });
          await page.screenshot({ path: path.join(output, `${mode}-${width}.png`), fullPage: true });
        }
      }, width);
    }, 30_000);

    it(`reviews all dimensions and a new resource rate, preserves unknowns and exactly recovers the new chain at ${width}px`, async () => {
      await withMountedIntake(async page => {
        await page.getByRole("button", { name: "沿用我的现实资料", exact: true }).click();
        await page.getByLabel("资源 1 名称").waitFor();
        expect(await page.getByRole("textbox", { name: /^Main question/ }).inputValue()).toBe("");
        expect(await page.getByLabel("资源 1 每次受控行动的资源变化量").inputValue()).toBe("");
        expect(await page.getByLabel("资源 2 每次受控行动的资源变化量").inputValue()).toBe("");
        expect(await page.getByLabel("限制 1 截止时间").inputValue()).toContain("2020-01-01");
        expect(await page.getByLabel(/^已核对：时间限制 1/).isDisabled()).toBe(true);
        expect(await page.getByLabel(/^我确认逐项核对后的现实资料/).isDisabled()).toBe(true);
        expect(await page.evaluate(() => document.body.textContent?.includes('70000000-0000'))).toBe(false);
        await page.getByLabel("限制 1 截止时间").fill("2099-01-01T10:00");
        expect(await page.getByLabel(/^已核对：时间限制 1/).isDisabled()).toBe(false);
        for (const checkbox of await page.getByLabel(/^已核对：/).all()) await checkbox.check();
        expect(await page.getByLabel(/^已核对：/).count()).toBe(18);
        await page.getByLabel("生活气候资料类别").selectOption("unknown");
        expect(await page.getByLabel(/^已核对：生活气候/).isChecked()).toBe(false);
        expect(await page.getByLabel(/^已核对：目标第1项/).isChecked()).toBe(true);
        expect(await page.getByLabel("生活气候可复核描述").inputValue()).toBe("");
        await page.getByLabel(/^已核对：生活气候/).check();
        await page.getByRole("button", { name: "新增目标", exact: true }).click();
        expect(await page.getByLabel(/^已核对：目标第1项/).isChecked()).toBe(false);
        expect(await page.getByLabel(/^已核对：目标第2项/).isChecked()).toBe(false);
        await page.getByLabel("移除第 1 项目标").click();
        expect(await page.getByLabel(/^已核对：目标第1项/).isChecked()).toBe(false);
        await page.getByLabel("资源 1 每次受控行动的资源变化量").fill("2");
        expect(await page.getByLabel(/^已核对：资源 1/).isChecked()).toBe(false);
        expect(await page.getByLabel(/^单独确认：学习时间/).isChecked()).toBe(false);
        await fillNewSituation(page);
        for (const checkbox of await page.getByLabel(/^已核对：/).all()) await checkbox.check();
        expect(await page.getByLabel(/^我确认逐项核对后的现实资料/).isDisabled()).toBe(true);
        await page.getByLabel(/^单独确认：学习时间/).check();
        await page.getByLabel(/^我确认逐项核对后的现实资料/).check();
        await page.getByLabel(/^我了解提交内容/).check();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const output = path.resolve("output/playwright/profile-continuation"); mkdirSync(output, { recursive: true });
        await page.screenshot({ path: path.join(output, `review-${width}.png`), fullPage: true });
        await submitOrRetry(page);
        await page.getByRole("button", { name: "重试原处境提交", exact: true }).waitFor();
        for (const name of ["沿用我的现实资料", "从空白新建", "重新读取当前资料"]) expect(await page.getByRole("button", { name, exact: true }).isDisabled()).toBe(true);
        expect(await page.getByLabel("资源 1 名称").isDisabled()).toBe(true);
        expect(await page.getByLabel(/^已核对：身份结构第1项/).isDisabled()).toBe(true);
        await page.evaluate(() => { window.profileContinuation.sourceRevision = 99; window.profileContinuation.failure = "missing-profile-receipt"; });
        await submitOrRetry(page);
        await page.getByRole("button", { name: "重试原处境提交", exact: true }).waitFor();
        expect(await page.getByRole("link", { name: "进入 People", exact: true }).count()).toBe(0);
        await page.evaluate(() => { window.profileContinuation.failure = ""; });
        await submitOrRetry(page);
        await page.getByRole("link", { name: "进入 People", exact: true }).waitFor();
        expect(await page.getByRole("link", { name: "查看新资料的路径 B", exact: true }).getAttribute("href")).toBe("/app/new/life-climate");
        const requests = await page.evaluate(() => window.profileContinuation.requests);
        expect(requests).toHaveLength(3); expect(requests[1]).toBe(requests[0]); expect(requests[2]).toBe(requests[0]);
        const body = JSON.parse(requests[0]);
        expect(body.realityContinuation.sourceRevision).toBe(3);
        expect(body.realityContinuation.reviewedKeys).toHaveLength(18);
        expect(body.realityContinuation.confirmedRateKeys).toEqual(["worldInputs.resources.1"]);
        expect(body.realityContinuation.reviewedProfile.revision).toBe(0);
        expect(body.realityContinuation.reviewedProfile.lifeClimate).toEqual({ value: "", classification: "unknown", evidenceSummary: "明确未知" });
        expect(body.realityContinuation.reviewedProfile.worldInputs.resources[1].usePerTick).toBeNull();
        expect(Object.keys(body).sort()).toEqual(["draft", "realityContinuation", "submissionKey"]);
        expect(await page.evaluate(() => window.profileContinuation.operations.filter(item => item.method === 'PUT').length)).toBe(0);
        expect(await page.evaluate(() => window.profileContinuation.operations.filter(item => item.url.includes('prepare_continuation')).length)).toBe(1);
        await page.screenshot({ path: path.join(output, `saved-${width}.png`), fullPage: true });
      }, width);
    }, 60_000);

    it(`keeps the original Profile GET/PUT editor functional at ${width}px`, async () => {
      await withMountedIntake(async page => {
        await page.evaluate(() => window.profileContinuation.open("profile"));
        await page.getByLabel("生活气候可复核描述").waitFor();
        await page.getByLabel("生活气候可复核描述").fill("最近个人安排已有变化");
        await page.getByRole("button", { name: "保存当前正式链资料", exact: true }).click();
        await page.getByRole("link", { name: "核对并继续调整行动模型", exact: true }).waitFor();
        expect(await page.evaluate(() => window.profileContinuation.operations.filter(item => item.url === '/api/reality-profile' && item.method === 'PUT').length)).toBe(1);
        expect(await page.evaluate(() => window.profileContinuation.requests.length)).toBe(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }, width);
    }, 30_000);
  }

  it("refreshes a known stale source only after clearing every review and consent, with a new identity", async () => {
    await withMountedIntake(async page => {
      await prepareAndReview(page);
      await page.evaluate(() => { window.profileContinuation.failure = "stale"; });
      await submitOrRetry(page);
      await page.waitForFunction(() => document.body.textContent?.includes('来源资料已变化，这次提交未保存') === true);
      expect(await page.getByLabel("资源 1 名称").isDisabled()).toBe(true);
      expect(await page.getByLabel(/^我了解提交内容/).isChecked()).toBe(false);
      await page.evaluate(() => { window.profileContinuation.sourceRevision = 4; });
      await page.getByRole("button", { name: "重新读取当前资料", exact: true }).click();
      await page.getByLabel("资源 1 名称").waitFor();
      for (const checkbox of await page.getByLabel(/^已核对：/).all()) expect(await checkbox.isChecked()).toBe(false);
      expect(await page.getByLabel("资源 1 每次受控行动的资源变化量").inputValue()).toBe("");
      await page.getByLabel("限制 1 截止时间").fill("2099-01-01T10:00");
      for (const checkbox of await page.getByLabel(/^已核对：/).all()) await checkbox.check();
      await page.getByLabel(/^我确认逐项核对后的现实资料/).check(); await page.getByLabel(/^我了解提交内容/).check();
      await page.evaluate(() => { window.profileContinuation.failure = ""; }); await submitOrRetry(page);
      await page.getByRole("link", { name: "进入 People", exact: true }).waitFor();
      const requests = await page.evaluate(() => window.profileContinuation.requests);
      expect(JSON.parse(requests[1]).submissionKey).not.toBe(JSON.parse(requests[0]).submissionKey);
      expect(JSON.parse(requests[1]).realityContinuation.sourceRevision).toBe(4);
    });
  }, 60_000);
  it("offers an explicit saved-reality entry alongside blank intake on the new-situation page", async () => {
    await withMountedIntake(async page => {
      await page.evaluate(() => window.profileContinuation.open("scene"));
      await page.getByRole("heading", { name: "开始一个属于你的个人数字生命沙盘。" }).waitFor();
      expect(await page.getByRole("link", { name: "沿用我的现实资料", exact: true }).count()).toBe(1);
    });
  }, 30_000);

  for (const failure of ["network", "server", "invalid-success"]) {
    it(`locks all editable new-situation fields after an unknown ${failure} response`, async () => {
      await withMountedIntake(async page => {
        await fillNewSituation(page);
        await page.evaluate(() => { window.profileContinuation.failure = "network"; });
        if (failure === "server") await page.evaluate(() => { window.profileContinuation.failure = "server"; });
        if (failure === "invalid-success") await page.evaluate(() => { window.profileContinuation.failure = "invalid-success"; });
        await submitOrRetry(page);
        await page.waitForFunction(() => window.profileContinuation.requests.length === 1 && Boolean(document.querySelector('[role="status"]')?.textContent));
        const output = path.resolve("output/playwright/profile-continuation"); mkdirSync(output, { recursive: true });
        await page.screenshot({ path: path.join(output, `red-${failure}.png`), fullPage: true });
        expect(await page.getByRole("textbox", { name: /^Situation summary/ }).isDisabled()).toBe(true);
        expect(await page.getByRole("textbox", { name: /^Main question/ }).isDisabled()).toBe(true);
        expect(await page.getByLabel(/^我了解提交内容/).isDisabled()).toBe(true);
        expect(await page.getByRole("button", { name: "30 days", exact: true }).isDisabled()).toBe(true);
        expect(await page.getByRole("link", { name: "进入 People", exact: true }).count()).toBe(0);
      });
    }, 30_000);
  }

  it("replays the exact original complete body and submission key after a lost response", async () => {
    await withMountedIntake(async page => {
      await fillNewSituation(page);
      await submitOrRetry(page);
      await page.waitForFunction(() => window.profileContinuation.requests.length === 1 && Boolean(document.querySelector('[role="status"]')?.textContent));
      await page.evaluate(() => { window.profileContinuation.failure = ""; });
      await submitOrRetry(page);
      await page.waitForFunction(() => window.profileContinuation.requests.length === 2);
      const requests = await page.evaluate(() => window.profileContinuation.requests);
      expect(JSON.parse(requests[0]).draft.createdAt).toBeTruthy();
      expect(requests[1]).toBe(requests[0]);
      await page.getByRole("link", { name: "进入 People", exact: true }).waitFor();
    });
  }, 30_000);

  for (const authFailure of ["unauthorized", "forbidden"]) it(`retains unknown identity when an exact replay encounters ${authFailure} before receipt recovery`, async () => {
    await withMountedIntake(async page => {
      await fillNewSituation(page); await submitOrRetry(page);
      await page.waitForFunction(() => window.profileContinuation.requests.length === 1 && Boolean(document.querySelector('[role="status"]')?.textContent));
      if (authFailure === "unauthorized") await page.evaluate(() => { window.profileContinuation.failure = "unauthorized"; });
      else await page.evaluate(() => { window.profileContinuation.failure = "forbidden"; });
      await submitOrRetry(page);
      await page.waitForFunction(() => window.profileContinuation.requests.length === 2 && !Array.from(document.querySelectorAll('button')).some(button => button.textContent === '正在确认新处境'));
      expect(await page.getByRole("textbox", { name: /^Situation summary/ }).isDisabled()).toBe(true);
      await page.evaluate(() => { window.profileContinuation.failure = ""; }); await submitOrRetry(page);
      await page.waitForFunction(() => window.profileContinuation.requests.length === 3);
      const requests = await page.evaluate(() => window.profileContinuation.requests);
      expect(requests[2]).toBe(requests[0]);
    });
  }, 30_000);

  it("keeps an unsupported successful Seed receipt in unknown recovery", async () => {
    await withMountedIntake(async page => {
      await fillNewSituation(page);
      await page.evaluate(() => { window.profileContinuation.failure = "wrong-version"; });
      await submitOrRetry(page);
      await page.waitForFunction(() => window.profileContinuation.requests.length === 1 && Boolean(document.querySelector('[role="status"]')?.textContent));
      expect(await page.getByRole("link", { name: "进入 People", exact: true }).count()).toBe(0);
      expect(await page.getByRole("button", { name: "重试原处境提交", exact: true }).count()).toBe(1);
    });
  }, 30_000);
});
