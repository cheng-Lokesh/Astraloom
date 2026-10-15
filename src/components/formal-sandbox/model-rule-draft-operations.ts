import { digitalLifeRulesSchema, type DigitalLifeRules } from "@/lib/digital-life/model";
import { digitalLifeRulesDraftSchema, type DigitalLifeRulesDraft, type SafeDigitalLifeCorrectionContext } from "@/lib/formal-sandbox/correction-context";
import { buildEditorRules, type EditorDraft } from "./digital-life-rules-editor";

export type DraftAction = Omit<DigitalLifeRulesDraft["actions"][number], "confirmedForSimulation"> & { confirmedForSimulation: boolean };
export type DraftStrategy = Omit<DigitalLifeRulesDraft["strategies"][number], "confirmedForSimulation"> & { confirmedForSimulation: boolean };
export type RevisionDraft = Omit<DigitalLifeRulesDraft, "actions" | "strategies"> & { actions: DraftAction[]; strategies: DraftStrategy[] };
export type DraftSource = Pick<SafeDigitalLifeCorrectionContext, "modelContext" | "horizonDays">;
export type DraftSelection = { kind: "action"; key: string } | { kind: "strategy"; participantKey: string };
export type DraftValidation = { ok: true } | { ok: false; message: string; invalidActionKeys: string[] };
export type DraftOperationResult = { ok: true; draft: RevisionDraft; resetPermissions: boolean; invalidActionKeys: string[]; message?: string; addedActionKey?: string } | { ok: false; message: string };

const fail = (message: string): DraftOperationResult => ({ ok: false, message });
const unconfirmed = (draft: RevisionDraft) => ({ ...draft, actions: draft.actions.map(action => ({ ...action, confirmedForSimulation: false as const })), strategies: draft.strategies.map(strategy => ({ ...strategy, confirmedForSimulation: false as const })) });
// This temporary shape is used only by validators, never emitted as Run permission.
const validationRules = (draft: RevisionDraft) => ({ ...draft, actions: draft.actions.map(action => ({ ...action, confirmedForSimulation: true as const })), strategies: draft.strategies.map(strategy => ({ ...strategy, confirmedForSimulation: true as const })) });

function dependentKeys(actions: DraftAction[], initial: Iterable<string>) {
  const keys = new Set(initial);
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const action of actions) if (action.when.kind === "after_rule" && keys.has(action.when.ruleKey) && !keys.has(action.key)) { keys.add(action.key); expanded = true; }
  }
  return keys;
}

function orderedActions(actions: DraftAction[]): { ok: true; actions: DraftAction[] } | { ok: false; message: string } {
  const byKey = new Map(actions.map(action => [action.key, action]));
  if (byKey.size !== actions.length) return { ok: false, message: "行动编号重复，请重新载入当前草稿。" };
  const visiting = new Set<string>(); const visited = new Set<string>(); const ordered: DraftAction[] = [];
  function visit(action: DraftAction): boolean {
    if (visited.has(action.key)) return true;
    if (visiting.has(action.key)) return false;
    visiting.add(action.key);
    if (action.when.kind === "after_rule") {
      const prior = byKey.get(action.when.ruleKey);
      if (!prior || prior.pathKey !== action.pathKey || !visit(prior)) return false;
    }
    visiting.delete(action.key); visited.add(action.key); ordered.push(action); return true;
  }
  for (const action of actions) if (!visit(action)) return { ok: false, message: "前置行动必须存在于同一策略路径，不能形成循环依赖。" };
  return { ok: true, actions: ordered };
}

function invalidate(draft: RevisionDraft, keys: Set<string>, paths: Set<string> = new Set()) {
  for (const action of draft.actions) if (keys.has(action.key)) paths.add(action.pathKey);
  return { ...draft, actions: draft.actions.map(action => keys.has(action.key) ? { ...action, confirmedForSimulation: false } : action), strategies: draft.strategies.map(strategy => paths.has(strategy.participantKey) ? { ...strategy, confirmedForSimulation: false } : strategy) };
}
function completed(source: DraftSource, draft: RevisionDraft, resetPermissions: boolean, addedActionKey?: string): DraftOperationResult {
  const validity = validateRevisionDraft(source, draft);
  return { ok: true, draft: structuredClone(draft), resetPermissions, invalidActionKeys: validity.ok ? [] : validity.invalidActionKeys, ...(!validity.ok ? { message: validity.message } : {}), ...(addedActionKey ? { addedActionKey } : {}) };
}
function sourceMatches(source: DraftSource, draft: RevisionDraft) {
  return draft.graphSnapshotId === source.modelContext.graphSnapshotId && draft.agentSnapshotId === source.modelContext.agentSnapshotId && draft.profileRevision === source.modelContext.profileRevision;
}

