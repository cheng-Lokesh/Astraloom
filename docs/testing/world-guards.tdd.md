# World guards v3 TDD checkpoints and acceptance boundary

Updated: 2026-10-19

## Scope

This record covers the v3 guarded-action candidate in the existing formal
account sandbox. It documents the current contracts and the RED evidence
available to the docs task. It does not claim the candidate is green, delivered,
database-tested, built, pushed, or accepted.

The user-visible feature contract is one optional guard combined with the
existing `at_tick` or `after_rule` schedule. Guarded actions must belong to the
owning self in `main` or to the exact self variant on that variant's path.
Resources use a bounded `lte`/`gte` balance; environment guards select declared
enum values. Results must be replayed from Core events and remain separated by
path, sample, and executed tick.

Compatibility remains explicit:

- Rule/model/draft records add v3 identifiers while existing v1/v2 records keep
  their original behavior.
- Model-draft source remains `digital-life-model-draft-source-v2` and continues
  to use `signature_v2`. `GET ?prepare_version=v3` is read-only and returns a
  separate prepared protocol; it does not silently upgrade a saved draft.
- V3 uses `digital-life-adapter-v3`; the Run bundle/runtime and reservation
  writer retain their existing v1 identifiers. No v3-only raw bundle keys or
  V2 Core changes are part of this candidate.
- The shared candidate producer orders explicit rules, declared rates, then
  the authorized planner. Core selection and transitions remain authoritative.

## RED checkpoint history

| Checkpoint | Scope recorded by the checkpoint | Evidence status |
| --- | --- | --- |
| `48fe8ff` | Initial business RED across four target files: UI, SQL-source, rule-contract, and runtime coverage. | Checkpoint commit exists; no execution count is asserted here. |
| `fc29af3` | Reproduces v3 revised-run no-actions recovery. | RED checkpoint; no count is asserted here. |
| `b32a0f5` | Reproduces guard-description overflow and a transient-event contradiction. | RED checkpoint; no count is asserted here. |
| `ec1cd7b` | Reproduces adding an action to an existing guarded draft. | RED checkpoint; no count is asserted here. |
| `23f2da9` | Reproduces acceptance of observations after the initial resource controller is rebound. | Backend review-authority reproduction: 1 failed / 8 skipped. |
| `dc4865c0f24c9684448bdcbfc5d97710a0f5d002` | Committed SQL-owner RED checkpoint; one SQL test file. | Root reported 2 failed / 11 passed. This RED checkpoint is not a feature delivery. |

Separate from those commits, the pre-modification 11-parameter exploratory
run exited 1 with 10 failed / 1 passed / 9 skipped. Nine failures represented
business gaps. One case had an invalid precondition because Core rejects the
initial revision; that case was removed. Provenance already rejected its
tampering case and passed. This exploratory RED has no separate checkpoint and
must not be assigned a new SHA. The final retained ten regression cases are
included in the producer-reported 19/19 GREEN review-target run.

The SQL-owner failure identifies missing complete source-boundary validation
and exact planner-v1 Event-envelope binding. The backend review-authority
failure at `23f2da9` identifies the initial-resource controller/owner binding
gap.

After the RED checkpoints, Root reported a producer review-target run of
19/19 GREEN for the shared initial-World builder, including the controller
rebind case and ten initial-World structure/source tamper cases. The shared
initial-World builder and pure `correction-contracts` schema extraction are
complete; the extracted schema is literally equivalent to the old schema.
The SQL producer reported complete source-boundary and planner-v1
Event-envelope implementation, with sourcechecks 13/13 GREEN. Test freeze is
complete. The earlier producer review/runtime target was 30/30 PASS (exit 0,
63.46 seconds); separate later enhancements were 15 PASS / 4 skipped and
main/variant JSON compatibility was 1 PASS / 10 skipped.

Independent verification is now complete for the focused repair: a readonly
review found no unresolved targeted P1/P2, and
`npx vitest run src/lib/digital-life/world-guards-review.test.ts src/lib/formal-sandbox/world-guards.runtime.test.ts --reporter=verbose`
passed 2 files / 30 tests, exit 0, in 60.11 seconds. SQL source tests passed
with
`npx vitest run src/lib/digital-life/world-guards-sql.test.ts src/lib/digital-life/environment-sql.test.ts --reporter=verbose`
(2 files / 22 tests, exit 0). The Root UI command
`npx.cmd vitest run src/components/formal-sandbox/world-guards-ui.test.ts src/components/formal-sandbox/world-guards-revision-recovery.test.ts`
passed 2 files / 7 tests, exit 0, in 20.80 seconds (session 63034). Producer
SQL-test ESLint `npx eslint src/lib/digital-life/world-guards-sql.test.ts`
exited 0. Root also reports final `npx tsc --noEmit --incremental false` and
scoped ESLint for seven changed TypeScript files both exited 0.

