# Profile-update model reconciliation

Date: 2026-10-16. Status: functional candidate; bounded independent review,
final UI regression, exact feature-SHA build/preview, and push passed. Real
account/database acceptance remains pending. This entry follows the current user-directed persistent personal
digital-life sandbox route. Career remains a possible input domain, not the
product's final boundary. The frozen V2 Core remains unchanged.

## Contract under test

- The only reconciliation entry is the explicit read-only
  `GET /api/sandbox/model-draft?prepare_version=v2&reconcile_revision=N`.
  `N` is a positive safe integer naming the authenticated owner's latest saved
  draft revision. A different latest revision returns `409 revision_conflict`
  before the additional scope query. Ordinary GET and
  `GET ...?prepare_version=v2` retain their existing behavior; POST rejects all
  query parameters.
- Preparation is valid only when Reality Profile revision strictly increased
  while the submitted Seed, locked Graph, Agent snapshot, ordered Agents, and
  ordered relationships still match. The reconciliation branch alone performs
  an additional owner/RLS-scoped Seed lookup and compares it to the current
  source. A changed or inconsistent chain returns
  `409 model_reconciliation_scope_changed`; if no valid v2 source can be
  prepared, the existing `409 model_source_stale` is returned. The two reads
  are not atomic; Save's existing source check and revision compare-and-swap
  remain authoritative.
- The response preserves the old saved source/rules and returns a separate
  current `preparedSourceContext` plus a
  `digital-life-model-reconciliation-v1` plan. It never maps old resource or
  variable ordinals by name or position. No SQL, source version, table, Run, or
  permission is created by this read.
- Each old resource action needs an explicit current resource selection and a
  newly valid amount. Each old environment action needs an explicit current
  non-unknown variable selection and a safe replacement different from the
  current baseline. A Profile-linked commitment needs explicit detachment or
  rule removal. Detachment removes only `profileEntryKey`, preserving the user's
  commitment text/status; no old Profile value is reconstructed. Explicit
  removal previews and confirms dependent action/strategy removal.
- Applying a complete, revalidated plan produces only an unsaved current
  v2 draft. All action/strategy confirmations are false, and `planning`,
  `symbolic`, `outcomeCalibration`, and `requestIdentity` are reset. It does not
  save or start a Run. The UI must Save, GET and verify the fresh source, collect
  fresh per-rule/strategy confirmations, and then use a new Run request. An
  unknown Save/Run response locks changes and source refresh until the exact
  original body/key is replayed. This recovery is mounted-component scope only.
  Historical drafts and Runs remain immutable.

## RED evidence

At the committed dev-branch checkpoint `5f516f4`, the backend two-file focused
run reported 22 tests: 11 business assertions failed and 11 passed, exit 1.
The unimplemented route/helper behavior was the expected RED. A separate
runtime-stage apply-helper RED run imported the real entrypoint while it still
used the fail-closed placeholder; all 9 expected behavior cases failed without
setup errors. This was not a separately committed Git checkpoint; its Git
history was not captured as an independent commit. The 375px Chrome exercise used the real React component and typed
browser client with mock HTTP and initially had one business failure because
the explicit reconciliation CTA was absent. These are baseline failures, not
candidate regressions.

The intermediate Profile-save integration run in `profile-client.test` and
`current-model-draft.test` reported 2 business failures and 5 passes, exit 1.
The missing successful-save continuation link and stale-draft continuation copy
were fixed. A later UI-only deletion-preview RED was recorded at committed
checkpoint `e1448c4`; that checkpoint changed only the UI test and exposed a
missing strategy cascade preview when deleting a variant's last self action.
The implementation was then updated and the final focused UI run passed.

## Candidate GREEN evidence

The backend producer reports five focused files and 72 tests PASS, exit 0,
covering the reconciliation API, pure apply helper, canonical runtime, and
existing model-draft/rule-operation regressions. The scoped nine-path ESLint
run exited 0 with no warnings. After replacing an unused destructuring pattern
with clone/delete, the apply-helper file reran with 18 tests PASS, exit 0.
These are producer/local functional checks. A later independent reviewer
reran the frozen API, apply, runtime, final UI, and existing rule-operation
targets serially: 5 targets, 52 tests PASS, exit 0, 18.35 seconds. The reviewer
changed no files and found no reproducible P1 or P2 within that narrow review
scope. This does not replace database/account acceptance.

