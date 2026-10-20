import { listRealityProfileEntries, type RealityProfileField } from "@/lib/reality-profile/profile";
import {
  LifeClimateB3Error, LIFE_CLIMATE_B3_VERSION, lifeClimateB3FrozenSourceSchema, lifeClimateB3RequestSchema, lifeClimateB3RunSchema,
  type LifeClimateB3Assumption, type LifeClimateB3Condition, type LifeClimateB3Event,
  type LifeClimateB3Request, type LifeClimateB3Rule, type LifeClimateB3Run, type LifeClimateB3Stage,
} from "./contracts";
import { canonicalLifeClimateB3Json, createLifeClimateB3ConfirmationContext, createLifeClimateB3SourceContext, hashLifeClimateB3Value, sha256LifeClimateB3Text } from "./context";
import { createLifeClimateB3SymbolicSourceContext, getLifeClimateB3StageWindows, lifeClimateB3StageCount } from "./source";

const ZERO = BigInt(0), SCALE = BigInt(1000000), LIMIT = BigInt("1000000000000000000000000");
const clone = <T>(value: T): T => structuredClone(value);
function fail(code = "invalid_b3_request"): never { throw new LifeClimateB3Error(code); }
function decimal(value: string): bigint {
  const [whole, fraction = ""] = value.split(".");
  const parsed = BigInt(whole) * SCALE + BigInt(fraction.padEnd(6, "0"));
  if (parsed > LIMIT) fail("b3_arithmetic_limit");
  return parsed;
}
function format(value: bigint): string {
  const negative = value < ZERO, absolute = negative ? -value : value;
  if (absolute > LIMIT) fail("b3_arithmetic_limit");
  const whole = absolute / SCALE, fraction = String(absolute % SCALE).padStart(6, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}
function unique(values: string[]) { return new Set(values).size === values.length; }
function sameSet(actual: string[], expected: string[]) { return unique(actual) && actual.length === expected.length && expected.every((id) => actual.includes(id)); }
const phase = (rule: LifeClimateB3Rule) => rule.kind === "scenario_change" ? 0 : rule.kind === "relocation" || rule.kind === "one_time_resource_change" ? 1 : rule.kind === "recurring_resource_flow" ? 2 : rule.kind === "investment_cycle" ? 3 : 4;
type Truth = "satisfied" | "constrained" | "unknown";
function combine(values: Truth[]): Truth { return values.includes("constrained") ? "constrained" : values.includes("unknown") ? "unknown" : "satisfied"; }
type ResourceDeclaration = LifeClimateB3Request["model"]["resources"][number];
type ResourceRuntime = { declaration: ResourceDeclaration; amount: bigint | null; status: "known" | "unknown" | "constrained"; shortfall: bigint | null };
type InvestmentRuntime = { unit: string; amount: bigint | null };
type ContextRuntime = LifeClimateB3Stage["contextStates"][number];
type Change = { target: string; label: string; before: string | number | null; after: string | number | null };

function resourceTargets(rule: LifeClimateB3Rule): string[] {
  if (rule.kind === "recurring_resource_flow" || rule.kind === "one_time_resource_change") return [rule.resourceId];
  if (rule.kind === "investment_cycle") return [rule.timeResourceId, rule.budgetResourceId];
  if (rule.kind === "relocation") return [rule.budgetResourceId];
  return [];
}

async function normalize(sourceInput: unknown, requestInput: unknown) {
  canonicalLifeClimateB3Json(sourceInput);
  canonicalLifeClimateB3Json(requestInput);
  const sourceParsed = lifeClimateB3FrozenSourceSchema.safeParse(sourceInput);
  if (!sourceParsed.success) fail("invalid_b3_source");
  const source = sourceParsed.data;
  const context = await createLifeClimateB3SourceContext(source.view);
  if (source.sourceContext !== context || source.binding.profileRevision !== source.view.profile.revision || source.view.scopeKey !== await sha256LifeClimateB3Text(source.binding.seedContextId)) fail("invalid_b3_source");
  const requestParsed = lifeClimateB3RequestSchema.safeParse(requestInput);
  if (!requestParsed.success) fail();
  const request = requestParsed.data;
  if (request.profileRevision !== source.binding.profileRevision || request.sourceContext !== context) fail("b3_source_stale");
  const { confirmation, ...unconfirmed } = request;
  if (confirmation.context !== await createLifeClimateB3ConfirmationContext(unconfirmed)) fail("b3_confirmation_mismatch");
  const model = request.model;
  const allRules = [...model.commonRules, ...model.alternatives.flatMap((path) => path.rules)];
  if (!sameSet(confirmation.assumptionIds, model.assumptions.map((item) => item.id)) || !sameSet(confirmation.ruleIds, allRules.map((item) => item.id)) || !sameSet(confirmation.pathIds, ["baseline", ...model.alternatives.map((path) => path.id)])) fail("b3_confirmation_mismatch");
  if (!unique(model.resources.map((item) => item.id)) || !unique(model.assumptions.map((item) => item.id)) || !unique(allRules.map((item) => item.id)) || !unique(model.alternatives.map((item) => item.id)) || !unique(model.alternatives.map((item) => item.label))) fail();
  const profileResourceBindings = model.resources.flatMap((item) => item.initial.kind === "profile_resource" ? [item.initial.resourceKey] : []);
  if (!unique(profileResourceBindings)) fail();
  if (!sameSet(model.constraintBindings.map((item) => item.constraintKey), source.view.profile.worldInputs.constraints.map((item) => item.key))) fail();
  const assumptions = new Map(model.assumptions.map((item) => [item.id, item]));
  const resources = new Map(model.resources.map((item) => [item.id, item]));
  const entries = new Map(listRealityProfileEntries(source.view.profile).map((entry) => [entry.key, entry]));
  const profileResources = new Map(source.view.profile.worldInputs.resources.map((item) => [item.key, item]));
  const refs = new Set([...entries.keys(), ...[...profileResources.keys()].map((key) => `worldInputs.resources.${key}`), ...source.view.profile.worldInputs.constraints.map((item) => `worldInputs.constraints.${item.key}`)]);
  const amount = (id: string, unit?: string, periodUnit?: "once" | "quarter" | "year") => {
    const item = assumptions.get(id);
    if (!item || item.kind !== "quantity" || unit && item.unit !== unit || periodUnit && item.periodUnit !== periodUnit) fail();
    if (item.value !== null) decimal(item.value);
    return item;
  };
  const state = (id: string) => { const item = assumptions.get(id); if (!item || item.kind !== "state") fail(); return item; };
  for (const resource of model.resources) {
    if (decimal(resource.minimum) > decimal(resource.maximum)) fail();
    if (resource.initial.kind === "profile_resource") {
      const initial = profileResources.get(resource.initial.resourceKey);
      if (!initial || initial.unit !== resource.unit || (initial.resourceType === "budget" || initial.resourceType === "time" ? initial.resourceType : "other") !== resource.resourceType || decimal(String(initial.minimum)) !== decimal(resource.minimum) || decimal(String(initial.maximum)) !== decimal(resource.maximum)) fail();
    } else if (resource.initial.kind === "assumption") {
      const value = amount(resource.initial.assumptionId, resource.unit, "once").value;
      if (value !== null && (decimal(value) < decimal(resource.minimum) || decimal(value) > decimal(resource.maximum))) fail();
    }
  }
  for (const binding of model.constraintBindings) if (binding.mode === "narrowed_stage_limit") {
    const value = amount(binding.assumptionId, "阶段", "once").value;
    if (value !== String(binding.lastStage) || binding.lastStage > lifeClimateB3StageCount(request.horizon)) fail();
  }
  for (const path of [{ id: "baseline", rules: [] as LifeClimateB3Rule[] }, ...model.alternatives]) {
    const rules = [...model.commonRules, ...path.rules];
    const ruleMap = new Map(rules.map((rule) => [rule.id, rule]));
    const investments = new Map<string, Extract<LifeClimateB3Rule, { kind: "investment_cycle" }>>();
    for (const rule of rules) if (rule.kind === "investment_cycle") { if (investments.has(rule.investmentId)) fail(); investments.set(rule.investmentId, rule); }
    const orderKeys = rules.map((rule) => `${phase(rule)}:${rule.order}`);
    if (!unique(orderKeys)) fail();
    for (const rule of rules) {
      if (!unique(rule.stages.map(String)) || rule.stages.some((value, index) => index > 0 && value <= rule.stages[index - 1]) || !unique(rule.assumptionRefs) || !unique(rule.sourceRefs) || rule.assumptionRefs.some((ref) => !assumptions.has(ref)) || rule.sourceRefs.some((ref) => !refs.has(ref))) fail();
      const used: string[] = [];
      const qty = (id: string, unit?: string, periodUnit?: "once" | "quarter" | "year") => { used.push(id); return amount(id, unit, periodUnit); };
      const val = (id: string) => { used.push(id); return state(id); };
      const res = (id: string, type?: string) => { const value = resources.get(id); if (!value || type && value.resourceType !== type) fail(); return value; };
      for (const target of resourceTargets(rule)) res(target);
      if (["scenario_change", "one_time_resource_change", "relocation", "guarded_structure_transition"].includes(rule.kind) && rule.stages.length !== 1) fail();
      if (rule.kind === "scenario_change") {
        if (!entries.has(rule.sourceEntryKey) || rule.sourceEntryKey.startsWith("lifeModelDomains.")) fail();
        val(rule.valueAssumptionId);
      } else if (rule.kind === "one_time_resource_change") qty(rule.amountAssumptionId, res(rule.resourceId).unit, "once");
      else if (rule.kind === "recurring_resource_flow") {
        if (!sameSet(rule.amountByStage.map((item) => String(item.stageIndex)), rule.stages.map(String))) fail();
        for (const item of rule.amountByStage) qty(item.amountAssumptionId, res(rule.resourceId).unit, request.periodUnit);
      } else if (rule.kind === "relocation") {
        if (!rule.targetEntryKey.startsWith("lifeModelDomains.environment.") || !entries.has(rule.targetEntryKey)) fail();
        val(rule.valueAssumptionId); qty(rule.costAmountAssumptionId, res(rule.budgetResourceId, "budget").unit, "once");
      } else if (rule.kind === "investment_cycle") {
        const time = res(rule.timeResourceId, "time"), budget = res(rule.budgetResourceId, "budget");
        qty(rule.initialProgressAssumptionId, time.unit, "once"); qty(rule.timeAmountAssumptionId, time.unit, request.periodUnit); qty(rule.costAmountAssumptionId, budget.unit, request.periodUnit);
      } else if (rule.kind === "guarded_structure_transition") {
        if (!rule.guard || !unique(rule.effects.map((effect) => effect.targetEntryKey))) fail();
        for (const effect of rule.effects) { if (!effect.targetEntryKey.startsWith("lifeModelDomains.") || !entries.has(effect.targetEntryKey)) fail(); val(effect.valueAssumptionId); }
      } else if (rule.kind === "transition_readiness") {
        if (!investments.has(rule.investmentId) || !rule.guard?.all.some((condition) => condition.kind === "investment_at_least" && condition.investmentId === rule.investmentId) || !rule.guard.all.some((condition) => condition.kind === "resource_at_least")) fail();
      }
      for (const guard of rule.guard?.all ?? []) {
        if (guard.kind === "resource_at_least") qty(guard.amountAssumptionId, res(guard.resourceId).unit, "once");
        else if (guard.kind === "investment_at_least") { const investment = investments.get(guard.investmentId); if (!investment) fail(); qty(guard.amountAssumptionId, res(investment.timeResourceId).unit, "once"); }
        else if (guard.kind === "source_state_is") { if (!entries.has(guard.sourceEntryKey)) fail(); val(guard.valueAssumptionId); }
        else {
          const previous = ruleMap.get(guard.ruleId);
          if (!previous || previous.id === rule.id || rule.stages.some((at) => !previous.stages.some((before) => before < at || before === at && (phase(previous) < phase(rule) || phase(previous) === phase(rule) && previous.order < rule.order)))) fail();
        }
      }
      if (used.some((ref) => !rule.assumptionRefs.includes(ref))) fail();
    }
  }
  if (source.symbolic) {
    const { sourceContext: symbolicContext, ...content } = source.symbolic;
    if (symbolicContext !== await createLifeClimateB3SymbolicSourceContext(content) || source.symbolic.series.some((point, index) => point.stageIndex !== index + 1 || point.status === "available" && point.frame.sourceVersion !== source.symbolic!.sourceVersion) || source.symbolic.series.length !== lifeClimateB3StageCount(source.symbolic.horizon) || (source.symbolic.horizon === "1_year") !== (source.symbolic.periodUnit === "quarter")) fail("invalid_b3_source");
  }
  if (request.symbolic.enabled && (!source.symbolic || source.symbolic.sourceContext !== request.symbolic.sourceContext || source.symbolic.horizon !== request.horizon || source.symbolic.periodUnit !== request.periodUnit)) fail("b3_source_stale");
  return { source, request, assumptions, entries, profileResources };
}

export async function buildLifeClimateB3Run(sourceInput: unknown, requestInput: unknown): Promise<LifeClimateB3Run> {
  const { source, request, assumptions, entries, profileResources } = await normalize(sourceInput, requestInput);
  const model = request.model;
  const coreSignature = await hashLifeClimateB3Value({ version: LIFE_CLIMATE_B3_VERSION, sourceContext: request.sourceContext, binding: source.binding, horizon: request.horizon, periodUnit: request.periodUnit, model });
  const events: LifeClimateB3Event[] = [];
  const paths: LifeClimateB3Run["paths"] = [];
  const windows = getLifeClimateB3StageWindows(source.binding.assessedAt, request.horizon, request.periodUnit);
  const quantity = (id: string): bigint | null => { const value = assumptions.get(id) as Extract<LifeClimateB3Assumption, { kind: "quantity" }>; return value.value === null ? null : decimal(value.value); };
  const stateValue = (id: string) => (assumptions.get(id) as Extract<LifeClimateB3Assumption, { kind: "state" }>).value;
  for (const definition of [{ id: "baseline", label: "不增加新变化条件的对照", rules: [] as LifeClimateB3Rule[] }, ...model.alternatives]) {
    const rules = [...model.commonRules, ...definition.rules].sort((a, b) => phase(a) - phase(b) || a.order - b.order);
    const resourceMap = new Map<string, ResourceRuntime>();
    for (const declaration of model.resources) {
      let amount: bigint | null = null;
      if (declaration.initial.kind === "profile_resource") amount = decimal(String(profileResources.get(declaration.initial.resourceKey)!.available));
      else if (declaration.initial.kind === "assumption") amount = quantity(declaration.initial.assumptionId);
      resourceMap.set(declaration.id, { declaration, amount, status: amount === null ? "unknown" : "known", shortfall: null });
    }
    const investmentMap = new Map<string, InvestmentRuntime>();
    for (const rule of rules) if (rule.kind === "investment_cycle") investmentMap.set(rule.investmentId, { unit: resourceMap.get(rule.timeResourceId)!.declaration.unit, amount: quantity(rule.initialProgressAssumptionId) });
    const contexts = new Map<string, ContextRuntime>([...entries].map(([key, entry]) => [key, { sourceEntryKey: key, label: entry.label, value: entry.field.classification === "unknown" ? null : entry.field.value, classification: entry.field.classification, source: "frozen_profile", sourceRefs: [key], assumptionRefs: [], evidenceEventIds: [] }]));
    const domains = clone(source.view.profile.lifeModelDomains);
    const latest = new Map<string, string>();
    const succeeded = new Set<string>();
    const executions = new Map<string, { status: string; stageIndex: number }>();
    const transitions = new Map<string, LifeClimateB3Stage["transitions"][number]>();
    const obligations: LifeClimateB3Stage["obligations"] = [];
    const stages: LifeClimateB3Stage[] = [];
    let sequence = 0;
    const deriveReferences = (rule: LifeClimateB3Rule) => {
      const sourceRefs = new Set(rule.sourceRefs), assumptionRefs = new Set(rule.assumptionRefs);
      const resourceIds = new Set(resourceTargets(rule));
      const investmentIds = new Set<string>();
      if (rule.kind === "scenario_change") sourceRefs.add(rule.sourceEntryKey);
      if (rule.kind === "relocation") sourceRefs.add(rule.targetEntryKey);
      if (rule.kind === "guarded_structure_transition") for (const effect of rule.effects) sourceRefs.add(effect.targetEntryKey);
      if (rule.kind === "investment_cycle" || rule.kind === "transition_readiness") investmentIds.add(rule.investmentId);
      for (const guard of rule.guard?.all ?? []) {
        if (guard.kind === "source_state_is") sourceRefs.add(guard.sourceEntryKey);
        else if (guard.kind === "resource_at_least") resourceIds.add(guard.resourceId);
        else if (guard.kind === "investment_at_least") investmentIds.add(guard.investmentId);
      }
      for (const investmentId of investmentIds) {
        const investment = rules.find((item): item is Extract<LifeClimateB3Rule, { kind: "investment_cycle" }> => item.kind === "investment_cycle" && item.investmentId === investmentId)!;
        assumptionRefs.add(investment.initialProgressAssumptionId);
        resourceIds.add(investment.timeResourceId); resourceIds.add(investment.budgetResourceId);
      }
      for (const id of resourceIds) {
        const resource = resourceMap.get(id)!.declaration;
        if (resource.initial.kind === "profile_resource") sourceRefs.add(`worldInputs.resources.${resource.initial.resourceKey}`);
        else if (resource.initial.kind === "assumption") assumptionRefs.add(resource.initial.assumptionId);
      }
      return { sourceRefs, assumptionRefs };
    };
    const condition = (guard: LifeClimateB3Condition): Truth => {
      if (guard.kind === "rule_executed") {
        const referenced = rules.find((rule) => rule.id === guard.ruleId)!;
        // Repeated required obligations depend on their latest assessment, not a past payment.
        // Historical one-time actions and accumulated investment keep their completed evidence.
        if (referenced.kind === "recurring_resource_flow" && referenced.obligation === "required") {
          const latestExecution = executions.get(guard.ruleId);
          return latestExecution?.status === "unknown" ? "unknown" : latestExecution?.status === "conditions_met" ? "satisfied" : "constrained";
        }
        return succeeded.has(guard.ruleId) ? "satisfied" : "constrained";
      }
      if (guard.kind === "source_state_is") {
        const before = contexts.get(guard.sourceEntryKey)!.value, expected = stateValue(guard.valueAssumptionId);
        return before === null || expected === null ? "unknown" : before === expected ? "satisfied" : "constrained";
      }
      const threshold = quantity(guard.amountAssumptionId);
      if (guard.kind === "resource_at_least") {
        const resource = resourceMap.get(guard.resourceId)!;
        return resource.status === "constrained" ? "constrained" : resource.amount === null || threshold === null ? "unknown" : resource.amount >= threshold ? "satisfied" : "constrained";
      }
      const investment = investmentMap.get(guard.investmentId)!;
      return investment.amount === null || threshold === null ? "unknown" : investment.amount >= threshold ? "satisfied" : "constrained";
    };
    for (const window of windows) {
      const stageIndex = window.stageIndex;
      const constraintStates: LifeClimateB3Stage["constraints"] = source.view.profile.worldInputs.constraints.map((constraint) => {
        const binding = model.constraintBindings.find((item) => item.constraintKey === constraint.key)!;
        const deadline = Date.parse(constraint.rule.value), start = Date.parse(window.startAt), end = Date.parse(window.endAt);
        let status: Truth = deadline <= start ? "constrained" : deadline < end ? "unknown" : "satisfied";
        let reason: LifeClimateB3Stage["constraints"][number]["reason"] = deadline <= start ? "deadline_passed" : deadline < end ? "deadline_inside_stage" : "before_deadline";
        if (binding.mode === "narrowed_stage_limit" && stageIndex > binding.lastStage) { status = "constrained"; reason = "narrowed_stage_limit"; }
        return { constraintKey: constraint.key, label: constraint.label, resourceLabel: profileResources.get(constraint.resourceKey)!.label, resourceIds: model.resources.filter((item) => item.initial.kind === "profile_resource" && item.initial.resourceKey === constraint.resourceKey).map((item) => item.id), status, reason, sourceRefs: [`worldInputs.constraints.${constraint.key}`], assumptionRefs: binding.mode === "narrowed_stage_limit" ? [binding.assumptionId] : [] };
      });
      for (const rule of rules.filter((item) => item.stages.includes(stageIndex))) {
        const changes: Change[] = [];
        const touched = new Set<string>();
        const guardTargets = (rule.guard?.all ?? []).flatMap((item) => item.kind === "resource_at_least" ? [`resource:${item.resourceId}`] : item.kind === "investment_at_least" ? [`investment:${item.investmentId}`] : item.kind === "source_state_is" ? [`context:${item.sourceEntryKey}`] : [`execution:${item.ruleId}`]);
        const ownTargets = rule.kind === "scenario_change" ? [`context:${rule.sourceEntryKey}`] : rule.kind === "relocation" ? [`context:${rule.targetEntryKey}`] : rule.kind === "guarded_structure_transition" ? rule.effects.map((effect) => `context:${effect.targetEntryKey}`) : rule.kind === "investment_cycle" ? [`investment:${rule.investmentId}`] : [];
        const priorIds = [...new Set([...resourceTargets(rule).map((target) => `resource:${target}`), ...guardTargets, ...ownTargets].flatMap((target) => latest.has(target) ? [latest.get(target)!] : []))];
        const previousExecution = executions.get(rule.id);
        const explicit = combine((rule.guard?.all ?? []).map(condition));
        // Current-stock guards read the same bounded resource as consuming operations.
        // Historical investment guards read completed progress, not today's time/budget availability.
        const currentResourceIds = new Set([...resourceTargets(rule), ...(rule.guard?.all ?? []).flatMap((guard) => guard.kind === "resource_at_least" ? [guard.resourceId] : [])]);
        const applicableConstraints = constraintStates.filter((item) => item.resourceIds.some((id) => currentResourceIds.has(id)));
        let outcome = combine([explicit, ...applicableConstraints.map((item) => item.status)]);
        const add = (target: string, label: string, before: Change["before"], after: Change["after"]) => { if (before !== after) { changes.push({ target, label, before, after }); touched.add(target); } };
        const resourceStatus = (target: string): Truth => resourceMap.get(target)!.status === "known" ? "satisfied" : resourceMap.get(target)!.status === "constrained" ? "constrained" : "unknown";
        let obligation: LifeClimateB3Stage["obligations"][number] | null = null;
        let flowAmount: bigint | null = null;
        if (rule.kind === "recurring_resource_flow") {
          flowAmount = quantity(rule.amountByStage.find((item) => item.stageIndex === stageIndex)!.amountAssumptionId);
          if (rule.obligation === "required") obligation = { ruleId: rule.id, stageIndex, resourceId: rule.resourceId, resourceLabel: resourceMap.get(rule.resourceId)!.declaration.label, kind: rule.direction === "credit" ? "inflow_assumption" : "outflow_obligation", status: "unknown", requestedAmount: flowAmount === null ? null : format(flowAmount), paidAmount: null, shortfall: null, evidenceEventIds: [] };
        }
        if (explicit === "constrained" && rule.kind !== "transition_readiness") {
          if (obligation) { obligation.status = "not_applicable"; obligation.paidAmount = "0"; obligation.evidenceEventIds = priorIds; obligations.push(obligation); }
          if (rule.kind === "recurring_resource_flow" && rule.obligation === "required") executions.set(rule.id, { status: "not_applicable", stageIndex });
          continue;
        }
        const plannedDeltas: Array<{ id: string; delta: bigint | null }> = [];
        if (rule.kind === "one_time_resource_change") { const value = quantity(rule.amountAssumptionId); plannedDeltas.push({ id: rule.resourceId, delta: value === null ? null : rule.direction === "credit" ? value : -value }); }
        else if (rule.kind === "recurring_resource_flow") plannedDeltas.push({ id: rule.resourceId, delta: flowAmount === null ? null : rule.direction === "credit" ? flowAmount : -flowAmount });
        else if (rule.kind === "relocation") { const value = quantity(rule.costAmountAssumptionId); plannedDeltas.push({ id: rule.budgetResourceId, delta: value === null ? null : -value }); if (stateValue(rule.valueAssumptionId) === null) outcome = combine([outcome, "unknown"]); }
        else if (rule.kind === "investment_cycle") {
          const time = quantity(rule.timeAmountAssumptionId), cost = quantity(rule.costAmountAssumptionId);
          plannedDeltas.push({ id: rule.timeResourceId, delta: time === null ? null : -time }, { id: rule.budgetResourceId, delta: cost === null ? null : -cost });
        } else if (rule.kind === "scenario_change" && stateValue(rule.valueAssumptionId) === null || rule.kind === "guarded_structure_transition" && rule.effects.some((effect) => stateValue(effect.valueAssumptionId) === null)) outcome = combine([outcome, "unknown"]);
        let deficit: bigint | null = null;
        for (const planned of plannedDeltas) {
          const resource = resourceMap.get(planned.id)!;
          outcome = combine([outcome, resourceStatus(planned.id)]);
          if (planned.delta === null || resource.amount === null) outcome = combine([outcome, "unknown"]);
          else {
            const projected = resource.amount + planned.delta;
            format(projected);
            if (projected < decimal(resource.declaration.minimum)) { outcome = "constrained"; deficit = decimal(resource.declaration.minimum) - projected; }
            else if (projected > decimal(resource.declaration.maximum)) outcome = "constrained";
          }
        }
        let kind: LifeClimateB3Event["kind"] = "resource_change";
        let summary = "按已确认的资源条件执行阶段变化。";
        if (outcome !== "satisfied") {
          kind = outcome === "unknown" ? "guard_unknown" : "guard_constrained";
          summary = outcome === "unknown" ? "这项明确尝试存在未知前提，未执行其状态变化。" : "这项明确尝试未满足资源或阶段前提，未执行其状态变化。";
          if (obligation) {
            const resource = resourceMap.get(rule.kind === "recurring_resource_flow" ? rule.resourceId : "")!;
            const before = resource.amount === null ? null : format(resource.amount);
            const statusBefore = resource.status;
            resource.status = outcome === "unknown" ? "unknown" : "constrained";
            if (outcome === "unknown") resource.amount = null;
            resource.shortfall = deficit;
            add(`resource:${resource.declaration.id}`, resource.declaration.label, before, resource.amount === null ? null : format(resource.amount));
            add(`resource-status:${resource.declaration.id}`, resource.declaration.label, statusBefore, resource.status);
            touched.add(`resource:${resource.declaration.id}`);
            obligation.status = outcome === "unknown" ? "unknown" : "unfunded";
            obligation.paidAmount = "0"; obligation.shortfall = deficit === null ? null : format(deficit);
          }
        } else {
          for (const planned of plannedDeltas) {
            const resource = resourceMap.get(planned.id)!;
            const before = format(resource.amount!); resource.amount = resource.amount! + planned.delta!;
            add(`resource:${planned.id}`, resource.declaration.label, before, format(resource.amount));
          }
          if (obligation) { obligation.status = "fulfilled"; obligation.paidAmount = flowAmount === null ? null : format(flowAmount); }
          const setContext = (key: string, assumptionId: string) => {
            const current = contexts.get(key)!;
            const value = stateValue(assumptionId)!;
            add(`context:${key}`, current.label, current.value, value);
            if (current.value !== value) {
              add(`context-classification:${key}`, current.label, current.classification, "assumption");
              current.value = value; current.classification = "assumption"; current.source = "simulation_condition"; current.assumptionRefs = [assumptionId];
              const domainMatch = /^lifeModelDomains\.(identity|career|wealth|relationships|environment|lifeStage)\.([1-8])$/.exec(key);
              if (domainMatch) domains[domainMatch[1] as keyof Omit<typeof domains, "version">][Number(domainMatch[2]) - 1] = { value, classification: "assumption", evidenceSummary: assumptions.get(assumptionId)!.evidenceSummary } as RealityProfileField;
              touched.add(`context:${key}`);
            }
          };
          if (rule.kind === "scenario_change") { setContext(rule.sourceEntryKey, rule.valueAssumptionId); kind = "scenario_change"; summary = "按单独确认的外部情景更新此阶段背景。"; }
          else if (rule.kind === "relocation") { setContext(rule.targetEntryKey, rule.valueAssumptionId); kind = "relocation"; summary = "一次迁居条件生效，并按明确成本减少储备。"; }
          else if (rule.kind === "guarded_structure_transition") { for (const effect of rule.effects) setContext(effect.targetEntryKey, effect.valueAssumptionId); kind = "structure_transition"; summary = "守卫条件满足后，应用明确的跨域结构假设。"; }
          else if (rule.kind === "investment_cycle") {
            const investment = investmentMap.get(rule.investmentId)!;
            const before = investment.amount === null ? null : format(investment.amount);
            investment.amount = investment.amount === null ? null : investment.amount + quantity(rule.timeAmountAssumptionId)!;
            add(`investment:${rule.investmentId}`, "累计投入", before, investment.amount === null ? null : format(investment.amount));
            kind = "investment"; summary = "按明确成本与有限时间存量完成本阶段投入；不推断能力增长。";
          }
        }
        if (rule.kind === "transition_readiness") {
          const status = outcome === "satisfied" ? "conditions_met" : outcome;
          transitions.set(rule.id, { ruleId: rule.id, domain: rule.domain, status });
          if (outcome === "satisfied") { kind = "transition_readiness"; summary = "已确认的投入与储备门槛满足，可进入转型尝试；录用与新收入仍未建立。"; }
        }
        const executionStatus = outcome === "satisfied" ? "conditions_met" : outcome;
        // A scheduled attempted rule has an execution assessment. Static inputs alone never create Events.
        if (outcome !== "satisfied" || rule.kind === "transition_readiness") {
          add(`execution:${rule.id}`, "规则条件评估", previousExecution?.status ?? null, executionStatus);
          add(`execution-stage:${rule.id}`, "评估阶段", previousExecution?.stageIndex ?? null, stageIndex);
          touched.add(`execution:${rule.id}`);
        }
        executions.set(rule.id, { status: executionStatus, stageIndex });
        if (changes.length > 0) {
          sequence += 1;
          const eventId = await hashLifeClimateB3Value({ coreSignature, pathId: definition.id, stageIndex, sequence, ruleId: rule.id });
          const references = deriveReferences(rule);
          for (const constraint of applicableConstraints) {
            references.sourceRefs.add(`worldInputs.constraints.${constraint.constraintKey}`);
            for (const ref of constraint.assumptionRefs) references.assumptionRefs.add(ref);
          }
          const event: LifeClimateB3Event = { id: eventId, kind, pathId: definition.id, stageIndex, sequence, ruleId: rule.id, summary, sourceRefs: [...references.sourceRefs], assumptionRefs: [...references.assumptionRefs], before: changes.map((change) => ({ target: change.target, label: change.label, value: change.before })), after: changes.map((change) => ({ target: change.target, label: change.label, value: change.after })), causalEventIds: priorIds };
          events.push(event);
          for (const target of touched) latest.set(target, eventId);
          latest.set(`execution:${rule.id}`, eventId);
          for (const target of touched) if (target.startsWith("context:")) contexts.get(target.slice(8))!.evidenceEventIds = [eventId];
          if (obligation) obligation.evidenceEventIds = [eventId];
          if (outcome === "satisfied") succeeded.add(rule.id);
        }
        if (obligation) obligations.push(obligation);
      }
      stages.push({ stageIndex, label: request.periodUnit === "quarter" ? `第 ${stageIndex} 阶段（季度）` : `第 ${stageIndex} 年`, lifeModelDomains: clone(domains), contextStates: clone([...contexts.values()].filter((item) => !item.sourceEntryKey.startsWith("lifeModelDomains."))), constraints: clone(constraintStates), obligations: clone(obligations), resources: [...resourceMap].map(([id, item]) => ({ id, label: item.declaration.label, unit: item.declaration.unit, balance: item.amount === null ? null : format(item.amount), status: item.status, shortfall: item.shortfall === null ? null : format(item.shortfall) })), investments: [...investmentMap].map(([id, item]) => ({ id, unit: item.unit, amount: item.amount === null ? null : format(item.amount), status: item.amount === null ? "unknown" : "known" })), transitions: clone([...transitions.values()]) });
    }
    paths.push({ id: definition.id, label: definition.label, basis: definition.id === "baseline" ? "explicit_common_conditions" : "explicit_path_conditions", stages });
  }
  const claims: LifeClimateB3Run["claims"] = [];
  for (const event of events) claims.push({ id: await hashLifeClimateB3Value({ eventId: event.id, version: LIFE_CLIMATE_B3_VERSION, kind: "claim" }), type: event.kind === "investment" ? "investment_projection" : event.kind === "transition_readiness" ? "transition_conditions" : event.kind === "guard_unknown" || event.kind === "guard_constrained" ? "conditional_constraint" : event.kind === "resource_change" ? "resource_projection" : "conditional_structure_change", pathId: event.pathId, summary: event.summary, uncertainty: "这是明确条件下的模拟记录，不是现实已经发生的证据、录用保证、收入承诺或现实概率；未知前提仍保持未知。", evidenceEventIds: [event.id], sourceRefs: event.sourceRefs, assumptionRefs: event.assumptionRefs });
  const comparisons: LifeClimateB3Run["comparisons"] = [];
  for (const alternative of paths.slice(1)) for (const current of alternative.stages) {
    const baseline = paths[0].stages[current.stageIndex - 1];
    comparisons.push({ baselinePathId: "baseline", alternativePathId: alternative.id, stageIndex: current.stageIndex, resourceDifferences: current.resources.map((resource) => {
      const baseResource = baseline.resources.find((item) => item.id === resource.id)!;
      const status = resource.status === "constrained" || baseResource.status === "constrained" ? "constrained" : resource.balance === null || baseResource.balance === null ? "unknown" : "known";
      const evidenceEventIds = events.filter((event) => (event.pathId === "baseline" || event.pathId === alternative.id) && event.stageIndex <= current.stageIndex && [...event.before, ...event.after].some((entry) => entry.target === `resource:${resource.id}`)).map((event) => event.id);
      return { resourceId: resource.id, status, baselineValue: baseResource.balance, alternativeValue: resource.balance, difference: status === "known" ? format(decimal(resource.balance!) - decimal(baseResource.balance!)) : null, evidenceEventIds };
    }) });
  }
  return lifeClimateB3RunSchema.parse({ version: LIFE_CLIMATE_B3_VERSION, horizon: request.horizon, periodUnit: request.periodUnit, profileRevision: request.profileRevision, sourceContext: request.sourceContext, sourceSnapshot: clone(source), requestSnapshot: clone(request), paths, events, claims, comparisons, report: { mode: "conditional_long_horizon_structure", headline: "长期人生结构条件沙盘", summary: "并列比较不增加新变化条件的对照与至少两条明确路径；资源、投入、限制和阶段前提共同形成条件差异。", limitations: ["所有未来流量、投入与结构变化都依赖逐项确认的条件，不代表现实会保持不变或必然实现。", "学习只记录投入，不推断能力、录用或新收入；缺少前提时保留未知或受限。", "阶段为粗粒度条件范围，不提供精确事件日期、现实概率或唯一人生答案。", "人生气候象征镜头独立呈现，不参与资源、行动、守卫、证据或结论强度计算。"], claimIds: claims.map((claim) => claim.id), includesExactDates: false, claimsUseEventEvidence: true }, symbolicAttachment: request.symbolic.enabled ? clone(source.symbolic) : null });
}

export async function validateLifeClimateB3Run(source: unknown, request: unknown, candidate: unknown): Promise<LifeClimateB3Run> {
  try {
    canonicalLifeClimateB3Json(candidate);
    const result = lifeClimateB3RunSchema.safeParse(candidate);
    if (!result.success) fail("b3_semantic_mismatch");
    const expected = await buildLifeClimateB3Run(source, request);
    if (canonicalLifeClimateB3Json(result.data) !== canonicalLifeClimateB3Json(expected)) fail("b3_semantic_mismatch");
    return clone(expected);
  } catch (error) {
    if (error instanceof LifeClimateB3Error && error.code === "b3_semantic_mismatch") throw error;
    throw new LifeClimateB3Error("b3_semantic_mismatch");
  }
}
