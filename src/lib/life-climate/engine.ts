import { randomUUID } from "node:crypto";
import { z } from "zod";

import {
  realityProfileDraftSchema,
  type RealityProfileDraft,
  type RealityProfileLifeModelDomains,
} from "@/lib/reality-profile/profile";

export const LIFE_CLIMATE_B1_VERSION = "life-climate-b1-v1" as const;
export const LIFE_CLIMATE_B2_VERSION = "life-climate-b2-v1" as const;
export const lifeClimateDomainKeys = ["identity", "career", "wealth", "relationships", "environment", "lifeStage"] as const;
export type LifeClimateDomain = typeof lifeClimateDomainKeys[number];
export type LifeClimatePeriodIndex = 1 | 2 | 3 | 4;
export const lifeClimateHorizonKeys = ["1_year", "3_years", "5_years"] as const;
export type LifeClimateHorizon = typeof lifeClimateHorizonKeys[number];

const horizonPeriodCounts: Record<LifeClimateHorizon, number> = {
  "1_year": 4,
  "3_years": 3,
  "5_years": 5,
};

const domainLabels: Record<LifeClimateDomain, string> = {
  identity: "身份结构",
  career: "职业结构",
  wealth: "财富结构",
  relationships: "关系生态",
  environment: "城市与生活环境",
  lifeStage: "人生阶段",
};

const unsafePathText = /[\u0000-\u001f\u007f-\u009f]|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:raw\s+(?:scenario|evidence)|trace(?:[_ -]?id)?|internal(?:[_ -]?key)?|token|secret|password|api[_ -]?key)\b/i;
const safePathText = (maximum: number) => z.string().trim().min(1).max(maximum).refine((value) => !unsafePathText.test(value));

export const lifeClimateRunRequestSchema = z.object({
  horizon: z.literal("1_year"),
  profileRevision: z.number().int().nonnegative(),
  change: z.object({
    domain: z.enum(lifeClimateDomainKeys),
    entryIndex: z.number().int().min(0).max(7),
    startPeriod: z.number().int().min(1).max(4),
    newState: safePathText(240),
    evidenceSummary: safePathText(160),
  }).strict(),
}).strict();

export const lifeClimatePathChangeSchema = z.object({
  domain: z.enum(lifeClimateDomainKeys),
  entryIndex: z.number().int().min(0).max(7),
  startPeriod: z.number().int().min(1).max(5),
  newState: safePathText(240),
  evidenceSummary: safePathText(160),
}).strict();

export const lifeClimatePathRunRequestSchema = z.object({
  horizon: z.enum(lifeClimateHorizonKeys),
  profileRevision: z.number().int().nonnegative(),
  changes: z.array(lifeClimatePathChangeSchema).min(1).max(12),
}).strict().superRefine((request, context) => {
  const periodCount = horizonPeriodCounts[request.horizon];
  const selectedTheme = request.changes[0]?.domain;
  const seenChanges = new Set<string>();
  request.changes.forEach((change, index) => {
    if (selectedTheme !== undefined && change.domain !== selectedTheme) {
      context.addIssue({ code: "custom", path: ["changes", index, "domain"], message: "one_theme_per_path" });
    }
    if (change.startPeriod > periodCount) {
      context.addIssue({ code: "custom", path: ["changes", index, "startPeriod"], message: "stage_outside_horizon" });
    }
    const identity = `${change.domain}:${change.entryIndex}:${change.startPeriod}`;
    if (seenChanges.has(identity)) {
      context.addIssue({ code: "custom", path: ["changes", index], message: "duplicate_change_in_stage" });
    }
    seenChanges.add(identity);
  });
});

export type LifeClimateRunRequest = z.infer<typeof lifeClimateRunRequestSchema>;
export type LifeClimatePathRunRequest = z.infer<typeof lifeClimatePathRunRequestSchema>;

type ProfileField = RealityProfileLifeModelDomains[LifeClimateDomain][number];

export type LifeClimatePathPeriod = {
  periodIndex: LifeClimatePeriodIndex;
  label: string;
  lifeModelDomains: RealityProfileLifeModelDomains;
  changedDomain: LifeClimateDomain | null;
};

export type LifeClimatePath = {
  id: "baseline" | "alternative";
  label: string;
  basis: "frozen_profile" | "user_assumption";
  periods: LifeClimatePathPeriod[];
};

