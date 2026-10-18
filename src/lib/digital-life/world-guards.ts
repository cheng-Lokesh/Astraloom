import type { DigitalLifeGuard, DigitalLifeRules } from "./model";
import type { WorldStateV2 } from "@/lib/v2/agent-world/types";

type Rule = { key: string; pathKey: string; actorKey: string; guard?: DigitalLifeGuard; operation: DigitalLifeRules["actions"][number]["operation"] };
type Context = { resources: Array<{ key: string; minimum: number; maximum: number; label?: string; unit?: string }>; variables?: Array<{ key: string; value: string; label?: string }> };

/** A definition can refer only to a frozen declared value, never introduce a new Reality fact. */
export function validateGuardDefinition(action: Rule, context: Context, actions: Rule[], pathSelf: string) {
  const guard = action.guard;
  if (!guard) return true;
  if (action.actorKey !== pathSelf) return false;
  if (guard.kind === "resource_balance") {
    const resource = context.resources.find(item => item.key === guard.resourceKey);
    return !!resource && Number.isFinite(guard.value) && guard.value >= resource.minimum && guard.value <= resource.maximum;
  }
  const variable = context.variables?.find(item => item.key === guard.variableKey);
  return !!variable && (variable.value === guard.value || actions.some(rule => rule.pathKey === action.pathKey && rule.operation.actionType === "update_external_variable" && rule.operation.variableKey === guard.variableKey && rule.operation.value === guard.value));
}

export function describeWorldGuard(guard: DigitalLifeGuard, context: Context): string {
  if (guard.kind === "resource_balance") {
    const resource = context.resources.find(item => item.key === guard.resourceKey);
    return `${resource?.label ?? "本人资源"}余额${guard.operator === "lte" ? "不高于" : "不低于"}${guard.value}${resource?.unit ?? ""}`;
  }
  return `${context.variables?.find(item => item.key === guard.variableKey)?.label ?? "环境条件"}等于“${guard.value}”`;
}

export function ruleAssumptionStatement(rule: Rule & { evidenceSummary: string }, context: Context) {
  return `用户确认的条件模拟规则：${rule.operation.actionType}。${rule.guard ? `触发条件：${describeWorldGuard(rule.guard, context)}。` : ""}依据：${rule.evidenceSummary}`;
}

export function observeWorldGuard(guard: DigitalLifeGuard, world: WorldStateV2, actorId: string, resources: Map<string, string>, variables?: Map<string, string>) {
  if (guard.kind === "resource_balance") {
    const resource = world.resources.find(item => item.id === resources.get(guard.resourceKey));
    if (!resource || resource.controllerAgentId !== actorId) return null;
    return { value: resource.available, satisfied: guard.operator === "lte" ? resource.available <= guard.value : resource.available >= guard.value, provenance: resource.provenance, targetId: resource.id };
  }
  const variable = world.externalVariables.find(item => item.id === variables?.get(guard.variableKey));
  if (!variable || variable.variableType !== "enum") return null;
  return { value: variable.value, satisfied: variable.value === guard.value, provenance: variable.provenance, targetId: variable.id };
}