export function validateRevisionDraft(source: DraftSource, draft: RevisionDraft): DraftValidation {
  const invalid = (message: string, invalidActionKeys = draft.actions.map(action => action.key)): DraftValidation => ({ ok: false, message, invalidActionKeys });
  if (!sourceMatches(source, draft)) return invalid("草稿来源已变化，请重新载入当前模型；不能沿用旧人物或资源。" );
  const parsed = digitalLifeRulesDraftSchema.safeParse(unconfirmed(draft));
  if (!parsed.success) {
    const keys = new Set<string>();
    for (const issue of parsed.error.issues) if (issue.path[0] === "actions" && typeof issue.path[1] === "number" && draft.actions[issue.path[1]]) keys.add(draft.actions[issue.path[1]].key);
    return invalid("请填写安全的行动、策略与来源说明，并检查周期和正数投入量。", [...keys]);
  }
  const context = source.modelContext;
  const cores = context.agents.filter(agent => agent.role === "user_core");
  if (cores.length !== 1) return invalid("当前本人模型不完整，请重新载入。" );
  const core = cores[0].key;
  const cap = source.horizonDays === 30 ? 3 : 6;
  const strategies = new Set(draft.strategies.map(strategy => strategy.participantKey));
  if (strategies.size !== draft.strategies.length || draft.strategies.some(strategy => !context.agents.some(agent => agent.key === strategy.participantKey && agent.role === "user_variant") || !draft.actions.some(action => action.pathKey === strategy.participantKey && action.actorKey === strategy.participantKey))) return invalid("每个策略须选择已有平行分身，并至少添加该分身的一条行动。", draft.actions.filter(action => action.pathKey !== "main").map(action => action.key));
  const ordered = orderedActions(draft.actions);
  if (!ordered.ok) return invalid(ordered.message);
  // Saved and submitted arrays must already name predecessors before successors.
  if (ordered.actions.some((action, index) => action.key !== draft.actions[index].key)) return invalid("请先整理前置行动顺序，不能引用后面的行动。" );
  const seen = new Map<string, DraftAction>(); const invalidKeys: string[] = [];
  for (const action of draft.actions) {
    const actor = context.agents.find(agent => agent.key === action.actorKey);
    const self = action.pathKey === "main" ? core : action.pathKey;
    const prior = action.when.kind === "after_rule" ? seen.get(action.when.ruleKey) : undefined;
    const thirdParty = actor?.role === "npc" || actor?.role === "group";
    let valid = !!actor && (action.pathKey === "main" || strategies.has(action.pathKey)) && (thirdParty || action.actorKey === self) && draft.actions.filter(item => item.pathKey === action.pathKey).length <= cap;
    if (action.when.kind === "at_tick") valid &&= action.when.tickIndex < cap;
    else valid &&= !!prior && prior.pathKey === action.pathKey;
    if (thirdParty) valid &&= action.operation.actionType === "update_relation_signal" && prior?.operation.actionType === "request_information" && prior.operation.targetPersonKey === action.actorKey;
    const operation = action.operation;
    if (operation.actionType === "request_information") {
      valid &&= !thirdParty && context.agents.some(agent => agent.key === operation.targetPersonKey && (agent.role === "npc" || agent.role === "group")) && context.relationships.some(relation => [relation.fromPersonKey, relation.toPersonKey].includes(core) && [relation.fromPersonKey, relation.toPersonKey].includes(operation.targetPersonKey));
    } else if (operation.actionType === "update_relation_signal") {
      const relation = context.relationships.find(item => item.key === operation.relationKey);
      valid &&= thirdParty && !!relation && [relation.fromPersonKey, relation.toPersonKey].includes(core) && [relation.fromPersonKey, relation.toPersonKey].includes(action.actorKey);
    } else if (operation.actionType === "allocate_resource") {
      const resource = context.resources.find(item => item.key === operation.resourceKey);
      valid &&= !thirdParty && !!resource && operation.amount <= resource.available - resource.minimum;
    } else valid &&= !thirdParty;
    if (!valid) invalidKeys.push(action.key);
    seen.set(action.key, action);
  }
  return invalidKeys.length ? invalid("请检查人物、既有关系、资源余额和本路径前置行动；换询问对象后，须明确重配或删除原回应。", [...dependentKeys(draft.actions, invalidKeys)]) : { ok: true };
}

