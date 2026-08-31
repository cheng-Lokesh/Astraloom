# M2.1 formal entry and legacy isolation TDD evidence

Status: **candidate only**. This record does not mark M2.1, the second phase,
or Phase 4 as PASS. No push, PR, or merge occurred.

## Scope and non-goals

This change routes public and compatibility entry points to the existing formal
account path. It does not add Track B, a Reality Profile, Destiny, resources,
World State, AI, billing, data models, schema/API/RLS/migrations, changes to
the formal overview contract, or changes under `src/lib/v2/**`.

## User journeys covered

| Guarantee | Test | Result |
| --- | --- | --- |
| Public CTA describes the personal sandbox and uses formal routes only | `m2-1-formal-entry-contract.test.ts` | PASS after GREEN |
| Old Start bookmark redirects without local trial state | same | PASS after GREEN |
| New Scene has Track A and Reality Intake only | same | PASS after GREEN |
| Running without a Run id is an honest empty state | same | PASS after GREEN |
| Missing History timestamps never reveal the Run id | same | PASS after GREEN |
| Formal navigation has no sample or standalone Result destination | same | PASS after GREEN |
| Root to Scene to formal Intake never imports, renders, invokes, or links a trial/sample shortcut | `m2-1-formal-entry-contract.test.ts` | PASS after repair GREEN |
| Formal desktop and mobile navigation targets, including language controls, are at least 44px high | `app-shell.m2.test.ts` | PASS after repair GREEN |

## TDD checkpoints

| Stage | Commit | Command | Actual result |
| --- | --- | --- | --- |
| RED | `5c3acd6650c9dc66a7a69ce41f4dfb9c2d36f99a` | `npm.cmd test -- src/app/m2-1-formal-entry-contract.test.ts` | exit 1, 1 file, 6 tests, 5 intended failures. Existing hero, Start, Scene, no-Run state, and History fallback violated the contract. |
| GREEN | `7b012797c2624664610a3b37ece1e4cfdeca2519` | same | exit 0, 1 file, 6 tests passed. |
| M2.0 regression | working tree after GREEN | `npm.cmd test -- src/app/m2-1-formal-entry-contract.test.ts src/lib/sandbox-overview/overview.server.test.ts src/app/api/sandbox-overview/route.test.ts src/app/app/dashboard/page.m2.test.ts src/components/app-shell.m2.test.ts` | exit 0, 5 files, 33 tests passed. |
| Type check | working tree after GREEN | `npm.cmd run type-check` | exit 0. |
| Full Vitest | working tree after GREEN | `npm.cmd test` | exit 0, 63 files / 605 tests, 105.22 seconds. |
| Repository coverage | working tree after GREEN | `npm.cmd run test:coverage` | exit 0, 63 files / 605 tests. Statements 90.85%, branches 81.21%, functions 95.55%, lines 93.52%. |
| pgTAP | local non-reset Supabase | `npx.cmd --no-install supabase test db --local supabase/tests` | exit 0, 8 files / 538 assertions. |
| Golden | working tree after GREEN | `npm.cmd run test:golden` | exit 0, 1 file / 3 tests, all eight implemented Golden Cases. |
| Seven V2 scripts | working tree after GREEN | `test:v2:evidence`, `world`, `trajectory`, `analysis`, `claims-reports`, `outcome-calibration`, `migration-async-execution` | exit 0. Test counts: 83, 116, 63, 47, 23, 40, 22. |
| Lint | working tree after GREEN | `npm.cmd run lint` | exit 0. |
| Production build | working tree after GREEN | `npm.cmd run build` | exit 0. |

## Independent-review repair, 2026-08-31

An independent M2.1 review marked the candidate **FAIL** before this repair.
The two scoped findings were: the formal Scene to Intake path still exposed the
trial/sample component and Career-filled sample text, and formal navigation
targets were 40px rather than 44px. This repair changed no schema, API, RLS,
migration, overview contract, formal Run/History/Feedback semantics, or
`src/lib/v2/**`.

