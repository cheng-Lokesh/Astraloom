import { z } from "zod";

const schema = z.object({ horizon: z.enum(["30_days", "90_days"]).optional() }).strict();

export function parseHistoryFilter(params: URLSearchParams): { horizon?: "30_days" | "90_days" } | null {
  const entries = [...params.entries()];
  if (entries.some(([key]) => key !== "horizon") || params.getAll("horizon").length > 1) return null;
  const parsed = schema.safeParse(Object.fromEntries(entries));
  return parsed.success ? parsed.data : null;
}