export type LifeClimateEvent = {
  id: string;
  kind: "assumption_transition";
  pathId: "alternative";
  periodIndex: LifeClimatePeriodIndex;
  source: "user_assumption";
  domain: LifeClimateDomain;
  summary: string;
  beforeState: ProfileField;
  afterState: ProfileField;
};

export type LifeClimateClaim = {
  id: string;
  type: "conditional_structure_change";
  pathId: "alternative";
  summary: string;
  uncertainty: string;
  evidenceEventIds: string[];
};

export type LifeClimateRun = {
  version: typeof LIFE_CLIMATE_B1_VERSION;
  horizon: "1_year";
  profileRevision: number;
  profileSnapshot: { lifeModelDomains: RealityProfileLifeModelDomains };
  selectedChange: LifeClimateRunRequest["change"];
  paths: [LifeClimatePath, LifeClimatePath];
  events: LifeClimateEvent[];
  claims: LifeClimateClaim[];
  report: {
    claimIds: string[];
    mode: "conditional_structure_comparison";
    headline: string;
    summary: string;
    limitations: string[];
    includesExactDates: false;
    claimsUseEventEvidence: true;
  };
};

export type LifeClimateMultiPathPeriod = {
  periodIndex: number;
  label: string;
  lifeModelDomains: RealityProfileLifeModelDomains;
  changedDomains: LifeClimateDomain[];
};

export type LifeClimatePathEvent = {
  id: string;
  kind: "assumption_transition";
  pathId: "alternative";
  periodIndex: number;
  source: "user_assumption";
  domain: LifeClimateDomain;
  entryIndex: number;
  summary: string;
  beforeState: ProfileField;
  afterState: ProfileField;
};

export type LifeClimatePathClaim = {
  id: string;
  type: "conditional_structure_change";
  pathId: "alternative";
  summary: string;
  uncertainty: string;
  evidenceEventIds: string[];
};

export type LifeClimatePathRun = {
  version: typeof LIFE_CLIMATE_B2_VERSION;
  horizon: LifeClimateHorizon;
  profileRevision: number;
  profileSnapshot: { lifeModelDomains: RealityProfileLifeModelDomains };
  selectedChanges: LifeClimatePathRunRequest["changes"];
  paths: [
    { id: "baseline"; label: string; basis: "frozen_profile"; periods: LifeClimateMultiPathPeriod[] },
    { id: "alternative"; label: string; basis: "user_assumptions"; periods: LifeClimateMultiPathPeriod[] },
  ];
  events: LifeClimatePathEvent[];
  claims: LifeClimatePathClaim[];
  report: {
    claimIds: string[];
    mode: "user_authored_structural_path";
    headline: string;
    summary: string;
    limitations: string[];
    includesExactDates: false;
    claimsUseEventEvidence: true;
  };
};

function cloneLifeModelDomains(domains: RealityProfileLifeModelDomains): RealityProfileLifeModelDomains {
  return {
    version: 1,
    identity: domains.identity.map((item) => ({ ...item })),
    career: domains.career.map((item) => ({ ...item })),
    wealth: domains.wealth.map((item) => ({ ...item })),
    relationships: domains.relationships.map((item) => ({ ...item })),
    environment: domains.environment.map((item) => ({ ...item })),
    lifeStage: domains.lifeStage.map((item) => ({ ...item })),
  };
}

function buildPeriods(
  domains: RealityProfileLifeModelDomains,
  change: LifeClimateRunRequest["change"],
  pathId: LifeClimatePath["id"],
): LifeClimatePathPeriod[] {
  return ([1, 2, 3, 4] as const).map((periodIndex) => {
    const lifeModelDomains = cloneLifeModelDomains(domains);
    const changedDomain = pathId === "alternative" && periodIndex >= change.startPeriod ? change.domain : null;
    if (changedDomain) {
      lifeModelDomains[changedDomain][change.entryIndex] = {
        value: change.newState,
        classification: "assumption",
        evidenceSummary: change.evidenceSummary,
      };
    }
    return { periodIndex, label: ["第一阶段", "第二阶段", "第三阶段", "第四阶段"][periodIndex - 1], lifeModelDomains, changedDomain };
  });
}

