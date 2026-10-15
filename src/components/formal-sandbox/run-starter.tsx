"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui-foundation";
import { createFormalSandboxClient } from "@/lib/formal-sandbox/client";
import { safeDigitalLifeContextSchema, type SafeDigitalLifeContext } from "@/lib/formal-sandbox/model-context";
import { digitalLifeRulesSchema, type DigitalLifeRules } from "@/lib/digital-life/model";
import { DigitalLifeRulesEditor } from "./digital-life-rules-editor";
import { CalibrationSelection } from "./calibration-selection";
import type { FormalCalibrationContext } from "@/lib/formal-sandbox/outcomes/contracts";
import type { DefaultPlanningContext } from "@/lib/formal-planning/contracts";
import { buildPlanningRequest, DefaultPlanningEditor, emptyPlanningDraft } from "./default-planning-editor";
import { buildRelationshipResponseRequest, emptyRelationshipResponseDraft, RelationshipResponseEditor } from "./relationship-response-editor";
import { ModelRuleRevision, ModelRulesDraftEditor, type RevisionDraft } from "./model-rule-revision";
import type { DigitalLifeModelDraft, DigitalLifeModelDraftSource, SaveDigitalLifeModelDraft } from "@/lib/digital-life/model-draft";
import { digitalLifeRulesDraftSchema, type DigitalLifeRulesDraft } from "@/lib/formal-sandbox/correction-context";
import { compatibleRevision } from "./model-rule-revision-query";
import type { SafeDigitalLifeCorrectionContext } from "@/lib/formal-sandbox/correction-context";
import { normalizeDraftForSave } from "./model-rule-draft-operations";
import { ModelReconciliationPanel, type ReconciliationPlan } from "./model-reconciliation-panel";
import type { ModelReconciliationApplication } from "@/lib/digital-life/model-reconciliation";

type StartInput = Parameters<ReturnType<typeof createFormalSandboxClient>["start"]>[0];
function matchesModelSource(source: DigitalLifeModelDraftSource, current: SafeDigitalLifeContext) {
  const legacy = { graphSnapshotId: current.graphSnapshotId, agentSnapshotId: current.agentSnapshotId, profileRevision: current.profileRevision, agents: current.agents, relationships: current.relationships, resources: current.resources };
  return JSON.stringify(source.modelContext) === JSON.stringify("version" in source ? current : legacy);
}
function canReconcileModel(draft: DigitalLifeModelDraft | null) {
  const old = draft?.sourceContext?.modelContext;
  const current = draft?.currentSourceContext?.modelContext;
  return Boolean(draft?.status === "stale" && old && current && current.profileRevision > old.profileRevision && old.graphSnapshotId === current.graphSnapshotId && old.agentSnapshotId === current.agentSnapshotId && JSON.stringify(old.agents) === JSON.stringify(current.agents) && JSON.stringify(old.relationships) === JSON.stringify(current.relationships));
}

export function isCurrentCalibrationContext(context: FormalCalibrationContext, profileRevision: number, requestGeneration: number, currentGeneration: number) {
  return requestGeneration === currentGeneration && context.status === "available" && context.profileRevision === profileRevision;
}
export function isCurrentPlanningContext(context: DefaultPlanningContext, profileRevision: number, requestGeneration: number, currentGeneration: number) {
  return requestGeneration === currentGeneration && context.profileRevision === profileRevision;
}

