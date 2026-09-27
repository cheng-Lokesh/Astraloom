import { z } from "zod";

const unsafeVisibleText = /[\u0000-\u001f\u007f]|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|\b(?:raw\s+(?:scenario|evidence)|trace(?:[_ -]?id)?|internal(?:[_ -]?key)?|token|secret|password|api[_ -]?key)\b/i;
const safeTextSchema = z.string().trim().min(1).max(240).refine((value) => !unsafeVisibleText.test(value), "Unsafe profile text");
const classificationSchema = z.enum(["fact", "assumption", "unknown"]);

const profileFieldSchema = z.object({
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

export const realityProfileDraftSchema = z.object({
  lifeClimate: profileFieldSchema,
  resources: profileFieldSchema,
  constraints: profileFieldSchema,
  revision: z.number().int().nonnegative(),
}).strict();

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

function ledgerFor(field: z.infer<typeof profileFieldSchema>, label: string) {
  if (field.classification === "unknown") return { item: null, unknown: { label } as UnknownItem };
  return { item: { label: field.value, evidenceSummary: field.evidenceSummary } as LedgerItem, unknown: null };
}

export function buildRealityWorldProjection(draft: RealityProfileDraft, state: { graphLocked: boolean; latestRunEvent: LatestRunEvent }) {
  const parsed = realityProfileDraftSchema.parse(draft);
  const climate = ledgerFor(parsed.lifeClimate, "人生气候");
  const resources = ledgerFor(parsed.resources, "资源");
  const constraints = ledgerFor(parsed.constraints, "约束");
  const fields = [climate, resources, constraints];
  const facts = fields.flatMap(({ item }) => item && [item]).filter((item): item is LedgerItem => Boolean(item && [parsed.lifeClimate, parsed.resources, parsed.constraints].some(field => field.value === item.label && field.classification === "fact")));
  const assumptions = fields.flatMap(({ item }) => item && [item]).filter((item): item is LedgerItem => Boolean(item && [parsed.lifeClimate, parsed.resources, parsed.constraints].some(field => field.value === item.label && field.classification === "assumption")));
  const changeNodes = state.graphLocked && state.latestRunEvent ? [{ label: eventLabels[state.latestRunEvent], evidenceSummary: "来自当前正式运行的受控模拟事件" }] : [];

  return {
    reality: { facts, assumptions, unknowns: fields.flatMap(({ unknown }) => unknown ? [unknown] : []) },
    world: {
      state: state.graphLocked ? "locked_graph" as const : "submitted" as const,
      resources: resources.item ? [resources.item] : [],
      constraints: constraints.item ? [constraints.item] : [],
      changeNodes,
    },
  };
}
