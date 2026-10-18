# Reality Review Loop v2: TDD and delivery record

Date: 2026-10-19. This is a scoped feature/source candidate record, not a
full-suite or stage acceptance report. It does not replace the V1 contracts or
the existing Run/Result compatibility rules.

## Contract under test

`formal-reality-criteria-v2` is a bounded, pre-run standard for checking the
user's own observable action and resource changes. It is frozen with a new
Run from deterministic replay of its existing frozen input and recorded Core
transitions; it does not launch another simulation. A target can be a
self-resource-only comparison, or one representative main-path trajectory
containing this ordered request/response chain, optionally extended by a
later resource-action step:

1. the user explicitly requests something from an NPC;
2. the NPC makes a visible relationship response to that request; and
3. optionally, a later explicit `after_rule` action changes the user's own
   resource.

The request/response chain must be supported by actual same-trajectory Event
references; when the optional resource action is included, its Event and rule
binding must also be actual and consistent. Timestamp proximity alone is not
causality. The frozen standard binds the representative trajectory and seed,
actual selected Event ids, and applicable rule keys. Safe API `review` groups
expose typed condition keys and ordinal step references. Derived
`correctionRequirements` remain an API projection only: they are not copied
into `frozenRealityCriteria` or its fingerprint.

Compatibility and scope constraints:

- The existing V1 builder, ordering, and hash reconstruction stay unchanged.
  Old Runs without a frozen standard remain `not_recorded`; no standard is
  retroactively added.
- The whole Core Cluster remains `not_observable`; this feature adds no Core
  score, Brier score, or real-world probability claim.
- Observation is condition-level. Known differences may be retained, while
  unknown and unfilled entries stay `null`; saving a partial review records an
  uncertain aggregate rather than asserting that the whole simulated scenario
  occurred.
- A false `request_information` observation does not get a fabricated
  occurrence time. An open observation window does not become a time or an
  automatic `did_not_occur` observation.
- Actor, relationship, resource, and visible-source confirmation are separate
  conditions. A correction requires the exact linked request/response and
  required scope/source confirmations, not a nearest or merely similar event.
- Successful save leaves the source Run unchanged and can continue through the
  existing `revise_run` flow. Correction selection is independent, defaults
  off, and requires the existing explicit `outcome_calibration` confirmation;
  it is never auto-applied by saving an observation.
- For an ambiguous save response, editing stays locked and retry reuses the
  exact original body and idempotency key. A known failure does not authorize
  mutation of that replay pair.

`usedCorrections` is an optional safe Result receipt for the main path only.
It is derived from the current frozen input and a same-owner completed formal
source Run with a validated frozen Forecast Lock. Source owner, seed, graph,
agent/profile scope, frozen rules, and actual Events must match the existing
contract. Each sample distinguishes actual `executed` from `not_executed`;
an unavailable source preserves the Result with an empty
`source_unavailable` receipt, while contradictory/tampered evidence fails
closed. Strategy paths do not receive this receipt. History displays each
side's own receipt; it does not assert real-world improvement or automatic
learning.

The JSON compatibility adapter restores only optional `undefined` properties
omitted by serialization within the frozen Reality Boundary ledger, verifies
canonical equality and rebuilt Forecast Lock equality, then passes the result
through the existing Core parser. It does not change Core ids, signatures,
hash construction, writer, or historical bundle shape. The forward migration
`20261018173334_formal_reality_criteria_review_v2.sql` updates only the
completion-trigger function for v1/v2 criteria. No tables, RLS, grants, or
append RPC are changed.

## RED checkpoints and repairs

- Backend initial checkpoint `b0810ee`: 5 failures. This was a valid RED
  checkpoint before the functional repair.
- Receipt and duplicate-selection checkpoint `de3ef1e`: one targeted failure
  in each of the two reported selections.
- API authorization/error/anonymous/source-row-id checkpoint `1d2898b`:
  3 failed and 3 passed.
- An independent 3-file run historically reported 42 passed / 1 failed; the
  sole failure was JSON save round-trip and was subsequently repaired. The
  counts below are separate, overlapping targeted runs and must not be summed
  into a full-suite claim.
