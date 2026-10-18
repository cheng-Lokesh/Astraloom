import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRequire } from "node:module";
import path from "node:path";
import { build } from "vite";
import { expect, it } from "vitest";
import { ResultWorkbench } from "./result-workbench";

const runId = "60000000-0000-4000-8000-000000000001";
const step = (order: number, label: string) => ({ key: `step-${order}`, order, label, kind: "sandbox_simulation" as const, boundary: "simulation_step" as const, participantKeys: ["person-1"], relationshipKeys: [] });
const claim = (statement: string) => ({ key: "claim-1", statement, uncertainty: "仅在本次模拟假设成立时有参考意义", boundary: "conditional_claim" as const, stepKeys: ["step-1"], supportingStepKeys: ["step-1"], participantKeys: ["person-1"], relationshipKeys: [] });
const base = {
  participants: [{ key: "person-1", label: "本人", role: "scenario decision maker" as const }, { key: "person-2", label: "协作对象", role: "frozen participant" as const }], relationships: [],
  facts: [{ key: "fact-1", statement: "已明确可投入时间", boundary: "user_provided_fact" as const }], assumptions: [{ key: "assumption-1", statement: "假设对方能提供反馈", boundary: "system_assumption" as const }],
  realityProfile: { status: "not_recorded" as const, revision: null, facts: [], assumptions: [], unknowns: [], structuredResources: [], structuredConstraints: [], worldVariables: [] },
  resourceChanges: [], steps: [step(1, "准备材料"), step(2, "对方回应")], claims: [claim("主路径条件结论")],
};
const timeline = (prefix: string) => ({ version: "formal-simulation-timeline-v1" as const, samples: Array.from({ length: 3 }, (_, index) => ({
  key: `sample-${index + 1}`, terminalStatus: "completed" as const, ticks: [
    { tickIndex: 0, occurredAt: "2026-10-20T01:00:00.000Z", status: "event" as const, event: { stepKey: "step-1", label: `${prefix}样本${index + 1}准备材料`, kind: "resource" as const, participantKeys: ["person-1"], relationshipKeys: [], changes: [{ kind: "resource" as const, label: "学习时间", before: 8, after: 6, unit: "小时" }], causes: { priorStepKeys: [], factKeys: ["fact-1"], assumptionKeys: ["assumption-1"], unrecorded: false }, claimKeys: ["claim-1"] } },
    { tickIndex: 1, occurredAt: "2026-10-21T01:00:00.000Z", status: "event" as const, event: { stepKey: "step-2", label: `${prefix}样本${index + 1}对方回应`, kind: "relationship_response" as const, participantKeys: ["person-2"], relationshipKeys: [], changes: [{ kind: "relationship" as const, label: "协作回应", before: "neutral", after: "positive", unit: null }], causes: { priorStepKeys: ["step-1"], factKeys: [], assumptionKeys: ["assumption-1"], unrecorded: false }, claimKeys: [] } },
    { tickIndex: 2, occurredAt: null, status: "not_reached" as const, event: null },
  ],
})) });
const projection = { ...base, timeline: timeline("主路径"), strategyPaths: [{ key: "path-1", label: "先询问信息", projection: { ...base, claims: [claim("策略独立条件结论")], timeline: timeline("策略") } }] };

it("adds a per-world chronology to the existing result entry and labels historical absence honestly", () => {
  const html = renderToStaticMarkup(createElement(ResultWorkbench, { projection, runId }));
  expect(html).toContain("数字生命时间线");
  expect(html).toContain("主路径样本1准备材料");
  expect(html).not.toContain("主路径样本2准备材料");
  expect(html).toContain("模拟时间");
  expect(html).toContain("未到达此模拟周期");
  expect(html).not.toContain("等待触发");
  const legacy = renderToStaticMarkup(createElement(ResultWorkbench, { projection: base, runId }));
  expect(legacy).toContain("此历史运行未记录逐周期时间线");
  expect(legacy).toContain("准备材料");
});

it("distinguishes executed empty cycles and missing time from unreached cycles without invented state", () => {
  const emptyTimeline = { ...timeline("主路径"), samples: [{ key: "sample-1", terminalStatus: "no_actions" as const, ticks: [{ tickIndex: 0, occurredAt: null, status: "no_actions" as const, event: null }, { tickIndex: 1, occurredAt: null, status: "not_reached" as const, event: null }] }] };
  const html = renderToStaticMarkup(createElement(ResultWorkbench, { projection: { ...base, timeline: emptyTimeline }, runId }));
  expect(html).toContain("本周期未选中行动");
  expect(html).toContain("模拟时间未记录");
  expect(html).toContain("未到达此模拟周期");
  expect(html).not.toContain("等待触发");
});

