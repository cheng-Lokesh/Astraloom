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

## Third independent-review FAIL and minimum repair, 2026-08-31

An independent M2.1 review marked the candidate **FAIL** a third time before
this repair. The sole scoped code finding was that the public legacy `/intake`
route still rendered `LocalIntakePage`, which exposed legacy Track B horizons
and formal-chain People/submit CTAs through a formal primary shell. This repair
changes only that public route and its cross-entry contract test. It changes no
schema, API, RLS, migration, formal Intake auth/submission boundary, Archive
auth boundary, timeout, coverage threshold, Vitest configuration, or
`src/lib/v2/**`.

| Stage | Commit | Command | Actual result |
| --- | --- | --- | --- |
| Third-repair RED | `7dd06fcc283493592f602f776dd5942bde718513` | `npm.cmd test -- src/app/m2-1-formal-entry-contract.test.ts` | exit 1, 1 file / 10 tests. The new direct `/intake` assertion failed because the route imported and rendered `LocalIntakePage`, not because of setup or compilation. |
| Third-repair GREEN | `233b2ceb26232d66bec6459982dd36fc5ddabf61` | same | exit 0, 1 file / 10 tests. The legacy public bookmark now uses a server redirect to `/app/new/scene`; the legacy component is no longer rendered by that public route. |
| M2.0 plus M2.1 regression | `233b2ce` | `npm.cmd test -- src/lib/sandbox-overview/overview.server.test.ts src/app/api/sandbox-overview/route.test.ts src/app/app/dashboard/page.m2.test.ts src/components/app-shell.m2.test.ts src/app/m2-1-formal-entry-contract.test.ts` | exit 0, 5 files / 38 tests. |
| Seven V2 scripts | clean working tree after GREEN | `npm.cmd run test:v2:evidence`; `world`; `trajectory`; `analysis`; `claims-reports`; `outcome-calibration`; `migration-async-execution` | every command exit 0. Counts: 83, 116, 63, 47, 23, 40, 22. Claims/Reports, Outcome Calibration, and Migration Async did not reproduce the independent review timeout red. |
| Full Vitest | clean working tree after GREEN | `npm.cmd test` | exit 0, 63 files / 610 tests, 119.13 seconds (test time 80.87 seconds). |
| Repository coverage | clean working tree after GREEN | `npm.cmd run test:coverage` | exit 0, 63 files / 610 tests, 139.22 seconds (test time 91.64 seconds). Statements 90.85%, branches 81.21%, functions 95.55%, lines 93.52%. |
| Static gates | clean working tree after GREEN | `npm.cmd run lint`; `npm.cmd run type-check`; `npm.cmd run build` | exit 0 for each. |
| pgTAP and Golden | local non-reset Supabase / working tree | `npx.cmd --no-install supabase test db --local supabase/tests`; `npm.cmd run test:golden` | exit 0: 8 files / 538 assertions; then 1 file / 3 tests covering all 8 Golden Cases. |
| Diff, secret/PII, V2 boundary | clean working tree after GREEN | `git diff --check`; changed-file pattern scan; `git diff --quiet 0bbb9a76..HEAD -- src/lib/v2` | exit 0, no changed-file secret/PII match, and empty V2 diff. The repository-wide scanner remains exit 1 solely for pre-existing documented placeholder matches in `SUPABASE_SETUP.md` and `docs/STAGING_BETA.md`; it revealed no credential value and is not treated as a clean full-repository gate. |

### V2 timeout root-cause boundary

No production or test-code root cause was reproduced in the authorized clean
replay. The original commands passed unchanged, and the existing 15-second
timeouts remain present in Claims/Reports and Outcome Calibration tests. The
reported 15/15/5-second failures therefore cannot be attributed to this repair
without a reproducing independent-review environment; this task makes no V2
repair or acceptance claim.

### Anonymous production-browser evidence

The production build from `233b2ce` was served only by this task at
`http://127.0.0.1:4319` (owned startup PID `27624`). In a new anonymous
Playwright session, Root CTA -> Scene CTA -> `/app/new/intake` reached the
server login boundary; it created no Seed and showed no People action. A direct
`/intake` request ended at `/app/new/scene`; its body contained none of Track
B, 1/3/5-year horizons, `Confirm people`, or `Submit formal Track A version`.

