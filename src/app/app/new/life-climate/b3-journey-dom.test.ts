import { createRequire } from "node:module";
import path from "node:path";
import { build } from "vite";
import { describe, expect, it } from "vitest";

// Browser mounts the existing production entry, not a missing proposed module.
const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {LifeClimateClient} from '@/app/app/new/life-climate/life-climate-client';import {createEmptyRealityProfileDraft} from '@/lib/reality-profile/profile';globalThis.React=React;window.fetch=async(url)=>new Response(JSON.stringify(String(url).includes('reality-profile')?{profile:createEmptyRealityProfileDraft(7)}:{items:[]}));createRoot(document.getElementById('root')).render(React.createElement(LifeClimateClient));`;
async function bundle() {
  const result = await build({ configFile: false, logLevel: "silent", resolve: { alias: { "@/components/language-provider": "virtual:language", "@": path.join(process.cwd(), "src"), "next/link": "virtual:link" } }, plugins: [{ name: "b3-entry-red", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:language") return "export function useLanguage(){return {locale:'zh'}}"; if (id === "\0virtual:link") return "import React from 'react';export default function Link(p){return React.createElement('a',p)}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife" } } } });
  const output = (Array.isArray(result) ? result[0] : result) as { output: Array<{ type: string; code: string }> };
  return output.output.find(item => item.type === "chunk")!.code;
}
describe("B3 full-life journey discoverability in real mounted Chrome", () => {
  for (const width of [375, 1280]) it(`offers the separate multi-domain journey while preserving legacy at ${width}px`, async () => {
    const { chromium } = createRequire(import.meta.url)("C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
    const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
    try {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors: string[] = [];
      page.on("pageerror", (error: Error) => errors.push(error.message));
      await page.setContent('<html><body><div id="root"></div></body></html>');
      await page.addScriptTag({ content: await bundle() });
      await page.getByRole("heading", { name: "长期人生气候路径", exact: true }).waitFor();
      expect(errors).toEqual([]);
      // This is the intended RED: existing working UI has no B3 journey entry.
      const entry = page.getByRole("link", { name: "多领域人生结构对照", exact: true });
      expect(await entry.count(), "A person must be able to discover baseline + two choices, 14-dimension review, explicit flows and saved-intent recovery without JSON").toBe(1);
      expect(await entry.getAttribute("href")).toBe("/app/new/life-climate/b3");
      expect(await page.getByRole("heading", { name: "搭建一条备选人生路径", exact: true }).count()).toBe(1);
    } finally { await browser.close(); }
  }, 30_000);
});
