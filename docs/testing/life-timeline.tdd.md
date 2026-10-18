# Track A life timeline TDD record

Date: 2026-10-19. Scope: safe, optional timeline projection for existing Track A
Results and its UI. This record distinguishes historical RED checkpoints,
focused GREEN evidence, independent sampled checks, and outstanding release
gates. It is not a phase acceptance.

## Contract under test

- Browser-safe `formal-simulation-timeline-v1` is optional on the main and
  strategy digital-life projections. It is derived from frozen
  `trajectoryAnalysis.trajectories[].steps`, actual recorded Events, and safe
  current projection maps; it adds no raw bundle key, persistence, API write,
  SQL change, or V2 Core change.
- Each path has three repeated samples. A 30-day run projects three ticks and
  a 90-day run six. Tick index and time follow actual trajectory steps/events,
  not Event ordinal. A tick is `event`, `no_actions`, or `not_reached`; the last
  has no time/state and is not waiting or a prediction.
- Action kinds are `commitment`, `resource`, `relationship_response`,
  `environment`, and `information_request`. Change kinds are `resource`,
  `relationship`, `environment`, `commitment`, and `information_request`.
  Safe before/after values describe recorded transitions only.
- Predecessors must be strictly earlier actual Event references within the
  same World, path, sample, and trajectory. Rule associations are derived from
  actual causal assumption IDs, the assumption ledger, and the current path's
  active rules. UI evidence is a safe hypothesis summary/guard description;
  no claims, probabilities, or cross-path associations are invented.
- A missing analysis preserves legacy steps without timeline. Valid legacy
  analysis without a typed model preserves old steps only and is not rerun or
  backfilled. Present but malformed/inconsistent analysis rejects projection.
  UI path/sample changes reset detail state; strategy feedback remains scoped,
  and main Outcome Observations are only linked by the existing anchor without
  auto-fill or write.

## RED history

- Backend checkpoint `fcfdf07fcfa72b95ac8d7b42866df7333c551e03`:
  `npm test -- src/lib/formal-sandbox/timeline-projection.test.ts --reporter=dot`,
  exit 1, 9 failed / 1 passed. This is a historical RED, not current feature
  status.
- UI checkpoint `032ec859dca65be56450fa7c55e497feed548c42`: one SSR assertion
  failed because the valid result lacked “数字生命时间线.” The exact command
  was not recorded, so no command/count beyond that reported result is inferred.
- The optional `ruleKeys` case later had a focused RED of 1 failed / 20
  skipped, exit 1; it then passed 1 / 20 skipped, exit 0, in 7.62 seconds.

## GREEN and independent evidence

- The current timeline file contains 21 cases spanning v1/v2/v3 with 30/90-day
  horizons, at most two strategy worlds, JSON round-trip, and coherent
  same-sample/path predecessor, future-reference, and tamper checks. The
  complete expanded 21-case matrix was not rerun after adding `ruleKeys`; the
  newly added rule-key case has its own focused GREEN result below.
- Producer's earlier three-file focused run (timeline, browser import boundary,
  old result projection) was 63 PASS, exit 0, 38.72 seconds. It preceded the
  optional `ruleKeys` addition and must not be described as a final rerun of
  the expanded matrix.
- Final TypeScript check session 61073 exited 0; scoped ESLint for the five
  owned files exited 0. Final UI run was 3/3 PASS, exit 0, 7.89 seconds (job
  78053), exercising runtime projection → JSON → typed client → React with
  mock HTTP, including visible rule hypotheses.
- Independent reviewer ran two filtered subsets: backend/boundary selection
  yielded 10 PASS / 12 filtered; timeline/UI selection yielded 2 PASS / 22
  filtered. Across them, 12 selected tests passed; this is not the complete
  suite or full expanded matrix. No unresolved targeted P1/P2 was found in
  that review. The two `-t` selectors were respectively
  `shows request|coherent|NPC in every stored|client rejects malformed|keeps actualbrowser|legacy`
  and `resolves only persisted current-path|reads JSON through the typed client`;
  these describe filtered samples, not a full test command/run.
- An earlier synthetic CSS/globals inspection did not find a production
  stylesheet asset. That is historical and superseded by the final exact-build
  browser QA: the production Next page loaded four production CSS files and a
  mock read-only Result API. Playwright passed 1/1, exit 0, in 6.30 seconds at
  375px and 1280px; no horizontal overflow, path/sample reset worked, the rule
  explanation rendered, the select was 44px, and there were zero writes,
  browser errors, or cookies. Screenshots:
  `output/playwright/life-timeline/production-css-mobile.png` and
  `output/playwright/life-timeline/production-css-desktop.png`. This is still
  mock-page UI evidence, not a real-account acceptance.

## Delivery and remaining gates

Feature GREEN is fixed at `d04f15e088500bb22f089e85f89404ec13277a1e`
(8 paths, +508/-12). Its exact clean isolated build passed:
`npm.cmd run build -- --webpack`, session 10835, exit 0 (compile 17.5s,
TypeScript 25.9s, 111 pages in 3.7s). The production server started at
`127.0.0.1:52340` (session 71254, Ready 224ms). `/` and the Result page
returned 200 `s-maxage`; `/app/start?model_draft=current` and `/app/archive`
each returned 200 `no-store`.
The Result API returned 500 `no-store` with missing Supabase configuration,
which is fail-closed behavior only, not Auth/DB acceptance. Git worker confirmed
a normal push of exact `d04` exited 0; live
`origin=HEAD=upstream=d04f15e088500bb22f089e85f89404ec13277a1e`, divergence
0/0, index empty. This is the development branch only, with no main update, PR,
or deployment claimed. No database, Auth/RLS, full-suite/coverage,
real-account, or phase-level acceptance is claimed. The documentation-only
follow-up did not run commands or operate the service.
