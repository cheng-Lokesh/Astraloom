import { z } from "zod";

const unsafeVisibleText = /[\u0000-\u001f\u007f]|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:raw\s+(?:scenario|evidence)|trace(?:[_ -]?id)?|internal(?:[_ -]?key)?|token|secret|password|api[_ -]?key)\b/i;
const safeTextSchema = z.string().trim().min(1).max(240).refine((value) => !unsafeVisibleText.test(value), "Unsafe profile text");
const classificationSchema = z.enum(["fact", "assumption", "unknown"]);

export const realityProfileFieldSchema = z.object({
  value: z.string().trim().max(240),
  classification: classificationSchema,
  evidenceSummary: z.string().trim().max(160),
}).strict().superRefine((field, ctx) => {
  if (field.classification === "unknown") {
    if (field.value || field.evidenceSummary !== "明确未知") {
      ctx.addIssue({ code: "custom", message: "Unknown fields must be explicitly unknown without a value." });
    }
    return;
  }
  for (const [key, value] of Object.entries({ value: field.value, evidenceSummary: field.evidenceSummary })) {
    const parsed = safeTextSchema.safeParse(value);
    if (!parsed.success) ctx.addIssue({ code: "custom", path: [key], message: "Profile text is invalid." });
  }
});

const profileItemsSchema = z.array(realityProfileFieldSchema).min(1).max(8);

export const realityProfileDraftSchema = z.object({
  lifeClimate: realityProfileFieldSchema,
  resources: realityProfileFieldSchema,
  constraints: realityProfileFieldSchema,
  goals: profileItemsSchema,
  values: profileItemsSchema,
  lifeThemes: profileItemsSchema,
  pressures: profileItemsSchema,
  externalVariables: profileItemsSchema,
  revision: z.number().int().nonnegative(),
}).strict();

export type RealityProfileField = z.infer<typeof realityProfileFieldSchema>;
export type RealityProfileDraft = z.infer<typeof realityProfileDraftSchema>;
type LedgerItem = { label: string; evidenceSummary: string };
type UnknownItem = { label: string };
export type LatestRunEvent = "cooperation" | "avoidance" | "direct_conflict" | "disclosure" | "resource_competition" | "support" | "opportunity_signal" | "information_gap_widening" | null;

const eventLabels: Record<Exclude<LatestRunEvent, null>, string> = {
  cooperation: "协作变化",
  avoidance: "回避变化",
  direct_conflict: "冲突变化",
  disclosure: "信息披露变化",
  resource_competition: "资源竞争变化",
  support: "支持变化",
  opportunity_signal: "机会信号变化",
  information_gap_widening: "信息差变化",
};

const dimensionLabels = {
  lifeClimate: "人生气候",
  resources: "资源",
  constraints: "约束",
  goals: "目标",
  values: "价值观",
  lifeThemes: "人生主题",
  pressures: "压力",
  externalVariables: "外部变量",
} as const;

type ProfileDimensionKey = keyof typeof dimensionLabels;
type DimensionSummary = { label: string; facts: number; assumptions: number; unknowns: number };

export function createUnknownRealityProfileField(): RealityProfileField {
  return { value: "", classification: "unknown", evidenceSummary: "明确未知" };
}

export function createEmptyRealityProfileDraft(revision = 0): RealityProfileDraft {
  return {
    lifeClimate: createUnknownRealityProfileField(),
    resources: createUnknownRealityProfileField(),
    constraints: createUnknownRealityProfileField(),
    goals: [createUnknownRealityProfileField()],
    values: [createUnknownRealityProfileField()],
    lifeThemes: [createUnknownRealityProfileField()],
    pressures: [createUnknownRealityProfileField()],
    externalVariables: [createUnknownRealityProfileField()],
    revision,
  };
}

