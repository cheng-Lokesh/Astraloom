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