Anonymous Archive rendered its server login boundary. Browser requests
contained no `/api/sandbox/runs` request, and the console reported 0 errors and
0 warnings. At 375, 768, and 1280 CSS pixels, horizontal overflow was 0 and no
visible `a`, `button`, `summary`, or role-button target measured under 44px.
Tab focus reached an anchor with a computed `3px solid` outline. No login or
authenticated browser operation was attempted.

This remains an unpushed local **repair candidate** only. It does not mark
M2.1, the second phase, or Phase 4 as PASS. Fresh independent authenticated
Intake submission and Archive replay remain for a subsequent reviewer.

## Fourth independent-review FAIL and final minimum repair, 2026-09-07

Status: **repair candidate only**. This fourth repair does not mark M2.1, the
second phase, or Phase 4 as PASS. No push, PR, merge, schema/API/RLS/migration,
timeout, coverage threshold, Vitest configuration, or `src/lib/v2/**` change
occurred.

The independent review found two user-visible gaps: the authenticated formal
Intake privacy acknowledgement used a 16px native checkbox, and completed Runs
were projected as `ready` with "Bundle is ready." The minimum repair makes the
native checkbox itself a 44px by 44px keyboard-focusable control while retaining
the enclosing accessible label and checked state. It keeps the server's
`completed` status as the completion authority but projects it as
"结果已生成" / "服务端已完成本次沙盘运行，结果已生成。" It neither alters
server enums nor synthesizes completion.

An acceptance follow-up also found that the first completed-copy repair treated
`loading` as `running` and described an unreadable status as a stopped Run. A
second, focused RED/GREEN checkpoint extracted a four-state user projection:
loading reads as "正在读取服务器状态", running as "沙盘运行中", completed as
"结果已生成", and an unreadable state as "状态暂不可用" without asserting
that a Run stopped.

| Stage | Commit | Command | Actual result |
| --- | --- | --- | --- |
| Fourth-repair RED | `ed8867c1d5e8b967341a7222ab5b347a3d5201a4` | `npm.cmd test -- src/app/m2-1-formal-entry-contract.test.ts` | exit 1, 1 file / 12 tests; the 44px layout/focus assertion and completed natural-language/no-raw-ready assertion failed for the intended current behavior. |
| Fourth-repair GREEN | `9b8f71da4ddc639cc5c3de84f57defb9bd073268` | same | exit 0, 1 file / 12 tests. |
| Projection RED | `ec2a271e1a3a789e404faf0b783685e123ae6c52` | same | exit 1, 1 file / 13 tests; the required behavioral projection function was absent, so no testable distinction protected loading/running/completed/error. |
| Projection GREEN | `f7422190c707b052c38b340cb2ba23e222486f41` | same | exit 0, 1 file / 13 tests. |
| M2.0 plus M2.1 regression | `f742219` | `npm.cmd test -- src/lib/sandbox-overview/overview.server.test.ts src/app/api/sandbox-overview/route.test.ts src/app/app/dashboard/page.m2.test.ts src/components/app-shell.m2.test.ts src/app/m2-1-formal-entry-contract.test.ts` | exit 0, 5 files / 41 tests. |
| Full Vitest | `f742219` | `npm.cmd test` | exit 0, 63 files / 613 tests, 64.31 seconds. |
| Repository coverage | `f742219` | `npm.cmd run test:coverage` | exit 0. Statements 90.85%, branches 81.21%, functions 95.55%, lines 93.52%. |
| Lint, type check, production build | `f742219` | `npm.cmd run lint`; `npm.cmd run type-check`; `npm.cmd run build` | exit 0 for each. |
| Golden | `f742219` | `npm.cmd run test:golden` | exit 0, 1 file / 3 tests covering all eight implemented Golden Cases. |
| Seven V2 scripts | `f742219` | `test:v2:evidence`, `world`, `trajectory`, `analysis`, `claims-reports`, `outcome-calibration`, `migration-async-execution` | exit 0. Counts: 83, 116, 63, 47, 23, 40, 22. |
| pgTAP | local environment | `SUPABASE_TELEMETRY_DISABLED=1 npx.cmd --no-install supabase test db --local supabase/tests` | **BLOCKED**, exit 1 before assertions: Docker Desktop's Linux engine was offline and `127.0.0.1:54322` refused the connection. No reset, rebuild, volume cleanup, or database mutation was attempted. |

### Final anonymous production-browser evidence