it("reads JSON through the typed client, isolates paths/samples and resets expanded evidence at 375px", async () => {
  const require = createRequire(import.meta.url);
  const { chromium } = require(path.join(process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules", "playwright"));
  const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {ResultWorkbench} from '@/app/app/simulation/result/result-workbench';import {createFormalSandboxClient} from '@/lib/formal-sandbox/client';globalThis.React=React;
  window.timelineTest={requests:[],loaded:false};const projection=${JSON.stringify(projection)};
  window.fetch=async(url,init)=>{window.timelineTest.requests.push({url:String(url),method:init?.method??'GET'});if(String(url).endsWith('/result'))return new Response(JSON.stringify({ok:true,completed_at:'2026-10-19T01:00:00Z',projection}));return new Response(JSON.stringify({ok:false,error_code:'unavailable',trace_id:'test'}),{status:500})};
  createFormalSandboxClient().result('${runId}').then(result=>{if(!result.ok){document.getElementById('root').textContent='Client rejected result: '+result.errorCode;return}window.timelineTest.loaded=true;createRoot(document.getElementById('root')).render(React.createElement(ResultWorkbench,{projection:result.data.projection,runId:'${runId}'}))});`;
  const built = await build({ configFile: false, root: process.cwd(), logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/link": "virtual:link" } }, plugins: [{ name: "life-timeline-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "LifeTimeline" } } } });
  const bundle = (Array.isArray(built) ? built[0] : built) as { output: Array<{ type: string; code?: string }> };
  const browser = await chromium.launch({ executablePath: process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); page.setDefaultTimeout(5000);
    const errors: string[] = []; page.on("pageerror", (error: Error) => errors.push(error.message));
    await page.setContent('<html lang="zh"><style>body{margin:0;background:#101525;color:#f3f5fa;font-family:system-ui}#root{width:343px;padding:16px}input,select{box-sizing:border-box;max-width:100%;min-height:44px}button,summary,a{min-height:44px}section,fieldset,div{min-width:0;box-sizing:border-box}p{overflow-wrap:anywhere}</style><body><div id="root"></div></body></html>');
    await page.addScriptTag({ content: bundle.output.find(item => item.type === "chunk")!.code });
    await page.waitForFunction("window.timelineTest.loaded===true");
    const region = page.getByRole("region", { name: "数字生命时间线", exact: true });
    await region.waitFor();
    expect(await region.textContent()).toContain("主路径样本1准备材料");
    expect(await region.textContent()).not.toContain("主路径样本2准备材料");
    expect(await region.textContent()).toContain("学习时间：8 → 6 小时");
    expect(await region.textContent()).toContain("协作对象");
    await region.getByText("为什么出现这一步", { exact: true }).first().click();
    expect(await region.locator("details[open]").count()).toBe(1);
    expect(await region.locator("details[open]").textContent()).toContain("已明确可投入时间");
    await region.getByText("查看相关条件结论", { exact: true }).click();
    expect(await region.locator("details[open]").count()).toBe(2);
    expect(await region.locator("details[open]").last().textContent()).toContain("主路径条件结论");
    await region.getByLabel("采样世界", { exact: true }).selectOption("sample-2");
    expect(await region.locator("details[open]").count()).toBe(0);
    expect(await region.textContent()).toContain("主路径样本2准备材料");
    expect(await region.textContent()).not.toContain("主路径样本1准备材料");
    await region.getByLabel("模拟路径", { exact: true }).selectOption("path-1");
    expect(await region.getByLabel("采样世界", { exact: true }).inputValue()).toBe("sample-1");
    expect(await region.textContent()).toContain("策略样本1准备材料");
    expect(await region.textContent()).not.toContain("主路径样本2准备材料");
    await region.getByText("查看相关条件结论", { exact: true }).click();
    expect(await region.locator("details[open]").textContent()).toContain("策略独立条件结论");
    expect(await region.locator("details[open]").textContent()).not.toContain("主路径条件结论");
    expect(await region.getByText("反馈这条结论", { exact: false }).count()).toBe(0);
    expect(await region.getByRole("link", { name: "记录现实后来发生了什么", exact: true }).count()).toBe(0);
    await region.getByLabel("模拟路径", { exact: true }).selectOption("main");
    expect(await region.locator("details[open]").count()).toBe(0);
    expect(await region.getByRole("link", { name: "记录现实后来发生了什么", exact: true }).getAttribute("href")).toBe("#run-outcome-observations");
    const unreachable = region.getByRole("listitem").filter({ hasText: "未到达此模拟周期" });
    expect(await unreachable.textContent()).not.toContain("2026-");
    expect(await unreachable.textContent()).not.toContain("8 →");
    await region.getByLabel("模拟路径", { exact: true }).focus();
    expect(await region.getByLabel("模拟路径", { exact: true }).evaluate((element: HTMLElement) => element === document.activeElement)).toBe(true);
    expect(await region.getByLabel("模拟路径", { exact: true }).evaluate((element: HTMLElement) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate("document.documentElement.scrollWidth<=375")).toBe(true);
    expect(await region.innerText()).not.toMatch(/step-\d|claim-\d|person-\d|sample-\d/);
    expect(await page.evaluate("window.timelineTest.requests.filter(request=>request.method!=='GET').length")).toBe(0);
    expect(errors).toEqual([]);
  } finally { await browser.close(); }
}, 30000);
