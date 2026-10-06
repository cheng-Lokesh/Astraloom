import path from "node:path";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "vite";
import { expect, it } from "vitest";
import { buildSymbolicFrame } from "@/lib/formal-symbolic-lens/frame";
import { FrozenSymbolicResult } from "./frozen-symbolic-result";

const frame = buildSymbolicFrame({ birthDate: "1991-06-15", birthTime: null }, 2, "2026-09-06T00:00:00Z");
const attached = { status: "attached" as const, frozenAt: "2026-09-06T00:00:00Z", preferenceRevision: 3, frame, causalUse: false as const };
it("renders all five frozen dimensions and calculation limits as a separate symbolic region", () => {
  const html = renderToStaticMarkup(createElement(FrozenSymbolicResult, { lens: attached }));
  expect(html).toContain("本次冻结的象征对照");
  expect(html).toContain('aria-labelledby="frozen-symbolic-title"');
  expect(html).toContain("2026-09");
  expect(html).toContain("来源版本：2");
  expect(html).toContain(frame.ruleVersion);
  expect(html).toContain(frame.calculation.calculationVersion);
  expect(html).toContain("出生时刻未知");
  expect(html).toContain("不参与人物行动、世界状态、事件证据、结论或模拟频率");
  expect(html).toContain("尚未融合初始倾向");
  for (const dimension of frame.dimensions) for (const text of [dimension.label, dimension.value, dimension.summary, ...dimension.limitations]) expect(html).toContain(text);
  expect(html).not.toMatch(/1991-06-15|natal_stem_counts|initial_tendency|sourceRefs/);
});
it.each([
  ["not_recorded", "当时未保存个人象征框架"], ["not_configured", "当时尚未配置象征框架"],
  ["not_authorized", "当时未授权新运行保存象征对照"], ["stale", "当时的框架属于旧参考时期"],
  ["withdrawn", "当时已撤回授权"],
] as const)("explains %s without filling history from current preferences", (status, message) => {
  const html = renderToStaticMarkup(createElement(FrozenSymbolicResult, { lens: { ...attached, status, frame: null } }));
  expect(html).toContain(message);
  expect(html).toContain("不会用当前配置补写本次运行");
  expect(html).not.toContain("初始倾向</dt>");
});
it("does not label an absent frame attached", () => {
  const html = renderToStaticMarkup(createElement(FrozenSymbolicResult, { lens: { ...attached, frame: null } }));
  expect(html).not.toContain("已附加五维框架");
});

const runtime = process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const executablePath = process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
type Page = { setContent(value: string): Promise<void>; addScriptTag(value: { content: string }): Promise<void>; waitForFunction(fn: () => boolean): Promise<void>; evaluate<T>(fn: () => T): Promise<T> };
it.skipIf(!existsSync(path.join(runtime, "playwright")) || !existsSync(executablePath))("real result page reads the async Run projection only, keeping an older frozen period", async () => {
  const projection = { participants: [], relationships: [], facts: [], assumptions: [], steps: [], claims: [], realityProfile: { status: "not_recorded", revision: null, facts: [], assumptions: [], unknowns: [], structuredResources: [], structuredConstraints: [], worldVariables: [] }, resourceChanges: [], symbolicLens: attached };
  const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import ResultPage from '@/app/app/simulation/result/page';globalThis.React=React;window.resultReadPaths=[];window.fetch=async(url,init)=>{window.resultReadPaths.push(String(url));await new Promise(resolve=>setTimeout(resolve,20));return new Response(JSON.stringify({ok:true,completed_at:null,projection:${JSON.stringify(projection)}}))};createRoot(document.getElementById('root')).render(React.createElement(ResultPage));`;
  const output = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/link": "virtual:link", "next/navigation": "virtual:navigation", "@/components/app-shell": "virtual:shell" } }, plugins: [{ name: "fixture", resolveId(id) { if(id.startsWith("virtual:"))return `\0${id}`; }, load(id) { if(id === "\0virtual:fixture")return fixture; if(id === "\0virtual:link")return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; if(id === "\0virtual:shell")return "export function AppShell({children}){return children}"; if(id === "\0virtual:navigation")return "export function useSearchParams(){return {get:()=> '00000000-0000-4000-8000-000000000001'}}"; } }], build: { write:false, minify:false, rollupOptions:{input:"virtual:fixture",output:{format:"iife",name:"Fixture"}} } });
  const bundle=(Array.isArray(output)?output[0]:output) as { output:Array<{type:string;code?:string}> };
  const {chromium}=createRequire(import.meta.url)(path.join(runtime,"playwright")) as {chromium:{launch(input:unknown):Promise<{newPage():Promise<Page>;close():Promise<void>}>}};
  const browser=await chromium.launch({executablePath,headless:true});
  try {
    const page=await browser.newPage();await page.setContent('<html lang="zh"><body><div id="root"></div></body></html>');await page.addScriptTag({content:bundle.output.find(item=>item.type==="chunk")!.code!});
    await page.waitForFunction(()=>Boolean(document.getElementById('frozen-symbolic-title')));
    const result=await page.evaluate(()=>({text:document.body.textContent??"",regions:document.querySelectorAll('[data-frozen-symbolic]').length,paths:(window as unknown as {resultReadPaths:string[]}).resultReadPaths}));
    expect(result.regions).toBe(1);expect(result.text).toContain("2026-09");expect(result.text).not.toContain("2026-10");
    expect(result.paths).toHaveLength(1);expect(result.paths[0]).toMatch(/^\/api\/sandbox\/runs\/[^/]+\/result$/);expect(result.paths).not.toContain('/api/symbolic-lens');
    expect(result.text).not.toMatch(/1991-06-15|natal_stem_counts|00000000-0000/);
  } finally {await browser.close();}
},30_000);