export function FormalRunStartError({ errorCode }: { errorCode: string }) {
  if (errorCode === "request_outcome_unknown") return null;
  if (errorCode.startsWith("correction_") || errorCode === "run_not_completed" || errorCode === "run_not_found") return <p role="alert" className="mt-2 max-w-prose text-sm text-[var(--risk-red)]">{errorCode === "correction_source_stale" ? "背景资料、人物或关系来源已变化，原规则不能套用到新模型。请返回原结果，或从当前情境重新准备运行。" : errorCode === "correction_rules_not_recorded" ? "这次历史运行未保存可修订的行动规则。请从当前情境准备新的运行。" : errorCode === "run_not_completed" ? "原运行尚未完成，请回到原运行查看状态后重试。" : "原运行的规则暂不可读取，请重新读取，或返回历史选择已完成的结果。"}</p>;
  if (errorCode === "planning_context_stale") return <p role="alert" className="mt-2 max-w-prose text-sm text-[var(--risk-red)]">资源或象征来源已变化，旧规划授权已清空。请重新读取模型，再逐项确认预算与初始假设。</p>;
  if (errorCode === "invalid_planning_request") return <p role="alert" className="mt-2 max-w-prose text-sm text-[var(--risk-red)]">默认规划未通过检查。请检查整次预算与独立确认，或关闭默认规划后使用明确行动规则。</p>;
  if (errorCode === "invalid_correction") return <p role="alert" className="mt-2 max-w-prose text-sm text-[var(--risk-red)]">所选观察修正与当前行动条件不相符。请取消修正或恢复对应原行动条件，再重新确认后开始运行。</p>;
  if (errorCode === "world_model_required") {
    return (
      <p role="alert" className="mt-2 max-w-xs text-sm text-[var(--risk-red)]">
        请在上方明确授权资源预算、添加行动规则，或补充资源及每周期投入规则，再开始运行。 {" "}
        <Link href="/app/reality-profile" className="underline underline-offset-4">
          修改背景资料
        </Link>
      </p>
    );
  }

  if (errorCode === "reservation_expired") {
    return (
      <p role="alert" className="mt-2 max-w-xs text-sm text-[var(--risk-red)]">
        首次请求冻结的运行时间窗口已过期，本次没有生成新的运行结果。已配置规则会保留。
      </p>
    );
  }

  return (
    <p role="alert" className="mt-2 max-w-xs text-sm text-[var(--risk-red)]">
      {errorCode === "profile_revision_conflict" ? "背景资料已更新，请重新读取当前模型并检查规则后重试。" : errorCode === "invalid_digital_life_rules" ? "规则未通过检查。请确认人物、触发条件、资源量和假设说明。" : errorCode === "current_graph_required" || errorCode === "graph_not_locked" ? "请先完成并锁定当前关系图，然后重新读取模型。" : errorCode === "unauthenticated" ? "登录后才能读取模型和开始运行。" : "无法开始运行。请检查已锁定关系图后重试；你的选择仍保留。"}
    </p>
  );
}

