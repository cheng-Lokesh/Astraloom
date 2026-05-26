# MiroFish E2E Golden Case Acceptance

This acceptance pack verifies the current product loop without adding product
features or opening external providers.

## Scope

Golden Case validation covers:

- SeedContext generation.
- SafetyVerifier level and flag coverage.
- KeyPeople extraction.
- AgentProfiles generation.
- Read-only RelationGraph generation.
- Simulation Engine v1 execution.
- EventLogs before Claims.
- EventLog evidence for every tick.
- Claim generation.
- `evidenceEventIds` on every Claim.
- Report Engine v1 `freePreview` and `paidReport`.
- Entitlement unlock invariants.
- Feedback history invariants.

It intentionally does not:

- Call a real LLM.
- Call Stripe or real payment services.
- Generate deterministic predictions.
- Allow graph editing.

## Golden Cases

The current pack covers 12 deterministic local cases:

1. Career Conflict: resource-control and authority pressure.
2. Relationship Crossroad: low-pressure relationship options without mind reading.
3. Collaboration Risk: ownership and benefit-boundary risk.
4. Family Boundary: communication boundaries without escalation.
5. Self Direction: Track B longer-horizon self-direction climate.
6. Track B Climate: three-year work, family, and energy climate view.
7. Caution: guaranteed-reconciliation wording triggers caution.
8. Downgraded: partner-monitoring wording downgrades output and blocks full depth.
9. Blocked: violent-retaliation wording stops the downstream pipeline.
10. High Information Gap: opaque committee and missing criteria.
11. High Resource Control: landlord or owner control over access and timing.
12. Low Confidence Input: sparse input still produces a safe local fallback.

Each non-blocked case must produce people, agents, locked graph edges,
simulation ticks, EventLogs, evidence-backed Claims, and Report output. The
blocked case must stop before downstream generation.

## Acceptance Script

The implementation lives in:

```text
src/lib/golden-cases/full-product-cases.ts
```

The script exports:

```ts
runGoldenCaseAcceptance()
```

Return shape:

```ts
{
  passed: boolean;
  generatedAt: string;
  cases: Array<{
    id: string;
    title: string;
    passed: boolean;
    steps: Array<{
      id: string;
      label: string;
      passed: boolean;
      detail: string;
      fixSuggestion: string | null;
    }>;
    summary: {
      safetyLevel: "safe" | "caution" | "downgraded" | "blocked";
      safetyFlags: string[];
      trackType: "crossroad" | "life_climate";
      keyPeopleCount: number;
      agentProfileCount: number;
      relationEdgeCount: number;
      tickCount: number;
      eventLogCount: number;
      claimCount: number;
      reportId: string | null;
    };
    failures: Array<{
      stepId: string;
      detail: string;
      fixSuggestion: string;
    }>;
  }>;
  safetySummary: Record<string, number>;
  trackSummary: Record<string, number>;
}
```

## Local Acceptance Page

Optional local page:

```text
/app/admin/acceptance
```

This page runs the same deterministic Golden Case script during render and shows
per-case pass/fail details. It is local acceptance UI only; it does not persist
data, call LLM providers, call payment providers, or create service-role writes.

## Required Checks

Run:

```powershell
npm run check
```

Then run the local app and open:

```text
http://localhost:3000/app/admin/acceptance
```

Expected result:

- Overall status is `Golden Cases Passed`.
- All 12 Golden Cases pass all applicable steps.
- Safety coverage shows safe, caution, downgraded, and blocked cases.
- Track coverage shows both crossroad and life climate cases.
- Failure Items And Fix Suggestions is absent.

## Failure Output

If any step fails, the script returns:

- the case title,
- the failed step id,
- the failing detail,
- a concrete fix suggestion.

Use the first failed step as the repair target. Do not weaken later assertions to
make a broken evidence chain pass.

## Non-Negotiable Invariants

- `modelVersion` remains `unreleased`.
- simulation `costCents` remains `0`.
- mock entitlement source is not `stripe`.
- paid unlock does not create claims.
- paid unlock does not raise confidence.
- paid unlock does not change risk level.
- feedback appends calibration input without mutating historical EventLogs or
  Claims.
- RelationGraph is locked before simulation and has no edge editing path.
- blocked safety cases do not generate people, agents, graph, simulation,
  claims, or reports.
- downgraded safety cases keep the evidence chain but cannot open full depth.