function ledgerFor(field: RealityProfileField, label: string) {
  if (field.classification === "unknown") return { classification: field.classification, item: null, unknown: { label } as UnknownItem };
  return { classification: field.classification, item: { label: field.value, evidenceSummary: field.evidenceSummary } as LedgerItem, unknown: null };
}

function classifiedDimensionItems(fields: RealityProfileField[], label: string) {
  return fields.map((field, index) => ({ field, label: fields.length === 1 ? label : `${label}（第${index + 1}项）` }));
}

function dimensionSummary(label: string, fields: RealityProfileField[]): DimensionSummary {
  return {
    label,
    facts: fields.filter(field => field.classification === "fact").length,
    assumptions: fields.filter(field => field.classification === "assumption").length,
    unknowns: fields.filter(field => field.classification === "unknown").length,
  };
}

export function buildRealityWorldProjection(draft: RealityProfileDraft, state: { graphLocked: boolean; latestRunEvent: LatestRunEvent }) {
  const parsed = realityProfileDraftSchema.parse(draft);
  const scalarDimensions = [
    { key: "lifeClimate", field: parsed.lifeClimate },
    { key: "resources", field: parsed.resources },
    { key: "constraints", field: parsed.constraints },
  ] as const;
  const listDimensions = [
    { key: "goals", fields: parsed.goals },
    { key: "values", fields: parsed.values },
    { key: "lifeThemes", fields: parsed.lifeThemes },
    { key: "pressures", fields: parsed.pressures },
    { key: "externalVariables", fields: parsed.externalVariables },
  ] as const;

  const ledgerEntries = [
    ...scalarDimensions.map(({ key, field }) => ({ key: key as ProfileDimensionKey, ...ledgerFor(field, dimensionLabels[key]) })),
    ...listDimensions.flatMap(({ key, fields }) => classifiedDimensionItems(fields, dimensionLabels[key]).map(({ field, label }) => ({ key: key as ProfileDimensionKey, ...ledgerFor(field, label) }))),
  ];
  const displayLabel = (key: ProfileDimensionKey, label: string) => key === "goals" || key === "values" || key === "lifeThemes" || key === "pressures" || key === "externalVariables" ? `${dimensionLabels[key]}：${label}` : label;
  const reality = {
    facts: ledgerEntries.filter(field => field.classification === "fact").flatMap(({ item, key }) => item ? [{ ...item, label: displayLabel(key, item.label) }] : []),
    assumptions: ledgerEntries.filter(field => field.classification === "assumption").flatMap(({ item, key }) => item ? [{ ...item, label: displayLabel(key, item.label) }] : []),
    unknowns: ledgerEntries.flatMap(({ unknown }) => unknown ? [unknown] : []),
    dimensions: [
      ...scalarDimensions.map(({ key, field }) => dimensionSummary(dimensionLabels[key], [field])),
      ...listDimensions.map(({ key, fields }) => dimensionSummary(dimensionLabels[key], fields)),
    ],
  };
  const itemsFor = (fields: RealityProfileField[]) => fields.filter(field => field.classification !== "unknown").map(field => ({ label: field.value, evidenceSummary: field.evidenceSummary }));
  const resources = ledgerFor(parsed.resources, dimensionLabels.resources);
  const constraints = ledgerFor(parsed.constraints, dimensionLabels.constraints);
  const changeNodes = state.graphLocked && state.latestRunEvent ? [{ label: eventLabels[state.latestRunEvent], evidenceSummary: "来自当前正式运行的受控模拟事件" }] : [];

  return {
    reality,
    world: {
      state: state.graphLocked ? "locked_graph" as const : "submitted" as const,
      resources: resources.item ? [resources.item] : [],
      constraints: constraints.item ? [constraints.item] : [],
      goals: itemsFor(parsed.goals),
      values: itemsFor(parsed.values),
      lifeThemes: itemsFor(parsed.lifeThemes),
      pressures: itemsFor(parsed.pressures),
      externalVariables: itemsFor(parsed.externalVariables),
      changeNodes,
    },
  };
}
