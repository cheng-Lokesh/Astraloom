import { LifeClimateB3Error, lifeClimateB3SourceViewSchema, type LifeClimateB3SourceView } from "./contracts";

const invalidUnicode = (value: string) => /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value);
function compareCodepoints(left: string, right: string) {
  const a = Array.from(left), b = Array.from(right);
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    const difference = a[i].codePointAt(0)! - b[i].codePointAt(0)!;
    if (difference !== 0) return difference;
  }
  return a.length - b.length;
}

/** Canonical JSON: Unicode codepoint key order (PostgreSQL UTF-8 COLLATE "C"), no getters/proxies. */
export function canonicalLifeClimateB3Json(value: unknown): string {
  try {
    if (value === null) return "null";
    if (typeof value === "string") {
      if (invalidUnicode(value)) throw new LifeClimateB3Error("invalid_b3_request");
      return JSON.stringify(value);
    }
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new LifeClimateB3Error("invalid_b3_request");
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) return `[${value.map(canonicalLifeClimateB3Json).join(",")}]`;
    if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new LifeClimateB3Error("invalid_b3_request");
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort(compareCodepoints);
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(record, key);
      if (!descriptor || descriptor.get || descriptor.set || invalidUnicode(key)) throw new LifeClimateB3Error("invalid_b3_request");
    }
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalLifeClimateB3Json(record[key])}`).join(",")}}`;
  } catch (error) {
    if (error instanceof LifeClimateB3Error) throw error;
    throw new LifeClimateB3Error("invalid_b3_request");
  }
}

export async function sha256LifeClimateB3Text(text: string): Promise<string> {
  if (invalidUnicode(text)) throw new LifeClimateB3Error("invalid_b3_request");
  const bytes = new TextEncoder().encode(text);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, "0")).join("");
}
export async function hashLifeClimateB3Value(value: unknown): Promise<string> {
  return sha256LifeClimateB3Text(canonicalLifeClimateB3Json(value));
}
export function assertLifeClimateB3SourcePrecision(view: LifeClimateB3SourceView) {
  for (const resource of view.profile.worldInputs.resources) {
    for (const value of [resource.available, resource.minimum, resource.maximum, resource.usePerTick]) {
      if (value !== null && !/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(String(value))) throw new LifeClimateB3Error("b3_unsupported_precision");
    }
  }
}
export async function createLifeClimateB3SourceContext(rawView: unknown): Promise<string> {
  canonicalLifeClimateB3Json(rawView);
  const result = lifeClimateB3SourceViewSchema.safeParse(rawView);
  if (!result.success) throw new LifeClimateB3Error("invalid_b3_source");
  assertLifeClimateB3SourcePrecision(result.data);
  return hashLifeClimateB3Value(result.data);
}
export async function createLifeClimateB3ConfirmationContext(requestWithoutConfirmation: unknown): Promise<string> {
  return hashLifeClimateB3Value(requestWithoutConfirmation);
}
