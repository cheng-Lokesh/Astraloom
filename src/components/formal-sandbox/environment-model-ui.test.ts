import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "vite";
import path from "node:path";
import { createRequire } from "node:module";
import { ModelRulesDraftEditor } from "./model-rule-revision";
import { emptyEditorDraft } from "./digital-life-rules-editor";
import { FrozenEnvironmentConditions } from "@/app/app/simulation/result/frozen-environment-conditions";
import type { FormalSandboxResultProjection } from "@/lib/formal-sandbox/client";
import { saveDigitalLifeModelDraftSchema } from "@/lib/digital-life/model-draft";
import { addDraftAction, confirmedDraftRules, normalizeDraftForSave, previewDraftRemoval, removeDraftSelection, setDraftActionConfirmation, updateDraftAction, validateRevisionDraft, type DraftSource, type RevisionDraft } from "./model-rule-draft-operations";

const context = { graphSnapshotId: "30000000-0000-4000-8000-000000000001", agentSnapshotId: "40000000-0000-4000-8000-000000000001", profileRevision: 2,
  agents: [{ key: "person-1", label: "本人", role: "user_core" as const }, { key: "person-2", label: "协作对象", role: "npc" as const }, { key: "person-3", label: "谨慎分身", role: "user_variant" as const }], relationships: [], resources: [],
  variables: [{ key: "external-variable-1", category: "external_variable" as const, label: "招聘条件", value: "岗位开放", classification: "fact" as const, evidenceSummary: "本人记录" }] };
const source: DraftSource = { modelContext: context, horizonDays: 30 };
const empty: RevisionDraft = { version: "digital-life-rules-v1", graphSnapshotId: context.graphSnapshotId, agentSnapshotId: context.agentSnapshotId, profileRevision: 2, actions: [], strategies: [] };
const editor = { ...emptyEditorDraft, actorKey: "person-1", operation: "update_external_variable" as const, variableKey: "external-variable-1", text: "岗位暂缓", evidenceSummary: "比较环境变化的假设", confirmed: true };

