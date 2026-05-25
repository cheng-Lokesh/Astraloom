export function createTraceId(prefix = "trace") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function createJobId(prefix = "job") {
  return createTraceId(prefix);
}

export function nowIso() {
  return new Date().toISOString();
}
