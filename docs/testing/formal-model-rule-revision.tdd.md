# Formal model-rule correction and separate rerun

Status: functional candidate, ready for independent review. Journeys derive from
the authorized digital-life modeling task: load the original saved rules, revise
explicit assumptions, confirm each item anew, and create a separate Run while
preserving the original history. No V2 Core production module was changed.

## RED evidence and checkpoint limitation

The first invocation used `model-rule-revision.test.tsx`; Vitest includes only
`src/**/*.test.ts`, so it reported `No test files found`, exit 1. This is setup
failure and is **not** counted as RED.

After renaming the test to `.test.ts`, the following command executed the actual
Start-page correction-entry journey before production edits:

```text
npx vitest run src/components/formal-sandbox/model-rule-revision.test.ts
1 test executed, 1 failed; exit 1
Error: redirected to blank scene
```

The failure came from the existing unconditional Start redirect despite the
revision selector; it was a valid behavior RED. It was not committed before
production changes because the delegated task prohibited staging/Git operations.
No retrospective RED commit is claimed. The later resource amount addition has
named GREEN/schema and browser evidence, but no independently recorded pre-edit
RED checkpoint. TDD checkpoint compliance is therefore incomplete.

## GREEN guarantees

`src/components/formal-sandbox/model-rule-revision.test.ts` contains seven named
tests:

1. `opens existing-run assumptions rather than redirecting to a blank scene`
2. `keeps the ordinary Start route and rejects duplicate, malformed or extra selectors`
3. `checks every ordinal label/resource value and revision against the exact current model`
4. `loads full original actions/strategy with unchecked permissions and no rendered IDs`
5. `reads the strict server DTO with no-store and sends only newly confirmed typed rules with a fresh key`
6. `the canonical Core consumes the corrected response without altering frozen source rules`
7. `edits a frozen resource amount only after fresh confirmation and rejects nonfinite, nonpositive or excessive values`

The Core test invokes the existing `buildFormalSandboxRunV2` with revised typed
rules and verifies an actual controlled relation Event's neutral-to-negative
delta. Original frozen rules remain byte-for-byte unchanged. The amount test
retains the resource ordinal and original amount, requires renewed confirmation,
and rejects NaN, Infinity, zero, negative and greater-than-one-million amounts.

Final relevant regression command, exit 0:

```text
npx vitest run src/components/formal-sandbox/model-rule-revision.test.ts src/components/formal-sandbox/run-starter.test.ts src/components/formal-sandbox/run-starter-calibration.test.ts src/lib/formal-sandbox/digital-life-client.test.ts
4 files passed, 12 tests passed
```

Final static checks, each exit 0:

```text
npx tsc --noEmit --incremental false
npx eslint src/components/formal-sandbox/model-rule-revision.tsx src/components/formal-sandbox/model-rule-revision-query.ts src/components/formal-sandbox/model-rule-revision.test.ts src/components/formal-sandbox/run-starter.tsx src/lib/formal-sandbox/client.ts src/app/app/start/page.tsx src/app/app/simulation/result/result-workbench.tsx
```

## Synthetic browser evidence

Command, exit 0:

```text
node output/playwright/model-rule-revision/browser-check.mjs
PASS: 375px source draft + per-item reconfirmation + corrected typed POST + exact unknown-request recovery + immutable source + stale/legacy fail closed
```

The local harness renders the actual `FormalRunStarter` and uses the actual typed
client GET/parser and POST serializer; Next navigation and HTTP responses are
synthetic. Chrome at 375px loads original self/NPC/strategy/allocation rules,
starts with all five confirmation controls unchecked, changes request cycle,
question, NPC response, commitment and allocation amount, and verifies fresh
confirmation. Changing the request also clears its dependent response's
confirmation. The synthetic 500 leaves all edits disabled and recovery submits
an identical full body and request key. Corrected typed values are in that body;
old planner/Outcome permissions and source-run association are absent. Source
response and amount remain unchanged. Stale current context and missing legacy
rules leave no actionable rule controls. The DOM does not expose UUIDs and has
no horizontal overflow. Screenshot: `output/playwright/model-rule-revision/revision-375px.png`.

## Boundaries and outstanding acceptance

No coverage matrix or full Core suite was repeated under the task's minimal
functional-gate scope. No production WIP build is claimed from a build of an older
immutable checkout. No database, real signed-in account, Auth/RLS, cross-owner,
atomicity or real history persistence acceptance was performed. Source
immutability here is fixture/transport/Core evidence, not a database-write proof.
This is explicit model-rule correction and a separate rerun, not full Fork or
completion of the nine-stage product. Component refs protect recovery during
props/source changes; persistent recovery after page refresh, leaving the page
or changing devices is not proven. No Git mutation occurred before independent
review. The root subsequently authorized a selected eleven-file checkpoint after
the independent narrow review found no reproducible P1 and reran seven tests
successfully. The checkpoint does not replace missing RED-first commit evidence.
Push and a build of the new fixed HEAD remain with the root task.