describe("environment model UI", () => {
  it("retains explicitly prepared v2 for ordinary actions and after removing the last environment condition", () => {
    const v2: RevisionDraft = { ...empty, version: "digital-life-rules-v2" };
    const ordinary = { ...emptyEditorDraft, actorKey: "person-1", operation: "update_commitment" as const, text: "准备沟通材料", evidenceSummary: "本人准备条件", confirmed: true };
    const added = addDraftAction(source, v2, ordinary); expect(added.ok).toBe(true); if (!added.ok) return;
    expect(added.draft.version).toBe("digital-life-rules-v2");
    const normalized = normalizeDraftForSave(source, added.draft);
    expect(saveDigitalLifeModelDraftSchema.safeParse({ version: "digital-life-model-draft-v2", expectedRevision: 2, idempotencyKey: "50000000-0000-4000-8000-000000000001", horizonDays: 30, sourceContext: { version: "digital-life-model-draft-source-v2", signature: "b".repeat(64), modelContext: context }, draftRules: normalized }).success).toBe(true);
    const environment = addDraftAction(source, v2, editor); expect(environment.ok).toBe(true); if (!environment.ok) return;
    const removed = removeDraftSelection(source, environment.draft, { kind: "action", key: environment.draft.actions[0].key }, true); expect(removed.ok).toBe(true); if (!removed.ok) return;
    const afterRemoval = addDraftAction(source, removed.draft, ordinary); expect(afterRemoval.ok && afterRemoval.draft.version).toBe("digital-life-rules-v2");
    const legacy = addDraftAction(source, empty, ordinary); expect(legacy.ok && legacy.draft.version).toBe("digital-life-rules-v1");
  });
  it("rejects baseline-equal environment values at add, confirmation, normalized Save and confirmed Run gates while keeping edits recoverable", () => {
    expect(addDraftAction(source, { ...empty, version: "digital-life-rules-v2" }, { ...editor, text: "岗位开放" }).ok).toBe(false);
    const added = addDraftAction(source, { ...empty, version: "digital-life-rules-v2" }, editor); expect(added.ok).toBe(true); if (!added.ok) return;
    const edited = updateDraftAction(source, added.draft, added.draft.actions[0].key, { operation: { actionType: "update_external_variable", variableKey: "external-variable-1", value: " 岗位开放 " } });
    expect(edited.ok).toBe(true); if (!edited.ok) return;
    expect(validateRevisionDraft(source, edited.draft).ok).toBe(false);
    expect(setDraftActionConfirmation(source, edited.draft, "rule-1", true).ok).toBe(false);
    expect(normalizeDraftForSave(source, edited.draft)).toBeNull();
    expect(confirmedDraftRules(source, { ...edited.draft, actions: edited.draft.actions.map(action => ({ ...action, confirmedForSimulation: true })) })).toBeNull();
    const repaired = updateDraftAction(source, edited.draft, "rule-1", { operation: { actionType: "update_external_variable", variableKey: "external-variable-1", value: "岗位减少" } });
    expect(repaired.ok && validateRevisionDraft(source, repaired.draft).ok).toBe(true);
  });
  it("adds a typed environment condition as v2, saves it unchecked, and rejects a second condition in the path", () => {
    const added = addDraftAction(source, empty, editor);
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.draft.version).toBe("digital-life-rules-v2");
    expect(added.draft.actions[0].operation).toEqual({ actionType: "update_external_variable", variableKey: "external-variable-1", value: "岗位暂缓" });
    expect(normalizeDraftForSave(source, added.draft)?.actions[0].confirmedForSimulation).toBe(false);
    expect(addDraftAction(source, added.draft, editor).ok).toBe(false);
    const bad = updateDraftAction(source, added.draft, added.draft.actions[0].key, { operation: { actionType: "update_external_variable", variableKey: "external-variable-2", value: "岗位暂缓" } });
    expect(bad.ok && validateRevisionDraft(source, bad.draft).ok).toBe(false);
  });
  it("shows registered initial values, explicit assumption boundary and scheduling limitation, including in disabled stale review", () => {
    const draft: RevisionDraft = { ...empty, version: "digital-life-rules-v2", actions: [{ key: "rule-1", pathKey: "main", actorKey: "person-1", when: { kind: "at_tick", tickIndex: 2 }, operation: { actionType: "update_external_variable", variableKey: "external-variable-1", value: "岗位暂缓" }, classification: "assumption", confirmedForSimulation: false, evidenceSummary: "比较环境变化的假设" }] };
    const draftRules = { ...draft, actions: draft.actions.map(action => ({ ...action, confirmedForSimulation: false as const })), strategies: [] };
    const html = renderToStaticMarkup(createElement(ModelRulesDraftEditor, { source: { ...source, draftRules }, currentModel: true, disabled: true, onChange: vi.fn() }));
    expect(html).toContain("环境条件假设");
    expect(html).toContain("岗位开放");
    expect(html).toContain("假设的新条件");
    expect(html).toContain("不代表控制现实");
    expect(html).toContain("可能未到达");
    expect(html).toContain("<fieldset disabled=");
  });
  it("invalidates dependent confirmations and explicitly cascades removal of an environment condition", () => {
    const added = addDraftAction(source, empty, editor); expect(added.ok).toBe(true); if (!added.ok) return;
    const draft: RevisionDraft = { ...added.draft, actions: [{ ...added.draft.actions[0], confirmedForSimulation: true }, { key: "rule-2", pathKey: "main", actorKey: "person-1", when: { kind: "after_rule", ruleKey: added.draft.actions[0].key }, operation: { actionType: "update_commitment", commitmentKey: "commitment-2", label: "准备另一方案", status: "planned" }, classification: "assumption", confirmedForSimulation: true, evidenceSummary: "环境变化后的模拟行动" }] };
    const changed = updateDraftAction(source, draft, draft.actions[0].key, { operation: { actionType: "update_external_variable", variableKey: "external-variable-1", value: "岗位减少" } });
    expect(changed.ok && changed.draft.actions.every(action => !action.confirmedForSimulation)).toBe(true);
    expect(previewDraftRemoval(draft, { kind: "action", key: draft.actions[0].key }).actionKeys).toEqual(["rule-1", "rule-2"]);
    expect(removeDraftSelection(source, draft, { kind: "action", key: "rule-1" }, false).ok).toBe(false);
    const removed = removeDraftSelection(source, draft, { kind: "action", key: "rule-1" }, true);
    expect(removed.ok && removed.draft.actions.length).toBe(0);
    const npc = addDraftAction(source, empty, { ...editor, actorKey: "person-2" }); expect(npc.ok).toBe(false);
  });
  it("shows actual environment values only for selected samples with their own saved event steps", () => {
    const condition = { key: "environment-condition-1", ruleKey: "rule-1", pathKey: "main", variableKey: "external-variable-1", label: "招聘条件", initialValue: "岗位开放", initialClassification: "fact", proposedValue: "岗位减少", boundary: "confirmed_simulation_assumption", samples: [{ key: "sample-1", state: "selected", stepKey: "step-1", actualValue: "已触发值", successorStepKeys: ["step-2"] }, { key: "sample-2", state: "not_selected", stepKey: null, actualValue: "不应显示的候选实际值", successorStepKeys: [] }, { key: "sample-3", state: "not_reached", stepKey: null, actualValue: null, successorStepKeys: [] }] };
    const projection = { environmentConditions: [condition], steps: [{ key: "step-1", order: 1 }, { key: "step-2", order: 2 }] } as unknown as FormalSandboxResultProjection;
    const html = renderToStaticMarkup(createElement(FrozenEnvironmentConditions, { projection }));
    expect(html).toContain("已触发值"); expect(html).toContain("后继模拟步骤：2"); expect(html).toContain("指定模拟周期未到达"); expect(html).toContain("条件候选未被选中");
    expect(html).not.toContain("不应显示的候选实际值"); expect(html).not.toContain("rule-1"); expect(html).not.toContain("external-variable-1");
    const isolated = renderToStaticMarkup(createElement(FrozenEnvironmentConditions, { projection: { ...projection, environmentConditions: [{ ...projection.environmentConditions![0], samples: projection.environmentConditions![0].samples.map(sample => ({ ...sample, state: "not_triggered", actualValue: null, stepKey: null })) }] } }));
    expect(isolated).not.toContain("已触发值"); expect(isolated).toContain("前置条件未触发");
  });
});

