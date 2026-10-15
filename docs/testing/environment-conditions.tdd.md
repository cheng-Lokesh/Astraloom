# Environment-condition rules v2 candidate evidence

日期：2026-10-15。本文记录局部候选证据，不构成九阶段或发布验收。
V2 Core 未修改；完整 Auth/RLS、真实数据库、CAS、全量 suite、生产 CSS
视觉和用户账户旅程仍待验证。

## Contract under test

- A saved v1 draft remains v1 and a saved v2 draft remains v2. A new unsaved
  draft initializes to the version of its read source, including v2 when
  `signature_v2` is available. Explicit `GET ...?prepare_version=v2` returns
  an additional separate read-only `preparedSourceContext`; POST rejects query
  parameters. V1 signature/source context and receipt/hash behavior remain
  unchanged; v2 has a separate `signature_v2`.
- The v2 operation is `update_external_variable`, with `variableKey` in
  `pressure-N` or `external-variable-N` (`N` 1–8) and a safe text value. It may
  select only an existing non-unknown Profile variable at its current ordinal,
  on the `self` actor/path; replacement differs from baseline and each path
  allows one condition. V2 rules/source/request envelope must match. The old
  six-field v1 source context stays strict; v2 may add optional `variables`
  selectors, and its `signature_v2` does not backfill the v1 source hash.
- Save stores every confirmation as false; Run requires fresh confirmation.
  Unknown requests retain their exact body/key for replay. A genuinely stale
  source is read-only; reconfiguration starts empty against current source and
  does not transfer old ordinal rules.
- At most one environment condition occupies each path's existing action cap:
  three slots at 30 days, six at 90 days. The Reality baseline and a different
  replacement simulation assumption remain separate; no private psychology is
  inferred.
- A selected condition must produce its actual controlled Event before the
  same-path `after_rule` chain can follow. Result states are
  `selected`/`not_selected`/`not_triggered`/`not_reached`, independently per
  sample/path. An early-ending candidate can be `not_reached`.

## RED and narrow fixes

- RED index: UI checkpoint `432854d` had 2 business failures; SQL checkpoint
  `e0b214d` had 3 source failures (not database execution); history/query
  checkpoint `9a053bd` had 2 targeted business failures; variable-ID helper
  checkpoint `da7b728` had 1 algorithm failure and 5 passes.
- Backend RED checkpoint `7c138fa06a6b4298fd0f6988b0b181067701aeb6` recorded
  initial environment runtime/schema gaps (6 business failures, 9 passing).
  Later independent review found that an environment Event envelope could
  accept extra targets/references/prior bindings. RED checkpoint
  `72354b658e4b995d9edfc98864da3d30511ae67f` had 4 tamper failures, 2 canonical
  passes, and 5 skipped cases. The narrow projection fix binds the exact
  envelope; independent recheck was 6 PASS / 5 filtered. Core remains unchanged.
- UI RED checkpoint `08c9a523fd570e4421ff285e2b66c92bff56c05b` covered v2
  downgrading after an ordinary action and acceptance of a same-as-baseline
  value. Both were fixed; the focused regression was 3 files / 25 tests PASS,
  with an independent 7-test UI re-review PASS.
- SQL source review found a variable-ID helper mismatch. The dedicated strict
  helper was corrected to match the TypeScript factory; the source algorithm
  parity check and independent review were 6/6 PASS. These are source checks,
  not database execution.

## GREEN evidence and limits

- Backend focused command:
  `npx vitest run src/lib/digital-life/environment-rules.test.ts src/lib/formal-sandbox/environment-conditions.runtime.test.ts src/lib/digital-life/model-draft.test.ts src/lib/formal-planning/relationship-response.test.ts src/lib/formal-sandbox/model-context.server.test.ts src/lib/formal-sandbox/result-projection.server.test.ts src/app/api/sandbox/runs/digital-life-route.test.ts src/lib/formal-sandbox/digital-life-client.test.ts --reporter=dot`
  reported 8 files / 93 tests PASS, exit 0. After the envelope fix, its targeted
  check and independent recheck were each 6 PASS / 5 skipped or filtered.
- UI focused suite reported 7 files / 45 tests PASS; after the two boundary
  fixes, the 3-target regression reported 25 tests PASS. The 375×812 Chrome
  exercise used the actual React component and typed client with mock HTTP and a
  stub router; it did not use production CSS or a real account.
- SQL tests include source-parity checks and related model-draft regression
  tests. The source algorithm parity review reported 6/6 PASS. Migration
  `20261015152158_environment_conditions_v2.sql` is new and forward-only;
  pgTAP has 56 cases but was not run against a database. Its completion coverage
  does not establish a full valid DB completion chain.

The fixed feature commit is `b5b9df35a0e77e8190ce641d12995c55f8e02ef8`.
Its isolated clean `npm.cmd run build -- --webpack` completed at that exact
SHA (session 22390, exit 0; compile 29.0s, TS 52s, 111/111 pages in 6.4s).
Production preview at `127.0.0.1:52340` (session 74224) reported Ready in
407ms. HTTP checks: `/` returned 200 with `s-maxage` (not `no-store`);
`/app/start?model_draft=current` and its invalid entry returned 200,
`no-store`. Without Supabase configuration,
`GET /api/sandbox/model-draft?prepare_version=v2` returned 500,
`no-store`; this is only missing-configuration fail-closed behavior, not Auth
or DB evidence. The feature commit was pushed successfully (exit 0); live
origin current dev ref is the exact SHA above, upstream `0/0`, index empty.
The subsequent five-path docs-only commit does not change the built app code
and is not separately built. No evidence here proves real Auth/RLS, DB
persistence, owner isolation, concurrent CAS, full-suite health, production
CSS acceptance, or nine-stage completion.