export function buildLifeClimateRun(
  rawProfile: RealityProfileDraft,
  rawRequest: LifeClimateRunRequest,
  createId: () => string = randomUUID,
): LifeClimateRun {
  const profile = realityProfileDraftSchema.parse(rawProfile);
  const request = lifeClimateRunRequestSchema.parse(rawRequest);
  if (profile.revision !== request.profileRevision) throw new Error("stale_profile_revision");
  if (request.change.entryIndex >= profile.lifeModelDomains[request.change.domain].length) throw new Error("life_climate_entry_not_found");

  const existing = profile.lifeModelDomains[request.change.domain][request.change.entryIndex];
  const afterState: ProfileField = {
    value: request.change.newState,
    classification: "assumption",
    evidenceSummary: request.change.evidenceSummary,
  };
  const transitionEvent: LifeClimateEvent = {
    id: createId(),
    kind: "assumption_transition",
    pathId: "alternative",
    periodIndex: request.change.startPeriod as LifeClimatePeriodIndex,
    source: "user_assumption",
    domain: request.change.domain,
    summary: `在${["第一阶段", "第二阶段", "第三阶段", "第四阶段"][request.change.startPeriod - 1]}，将${domainLabels[request.change.domain]}切换为你设定的备选状态。`,
    beforeState: { ...existing },
    afterState: { ...afterState },
  };
  const claim: LifeClimateClaim = {
    id: createId(),
    type: "conditional_structure_change",
    pathId: "alternative",
    summary: `如果“${request.change.newState}”这一项假设生效，${domainLabels[request.change.domain]}会从${["第一阶段", "第二阶段", "第三阶段", "第四阶段"][request.change.startPeriod - 1]}起按该状态呈现。`,
    uncertainty: "这是依据你填写的条件生成的结构对照，不代表现实一定如此；其他领域没有建立因果模型，仍保持原资料或明确未知。",
    evidenceEventIds: [transitionEvent.id],
  };
  const baseline: LifeClimatePath = {
    id: "baseline",
    label: "沿用当前资料结构",
    basis: "frozen_profile",
    periods: buildPeriods(profile.lifeModelDomains, request.change, "baseline"),
  };
  const alternative: LifeClimatePath = {
    id: "alternative",
    label: "应用一项用户假设",
    basis: "user_assumption",
    periods: buildPeriods(profile.lifeModelDomains, request.change, "alternative"),
  };

  return {
    version: LIFE_CLIMATE_B1_VERSION,
    horizon: request.horizon,
    profileRevision: profile.revision,
    profileSnapshot: { lifeModelDomains: cloneLifeModelDomains(profile.lifeModelDomains) },
    selectedChange: request.change,
    paths: [baseline, alternative],
    events: [transitionEvent],
    claims: [claim],
    report: {
      claimIds: [claim.id],
      mode: "conditional_structure_comparison",
      headline: "一年人生结构路径对照",
      summary: "并排查看当前资料结构与一项明确假设下的差异。阶段只表示相对顺序，不对应具体日历时间。",
      limitations: [
        "本版本只应用你明确填写的一项结构变化，不推导它对其他领域的连锁影响。",
        "事实、假设与未知保持分开；未建模的维度不会被补成结论。",
        "结果是条件式沙盘，不是现实事件清单、概率或确定预言。",
      ],
      includesExactDates: false,
      claimsUseEventEvidence: true,
    },
  };
}

function lifeClimatePeriodLabel(horizon: LifeClimateHorizon, periodIndex: number) {
  if (horizon === "1_year") return ["第一阶段", "第二阶段", "第三阶段", "第四阶段"][periodIndex - 1] ?? "相对阶段";
  return `第 ${periodIndex} 年`;
}

function lifeClimateHorizonLabel(horizon: LifeClimateHorizon) {
  if (horizon === "1_year") return "一年";
  return horizon === "3_years" ? "三年" : "五年";
}