it("upgrades a legacy source explicitly, edits environment rules and replays exact Save and Run requests at 375px", async () => {
  const require = createRequire(import.meta.url);
  const { chromium } = require(path.join(process.env.CODEX_BROWSER_MODULES ?? "C:/Users/clf04/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules", "playwright"));
  const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import {FormalRunStarter} from '@/components/formal-sandbox/run-starter';globalThis.React=React;
  const context=${JSON.stringify(context)};const {variables,...legacy}=context;const sourceContext={signature:'a'.repeat(64),modelContext:legacy};const preparedSourceContext={version:'digital-life-model-draft-source-v2',signature:'b'.repeat(64),modelContext:context};
  let draft={version:'digital-life-model-draft-v1',status:'current',currentRevision:2,horizonDays:30,sourceContext,currentSourceContext:sourceContext,draftRules:${JSON.stringify(empty)}};
  if(globalThis.staleEnvironment){draft={...draft,status:'stale',sourceContext:{...sourceContext,modelContext:{...legacy,profileRevision:1}},draftRules:{...draft.draftRules,profileRevision:1,actions:[{key:'rule-1',pathKey:'main',actorKey:'person-1',when:{kind:'at_tick',tickIndex:0},operation:{actionType:'update_commitment',commitmentKey:'commitment-1',label:'旧来源专属行动',status:'planned'},classification:'assumption',confirmedForSimulation:false,evidenceSummary:'旧来源条件'}]}}}
  window.environmentTest={saves:[],runs:[],failSave:true,failRun:true,navigated:'',prepares:0};let uuid=20;Object.defineProperty(crypto,'randomUUID',{value:()=>'50000000-0000-4000-8000-'+String(uuid++).padStart(12,'0')});
  window.fetch=async(url,init)=>{url=String(url);const result=data=>new Response(JSON.stringify({ok:true,...data}));if(url.includes('model-context'))return result({context});if(url.includes('model-draft')){if(url.includes('prepare_version')){window.environmentTest.prepares++;return result({draft,preparedSourceContext})}if(!init?.body)return result({draft});const input=JSON.parse(init.body);window.environmentTest.saves.push(input);if(window.environmentTest.failSave)return new Response(JSON.stringify({ok:false,error_code:'persistence_failed'}),{status:500});draft={...draft,version:input.version,currentRevision:3,sourceContext:input.sourceContext,currentSourceContext:input.sourceContext,draftRules:input.draftRules};return result({draft,idempotent:true})}if(url.includes('planning-context')||url.includes('calibration-context'))return new Response(JSON.stringify({ok:false,error_code:'unavailable'}),{status:500});if(url==='/api/sandbox/runs'){window.environmentTest.runs.push(JSON.parse(init.body));if(window.environmentTest.failRun)return new Response(JSON.stringify({ok:false,error_code:'persistence_failed'}),{status:500});return result({idempotent:true,run:{id:'60000000-0000-4000-8000-000000000001',status:'completed'}})}throw Error('unexpected request')};createRoot(document.getElementById('root')).render(React.createElement(FormalRunStarter,{currentDraftMode:true}));`;
  const built = await build({ configFile: false, root: process.cwd(), logLevel: "silent", resolve: { alias: { "@": path.join(process.cwd(), "src"), "next/navigation": "virtual:navigation", "next/link": "virtual:link" } }, plugins: [{ name: "environment-ui-fixture", resolveId(id) { if (id.startsWith("virtual:")) return `\0${id}`; }, load(id) { if (id === "\0virtual:fixture") return fixture; if (id === "\0virtual:navigation") return "export function useRouter(){return {push:url=>window.environmentTest.navigated=url}}"; if (id === "\0virtual:link") return "import React from 'react';export default function Link(props){return React.createElement('a',props)}"; } }], build: { write: false, minify: false, rollupOptions: { input: "virtual:fixture", output: { format: "iife", name: "EnvironmentModel" } } } });
  const bundle = (Array.isArray(built) ? built[0] : built) as { output: Array<{ type: string; code?: string }> };
  const browser = await chromium.launch({ executablePath: process.env.CODEX_BROWSER_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); page.setDefaultTimeout(5000);
    const errors: string[] = []; page.on("pageerror", (error: Error) => errors.push(error.message));
    await page.setContent('<html lang="zh"><style>body{margin:0;background:#101525;color:#f3f5fa;font-family:system-ui}#root{width:343px;padding:16px}input,select{box-sizing:border-box;max-width:100%;min-height:44px}button{min-height:44px}label{display:block}section,fieldset,div{min-width:0;box-sizing:border-box}fieldset{margin:0;width:100%}input[type=checkbox]{width:20px}p{overflow-wrap:anywhere}</style><body><div id="root"></div></body></html>');
    await page.addScriptTag({ content: bundle.output.find(item => item.type === "chunk")!.code });
    await page.getByRole("button", { name: "在当前资料上配置环境条件", exact: true }).click();
    await page.getByLabel("新增行动人物").selectOption("person-1");
    await page.getByLabel("新增行动类型").selectOption("update_external_variable");
    await page.getByLabel(/^新增环境条件/).selectOption("external-variable-1");
    await page.getByLabel("新增假设的新条件").fill("岗位开放");
    await page.getByLabel("新增行动模拟周期").selectOption("2");
    await page.getByLabel("新增行动来源与假设说明").fill("比较招聘变化的条件");
    await page.getByLabel("我独立确认将这条模拟假设加入草稿").check();
    await page.getByRole("button", { name: "添加行动规则", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "新环境条件与原值相同" }).waitFor();
    expect(await page.getByLabel("假设的新条件", { exact: true }).count()).toBe(0);
    await page.getByLabel("新增假设的新条件").fill("岗位暂缓");
    await page.getByLabel("我独立确认将这条模拟假设加入草稿").check();
    await page.getByRole("button", { name: "添加行动规则", exact: true }).click();
    await page.getByLabel("假设的新条件", { exact: true }).fill("");
    expect(await page.getByRole("button", { name: "开始 30 天运行", exact: true }).isDisabled()).toBe(true);
    await page.getByLabel("假设的新条件", { exact: true }).fill("岗位开放");
    await page.getByLabel("我重新确认行动 1 的模拟假设").check();
    expect(await page.getByLabel("我重新确认行动 1 的模拟假设").isChecked()).toBe(false);
    await page.getByRole("button", { name: "保存当前模型草稿", exact: true }).click();
    expect(await page.evaluate("window.environmentTest.saves.length")).toBe(0);
    expect(await page.getByRole("button", { name: "开始 30 天运行", exact: true }).isDisabled()).toBe(true);
    await page.getByLabel("假设的新条件", { exact: true }).fill("岗位减少");
    await page.getByRole("button", { name: "保存当前模型草稿", exact: true }).click();
    await page.getByRole("button", { name: "恢复原草稿保存请求", exact: true }).waitFor();
    expect(await page.getByLabel("假设的新条件", { exact: true }).isDisabled()).toBe(true);
    await page.evaluate("window.environmentTest.failSave=false");
    await page.getByRole("button", { name: "恢复原草稿保存请求", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "模型草稿版本 3 已保存。尚未开始运行" }).waitFor();
    const saved = await page.evaluate("window.environmentTest.saves");
    expect(saved[0]).toEqual(saved[1]); expect(saved[0].version).toBe("digital-life-model-draft-v2");
    expect(saved[0].sourceContext.version).toBe("digital-life-model-draft-source-v2");
    expect(saved[0].draftRules.actions[0].confirmedForSimulation).toBe(false);
    expect(await page.getByLabel("我重新确认行动 1 的模拟假设").isChecked()).toBe(false);
    await page.getByLabel("我重新确认行动 1 的模拟假设").check();
    await page.getByRole("button", { name: "开始 30 天运行", exact: true }).click();
    await page.getByRole("button", { name: "恢复原运行请求", exact: true }).waitFor();
    expect(await page.getByLabel("假设的新条件", { exact: true }).isDisabled()).toBe(true);
    await page.evaluate("window.environmentTest.failRun=false");
    await page.getByRole("button", { name: "恢复原运行请求", exact: true }).click();
    await page.waitForFunction("Boolean(window.environmentTest.navigated)");
    const runs = await page.evaluate("window.environmentTest.runs");
    expect(runs[0]).toEqual(runs[1]); expect(runs[0].digital_life_rules.version).toBe("digital-life-rules-v2");
    expect(runs[0].digital_life_rules.actions[0].operation.value).toBe("岗位减少");
    expect(await page.evaluate("document.documentElement.scrollWidth<=375")).toBe(true);
    expect(errors).toEqual([]);
    const stalePage = await browser.newPage({ viewport: { width: 375, height: 812 } }); stalePage.setDefaultTimeout(5000);
    await stalePage.setContent('<html lang="zh"><body><div id="root"></div></body></html>');
    await stalePage.addScriptTag({ content: "globalThis.staleEnvironment=true" });
    await stalePage.addScriptTag({ content: bundle.output.find(item => item.type === "chunk")!.code });
    await stalePage.getByLabel("本人承诺内容", { exact: true }).waitFor();
    expect(await stalePage.getByLabel("本人承诺内容", { exact: true }).isDisabled()).toBe(true);
    expect(await stalePage.getByRole("button", { name: "在当前资料上配置环境条件", exact: true }).count()).toBe(0);
    await stalePage.getByRole("button", { name: "为当前模型重新配置空草稿", exact: true }).click();
    await stalePage.getByRole("button", { name: "在当前资料上配置环境条件", exact: true }).click();
    await stalePage.getByLabel("新增行动人物").waitFor();
    expect(await stalePage.getByLabel("本人承诺内容", { exact: true }).count()).toBe(0);
    expect(await stalePage.evaluate("document.body.innerText")).not.toContain("旧来源专属行动");
    expect(await stalePage.evaluate("window.environmentTest.prepares")).toBe(1);
  } finally { await browser.close(); }
}, 60_000);