| Stage | Commit | Command | Actual result |
| --- | --- | --- | --- |
| Repair RED | `e38c0b3` | `npm.cmd test -- src/app/m2-1-formal-entry-contract.test.ts src/components/app-shell.m2.test.ts` | exit 1, 2 files / 9 tests. The two new assertions failed for `TrialSampleButton`/sample fill in formal Intake and absent `min-h-11` navigation targets. |
| Repair GREEN | `a3d3af8` | same | exit 0, 2 files / 9 tests. Formal Intake no longer imports, renders, invokes, or links the trial/sample path; formal navigation uses real 44px targets, not overlay hit areas. |
| Test hygiene | `802aa08` | focused suite, then `npm.cmd run lint` | exit 0. Removed one unused test fixture only. |
| M2.0 plus M2.1 regression | final candidate | `npm.cmd test -- src/lib/sandbox-overview/overview.server.test.ts src/app/api/sandbox-overview/route.test.ts src/app/app/dashboard/page.m2.test.ts src/components/app-shell.m2.test.ts src/app/m2-1-formal-entry-contract.test.ts` | exit 0, 5 files / 35 tests. |
| Full Vitest | final candidate | `npm.cmd test` | exit 0, 63 files / 607 tests, 128.84 seconds. |
| Repository coverage | final candidate | `npm.cmd run test:coverage` | exit 0, 63 files / 607 tests. Statements 90.85%, branches 81.21%, functions 95.55%, lines 93.52%. |
| Lint, type check, build | final candidate | `npm.cmd run lint`; `npm.cmd run type-check`; `npm.cmd run build` | every command exit 0. |
| Diff, secret/PII, V2 boundary | final candidate | `git diff --check d2e033a..HEAD`; changed-file scan; `git diff --quiet 0bbb9a76..HEAD -- src/lib/v2` | exit 0, 0 secret/PII hits, and empty V2 diff. |

The repair changed 5 source/test files from the independent-review start:
`src/app/app/new/intake/page.tsx`, `src/app/m2-1-formal-entry-contract.test.ts`,
`src/components/app-shell.m2.test.ts`, `src/components/app-shell.tsx`, and
`src/components/language-switcher.tsx`.

### Repair browser evidence

The final production build was served by this task at `http://127.0.0.1:4307`,
owned PID `24752`, with startup marker
`M2_1_REPAIR_HEAD=802aa089aadcc173679ed772612d234847f40763`.

- Public `/` CTA reached `/app/new/scene`, and the Scene CTA reached
  `/app/new/intake`. The Intake body contained no sample or trial text or
  control.
- `/app/start` redirected to `/app/new/scene`; `/app/simulation/running`
  without a Run id showed the honest Chinese empty state and My Sandbox, Start,
  and History links, with no raw no-id message or Result CTA.
- Every visible formal header target measured 44px. The 375, 768, and 1280
  viewport checks had `scrollWidth === clientWidth`; a 74-character Chinese
  scenario input also fit at the medium viewport. Keyboard Tab focus produced
  a visible solid outline.
- Browser console evidence was 0 errors and 0 warnings on the public, Scene,
  Intake, and no-id Running checks.

Authentication remains outside this repair. The high-port callback policy was
not changed, so authenticated chain replay and network evidence remain for the
next independent reviewer. This candidate remains local-only and unpushed; it
does not claim M2.1, the second phase, or Phase 4 PASS.

## Second independent-review FAIL and minimum repair, 2026-08-31

An independent M2.1 review marked the repaired candidate **FAIL** again before
this repair. The two bounded findings were: formal `/app/new/intake` still
loaded and saved a browser draft, exposed long-horizon choices, and allowed a
People action before server confirmation; anonymous `/app/archive` mounted its
History client and requested History before an authentication boundary. This
repair changes no schema, API payload contract, RLS, migration, My Sandbox
overview, formal Run/History/Feedback contract, or `src/lib/v2/**`.

