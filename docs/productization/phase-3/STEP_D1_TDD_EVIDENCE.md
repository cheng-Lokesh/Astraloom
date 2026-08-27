# Phase 3 Step D1 - People UI TDD Evidence

Status: Step D1 evidence only. This is not acceptance of Step D, Phase 3, Alpha, or MVP.

## Scope and non-goals

This delivery replaces the formal People ledger local-first behavior with a typed
browser adapter for the existing submitted-Seed and Key People APIs. It does not
change migrations, API routes, Agent or Graph UI/API migration, V2, LLM,
payments, or data-write boundaries.

## RED

Command: npm test -- src/lib/people/formal-people-client.test.ts

Result: RED. The new controller test suite failed to import the intentionally
missing formal-people-client module. This was the expected missing
implementation signal, not a test-environment failure.

Checkpoint: 3ba85f2 test: add formal people UI recovery contract.

## GREEN

Command: npx vitest run src/lib/people/formal-people-client.test.ts --reporter=verbose

Result: PASS - 1 file, 17 tests.

| Guarantee | Test coverage |
|---|---|
| Recovery selects latest submitted Seed with deterministic ID tie-break and then loads Key People | recovery and tie-break tests |
| Anonymous, absent Seed, malformed, GET, and empty-ledger states are private and clear | recovery state tests |
| Extract and every management operation use existing endpoints with a fresh UUID key | extract plus five atomic-operation cases |
| Duplicate in-flight action requests are blocked | in-flight action test |
| 409 conflicts, invalid transitions, 404, 500, and schema failures retain the last server view and expose no trace/body | failure mapping and unsafe-projection tests |
| Refresh re-reads server truth and never auto-retries a conflict | recovery-after-conflict test |

GREEN checkpoint: 75683a8 feat: recover formal people ledger in UI.

## Follow-up recovery and form-state repair

Live browser review found that the local Supabase Seed API returns submittedAt
and frozenAt using a +00:00 offset. The strict client schema now accepts that
safe ISO offset form, with a focused recovery test.

The supplement controller now returns a true success signal only after the
server accepts the atomic operation. The form clears display name, relationship,
role, and note only for that true result; a failed response leaves the entered
values in place. UI limits now match the server contract: display name is 120,
relationship and role are 80, and note is 1000 characters. An invalid local
operation produces a visible safe notice instead of silently returning.

The confirmed-person CTA is derived from the same copied server ledger state
that renders the grouped records. The focused controller success test proves a
confirmed response replaces the old ledger before page state is synchronized;
no separate stale-state path was found.

Follow-up command: npx vitest run src/lib/people/formal-people-client.test.ts --reporter=verbose

Follow-up result: PASS - 1 file, 20 tests. Lint and type-check also passed.

## Reviewer type-check block and repair

An independent reviewer blocked D1 at commit 85e773b because type-check found
11 errors in the controller test: recoverFetch was declared as the production
FormalPeopleFetch function type while the test later used Vitest mock APIs on
that value. The failure was reproduced with npm run type-check.

The test helper now returns Mock&lt;FormalPeopleFetch&gt;. This preserves the mock
API type for test setup while remaining structurally valid wherever the
controller accepts FormalPeopleFetch. No production behavior changed.

Repair verification: npm run type-check PASS; People controller tests PASS
(1 file, 20 tests); eslint for the three D1 files PASS.

## Second reviewer lint block and repair

The next independent review reproduced three react-hooks/refs errors in the
People page. The render path initialized and read a controller through
ref.current, including the initial state and Ledger props. The exact targeted
eslint command returned exit code 1 before repair.

The page now creates its stable controller through useState(makeController),
initializes view state lazily from that stable instance, and performs recovery
inside an effect without render-time ref access. This retains the existing
controller lifecycle and server-ledger behavior.

Repair verification: exact targeted eslint command PASS (exit code 0); npm run
type-check PASS (exit code 0); People controller tests PASS (1 file, 20 tests,
exit code 0).

## Additional verification

- npm run lint for the People page, client adapter, and controller test - PASS.
- npm run type-check - PASS.
- Focused Key People, Agent, and Graph API regression command was run against eight existing API suites.
- git diff --exit-code productization/phase-1-contract -- src/lib/v2 - PASS (zero diff).
- Local temporary authenticated E2E setup created one unique test user and one non-sensitive submitted Track A Seed through local GoTrue and the existing submit_seed_context_phase2 boundary, then deleted the user. Counts returned to 16/0/0/0/16, with Graph 0/0.

## Browser limitation

The local dev server started successfully. Playwright CLI was attempted with the
standard browser, a writable isolated daemon directory, and the installed Chrome
channel. In both browser attempts the CLI launched a browser process and failed
with Target crashed / Playwright CDP assertion before the first page could load.
No screenshots or browser-flow PASS claim is made. The temporary user was still
deleted and the CLI/browser session was closed.

## Known remaining risk

The authenticated browser journey (extract, confirm, supplement, refresh and
375px/1280px visual checks) needs a follow-up on a host where Playwright can
launch a stable browser session. The implementation is covered by strict
controller and existing API tests, but that does not substitute for rendered
browser acceptance.
