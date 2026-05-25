import { estimateCostCents } from "./cost-estimator";
import { createJobId, createTraceId, nowIso } from "./trace";

const observabilityStorageKey = "mirofish.observability.audit-events";

export type ObservabilityEventKind =
  | "model_call"
  | "generation_job"
  | "simulation_run"
  | "report_generation"
  | "audit_event";

export type ObservabilityEvent = {
  id: string;
  kind: ObservabilityEventKind;
  createdAt: string;
  traceId: string;
  userId: string;
  jobId: string;
  jobType: string;
  status: "completed" | "failed" | "blocked" | "preview";
  promptVersion: string | null;
  modelVersion: string | null;
  latencyMs: number | null;
  inputTokenEstimate: number;
  outputTokenEstimate: number;
  costEstimate: number;
  costCents: number;
  errorCode: string | null;
  version?: string | null;
  engineVersion?: string | null;
  safetyLevel?: string | null;
  claimIds?: string[];
  evidenceEventCount?: number;
  paidState?: "free" | "paid" | "locked" | "unknown";
  metadata?: Record<string, unknown>;
};

export type ObservabilitySummary = {
  recentTasks: ObservabilityEvent[];
  failedTasks: ObservabilityEvent[];
  averageCost: number;
  averageCostCents: number;
  errorCodeDistribution: Array<{ key: string; count: number }>;
  promptVersionDistribution: Array<{ key: string; count: number }>;
  eventCount: number;
};

type ObservabilityStore = {
  events?: ObservabilityEvent[];
};

function serverStore() {
  const globalStore = globalThis as typeof globalThis & {
    __mirofishObservabilityStore?: ObservabilityStore;
  };
  globalStore.__mirofishObservabilityStore ??= {};
  globalStore.__mirofishObservabilityStore.events ??= [];
  return globalStore.__mirofishObservabilityStore.events;
}

function loadEvents() {
  if (typeof window === "undefined") {
    return serverStore();
  }

  const raw = window.localStorage.getItem(observabilityStorageKey);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as ObservabilityEvent[];
  } catch {
    window.localStorage.removeItem(observabilityStorageKey);
    return [];
  }
}

function saveEvents(events: ObservabilityEvent[]) {
  const capped = events.slice(0, 200);

  if (typeof window === "undefined") {
    const store = serverStore();
    store.length = 0;
    store.push(...capped);
    return;
  }

  window.localStorage.setItem(observabilityStorageKey, JSON.stringify(capped));
}

function record(event: ObservabilityEvent) {
  const events = loadEvents();
  saveEvents([event, ...events]);
  return event;
}

export function recordObservabilityEvent(
  input: Omit<ObservabilityEvent, "id" | "createdAt" | "costCents"> & {
    id?: string;
    createdAt?: string;
    costCents?: number;
  },
) {
  return record({
    ...input,
    id: input.id ?? createJobId(input.kind),
    createdAt: input.createdAt ?? nowIso(),
    costCents: input.costCents ?? estimateCostCents(input.costEstimate),
  });
}

export function recordModelCallEvent(input: {
  traceId: string;
  userId?: string | null;
  jobId?: string | null;
  jobType: string;
  promptVersion: string;
  modelVersion: string;
  latencyMs: number;
  inputTokenEstimate?: number;
  outputTokenEstimate?: number;
  costEstimate: number;
  errorCode: string | null;
  metadata?: Record<string, unknown>;
}) {
  const event = recordObservabilityEvent({
    kind: "model_call",
    traceId: input.traceId,
    userId: input.userId ?? "local_or_unknown_user",
    jobId: input.jobId ?? createJobId("model_job"),
    jobType: input.jobType,
    status: input.errorCode ? "failed" : "completed",
    promptVersion: input.promptVersion,
    modelVersion: input.modelVersion,
    latencyMs: input.latencyMs,
    inputTokenEstimate: input.inputTokenEstimate ?? 0,
    outputTokenEstimate: input.outputTokenEstimate ?? 0,
    costEstimate: input.costEstimate,
    errorCode: input.errorCode,
    metadata: input.metadata,
  });

  recordObservabilityEvent({
    kind: "generation_job",
    traceId: input.traceId,
    userId: event.userId,
    jobId: event.jobId,
    jobType: input.jobType,
    status: event.status,
    promptVersion: input.promptVersion,
    modelVersion: input.modelVersion,
    latencyMs: input.latencyMs,
    inputTokenEstimate: event.inputTokenEstimate,
    outputTokenEstimate: event.outputTokenEstimate,
    costEstimate: input.costEstimate,
    errorCode: input.errorCode,
    metadata: { source: "model_call_log" },
  });

  return event;
}

export function recordSimulationRunEvent(input: {
  traceId: string;
  version: string;
  engineVersion: string;
  safetyLevel: string;
  costCents?: number;
  status?: "completed" | "failed" | "blocked" | "preview";
  errorCode?: string | null;
}) {
  return recordObservabilityEvent({
    kind: "simulation_run",
    traceId: input.traceId,
    userId: "local_or_unknown_user",
    jobId: createJobId("simulation_job"),
    jobType: "simulation_run",
    status: input.status ?? (input.errorCode ? "failed" : "preview"),
    promptVersion: null,
    modelVersion: "deterministic",
    latencyMs: 0,
    inputTokenEstimate: 0,
    outputTokenEstimate: 0,
    costEstimate: (input.costCents ?? 0) / 100,
    costCents: input.costCents ?? 0,
    errorCode: input.errorCode ?? null,
    version: input.version,
    engineVersion: input.engineVersion,
    safetyLevel: input.safetyLevel,
  });
}

export function recordReportGenerationEvent(input: {
  traceId?: string;
  claimIds: string[];
  evidenceEventCount: number;
  paidState: "free" | "paid" | "locked" | "unknown";
  errorCode?: string | null;
}) {
  return recordObservabilityEvent({
    kind: "report_generation",
    traceId: input.traceId ?? createTraceId("report_trace"),
    userId: "local_or_unknown_user",
    jobId: createJobId("report_job"),
    jobType: "report_generation",
    status: input.errorCode ? "failed" : "preview",
    promptVersion: "report-engine-v1",
    modelVersion: "deterministic",
    latencyMs: 0,
    inputTokenEstimate: 0,
    outputTokenEstimate: 0,
    costEstimate: 0,
    errorCode: input.errorCode ?? null,
    claimIds: input.claimIds,
    evidenceEventCount: input.evidenceEventCount,
    paidState: input.paidState,
  });
}

function distribution(
  events: ObservabilityEvent[],
  selector: (event: ObservabilityEvent) => string | null | undefined,
) {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = selector(event) ?? "none";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function summarizeObservabilityEvents(
  events: ObservabilityEvent[],
): ObservabilitySummary {
  const recentTasks = events.slice(0, 20);
  const failedTasks = events
    .filter((event) => event.errorCode || event.status === "failed")
    .slice(0, 20);
  const averageCost =
    events.length === 0
      ? 0
      : Number(
          (
            events.reduce((total, event) => total + event.costEstimate, 0) /
            events.length
          ).toFixed(6),
        );

  return {
    recentTasks,
    failedTasks,
    averageCost,
    averageCostCents: estimateCostCents(averageCost),
    errorCodeDistribution: distribution(events, (event) => event.errorCode),
    promptVersionDistribution: distribution(
      events,
      (event) => event.promptVersion,
    ),
    eventCount: events.length,
  };
}

export function getObservabilityEvents() {
  return [...loadEvents()];
}

export function getObservabilitySnapshot() {
  return summarizeObservabilityEvents(getObservabilityEvents());
}
