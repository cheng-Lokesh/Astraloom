import { createRequire } from "node:module";
import path from "node:path";
import { build } from "vite";
import { beforeAll, describe, expect, it } from "vitest";

const runtime = process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const executablePath = process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
type Probe = {
  locale: string;
  label: string;
  render(): void;
  walk(): void;
  settle(): Promise<void>;
  originalNode: Node;
  events: Array<{ old: string | null; next: string | null }>;
};
declare global { interface Window { localizedRegression: Probe } }
type Page = {
  setContent(html: string): Promise<void>;
  addScriptTag(input: { content: string }): Promise<void>;
  evaluate<T>(fn: () => T | Promise<T>): Promise<T>;
};
type Browser = { newPage(): Promise<Page>; close(): Promise<void> };

const fixture = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {LocalizedTextLayer,translateLocalizedAppText} from '@/components/localized-text-layer';
const state=window.localizedRegression={locale:'zh',label:'读取已保存资料…',events:[]};
const root=createRoot(document.getElementById('root'));
function Fixture(){return React.createElement(React.Fragment,null,
 React.createElement('main',{'data-localized-app-root':true},
  React.createElement('p',{id:'status',role:'status'},state.label),
  React.createElement('button',{id:'action','aria-label':state.label,title:state.label},state.label),
  React.createElement('input',{id:'input',placeholder:state.label,defaultValue:'Save'}),
  React.createElement('textarea',{id:'textarea',defaultValue:'Save'}),
  React.createElement('p',{id:'optout','data-no-localize':true},'Save'),
  React.createElement('section',{'data-localize':'off'},React.createElement('p',{id:'off'},'Save')),
  React.createElement('p',{id:'mixed'},React.createElement('span',null,'prefix'),state.label)),
 React.createElement(LocalizedTextLayer));}
