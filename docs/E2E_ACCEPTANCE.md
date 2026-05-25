# MiroFish E2E Golden Case Acceptance

This acceptance pack verifies the current product loop without adding product
features or opening external providers.

## Scope

Golden Case validation covers:

- SeedContext generation.
- KeyPeople extraction.
- AgentProfiles generation.
- Read-only RelationGraph generation.
- Simulation Engine v1 execution.
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

### 1. Relationship Crossroad

Situation: ambiguous romantic contact has gone cold, and the user is unsure
whether to initiate contact.

Expected product shape: relationship dynamics sandbox with a low-pressure
communication path, not mind reading or certainty about the other person.

### 2. Career Conflict

Situation: the boss is not providing resources, and the user is considering
whether to leave.

Expected product shape: authority/resource pressure review with evidence-backed
scenario branches, not career advice or a command to resign.

### 3. Collaboration Risk

Situation: a friend wants to collaborate on a project, and the user is worried
about relationship and benefit conflicts.

Expected product shape: relationship and practical boundary review with
conflict-risk signals, not a CRM-style editable relationship graph.

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
    failures: Array<{
      stepId: string;
      detail: string;
      fixSuggestion: string;
    }>;
  }>;
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
- Relationship Crossroad passes all steps.
- Career Conflict passes all steps.
- Collaboration Risk passes all steps.
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
