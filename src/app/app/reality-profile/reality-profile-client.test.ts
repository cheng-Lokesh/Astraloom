import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { build } from "vite";
import path from "node:path";
import { createRequire } from "node:module";

import { RealityProfileClient } from "./reality-profile-client";

describe("Reality Profile editor", () => {
  it("renders each review field and keeps unknown as the honest initial state", () => {
    const html = renderToStaticMarkup(createElement(RealityProfileClient));

    expect(html).toContain("生活气候");
    expect(html).toContain("资源");
    expect(html).toContain("限制");
    expect(html).toContain("目标");
    expect(html).toContain("价值观");
    expect(html).toContain("人生主题");
    expect(html).toContain("压力");
    expect(html).toContain("外部变量");
    expect(html).toContain("长期生命结构");
    expect(html).toContain("身份结构");
    expect(html).toContain("职业结构");
    expect(html).toContain("财富结构");
    expect(html).toContain("关系生态");
    expect(html).toContain("城市与生活环境");
    expect(html).toContain("人生阶段");
    expect(html).toContain("用于推演的结构化资源");
    expect(html).toContain("新增结构化资源");
    expect(html).toContain("每次受控行动的资源变化量");
    expect(html).toContain("明确未知");
    expect(html).toContain("保存当前正式链资料");
    expect(html).toContain("disabled");
  });
});

it("offers model review only after a successful Reality save and clears that success entry on a failed save", async () => {
  const require = createRequire(import.meta.url);
  const { chromium } = require(path.join(process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules", "playwright"));
  const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {RealityProfileClient} from '@/app/app/reality-profile/reality-profile-client';import {createEmptyRealityProfileDraft} from '@/lib/reality-profile/profile';globalThis.React=React;window.profileTest={fail:true};window.fetch=async(url,init)=>{if(init?.method==='PUT'&&window.profileTest.fail)return new Response(JSON.stringify({error_code:'persistence_failed'}),{status:500});return new Response(JSON.stringify({profile:createEmptyRealityProfileDraft()}))};createRoot(document.getElementById('root')).render(React.createElement(RealityProfileClient));`;
  const built = await build({ configFile: false, root: process.cwd(), logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/link": "virtual:link" } }, plugins: [{ name: "reality-continuation-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "RealityContinuation" } } } });
  const bundle = (Array.isArray(built) ? built[0] : built) as { output: Array<{ type: string; code?: string }> };
  const browser = await chromium.launch({ executablePath: process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); page.setDefaultTimeout(4000);
    await page.setContent('<html lang="zh"><body><div id="root"></div></body></html>');
    await page.addScriptTag({ content: bundle.output.find(item => item.type === "chunk")!.code });
    const link = page.getByRole("link", { name: "核对并继续调整行动模型", exact: true });
    expect(await link.count()).toBe(0);
    await page.getByRole("button", { name: "保存当前正式链资料", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "保存未完成" }).waitFor(); expect(await link.count()).toBe(0);
    await page.evaluate("window.profileTest.fail=false");
    await page.getByRole("button", { name: "保存当前正式链资料", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "已保存到当前正式链" }).waitFor();
    expect(await link.count()).toBe(1); expect(await link.getAttribute("href")).toBe("/app/start?model_draft=current");
    await page.evaluate("window.profileTest.fail=true");
    await page.getByRole("button", { name: "保存当前正式链资料", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "保存未完成" }).waitFor(); expect(await link.count()).toBe(0);
  } finally { await browser.close(); }
}, 60_000);