state.render=()=>flushSync(()=>root.render(React.createElement(Fixture)));
state.walk=()=>translateLocalizedAppText(document.querySelector('main'),state.locale);
state.settle=async()=>{for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)};
state.render();
state.originalNode=document.getElementById('status').firstChild;
new MutationObserver(records=>{for(const record of records)if(record.type==='characterData'&&record.target===state.originalNode)state.events.push({old:record.oldValue,next:record.target.nodeValue})}).observe(document.querySelector('main'),{subtree:true,characterData:true,characterDataOldValue:true});
`;

let bundle = "";
beforeAll(async () => {
  const built = await build({
    configFile: false, logLevel: "silent",
    resolve: { alias: { "@/components/language-provider": "virtual:language", "@": path.join(process.cwd(), "src") } },
    plugins: [{ name: "localized-regression-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) {
      if (id === "\0virtual:fixture") return fixture;
      if (id === "\0virtual:language") return "export function useLanguage(){return {displayLocale:window.localizedRegression.locale}}";
    } }],
    build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "LocalizedRegressionFixture" } } },
  });
  bundle = ((Array.isArray(built) ? built[0] : built) as { output: Array<{ type: string; code?: string }> }).output.find(item => item.type === "chunk")!.code!;
});

async function mounted(run: (page: Page) => Promise<void>) {
  const { chromium } = createRequire(import.meta.url)(path.join(runtime, "playwright")) as { chromium: { launch(options: unknown): Promise<Browser> } };
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<html><body><div id="root"></div></body></html>');
    await page.addScriptTag({ content: bundle });
    await page.evaluate(() => window.localizedRegression.settle());
    await run(page);
  } finally { await browser.close(); }
}

describe("mounted localization preserves current React state", () => {
  it("keeps same-node loading, error, saved and unknown retry labels after observer walks", async () => {
    await mounted(async page => {
      const sequence = await page.evaluate(async () => {
        const state = window.localizedRegression;
        const samples = [];
        for (const label of ['无法读取资料。请确认已登录并已提交正式 Seed 后重试。', '资料已保存。', '未知重试状态 · attempt 2', '读取已保存资料…']) {
          state.label = label; state.render();
          const immediate = document.getElementById('status')!.textContent;
          await state.settle();
          samples.push({ label, immediate, settled: document.getElementById('status')!.textContent, sameNode: document.getElementById('status')!.firstChild === state.originalNode, mixed: document.getElementById('mixed')!.lastChild!.textContent });
        }
        return { samples, mutations: state.events };
      });
      console.info("localized same-node mutation sequence", JSON.stringify(sequence));
      for (const sample of sequence.samples) {
        expect(sample.sameNode).toBe(true);
        expect(sample.immediate).toBe(sample.label);
        expect(sample.settled).toBe(sample.label);
        expect(sample.mixed).toBe(sample.label);
      }
    });
  }, 30_000);

  it("keeps dynamic aria-label, title and placeholder including removed and re-added attributes", async () => {
    await mounted(async page => {
      const samples = await page.evaluate(async () => {
        const state = window.localizedRegression;
        const result = [];
        for (const label of ['无法读取资料。', '资料已保存。', 'unknown retry', '']) {
          state.label = label; state.render(); await state.settle();
          result.push({ label, aria: document.getElementById('action')!.getAttribute('aria-label'), title: document.getElementById('action')!.getAttribute('title'), placeholder: document.getElementById('input')!.getAttribute('placeholder') });
        }
        document.getElementById('action')!.removeAttribute('title'); state.walk();
        document.getElementById('action')!.setAttribute('title','重新读取当前资料'); await state.settle();
        return { result, readded: document.getElementById('action')!.getAttribute('title') };
      });
      for (const sample of samples.result) {
        expect(sample.aria).toBe(sample.label); expect(sample.title).toBe(sample.label); expect(sample.placeholder).toBe(sample.label);
      }
      expect(samples.readded).toBe('重新读取当前资料');
    });
  }, 30_000);

  it("retains updated originals across language switches and repeated walks without translation drift", async () => {
    await mounted(async page => {
      const result = await page.evaluate(async () => {
        const state = window.localizedRegression;
        state.label = 'Save'; state.locale = 'ja'; state.render(); await state.settle();
        const first = document.getElementById('status')!.textContent;
        for (let i = 0; i < 5; i++) state.walk();
        const repeated = document.getElementById('status')!.textContent;
        state.locale = 'en'; state.render(); await state.settle();
        const restored = document.getElementById('status')!.textContent;
        state.label = 'Edit'; state.render(); await state.settle();
        state.locale = 'ja'; state.render(); await state.settle();
        const updated = { text: document.getElementById('status')!.textContent, aria: document.getElementById('action')!.getAttribute('aria-label'), title: document.getElementById('action')!.getAttribute('title'), placeholder: document.getElementById('input')!.getAttribute('placeholder') };
        state.locale = 'zh'; state.render(); await state.settle();
        return { first, repeated, restored, updated, latestOriginal: document.getElementById('status')!.textContent };
      });
      expect(result.first).toBe('保存'); expect(result.repeated).toBe('保存'); expect(result.restored).toBe('Save');
      expect(result.updated).toEqual({ text: '編集', aria: '編集', title: '編集', placeholder: '編集' });
      expect(result.latestOriginal).toBe('Edit');
    });
  }, 30_000);

  it("preserves untranslated updates, opt-out text and input/textarea user values", async () => {
    await mounted(async page => {
      const result = await page.evaluate(async () => {
        const state = window.localizedRegression;
        (document.getElementById('input') as HTMLInputElement).value = 'Save private draft';
        (document.getElementById('textarea') as HTMLTextAreaElement).value = 'Cancel private draft';
        state.label = '未知项 🌱 retry-3'; state.locale = 'ja'; state.render(); await state.settle();
        for (let i = 0; i < 6; i++) state.walk();
        return { text: document.getElementById('status')!.textContent, optout: document.getElementById('optout')!.textContent, off: document.getElementById('off')!.textContent, input: (document.getElementById('input') as HTMLInputElement).value, textarea: (document.getElementById('textarea') as HTMLTextAreaElement).value };
      });
      expect(result).toEqual({ text: '未知项 🌱 retry-3', optout: 'Save', off: 'Save', input: 'Save private draft', textarea: 'Cancel private draft' });
    });
  }, 30_000);
});