export function FormalRunStarter({ graphId, revisionRunId, currentDraftMode = false }: { graphId?: string; revisionRunId?: string; currentDraftMode?: boolean }) {
  const router = useRouter();
  const id = useId();
  const [context, setContext] = useState<SafeDigitalLifeContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [revisionSource, setRevisionSource] = useState<SafeDigitalLifeCorrectionContext | null>(null);
  const [revisionConfirmed, setRevisionConfirmed] = useState(false);
  const [reload, setReload] = useState(0);
  const [horizon, setHorizon] = useState<30 | 90>(30);
  const [rules, setRules] = useState<Pick<DigitalLifeRules, "actions" | "strategies">>({ actions: [], strategies: [] });
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calibration, setCalibration] = useState<FormalCalibrationContext | null>(null);
  const [calibrationError, setCalibrationError] = useState(false);
  const [correctionKeys, setCorrectionKeys] = useState<string[]>([]);
  const [calibrationConfirmed, setCalibrationConfirmed] = useState(false);
  const [unknownStart, setUnknownStart] = useState(false);
  const [planning, setPlanning] = useState<DefaultPlanningContext | null>(null);
  const [planningError, setPlanningError] = useState(false);
  const [planningDraft, setPlanningDraft] = useState(emptyPlanningDraft);
  const [relationshipDraft, setRelationshipDraft] = useState(emptyRelationshipResponseDraft);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const replay = useRef<{ signature: string; input: StartInput } | null>(null);
  const unknownStartRef = useRef(false);
  const [savedDraft, setSavedDraft] = useState<DigitalLifeModelDraft | null>(null);
  const [editableDraft, setEditableDraft] = useState<DigitalLifeRulesDraft | RevisionDraft | null>(null);
  const [draftConfirmed, setDraftConfirmed] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [savePending, setSavePending] = useState(false);
  const [unknownSave, setUnknownSave] = useState(false);
  const [editorRevision, setEditorRevision] = useState(0);
  const saveFlight = useRef(false);
  const saveReplay = useRef<SaveDigitalLifeModelDraft | null>(null);
  const freshCurrent = useRef(false);
  const [initialDraft, setInitialDraft] = useState<DigitalLifeRulesDraft | null>(null);
  const [preparedSource, setPreparedSource] = useState<DigitalLifeModelDraftSource | null>(null);
  const [preparingSource, setPreparingSource] = useState(false);
  const [reconciliation, setReconciliation] = useState<ReconciliationPlan | null>(null);
  const [reconciledUnsaved, setReconciledUnsaved] = useState(false);

  useEffect(() => {
    if (saveReplay.current) return;
    // A lost response must recover the accepted request, never refresh its sources.
    if (replay.current && (unknownStartRef.current || inFlight.current)) {
      if (inFlight.current) {
        unknownStartRef.current = true;
        setUnknownStart(true);
        setError("request_outcome_unknown");
      }
      return;
    }
    const currentGeneration = ++generation.current;
    let active = true;
    const abort = new AbortController();
    async function recover() {
      setLoading(true); setContext(null); setError(null); setRules({ actions: [], strategies: [] });
      setRevisionSource(null); setRevisionConfirmed(false);
      setSavedDraft(null); setPreparedSource(null); setReconciliation(null); setReconciledUnsaved(false); setEditableDraft(null); setInitialDraft(null); setDraftConfirmed(false); setDraftError(null);
      setCalibration(null); setCalibrationError(false); setCorrectionKeys([]); setCalibrationConfirmed(false);
      setPlanning(null); setPlanningError(false); setPlanningDraft(emptyPlanningDraft()); setRelationshipDraft(emptyRelationshipResponseDraft()); replay.current = null;
      try {
        let source: SafeDigitalLifeCorrectionContext | null = null;
        const preloaded = currentDraftMode ? await createFormalSandboxClient().modelDraft() : null;
        if (!active || currentGeneration !== generation.current) return;
        if (preloaded) {
          if (!preloaded.ok) { setDraftError(preloaded.errorCode); return; }
          setSavedDraft(preloaded.data.draft);
        }
        if (revisionRunId) {
          const result = await createFormalSandboxClient().correctionContext(revisionRunId);
          if (!active || currentGeneration !== generation.current) return;
          if (!result.ok) { setError(result.errorCode); return; }
          source = result.data.context;
        }
        const response = await fetch(`/api/sandbox/model-context${graphId ? `?graph_id=${encodeURIComponent(graphId)}` : ""}`, { cache: "no-store", signal: abort.signal });
        const body = await response.json().catch(() => null);
        if (!active || currentGeneration !== generation.current) return;
        const parsed = safeDigitalLifeContextSchema.safeParse(body?.context);
        if (!response.ok || body?.ok !== true || !parsed.success || (graphId && parsed.data.graphSnapshotId !== graphId)) { setError(typeof body?.error_code === "string" ? body.error_code : "context_unavailable"); return; }
        if (source && !compatibleRevision(source, parsed.data)) { setError("correction_source_stale"); return; }
        if (!revisionRunId) {
          const loaded = preloaded ?? await createFormalSandboxClient().modelDraft();
          if (!active || currentGeneration !== generation.current) return;
          if (!loaded.ok) { setDraftError(loaded.errorCode); if (currentDraftMode) return; }
          else {
            setSavedDraft(loaded.data.draft);
            const stored = loaded.data.draft;
            if (currentDraftMode && !freshCurrent.current) {
              if (stored.status === "stale") { setDraftError("model_source_stale"); return; }
              if (stored.status === "current" && stored.draftRules && stored.sourceContext && matchesModelSource(stored.sourceContext, parsed.data)) {
                setInitialDraft(stored.draftRules); setEditableDraft(stored.draftRules); setHorizon(stored.horizonDays!);
                setDraftConfirmed(stored.draftRules.actions.length === 0 && stored.draftRules.strategies.length === 0);
                setNotice(`已读取模型草稿版本 ${stored.currentRevision}。全部行动与策略授权已重置，请逐项复核。`);
              } else if (stored.status === "current") { setDraftError("model_source_stale"); return; }
              else setNotice("当前账户尚未保存模型草稿，可先配置并保存。");
            }
            if (currentDraftMode && (freshCurrent.current || stored.status === "not_saved")) {
              const empty: DigitalLifeRulesDraft = { version: stored.currentSourceContext && "version" in stored.currentSourceContext ? "digital-life-rules-v2" : "digital-life-rules-v1", graphSnapshotId: parsed.data.graphSnapshotId, agentSnapshotId: parsed.data.agentSnapshotId, profileRevision: parsed.data.profileRevision, actions: [], strategies: [] };
              setInitialDraft(empty); setEditableDraft(empty); setDraftConfirmed(true); freshCurrent.current = false;
            }
          }
        }
        if (source) {
          setRevisionSource(source); setHorizon(source.horizonDays);
          const empty = source.draftRules.actions.length === 0 && source.draftRules.strategies.length === 0;
          setRevisionConfirmed(empty);
          setNotice("原规则已载入，所有授权已重置。修改后请逐项重新确认，再另跑一次。");
        }
        setContext(parsed.data);
        try {
          const result = await createFormalSandboxClient().planningContext(parsed.data.graphSnapshotId);
          if (!active || currentGeneration !== generation.current) return;
          if (!result.ok || !isCurrentPlanningContext(result.data.context, parsed.data.profileRevision, currentGeneration, generation.current)) setPlanningError(true);
          else setPlanning(result.data.context);
        } catch { if (active && currentGeneration === generation.current) setPlanningError(true); }
        try {
          const result = await createFormalSandboxClient().calibrationContext(parsed.data.graphSnapshotId);
          if (!active || currentGeneration !== generation.current) return;
          if (!result.ok || !isCurrentCalibrationContext(result.data.context, parsed.data.profileRevision, currentGeneration, generation.current)) { setCalibrationError(true); return; }
          setCalibration(result.data.context);
        } catch { if (active) setCalibrationError(true); }
      } catch { if (active) setError("context_unavailable"); }
      finally { if (active) setLoading(false); }
    }
    void recover();
    return () => { active = false; generation.current += 1; abort.abort(); };
  }, [graphId, revisionRunId, currentDraftMode, reload]);

  async function start() {
    if (inFlight.current) return;
    let input: StartInput;
    if (unknownStartRef.current) {
      if (!replay.current) return;
      input = replay.current.input;
    } else {
      if (!context || reconciledUnsaved || saveFlight.current || unknownSave || (editableDraft && !draftConfirmed) || (revisionRunId && !revisionConfirmed)) return;
      if (correctionKeys.length && !calibrationConfirmed) { setNotice("请先明确确认所选观察修正的条件假设，再开始运行。"); return; }
      const parsed = digitalLifeRulesSchema.safeParse({ version: editableDraft?.version ?? (rules.actions.some(action => action.operation.actionType === "update_external_variable") ? "digital-life-rules-v2" : "digital-life-rules-v1"), graphSnapshotId: context.graphSnapshotId, agentSnapshotId: context.agentSnapshotId, profileRevision: context.profileRevision, ...rules });
      if (!parsed.success) { setError("invalid_digital_life_rules"); return; }
      const relationshipResponse = planning ? buildRelationshipResponseRequest(context, parsed.data, planning, planningDraft, relationshipDraft) : undefined;
      if (relationshipResponse === null) { setNotice("请重新选择已确认的询问与模拟回应，单独确认资源预算、回应调整与可选象征假设；也可以关闭回应调整。"); return; }
      const defaultPlanning = planning ? buildPlanningRequest(planning, { ...planningDraft, ...(relationshipResponse ? { relationshipResponse } : {}) }) : undefined;
      if (defaultPlanning === null) { setNotice("请逐项确认所选整次预算，并单独确认初始假设；也可以关闭所有默认授权。"); return; }
      const outcomeCalibration = correctionKeys.length ? { version: 1 as const, correction_keys: correctionKeys, confirmed: true as const } : undefined;
      const body = { graphSnapshotId: context.graphSnapshotId, horizonDays: horizon, digitalLifeRules: parsed.data, ...(outcomeCalibration ? { outcomeCalibration } : {}), ...(defaultPlanning && (defaultPlanning.resources.length || defaultPlanning.fusion.enabled) ? { defaultPlanning } : {}) };
      const signature = JSON.stringify(body);
      if (replay.current?.signature !== signature) replay.current = { signature, input: { ...body, idempotencyKey: crypto.randomUUID() } };
      input = replay.current.input;
    }
    inFlight.current = true;
    setPending(true);
    setError(null);
    const currentGeneration = generation.current;
    try {
      const response = await createFormalSandboxClient().start(input);
      if (currentGeneration !== generation.current) return;
      if (!response.ok) {
        if (response.status >= 500 || response.errorCode === "request_failed" || response.errorCode === "invalid_response") { unknownStartRef.current = true; setUnknownStart(true); setError("request_outcome_unknown"); }
        else {
          unknownStartRef.current = false; setUnknownStart(false); setError(response.errorCode);
          if (response.errorCode === "planning_context_stale" || response.errorCode === "profile_revision_conflict") { setPlanningDraft(emptyPlanningDraft()); setRelationshipDraft(emptyRelationshipResponseDraft()); setPlanning(null); setPlanningError(true); replay.current = null; }
        }
        return;
      }
      unknownStartRef.current = false;
      setUnknownStart(false);
      router.push(`/app/simulation/running?run_id=${response.data.run.id}`);
    } catch { if (currentGeneration === generation.current) { unknownStartRef.current = true; setUnknownStart(true); setError("request_outcome_unknown"); } }
    finally { inFlight.current = false; setPending(false); }
  }

  function changeHorizon(value: 30 | 90) {
    if (inFlight.current || unknownStartRef.current || saveFlight.current || unknownSave) return;
    if (value === horizon) return;
    setHorizon(value);
    if (currentDraftMode && context) {
      const empty: DigitalLifeRulesDraft = { version: editableDraft?.version ?? "digital-life-rules-v1", graphSnapshotId: context.graphSnapshotId, agentSnapshotId: context.agentSnapshotId, profileRevision: context.profileRevision, actions: [], strategies: [] };
      setInitialDraft(empty); setEditableDraft(empty); setDraftConfirmed(true); setEditorRevision(value => value + 1);
    } else { setEditableDraft(null); setDraftConfirmed(false); }
    setPlanningDraft(emptyPlanningDraft()); setRelationshipDraft(emptyRelationshipResponseDraft()); setCorrectionKeys([]); setCalibrationConfirmed(false);
    setNotice("时间窗口已更改，请重新确认整次预算与所有条件假设。");
    if (rules.actions.length || editableDraft?.actions.length || editableDraft?.strategies.length) {
      setRules({ actions: [], strategies: [] });
      setNotice("时间窗口已更改，原规则与规划授权已清空，请按新周期重新配置。" );
    }
  }

  function prepareExpiredReservationRetry() {
    replay.current = null;
    setError(null);
    setNotice("已准备新的运行，请确认后开始");
  }

  function changeRules(value: Pick<DigitalLifeRules, "actions" | "strategies">, resetPermissions = true) {
    setRules(value);
    if (!resetPermissions) return;
    setRelationshipDraft(emptyRelationshipResponseDraft()); setCorrectionKeys([]); setCalibrationConfirmed(false);
    setPlanningDraft(draft => ({ ...draft, fusionConfirmed: false, resources: Object.fromEntries(Object.entries(draft.resources).map(([key, resource]) => [key, { ...resource, confirmed: false }])) }));
    setNotice("行动条件已更改，请重新确认整次预算；如需回应调整，请重新选择组合并确认。");
  }
  const relationshipResponse = context && planning ? buildRelationshipResponseRequest(context, rules, planning, planningDraft, relationshipDraft) : undefined;
  const authorizedPlanning = planning ? buildPlanningRequest(planning, { ...planningDraft, ...(relationshipResponse ? { relationshipResponse } : {}) }) : undefined;
  const locked = pending || unknownStart || savePending || unknownSave || preparingSource;

  async function prepareReconciliation() {
    if (locked || inFlight.current || saveFlight.current || !savedDraft || !canReconcileModel(savedDraft)) return;
    const requestGeneration = generation.current;
    setPreparingSource(true); setDraftError(null);
    try {
      const response = await createFormalSandboxClient().prepareModelReconciliation(savedDraft.currentRevision);
      if (requestGeneration !== generation.current) return;
      if (!response.ok) { setDraftError(response.errorCode); return; }
      setReconciliation({ draft: response.data.draft, reconciliation: response.data.reconciliation, preparedSourceContext: response.data.preparedSourceContext });
    } catch { setDraftError("draft_reload_failed"); }
    finally { setPreparingSource(false); }
  }

  async function applyReconciliation(result: Extract<ModelReconciliationApplication, { ok: true }>) {
    if (locked || inFlight.current || saveFlight.current || !reconciliation) return;
    const requestGeneration = generation.current;
    setPreparingSource(true); setDraftError(null);
    try {
      const current = await createFormalSandboxClient().prepareModelReconciliation(result.expectedRevision);
      if (requestGeneration !== generation.current) return;
      if (!current.ok || current.data.draft.currentRevision !== result.expectedRevision || JSON.stringify(current.data.preparedSourceContext) !== JSON.stringify(result.sourceContext)) { setReconciliation(null); setDraftError(current.ok ? "reconciliation_source_changed" : current.errorCode); return; }
      setSavedDraft(current.data.draft); setPreparedSource(result.sourceContext); setContext(result.sourceContext.modelContext); setHorizon(result.horizonDays);
      setInitialDraft(result.draftRules); setEditableDraft(result.draftRules); setDraftConfirmed(false); setEditorRevision(value => value + 1); setReconciledUnsaved(true); setReconciliation(null);
      setPlanning(null); setCalibration(null); setPlanningDraft(emptyPlanningDraft()); setRelationshipDraft(emptyRelationshipResponseDraft()); setCorrectionKeys([]); setCalibrationConfirmed(false); replay.current = null;
      setRules({ actions: [], strategies: [] }); setNotice("核对结果已装入当前草稿。请先保存并重新读取，再逐项确认行动与策略；尚未开始运行。");
    } catch { setDraftError("draft_reload_failed"); }
    finally { setPreparingSource(false); }
  }

  async function prepareEnvironment() {
    if (locked || inFlight.current || saveFlight.current || !context) return;
    const prepareGeneration = generation.current;
    setPreparingSource(true);
    try {
      const response = await createFormalSandboxClient().prepareModelDraftV2();
      if (prepareGeneration !== generation.current) return;
      if (!response.ok || !response.data.preparedSourceContext || !matchesModelSource(response.data.preparedSourceContext, context)) { setDraftError("model_source_stale"); return; }
      const binding = response.data.preparedSourceContext;
      const previous = editableDraft;
      const next: DigitalLifeRulesDraft = { version: "digital-life-rules-v2", graphSnapshotId: context.graphSnapshotId, agentSnapshotId: context.agentSnapshotId, profileRevision: context.profileRevision, actions: previous?.actions.map(action => ({ ...action, confirmedForSimulation: false as const })) ?? [], strategies: previous?.strategies.map(strategy => ({ ...strategy, confirmedForSimulation: false as const })) ?? [] };
      setSavedDraft(response.data.draft); setPreparedSource(binding); setInitialDraft(next); setEditableDraft(next); setDraftConfirmed(!next.actions.length && !next.strategies.length); setEditorRevision(value => value + 1);
      changeRules({ actions: [], strategies: [] }); setNotice("已在当前资料上准备环境条件草稿，原有规则授权已清空。请配置、保存并逐项重新确认。");
    } catch { setDraftError("draft_reload_failed"); }
    finally { setPreparingSource(false); }
  }

  async function saveDraft() {
    if (inFlight.current || unknownStartRef.current || saveFlight.current) return;
    let input = saveReplay.current;
    if (!unknownSave) {
      const binding = preparedSource ?? savedDraft?.currentSourceContext;
      if (!context || !binding || !matchesModelSource(binding, context)) { setDraftError("model_source_stale"); return; }
      const raw = editableDraft ?? { version: "digital-life-rules-v1", graphSnapshotId: context.graphSnapshotId, agentSnapshotId: context.agentSnapshotId, profileRevision: context.profileRevision, ...rules };
      const normalized = normalizeDraftForSave({ modelContext: context, horizonDays: horizon }, raw);
      const parsed = digitalLifeRulesDraftSchema.safeParse(normalized);
      if (!parsed.success) { setDraftError("invalid_model_draft"); return; }
      input = { version: parsed.data.version === "digital-life-rules-v2" ? "digital-life-model-draft-v2" : "digital-life-model-draft-v1", expectedRevision: savedDraft!.currentRevision, idempotencyKey: crypto.randomUUID(), horizonDays: horizon, sourceContext: binding, draftRules: parsed.data };
      saveReplay.current = input;
    }
    if (!input) return;
    const saveGeneration = generation.current;
    saveFlight.current = true; setSavePending(true); setDraftError(null);
    try {
      const result = await createFormalSandboxClient().saveModelDraft(input);
      if (!result.ok) {
        if (result.status >= 500 || result.errorCode === "request_failed" || result.errorCode === "invalid_response") { setUnknownSave(true); setDraftError("save_outcome_unknown"); }
        else { saveReplay.current = null; setUnknownSave(false); setDraftError(result.errorCode); if (result.status === 409) setContext(null); }
        return;
      }
      saveReplay.current = null; setUnknownSave(false); setSavedDraft(result.data.draft);
      setPlanningDraft(emptyPlanningDraft()); setRelationshipDraft(emptyRelationshipResponseDraft()); setCorrectionKeys([]); setCalibrationConfirmed(false); replay.current = null;
      setRules({ actions: [], strategies: [] }); setDraftConfirmed(false);
      setNotice(`模型草稿版本 ${result.data.draft.currentRevision} 已保存。正在重新读取当前来源，请稍候复核。`);
      if (saveGeneration !== generation.current) { setReload(value => value + 1); return; }
      try {
        const refreshed = await createFormalSandboxClient().modelDraft();
        if (saveGeneration !== generation.current) { setReload(value => value + 1); return; }
        if (!refreshed.ok) { setContext(null); setDraftError("draft_reload_failed"); return; }
        const latest = refreshed.data.draft;
        setSavedDraft(latest);
        if (!context || latest.status !== "current" || !latest.draftRules || !latest.sourceContext || !latest.currentSourceContext || JSON.stringify(latest.sourceContext) !== JSON.stringify(latest.currentSourceContext) || !matchesModelSource(latest.sourceContext, context)) { setContext(null); setDraftError("model_source_stale"); return; }
        setInitialDraft(latest.draftRules); setEditableDraft(latest.draftRules); setHorizon(latest.horizonDays!); setDraftConfirmed(latest.draftRules.actions.length === 0 && latest.draftRules.strategies.length === 0); setEditorRevision(value => value + 1);
        setNotice(`模型草稿版本 ${latest.currentRevision} 已保存。尚未开始运行；请逐项重新确认。`);
        setReconciledUnsaved(false);
      } catch { setContext(null); setDraftError("draft_reload_failed"); }
    } catch { setUnknownSave(true); setDraftError("save_outcome_unknown"); }
    finally { saveFlight.current = false; setSavePending(false); }
  }

  return (
    <div className="min-w-0 w-full space-y-5">
      <h2 className="text-xl font-semibold">{currentDraftMode ? "配置当前模型草稿与本次运行" : "配置本次数字生命运行"}</h2>
      <p className="max-w-prose text-sm leading-6 text-[var(--text-secondary)]">30 天包含 3 个模拟周期，90 天包含 6 个周期。周期表达条件变化，不是现实中的精确发生日期。</p>
      <p className="max-w-prose text-sm leading-6 text-[var(--text-secondary)]">环境条件只用于模拟，不代表控制现实，也不改写现实档案。模拟可能提前结束，指定周期可能未到达；只有已触发的模拟事件才形成变化节点。</p>
      {currentDraftMode && context && editableDraft?.version === "digital-life-rules-v1" ? <Button variant="ghostOnDark" disabled={locked} onClick={prepareEnvironment} className="!w-auto px-4 py-3">在当前资料上配置环境条件</Button> : null}
      {loading ? <p role="status" className="animate-pulse motion-reduce:animate-none">正在读取已锁定模型与可选人物…</p> : null}
      {!loading && !context ? <div><p className="text-sm leading-6">当前模型暂不可读取。请完成当前情境的人物与关系图，再重新读取。</p><Button disabled={locked} variant="ghostOnDark" onClick={() => setReload(value => value + 1)} className="!w-auto px-4 py-3">重新读取模型</Button><Link href="/app/new/intake" className="ml-3 inline-flex min-h-11 items-center underline">返回情境准备</Link></div> : null}
      {!loading && currentDraftMode && !context && savedDraft?.draftRules && savedDraft.sourceContext && savedDraft.horizonDays ? <section className="space-y-4"><p role="alert">已保存版本 {savedDraft.currentRevision} 暂不能用于当前运行。下方保留原模型，只可查看；请重新读取并核对当前来源。</p><ModelRulesDraftEditor key={`stale-${savedDraft.currentRevision}`} source={{ draftRules: savedDraft.draftRules, modelContext: savedDraft.sourceContext.modelContext, horizonDays: savedDraft.horizonDays }} currentModel disabled onChange={() => {}} />{savedDraft.status === "stale" && savedDraft.currentSourceContext ? <Button disabled={locked} variant="ghostOnDark" onClick={() => { freshCurrent.current = true; setReload(value => value + 1); }} className="!w-auto px-4 py-3">为当前模型重新配置空草稿</Button> : null}</section> : null}
      {!context && canReconcileModel(savedDraft) && !reconciliation ? <Button disabled={locked} variant="ghostOnDark" onClick={() => void prepareReconciliation()} className="!w-auto px-4 py-3">按当前资料继续调整</Button> : null}
      {reconciliation ? <ModelReconciliationPanel plan={reconciliation} disabled={locked} onApply={result => void applyReconciliation(result)} onCancel={() => { if (!locked) setReconciliation(null); }} /> : null}
      {draftError === "reconciliation_source_changed" ? <p role="alert" className="text-sm leading-6">核对期间资料再次变化，未应用这次核对。原模型保留只读，请重新读取后再核对。</p> : draftError === "model_reconciliation_scope_changed" ? <p role="alert" className="text-sm leading-6">当前人物、关系或模型范围已变化，不能延续原规则。原模型保留只读，请为当前模型重新配置空草稿。</p> : null}
      {context ? <fieldset disabled={locked} className="min-w-0 space-y-5"><legend className="sr-only">配置当前模型与本次运行</legend>
        <label htmlFor={`${id}-horizon`} className="block max-w-xs">运行时间窗口<select id={`${id}-horizon`} value={horizon} disabled={locked || Boolean(revisionRunId)} onChange={event => changeHorizon(Number(event.target.value) as 30 | 90)} className="mt-2 block min-h-11 w-full rounded-md border border-white/20 bg-[var(--bg-base)] px-3 text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--evidence-gold)]"><option value="30">30 天 · 3 个模拟周期</option><option value="90">90 天 · 6 个模拟周期</option></select></label>
        <p role="status" className="text-sm">{notice}</p>
        <div id="formal-action-rules">{revisionSource ? <ModelRuleRevision key={`${revisionRunId}-${reload}`} source={revisionSource} disabled={locked} onChange={value => { setRevisionConfirmed(Boolean(value)); changeRules(value ? { actions: value.actions, strategies: value.strategies } : { actions: [], strategies: [] }); }} /> : editableDraft && initialDraft ? <ModelRulesDraftEditor key={`current-${reload}-${editorRevision}`} source={{ draftRules: initialDraft, modelContext: context, horizonDays: horizon }} originalRules={initialDraft} currentModel disabled={locked} onDraftChange={(draft, resetPermissions) => { setEditableDraft(draft); if (resetPermissions) changeRules({ actions: [], strategies: [] }); }} onChange={value => { setDraftConfirmed(Boolean(value)); changeRules(value ? { actions: value.actions, strategies: value.strategies } : { actions: [], strategies: [] }, false); }} /> : <DigitalLifeRulesEditor key={`${context.graphSnapshotId}-${context.profileRevision}-${horizon}`} context={context} horizonDays={horizon} actions={rules.actions} strategies={rules.strategies} onChange={changeRules} disabled={locked} />}</div>
        {planning ? <DefaultPlanningEditor context={planning} draft={planningDraft} onChange={draft => { setPlanningDraft(draft); setRelationshipDraft(value => ({ ...value, confirmed: false, symbolicConfirmed: false })); }} disabled={pending || unknownStart} explicitRuleResourceKeys={rules.actions.flatMap(action => action.operation.actionType === "allocate_resource" ? [action.operation.resourceKey] : [])} /> : null}
        {planning ? <RelationshipResponseEditor context={context} rules={rules} planning={planning} budgets={planningDraft} draft={relationshipDraft} onChange={setRelationshipDraft} disabled={pending || unknownStart} /> : null}
        {planningError ? <p role="status" className="text-sm leading-6">默认规划来源暂不可读取，旧授权已清空。本次不会应用默认规划；仍可使用明确行动规则。</p> : null}
        {calibration ? <CalibrationSelection context={calibration} selectedKeys={correctionKeys} confirmed={calibrationConfirmed} onChange={setCorrectionKeys} onConfirm={setCalibrationConfirmed} disabled={pending || unknownStart} /> : null}
        {calibrationError ? <p role="status" className="text-sm">观察修正暂不可读取，本次不应用修正。重新读取模型可再次检查可用条件。</p> : null}
        <Button variant="ghostOnDark" disabled={pending || unknownStart || loading} onClick={() => { setNotice("重新读取将清空旧规则与所有规划授权，请重新确认。"); setReload(value => value + 1); }} className="!w-auto px-4 py-3">重新读取模型与规划来源</Button>
      </fieldset> : null}
      {!revisionRunId ? <div className="space-y-3 border-t border-white/15 pt-4"><p className="text-sm leading-6">保存当前模型草稿后，返回或重新登录可继续复核。保存不会创建运行；行动、策略与预算仍须重新确认。</p><Button variant="ghostOnDark" loading={savePending} loadingLabel="正在保存模型草稿" disabled={locked || loading || !context || !savedDraft?.currentSourceContext} onClick={() => void saveDraft()} className="!w-auto px-4 py-3">保存当前模型草稿</Button>{unknownSave ? <><p role="alert" className="text-sm leading-6">草稿保存结果暂时未知。原保存内容已保留，请恢复原保存请求，期间不能修改或开始运行。</p><Button variant="ghostOnDark" disabled={savePending} onClick={() => void saveDraft()} className="!w-auto px-4 py-3">恢复原草稿保存请求</Button></> : null}{draftError && !unknownSave ? <p role="alert" className="text-sm leading-6">{draftError === "revision_conflict" ? "账户草稿已在其他页面更新。请重新读取，复核最新版本后再保存。" : draftError === "model_source_stale" ? "人物、关系或资源来源已变化，请重新读取并为当前模型重新配置。" : "模型草稿暂不可保存或读取，请检查内容并重新读取。"}</p> : null}</div> : null}
      <Button
        variant="onDark"
        loading={pending}
        disabled={locked || loading || !context || reconciledUnsaved || Boolean(editableDraft && !draftConfirmed) || Boolean(revisionRunId && !revisionConfirmed) || (correctionKeys.length > 0 && !calibrationConfirmed) || relationshipResponse === null || Boolean(planning && !authorizedPlanning)}
        onClick={() => void start()}
        className="!w-auto px-4 py-3"
        loadingLabel="正在提交本次运行"
      >
        开始 {horizon} 天运行
      </Button>
      {error ? <FormalRunStartError errorCode={error} /> : null}
      {unknownStart ? <div><p role="alert" className="text-sm leading-6">运行提交结果暂时未知。原请求与选择已保留；请恢复原运行请求，期间不能修改配置或自动发起新运行。</p><Button variant="ghostOnDark" disabled={pending} onClick={() => void start()} className="!w-auto px-4 py-3">恢复原运行请求</Button></div> : null}
      {context && error === "reservation_expired" ? <Button variant="ghostOnDark" disabled={locked} onClick={prepareExpiredReservationRetry} className="!w-auto px-4 py-3">保留规则，重新发起</Button> : null}
      {context && (error === "profile_revision_conflict" || error === "planning_context_stale") && !unknownStart ? <Button variant="ghostOnDark" disabled={locked} onClick={() => { setNotice("重新读取将更新模型并清空旧规则与规划授权。"); setReload(value => value + 1); }} className="!w-auto px-4 py-3">重新读取模型并检查规则</Button> : null}
      {context && calibrationError && !unknownStart ? <Button variant="ghostOnDark" disabled={locked} onClick={() => { setNotice("重新读取将清空旧规则，请重新确认条件。"); setReload(value => value + 1); }} className="!w-auto px-4 py-3">重新读取模型与观察修正</Button> : null}
    </div>
  );
}