The final production build was served by this task at
`http://127.0.0.1:4325`. A new anonymous Playwright session confirmed Root CTA
to Scene to formal Intake. Formal Intake rendered its server login boundary and
provided neither a formal submission nor a People action. Anonymous Archive
rendered its login boundary; its request listing had zero
`/api/sandbox/runs` entries and console capture had 0 errors / 0 warnings.
Running without a Run id showed the Chinese no-active-sandbox state, not a
fabricated run result.

At 375x812, 768x1024, and 1280x900 CSS pixels on the production Running empty
state, `scrollWidth === clientWidth` (375, 768, and 1280 respectively), and
the visible `a`, `button`, and `summary` targets had zero dimensions below
44px. Keyboard Tab focused an anchor with a computed 3px solid outline.

### Authenticated boundary

The scoped authenticated Intake 44px measurement and completed-Run browser
copy replay are **BLOCKED**. Docker Desktop's engine was unavailable, so local
Supabase Auth and database services could not be reached. No account, Magic
Link, cookie, token, UUID, business row, or temporary identity file was
created; therefore no user data cleanup action was needed. Unit/component
contracts do not replace this authenticated browser gate.

The task made one authorized, non-destructive environment-recovery attempt:
Docker Desktop was present but stopped, so it was launched in the background.
Its backend then exited before the Linux engine came online. The contemporaneous
Docker backend log reports failure to remove the existing
`C:/Users/clf04/AppData/Local/Docker/run/dockerInference` Unix listener path,
followed by service exit status 150. Repairing that runtime state would require
cleanup beyond this task's no-reset/no-rebuild/no-volume-deletion authority, so
the task stopped. No Supabase stack start, migration, volume operation, or
database write was attempted.

The authorized bounded root-cause inspection confirmed that exact target is a
zero-byte Windows `ReparsePoint` in Docker's `run` directory (created
2026-08-27, last written 2026-08-30), not a normal file. There was no running
Docker Desktop/backend process to attribute an open handle to, but both
`fsutil reparsepoint query` and ACL inspection failed with Windows error 1920
(the file cannot be accessed by the system). Its link/ACL state is therefore
not safely known. Per the recovery boundary, it was not renamed, removed, or
otherwise changed.

This remains an unpushed local repair candidate only. The pgTAP and
authenticated-browser blocks prevent any M2.1, second-phase, or Phase 4 PASS
claim.

### Recovery continuation and scoped authenticated recheck

The preceding blocked record is historical. Under subsequent, explicitly
bounded recovery authority, the exact inaccessible Docker runtime directory
`C:/Users/clf04/AppData/Local/Docker/run` was renamed non-recursively to the
unique sibling `run.astraloom-recovery-20260907142021`; it remains preserved as
a recoverable backup. No Docker configuration, WSL/VHD, volume, migration, or
application data was removed. Docker Desktop then reached Engine 29.6.2 and
the already-existing local Supabase stack became healthy. The unchanged command
`SUPABASE_TELEMETRY_DISABLED=1 npx.cmd --no-install supabase test db --local
supabase/tests` then exited 0: 8 files / 538 assertions.

One disposable local Auth identity was used only to recheck the two scoped UI
claims; no Intake or other business data was submitted. On the authenticated
formal Intake screen, the native privacy checkbox measured 44px by 44px in the
browser. Its enclosing semantic label remained present, Space toggled and
restored its checked state, and keyboard focus produced a visible outline.
On authenticated Running without a Run id, the honest no-active-sandbox state
was present and neither `ready` nor `Bundle is ready` was visible. The
completed projection remains proven by the focused fixture/source contract:
`projectRunningPhase("completed")` projects `结果已生成`, while the rendered
status binds to `statusLabel` and rejects raw `ready` / `Bundle is ready`
copy. This is intentionally not a fabricated completed Run browser replay.

After the check, the disposable browser cookie, local storage, and session
storage were cleared and its session closed. The exact temporary inbucket
message was deleted (HTTP 200); the temporary Auth user query returned 0; and
the temporary identity state file was individually cleared and rechecked at
0 bytes. Playwright transient logs/snapshots were removed from the worktree.
No identity, token, cookie, UUID, or business content is recorded here.

All executable gates listed above remain local evidence only. This is still an
unpushed **repair candidate**, not an M2.1, second-phase, or Phase 4 PASS
claim.