export function addDraftAction(source: DraftSource, draft: RevisionDraft, editor: EditorDraft, usedRuleKeys: readonly string[] = []): DraftOperationResult {
  if (!sourceMatches(source, draft)) return fail("草稿来源已变化，请重新载入当前模型。" );
  const temporary = validationRules(draft);
  const built = buildEditorRules(source.modelContext, source.horizonDays, temporary.actions, temporary.strategies, { ...editor, confirmed: true });
  if (!built.ok) return built;
  const nextNumber = Math.max(0, ...[...usedRuleKeys, ...draft.actions.map(action => action.key)].map(key => Number(key.slice(5))).filter(Number.isSafeInteger)) + 1;
  if (!Number.isSafeInteger(nextNumber)) return fail("行动编号已超出可用范围，请重新载入。" );
  const key = `rule-${nextNumber}`;
  const added = built.rules.actions.at(-1)!;
  const operation = added.operation.actionType === "update_commitment" ? { ...added.operation, commitmentKey: `commitment-${nextNumber}` } : added.operation;
  const next: RevisionDraft = { ...draft, actions: [...draft.actions, { ...added, key, operation, confirmedForSimulation: false }], strategies: built.rules.strategies.map(strategy => draft.strategies.find(existing => existing.participantKey === strategy.participantKey) ?? { ...strategy, confirmedForSimulation: false }) };
  return completed(source, invalidate(next, new Set([key])), true, key);
}

export function updateDraftAction(source: DraftSource, draft: RevisionDraft, key: string, patch: Partial<Omit<DraftAction, "key">>): DraftOperationResult {
  const original = draft.actions.find(action => action.key === key);
  if (!original || !sourceMatches(source, draft)) return fail("未找到当前行动或来源已变化，请重新载入。" );
  if (Object.keys(patch).every(field => field === "confirmedForSimulation")) return setDraftActionConfirmation(source, draft, key, patch.confirmedForSimulation ?? original.confirmedForSimulation);
  const replacement = { ...original, ...patch, key, confirmedForSimulation: false };
  const ordered = orderedActions(draft.actions.map(action => action.key === key ? replacement : action));
  if (!ordered.ok) return fail(ordered.message);
  const affected = dependentKeys([...draft.actions, ...ordered.actions], [key]);
  return completed(source, invalidate({ ...draft, actions: ordered.actions }, affected, new Set([original.pathKey, replacement.pathKey])), true);
}

export function setDraftActionConfirmation(source: DraftSource, draft: RevisionDraft, key: string, confirmed: boolean): DraftOperationResult {
  if (!draft.actions.some(action => action.key === key) || !sourceMatches(source, draft)) return fail("未找到当前行动或来源已变化。" );
  const validity = validateRevisionDraft(source, draft);
  if (confirmed && !validity.ok && validity.invalidActionKeys.includes(key)) return fail(validity.message);
  return completed(source, { ...draft, actions: draft.actions.map(action => action.key === key ? { ...action, confirmedForSimulation: confirmed } : action) }, false);
}

export function addDraftStrategy(source: DraftSource, draft: RevisionDraft, strategy: Omit<DraftStrategy, "confirmedForSimulation">): DraftOperationResult {
  if (!sourceMatches(source, draft) || draft.strategies.length >= 2 || draft.strategies.some(item => item.participantKey === strategy.participantKey) || !source.modelContext.agents.some(agent => agent.key === strategy.participantKey && agent.role === "user_variant")) return fail("最多添加两个已有平行分身的策略，每个分身只能有一个策略。" );
  const parsed = digitalLifeRulesSchema.shape.strategies.element.safeParse({ ...strategy, confirmedForSimulation: true });
  if (!parsed.success) return fail("请填写简短、安全的策略名称与来源说明。" );
  return completed(source, { ...draft, strategies: [...draft.strategies, { ...parsed.data, confirmedForSimulation: false }] }, true);
}