The SQL specimen is reconstructed from the actual TypeScript helper and
deep-equality checked. The pgTAP source fixture was rebuilt from frozen source;
its eight negative classes and gate-off zero-row checks are source evidence
only, not executed PostgreSQL/pgTAP evidence. The earlier pre-fix seven-file
runtime run had 63 PASS / 1 JSON-compatibility failure; that failure later
passed a targeted check, but there is no final all-green result for the full
seven-file runtime set. The functional/source candidate is READY; this is not
a phase PASS. Database execution, independent DB acceptance, and delivery gates
remain pending.

## Safe diagnostic and recovery contract

An observation is tied to a replayed Core step. The derived safe observation
projection uses `digital-life-guard-observations-v1` and is reconstructed by
replaying the existing frozen bundle and Core steps; it does not add persisted
raw trace data. It carries three independent samples.
Within each sample, executed ticks have their own schedule, nullable guard
result, candidate outcome, safe before/after values, and optional step key.
`selected` is reported only for the matching selected Event; `not_selected`
means an offered proposal was not selected; `not_reached` means no simulation
step reached that tick and has no fabricated state value or later-wait claim.

If an entire path has zero selected Core Events across all three samples, the
route returns a 409 safe DTO with `formal-path-diagnostics-v1` and
`status: "not_saved"`. A path with one or more selected Events may legally end
before later ticks; `not_reached` ticks alone do not make the Run ineligible.
When a zero-events path prevents a complete result, the other path's events do
not become a partial Run. There is no saved Simulation, Claim, or Report from
this diagnostic.

The authored migration stores a validated v3 terminal receipt on the existing
reservation. Exact owner/key/body replay returns the same safe diagnostic before
mutable source and expiry checks. Changed input requires a new key. Unknown
transport results retain and replay the original request body/key; a known
no-eligible response unlocks editing but clears rule and independent planning,
relationship, and outcome confirmations before a new attempt.

## Verification still required

Feature commit `436feec5a68fb958183f82f8cd1bf523ecc2a9d1` contains 43 files
(`+3195/-418`) and has not been pushed. Root ran an isolated clean build at
that exact SHA with `npm.cmd run build -- --webpack` (session 81560); it exited
1. The import trace showed a browser client value-importing
`guard-observations`, which reaches `trajectory-result-validation`, Core IDs,
and Node `crypto`, unavailable in the browser.

The repair was isolated through RED checkpoint
`41dab6e919cb224c943c8d47f0270359c648fff4`: the real
`client-import-boundary.test.ts` failed 1/1, exit 1. The minimal source fix
extracts pure schema/types into `guard-observation-contracts`; the server
`guard-observations` module re-exports them and the client imports the pure
module. It does not change DTOs, replay behavior, Core, or Webpack. After the
fix the same test passed 1/1, exit 0, and an independent rerun also passed 1/1.
Mechanical comparison confirmed the extracted schema/types and replay body
remain textually unchanged. Four-file lint exited 0. The GREEN fix commit is
`8954226836b53bb59074efe89324e6bf0e8e4add`, containing only three production
paths (`+15/-10`). Root's isolated clean build at that exact SHA,
`npm.cmd run build -- --webpack` (session 56471), exited 0: compile 25.7s,
TypeScript 43s, and 111/111 pages in 4.2s. Root started the exact build via
`npm.cmd run start` on `127.0.0.1:52340` (session 56679); it reported Ready in
253ms. Smoke HTTP checks returned `/` 200 with `s-maxage`,
`/app/start?model_draft=current` and the invalid model-draft route 200 with
`no-store`, and `/app/simulation/result?run_id=60000000-0000-4000-8000-000000000001`
200 with `s-maxage`. `GET /api/sandbox/model-draft?prepare_version=v3` returned
500 with `no-store` because Supabase is unconfigured; this is fail-closed
configuration behavior, not Auth or database acceptance.

The Git worker non-force-pushed exact `895422` to the current development ref,
exit 0; live origin, HEAD, and upstream matched, divergence was 0/0, and the
index was empty at verification. It was not pushed to main, attached to a PR,
or deployed. The feature is delivered to the development branch, not launched
or accepted as a real-account or phase-level release. The forthcoming
documentation-only commit does not change the built feature code and requires
no separate feature build.

The focused repair still has independent review/runtime 30/30 PASS; SQL source
22/22 and UI 7/7 also pass as recorded above. The functional/source candidate
has an exact-SHA build, local start, smoke checks, and development-branch push.
This does not establish full-suite or coverage, PostgreSQL compile/migration/
pgTAP, advisors, Auth, RLS, owner isolation, persistent-receipt execution,
real-account acceptance, or phase PASS. The docs-only change does not alter the
built feature source; this documentation update ran no tests or build.
