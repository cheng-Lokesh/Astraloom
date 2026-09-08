"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createFormalSandboxClient, type FormalSandboxResultProjection } from "@/lib/formal-sandbox/client";
import { createResultRequestGate, type ResultRequestState } from "@/lib/formal-sandbox/result-request-gate";
import { ResultLoading, ResultSurface } from "./result-workbench";

type Load = ResultRequestState<FormalSandboxResultProjection> | { phase: "loading"; runId: null };
export default function ResultPage() { return <AppShell><Suspense fallback={<ResultLoading />}><ResultController /></Suspense></AppShell>; }
function ResultController() { const runId = useSearchParams().get("run_id"); const [state, setState] = useState<Load>({ phase: "loading", runId: null }); const [retry, setRetry] = useState(0); const gate = useMemo(() => createResultRequestGate<FormalSandboxResultProjection>(setState), []); useEffect(() => { if (!runId) { gate.invalidate(); return; } const request = gate.begin(runId); void createFormalSandboxClient().result(runId).then((result) => { if (result.ok) gate.resolve(request, result.data.projection); else gate.reject(request, "Result is unavailable. Refresh or return to History."); }); return () => gate.cancel(request); }, [gate, runId, retry]); return <ResultSurface runId={runId} state={state} onRetry={() => setRetry((value) => value + 1)} />; }