The final focused UI command was:

    npx vitest run src/components/formal-sandbox/model-reconciliation-ui.test.ts src/components/formal-sandbox/model-rule-draft-operations.test.ts src/components/formal-sandbox/current-model-draft.test.ts src/app/app/reality-profile/reality-profile-client.test.ts
    4 files passed, 18 tests passed; exit 0

The UI worker reports its eight-path set READY, with scoped eight-path ESLint
and `git diff --check` both exiting 0. The 375px React/typed-client/mock-HTTP
exercise covers the saved-Profile success-only `核对并继续调整行动模型` link to
`/app/start?model_draft=current` (and no link on save failure), Dashboard
stale-source wording, a second prepare read that
rejects changed current source before Apply, and `409
model_reconciliation_scope_changed` remaining read-only with no Save or Run. It
also covers full strategy preview when removing a variant's final self action,
cancellation preserving the draft, and three dependent rules shown before
removing the main predecessor. Independent focused review also reran the final
UI test target as part of its five-target command.

The canonical runtime sample verifies that the original Run bundle and saved
request JSON remain byte-for-byte unchanged. Its prior eight-hour source stays
historical. On the updated source, ordinal 1 is a new four-hour rest resource
and remains unconsumed; the user explicitly reselects ordinal 2, a six-hour
available-time resource, and a two-hour allocation leaves four hours. The
controlled Event dependency chain remains valid.

## Exact feature-SHA build and preview

The implementation is frozen in the 17-path feature commit
`ed978e3e1efd0c22e0d10f32d9e362862b7e6fe9` (`+518/-73`). Root checked out
that exact SHA detached in an isolated clean worktree and ran:

    npm.cmd run build -- --webpack
    exit 0; compile 29.4s; TypeScript 50s; 111/111 pages in 6.3s

The production preview started in session `46823` at `127.0.0.1:52340` and
reported Ready in 405ms. The prior preview (session `74224`) was stopped and
its listener was verified absent before the new worktree was checked out.
HTTP checks on the exact feature SHA returned:

- `/`: 200, `s-maxage`.
- `/app/start?model_draft=current` and the invalid model-draft entry: 200,
  `no-store`.
- `/app/reality-profile`: 200, `s-maxage`.
- `GET /api/sandbox/model-draft?prepare_version=v2&reconcile_revision=3`:
  500, `no-store`, because Supabase configuration was absent. This confirms
  null-client fail-closed behavior only; it does not verify Auth, database, or
  RLS access.

The build and preview apply to the feature SHA only; this later documentation
edit is not included in that build. Gitworker then pushed the exact SHA to the
current development ref non-forcibly, exit 0; live origin matched the SHA,
upstream was `0/0`, and the index was empty. No main push, PR, or deploy was
performed. Later docs-only edits do not change the built feature code and were
not rebuilt.

The 375px UI exercise used the real React panel and typed browser client in
Chrome with mock HTTP. The reported functional path covers explicit resource
and variable reselection, same-as-baseline blocking, detaching the old Profile
link while retaining commitment text, preserving valid strategy/dependency
structure, Save compare-and-swap followed by GET and fresh confirmation, and
exact-body/key replay for unknown Save/Run outcomes. It also checks that a
second prepare read rejects a changed source before Apply and that scope-change
responses remain read-only. This exercise does not use a real signed-in account
or production page CSS.

## Remaining gates

- Real account/database gates remain open: Docker/database, live Auth/RLS,
  owner isolation, SQL/RPC execution, migration/pgTAP execution, concurrent
  CAS, cross-device persistence, and real-account history preservation were
  not verified; Docker/database is unavailable in this batch.
- These focused tests and mock-browser checks do not establish production
  styling, nine-stage completion, a complete Fork, or a stage-level PASS.