| Stage | Commit | Command | Actual result |
| --- | --- | --- | --- |
| Second-repair RED | `ebbc562` | `npm.cmd test -- src/app/m2-1-formal-entry-contract.test.ts` | exit 1, 1 file / 9 tests, 2 intended failures. The required formal Intake and authenticated Archive client modules did not exist. |
| Second-repair GREEN | `3a42107` | same | exit 0, 1 file / 9 tests. |
| M2.0 plus M2.1 regression | `3a42107` | `npm.cmd test -- src/lib/sandbox-overview/overview.server.test.ts src/app/api/sandbox-overview/route.test.ts src/app/app/dashboard/page.m2.test.ts src/components/app-shell.m2.test.ts src/app/m2-1-formal-entry-contract.test.ts` | exit 0, 5 files / 37 tests. |
| Full Vitest | `3a42107` | `npm.cmd test` | exit 0, 63 files / 609 tests, 98.84 seconds. |
| Repository coverage | `3a42107` | `npm.cmd run test:coverage` | exit 0, 63 files / 609 tests. Statements 90.85%, branches 81.21%, functions 95.55%, lines 93.52%. |
| Static gates | `3a42107` | `npm.cmd run lint`; `npm.cmd run type-check`; `npm.cmd run build` | every command exit 0. |

### Guarantees added by the repair

- The formal Intake route performs the server-session check before the client
  form mounts. Anonymous and unconfigured states render a truthful login/setup
  boundary.
- The formal client has only the 30- and 90-day Track A values, keeps form
  values in React state before submission, posts directly to
  `/api/seed-context` with one fresh UUID idempotency key, does not retry a
  conflict, retains in-memory input on failure without claiming persistence,
  and renders the People action only after a server-confirmed Seed response.
- The former browser-draft intake surface is retained only at the unlinked
  compatibility route `/intake`; formal CTAs and navigation do not point to it.
- Archive performs the server-session check before mounting its History client.
  The authenticated client retains the existing multi-Run History behavior;
  direct API 401 behavior is unchanged.

### Anonymous production-browser evidence

The production build from `3a42107` was served by this task at
`http://127.0.0.1:4317` in an isolated Playwright session. Root CTA -> Scene
CTA -> Intake reached the formal route. Intake rendered the login boundary with
no Track B value, browser-draft claim, or People action. Archive rendered the
login boundary; its performance resource list contained zero
`/api/sandbox/runs` requests, and console capture recorded 0 errors and 0
warnings. Anonymous Dashboard rendered its login boundary and Running rendered
its honest no-Run state. At 375, 768, and 1280 CSS pixels,
`scrollWidth === clientWidth`; no visible interactive target was below 44px;
Tab focus produced a 3px solid outline. Authentication setup remains outside
this repair, so authenticated Intake submission and authenticated multi-Run
Archive replay remain for the next independent review.

pgTAP, Golden, and seven V2 suites are reused from the immediately preceding
independent GREEN evidence because this repair changes none of their covered
contracts. This remains a local repair candidate only. It does not mark M2.1,
the second phase, or Phase 4 PASS, and it has not been pushed, submitted as a
PR, or merged.

## Browser and remaining acceptance boundary

The production build was served locally on port 3100. Anonymous browser replay
confirmed `/app/start` redirected to `/app/new/scene`; the public hero and
Scene CTA stayed on the formal account path; anonymous Dashboard showed its
sign-in boundary without local/demo state; and Running without a `run_id`
showed the honest empty state with My Sandbox, Start, and History links.
At 375, 768, and 1280 CSS pixels, `scrollWidth` equaled `clientWidth`; the
observed console had 0 errors and 0 warnings, and observed requests were 200.

The local login page truthfully reported that Auth remains in setup mode and
will not send email. Therefore a fresh neutral authenticated account, a full
account chain replay, refresh/re-login, and authenticated network evidence
remain **BLOCKED by local Auth configuration**. Archive missing-time browser
replay also remains unproven because no fixture was created. These browser
gaps prevent a Phase or second-phase PASS claim. Changed-file secret/PII scan
and the `src/lib/v2/**` diff must be recorded alongside the final candidate
commit.