- A JavaScript `String.replace` replacement containing `$'` once injected a
  suffix into generated SQL. Independent review caught it; checkpoint
  `e724bfa` preserved a valid RED before the SQL source was corrected using
  `apply_patch`. The later source checks are not a PostgreSQL compile.
- The focused UI REDs were exact response mapping (`9f927f8`) and closed-window /
  `canRecordDidNotOccur` wording (`c595ad6`). Both were closed by the final UI
  run below.

## Targeted GREEN evidence

- Backend final: 5 files / 29 tests, exit 0, session 79351.
- Used-correction receipt helper final: 5 files / 90 tests, exit 0, 70.06s.
  The targeted set included helper, API-route, browser-boundary,
  result-projection, and timeline coverage.
- Final TypeScript check session 92915 exited 0; the corresponding scoped
  lint checks exited 0. An earlier session 22121 had one `flatMap` inference
  error, fixed with an explicit generic annotation without `any` or schema
  relaxation.
- UI final: 3 files / 18 tests, exit 0, 26.87s; scoped lint exited 0.
- Independent reality-v2/SQL targeted run: 2 files / 24 tests, exit 0,
  25.64s. Independent API/UI/history run: 4 files / 22 tests, exit 0,
  10.03s. The final Chrome 375px filtered window was 1 passed / 4 filtered,
  exit 0, 4.31s; filtered cases are not executed tests.
- SQL source-structure checks reported 4/4 green. They do not prove SQL
  compilation, migration execution, or PostgreSQL behavior. The migration has
  not been run against a database; Docker pipe was unavailable.
- Independent review's final status was READY for the scoped functional/source
  candidate, with no unresolved targeted P1/P2 identified. This is not a
  product-stage PASS.

## Current delivery boundary

Feature GREEN is fixed at
`2387afd7b1968c73b18a8146f5bc80a611bb6fd8` (25 files, `+967/-55`; four tests
previously present in RED commits had no content diff in this commit). The
exact clean detached checkout build passed in session 94030:
`npm.cmd run build -- --webpack`, exit 0; compile 19.3s, TypeScript 41s, and
111/111 static pages in 4.2s.

The exact-SHA production preview started in session 37824 at
`127.0.0.1:52340` (Ready 274ms). `/` and
`/app/simulation/result?run_id=60000000-0000-4000-8000-000000000002` returned
200 with `s-maxage=31536000`; `/app/start?revise_run=60000000-0000-4000-8000-000000000001`
and `/app/archive` returned 200 with `no-store`. The Result API returned 500
with `no-store` because this clean preview had no Supabase configuration.
That is fail-closed behavior only, not evidence of Auth or database acceptance.

Production-CSS browser QA passed with
`node output/playwright/reality-review/production-qa.mjs http://127.0.0.1:52340`,
exit 0 in 9.52s. The fixture used the actual runtime source →
`buildObservedOutcome` correction → new runtime → projector source-map chain,
with 3 executed samples, 9 steps, and 3 targets. At both 375px and 1280px, four
real CSS files loaded with the AppShell, timeline, review, and receipt; the
inspected feature content was unobscured and had no horizontal overflow. The
page showed one receipt and its source-link href targeted the expected in-app
source. No UUID text, writes, or page errors were observed. The isolated
browser used only two mock read-only Result/Outcomes GETs and had no cookies.
Root visually inspected
`output/playwright/reality-review/production-css-receipt-375.png` and
`output/playwright/reality-review/production-css-receipt-1280.png` and
reported the checked feature area was clear. This does not establish that all
global AppShell/navigation overlay behavior is resolved. These local
screenshots are QA evidence, not real-account or database acceptance. Git
worker confirmed a normal non-force push of exact `2387afd`
(`2387afd7b1968c73b18a8146f5bc80a611bb6fd8`) exited 0; live
`origin=HEAD=upstream` matches that SHA, divergence is 0/0, and the index was
empty at push verification. This is the development branch only: no
main-branch update, PR, or deployment is claimed. No PostgreSQL
compile/migration, Auth/RLS, full-suite, coverage, real-account, or phase-level
PASS is claimed.
