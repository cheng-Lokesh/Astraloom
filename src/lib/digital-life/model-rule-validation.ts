import { digitalLifeRulesDraftSchema, type DigitalLifeRulesDraft, type SafeDigitalLifeCorrectionContext } from "@/lib/formal-sandbox/correction-context";

export type DraftAction = Omit<DigitalLifeRulesDraft["actions"][number], "confirmedForSimulation"> & { confirmedForSimulation: boolean };
export type DraftStrategy = Omit<DigitalLifeRulesDraft["strategies"][number], "confirmedForSimulation"> & { confirmedForSimulation: boolean };
export type RevisionDraft = Omit<DigitalLifeRulesDraft, "actions" | "strategies"> & { actions: DraftAction[]; strategies: DraftStrategy[] };
export type DraftSource = Pick<SafeDigitalLifeCorrectionContext, "modelContext" | "horizonDays">;
export type DraftValidation = { ok: true } | { ok: false; message: string; invalidActionKeys: string[] };

const unconfirmed = (draft: RevisionDraft) => ({ ...draft, actions: draft.actions.map(action => ({ ...action, confirmedForSimulation: false as const })), strategies: draft.strategies.map(strategy => ({ ...strategy, confirmedForSimulation: false as const })) });

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
  const unchangedEnvironment = draft.actions.filter(action => {
    const operation = action.operation;
    return operation.actionType === "update_external_variable" && context.variables?.some(variable => variable.key === operation.variableKey && variable.value === operation.value.trim());
  });
  if (unchangedEnvironment.length) return invalid("新环境条件与原值相同，请填写一个不同的模拟条件后重新确认。", [...dependentKeys(draft.actions, unchangedEnvironment.map(action => action.key))]);
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
    } else if (operation.actionType === "update_external_variable") {
      valid &&= !thirdParty && action.actorKey === self && !!context.variables?.some(variable => variable.key === operation.variableKey) && draft.actions.filter(item => item.pathKey === action.pathKey && item.operation.actionType === "update_external_variable").length === 1;
    } else valid &&= !thirdParty;
    if (!valid) invalidKeys.push(action.key);
    seen.set(action.key, action);
  }
  return invalidKeys.length ? invalid("请检查人物、既有关系、资源余额和本路径前置行动；换询问对象后，须明确重配或删除原回应。", [...dependentKeys(draft.actions, invalidKeys)]) : { ok: true };
}