export function buildLifeClimatePathRun(
  rawProfile: RealityProfileDraft,
  rawRequest: LifeClimatePathRunRequest,
  createId: () => string = randomUUID,
): LifeClimatePathRun {
  const profile = realityProfileDraftSchema.parse(rawProfile);
  const request = lifeClimatePathRunRequestSchema.parse(rawRequest);
  if (profile.revision !== request.profileRevision) throw new Error("stale_profile_revision");
  for (const change of request.changes) {
    if (change.entryIndex >= profile.lifeModelDomains[change.domain].length) throw new Error("life_climate_entry_not_found");
  }

  const periodCount = horizonPeriodCounts[request.horizon];
  const changes = request.changes
    .map((change, originalIndex) => ({ change, originalIndex }))
    .sort((left, right) => left.change.startPeriod - right.change.startPeriod || left.originalIndex - right.originalIndex);
  const events: LifeClimatePathEvent[] = [];
  const claims: LifeClimatePathClaim[] = [];
  const state = cloneLifeModelDomains(profile.lifeModelDomains);
  const alternativePeriods: LifeClimateMultiPathPeriod[] = [];
  const domainLabel = (domain: LifeClimateDomain) => domainLabels[domain];

  for (let periodIndex = 1; periodIndex <= periodCount; periodIndex += 1) {
    const changesAtPeriod = changes.filter(({ change }) => change.startPeriod === periodIndex);
    const changedDomains = [...new Set(changesAtPeriod.map(({ change }) => change.domain))];
    for (const { change } of changesAtPeriod) {
      const beforeState = { ...state[change.domain][change.entryIndex]! };
      const afterState: ProfileField = {
        value: change.newState,
        classification: "assumption",
        evidenceSummary: change.evidenceSummary,
      };
      state[change.domain][change.entryIndex] = afterState;
      const label = lifeClimatePeriodLabel(request.horizon, periodIndex);
      const event: LifeClimatePathEvent = {
        id: createId(),
        kind: "assumption_transition",
        pathId: "alternative",
        periodIndex,
        source: "user_assumption",
        domain: change.domain,
        entryIndex: change.entryIndex,
        summary: `在${label}，将${domainLabel(change.domain)}中的一项资料切换为你设定的备选状态。`,
        beforeState,
        afterState: { ...afterState },
      };
      events.push(event);
      claims.push({
        id: createId(),
        type: "conditional_structure_change",
        pathId: "alternative",
        summary: `如果你设定的${domainLabel(change.domain)}变化生效，该资料会从${label}起按此状态呈现。`,
        uncertainty: "这是你填写的条件式结构对照，不代表现实一定如此；系统没有推导其他领域的连锁变化。",
        evidenceEventIds: [event.id],
      });
    }
    alternativePeriods.push({
      periodIndex,
      label: lifeClimatePeriodLabel(request.horizon, periodIndex),
      lifeModelDomains: cloneLifeModelDomains(state),
      changedDomains,
    });
  }

  const baselinePeriods = Array.from({ length: periodCount }, (_, index) => ({
    periodIndex: index + 1,
    label: lifeClimatePeriodLabel(request.horizon, index + 1),
    lifeModelDomains: cloneLifeModelDomains(profile.lifeModelDomains),
    changedDomains: [],
  }));
  const horizonLabel = lifeClimateHorizonLabel(request.horizon);
  const baseline: LifeClimatePathRun["paths"][0] = {
    id: "baseline",
    label: "沿用当前资料结构",
    basis: "frozen_profile",
    periods: baselinePeriods,
  };
  const alternative: LifeClimatePathRun["paths"][1] = {
    id: "alternative",
    label: "按你设定的假设展开",
    basis: "user_assumptions",
    periods: alternativePeriods,
  };
  return {
    version: LIFE_CLIMATE_B2_VERSION,
    horizon: request.horizon,
    profileRevision: profile.revision,
    profileSnapshot: { lifeModelDomains: cloneLifeModelDomains(profile.lifeModelDomains) },
    selectedChanges: changes.map(({ change }) => ({ ...change })),
    paths: [baseline, alternative],
    events,
    claims,
    report: {
      claimIds: claims.map((claim) => claim.id),
      mode: "user_authored_structural_path",
      headline: `${horizonLabel}人生结构沙盘`,
      summary: "沿用当前资料的基线，与多条明确填写的结构变化并列查看。阶段表示相对先后，不对应具体日历日期。",
      limitations: [
        "备选路径只包含你明确填写的结构变化；未填写的领域沿用已保存内容或明确未知。",
        "系统不会推断跨领域因果、NPC 反应、现实事件、发生概率或确定结果。",
        "事件与结论记录的是你的模拟假设，不是现实已经发生的证据。",
      ],
      includesExactDates: false,
      claimsUseEventEvidence: true,
    },
  };
}