export function updateDraftStrategy(source: DraftSource, draft: RevisionDraft, key: string, patch: Partial<Omit<DraftStrategy, "participantKey">>): DraftOperationResult {
  const original = draft.strategies.find(strategy => strategy.participantKey === key);
  if (!original || !sourceMatches(source, draft)) return fail("未找到当前策略或来源已变化。" );
  if (Object.keys(patch).every(field => field === "confirmedForSimulation")) return setDraftStrategyConfirmation(source, draft, key, patch.confirmedForSimulation ?? original.confirmedForSimulation);
  const next = { ...draft, strategies: draft.strategies.map(strategy => strategy.participantKey === key ? { ...strategy, ...patch, participantKey: key, confirmedForSimulation: false } : strategy) };
  return completed(source, invalidate(next, dependentKeys(draft.actions, draft.actions.filter(action => action.pathKey === key).map(action => action.key)), new Set([key])), true);
}

export function setDraftStrategyConfirmation(source: DraftSource, draft: RevisionDraft, key: string, confirmed: boolean): DraftOperationResult {
  const strategy = draft.strategies.find(item => item.participantKey === key);
  if (!strategy || !sourceMatches(source, draft)) return fail("未找到当前策略或来源已变化。" );
  if (confirmed && (!digitalLifeRulesSchema.shape.strategies.element.safeParse({ ...strategy, confirmedForSimulation: true }).success || !draft.actions.some(action => action.pathKey === key && action.actorKey === key))) return fail("请填写安全的策略名称和来源，并添加本分身行动。" );
  return completed(source, { ...draft, strategies: draft.strategies.map(item => item.participantKey === key ? { ...item, confirmedForSimulation: confirmed } : item) }, false);
}

export function previewDraftRemoval(draft: RevisionDraft, selection: DraftSelection): { actionKeys: string[]; strategyKeys: string[] } {
  const initial = selection.kind === "action" ? draft.actions.filter(action => action.key === selection.key).map(action => action.key) : draft.actions.filter(action => action.pathKey === selection.participantKey).map(action => action.key);
  const removed = dependentKeys(draft.actions, initial);
  const strategies = new Set(draft.strategies.filter(strategy => (selection.kind === "strategy" && strategy.participantKey === selection.participantKey) || (draft.actions.some(action => removed.has(action.key) && action.pathKey === strategy.participantKey) && !draft.actions.some(action => !removed.has(action.key) && action.pathKey === strategy.participantKey && action.actorKey === strategy.participantKey))).map(strategy => strategy.participantKey));
  // Removing the final self action also removes the remaining conditional path rules.
  const allRemoved = dependentKeys(draft.actions, [...removed, ...draft.actions.filter(action => strategies.has(action.pathKey)).map(action => action.key)]);
  return { actionKeys: draft.actions.filter(action => allRemoved.has(action.key)).map(action => action.key), strategyKeys: draft.strategies.filter(strategy => strategies.has(strategy.participantKey)).map(strategy => strategy.participantKey) };
}

export function removeDraftSelection(source: DraftSource, draft: RevisionDraft, selection: DraftSelection, confirmed: boolean): DraftOperationResult {
  if (!confirmed) return fail("请先确认移除这条行动或策略及其全部后续规则。" );
  if (!sourceMatches(source, draft)) return fail("草稿来源已变化，请重新载入当前模型。" );
  const preview = previewDraftRemoval(draft, selection);
  if (!preview.actionKeys.length && !preview.strategyKeys.length) return fail("未找到要移除的行动或策略。" );
  const actions = draft.actions.filter(action => !preview.actionKeys.includes(action.key));
  const ordered = orderedActions(actions);
  if (!ordered.ok) return fail(ordered.message);
  const paths = new Set(draft.actions.filter(action => preview.actionKeys.includes(action.key)).map(action => action.pathKey));
  return completed(source, invalidate({ ...draft, actions: ordered.actions, strategies: draft.strategies.filter(strategy => !preview.strategyKeys.includes(strategy.participantKey)) }, new Set(), paths), true);
}

export function confirmedDraftRules(source: DraftSource, draft: RevisionDraft): DigitalLifeRules | null {
  if (!validateRevisionDraft(source, draft).ok) return null;
  const parsed = digitalLifeRulesSchema.safeParse(draft);
  return parsed.success ? parsed.data : null;
}
export function normalizeDraftForSave(source: DraftSource, draft: RevisionDraft): DigitalLifeRulesDraft | null {
  if (!validateRevisionDraft(source, draft).ok) return null;
  const parsed = digitalLifeRulesDraftSchema.safeParse(unconfirmed(draft));
  return parsed.success ? parsed.data : null;
}
