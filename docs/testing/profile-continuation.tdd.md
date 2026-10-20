# New-situation Reality Profile continuation TDD record

Date: 2026-10-19
Status as of 2026-10-20: current feature SHA is `d1d53e5aafdec6ecf592a2fa7737d2075c659cb0`. Its exact build and bounded production QA script passed. Profile's API remains BLOCKED by missing Supabase configuration; Auth, database, real-account, and stage acceptance remain unverified.

## Product boundary

This feature starts a distinct Track A situation while allowing the owner to
review their saved Reality Profile as input. The existing Profile is never
updated by this flow. The new Seed receives a new complete Profile at revision
1 only after every current Profile item is reviewed, every retained non-null
resource rate is confirmed separately, the user confirms that the profile
applies to this situation, and privacy/safety consent is renewed.

Unknown fields stay unknown. Preparation clears saved `usePerTick` values;
expired constraints require an explicit updated deadline or removal and are
never extended automatically. The new Seed, consent, and Profile are created
together. People, relationships, action rules, old Graphs, Run permissions, and
historical artifacts are not carried forward. This feature does not establish
the truth of the owner's earlier self-authored history.

The implementation does not change V2 Core or the fixed nine-stage product
goal. See `FUTURE_SIMULATOR_V2.md` for current product authority.

## RED checkpoints

- `a516fe0` (`test: capture profile continuation API and intake RED`) added the
  initial API and intake DOM cases. The reported API run had 14 failed and 1
  passed; the initial Chrome intake run had 5 failures. The failures exposed
  missing preparation/submission behavior and incomplete review/continuation
  handling.
- `94e823a` (`test: reproduce unknown continuation auth recovery and invalid
  receipt version`) added regressions for releasing a frozen request after
  unknown-result authentication errors and for accepting a success response
  with an invalid continuation receipt version. Its pre-fix targeted Chrome
  run had 3 failures.

These commits are historical RED evidence. Their failure counts are not current
acceptance results.

## Contracts implemented in the candidate

### Preparation and submission API

`GET /api/seed-context?prepare_continuation=1` derives the current owner's
newest submitted/frozen Seed and reads its Profile. It returns a no-store,
versioned complete draft at revision 0, source Seed id/revision, preparation
time, and expired-constraint keys; all resource rates are cleared. The read is
not an atomic source snapshot.

`POST /api/seed-context` accepts an optional strict `realityContinuation`
object. Its `reviewedKeys` and `confirmedRateKeys` must exactly match all
current Profile and rate keys, without duplicates, and the user's new-situation
confirmation must be true. The continuation payload is mapped through the
single camelCase-to-database mapper. Existing submissions without continuation
retain the two-argument API/RPC contract.

The three-argument SQL writer locks by owner then key, recovers the exact
same-owner receipt before mutable source/deadline reads, locks and checks the
current source Profile revision, recomputes review/rate key sets, then checks
deadlines with its post-lock clock. It writes the consent receipt, new Seed,
and revision-1 Profile in one transaction. Receipt replay requires the same
key and exact body; a changed body conflicts. The authored migration and pgTAP
fixture are source candidates only until run against PostgreSQL.

### UI and recovery

Scene and Dashboard offer an explicit continuation route; blank intake remains
available. The intake reuses the existing Profile editor for an in-memory
draft and does not send a PUT to the old Profile endpoint. It requires fresh
per-item review, separate resource-rate confirmation, new-situation
confirmation, and privacy/safety acknowledgement. After saving, the path
continues to People setup.

An unknown submission keeps the complete original body and submission key,
locks editing and source refresh, and permits exact retry only. A malformed or
wrong-version continuation receipt is not treated as success. A 401/403 after
an unknown outcome does not release the request. Explicit stale-source/revision
or expired-deadline rejection can return to editing only after clearing all
review/consent confirmations so the user must review again.

## Candidate verification evidence

- Backend: 6 focused files, 67 tests passed, exit 0, 3.64 seconds.
- Owned TypeScript files: scoped ESLint on 8 paths exited 0 with 0 warnings.
- Whole-repository TypeScript check exited 0.
- Independent review reran an overlapping 6-file/67-test selection and passed.
  This overlaps the producer run and must not be added to its count.
- UI: 5 focused files, 24 tests passed, exit 0, 74.50 seconds; this includes
  17 new DOM cases. The scoped ESLint and TypeScript combined command exited 0.
  Coverage included Profile GET/PUT boundaries at 375/1280 widths, Scene and
  Dashboard entry points, 768/1024 English Scene boundaries, item/rate/deadline
  review, stale source, unknown-result 401/403 handling, and invalid receipt
  version handling.
- The producer UI suite used component CSS fixtures. A separate reported
  17-case run passed in 59.45 seconds; this is component/DOM test evidence, not
  exact-feature production CSS or an actual Next page check. The available
  candidate screenshots mount current React with mock HTTP and an older
  stylesheet; they do not use CSS from an exact-feature build.

The two backend 67-test results overlap; the 24 UI tests are a separate suite.
No combined total is claimed.

## Build repair and current preview QA

The exact-SHA build of the original feature commit
`da52ba21c25da55ec2e650bb78caab47a3fd4de6` (16 paths, +1489/-429) ran in
session `68999` and exited 1: after a 23.1-second compile, Next's generated
`ParamCheck` rejected the API `GET` handler's optional `Request | undefined`
first parameter. This remains the historical result for `da52ba2`.

Build-repair RED checkpoint `bbd22a0ba34ad608ed82abb8bdb562b1f145609c` captured
the actual TypeScript `TS2344` error from the `route.test.ts` type guard. GREEN
repair `c0a8329e5b3c81cbb812d6d15ba0ffe7e9dfa2ab` changes only `route.ts` and
`route.test.ts`: the handler now takes a required `Request`, and three test
calls pass a Request. Production business logic is unchanged. The matching type
check exited 0; three focused API-pure test files passed 48 tests, two-file
scoped lint exited 0, and route-only coverage was statements 84.93%, branches
80%, functions 85.71%, and lines 92.85%. These coverage figures are not for the
whole repository. Independent read-only diff review found the normal HTTP,
Auth, owner, query, and RPC branches unchanged.

Root's exact-SHA clean build for `c0a8329` ran in session `21670` and exited 0:
compile 50 seconds, TypeScript 55 seconds, and 110/110 static pages in 5.2
seconds. Preview session `67447` was Ready on `127.0.0.1:52340` after 407 ms.

Production QA on this preview has not passed. The initial QA attempt incorrectly
assumed every page had a page-level login gate: Intake redirected to `/login`,
Dashboard showed its gate, but Profile rendered a public empty, disabled editor
shell. Its unauthenticated `GET /api/reality-profile` returned 500; no saved
Profile data was shown. A read-only DOM probe exited 0 and observed loading text
change to the expected error message at 442.4 ms, then revert to loading at
691.9 ms. Save stayed disabled and real writes were 0. This is a global
localized-state cache defect, not a data leak or Auth bypass. Other QA attempts
also stopped on an invalid failure-text assertion or a QA-script precedence
error; see [QA attempt history](../../output/playwright/profile-continuation/qa-attempt-history.md).
### Text-layer repair and latest preview probe

Text-fix RED checkpoint `7ababfec891d04243865e5bf835882f49577e258` reproduced
the global localization issue in actual Chrome: 4/4 cases failed. GREEN repair
`d1d53e5aafdec6ecf592a2fa7737d2075c659cb0` changes only
`localized-text-layer.tsx` and a new DOM test. It compares current DOM content
with the last translation output so a fresh React message is not replaced by an
older translation. It does not cancel the dictionary or observer. Producer
Chrome checks passed 4/4 with lint and TypeScript checks at exit 0; an
independent 4/4 rerun and lint also passed. This is limited READY, not full
internationalization acceptance. Attribute-based opt-out remains an existing
boundary; text-based opt-out passed its test. `contenteditable` and an external
new source exactly matching the old translation remain existing boundaries.

Root's exact-SHA clean build for d1 ran in session `8228` and exited 0: compile
23.5 seconds, TypeScript 48 seconds, and 110 pages in 4.6 seconds. Root stopped
the c0 preview session `67447` and confirmed listener count 0 before starting
d1 preview session `30838`; d1 was Ready on `127.0.0.1:52340` after 296 ms.

The d1 read-only Profile probe exited 0. At 781.1 ms the loading message changed
to the correct error message and it remained visible for a further 1,000 ms.
Save stayed disabled and real writes were 0. `GET /api/reality-profile` returned
500 because Supabase is not configured in this preview; this demonstrates only
fail-closed behavior, not Auth or database acceptance. The earlier c0 probe
remains recorded in the [QA attempt history](../../output/playwright/profile-continuation/qa-attempt-history.md).
The d1 probe artifacts are [JSON](../../output/playwright/profile-continuation/profile-status-probe-d1d53e5a.json)
and [375px screenshot](../../output/playwright/profile-continuation/profile-status-probe-d1d53e5a-375.png).

The final `production-qa.mjs` run on the exact d1 preview passed in session
`11232`, build ID `l1yle0-A9PpLEtJHAZNCB`. At 375px and 1280px, the real Scene
route returned 200; Intake redirected 307 to `/login` (final 200); Dashboard
showed its login prompt (200); Profile rendered its public empty, disabled
editor shell (200). The protected Profile API returned 500 because Supabase was
not configured, and the correct error remained visible. This Profile gate is
BLOCKED; it is not Auth or account acceptance.

Four exact-build CSS files were loaded across three mounted React component
types—`FormalIntakeClient`, `RealityProfileClient`, and `SandboxLedger`—at both
375px and 1280px (six component/viewport checks), using mock HTTP and stub
AppShell/language. Coverage included 18 Profile review items, one
separate rate confirmation, correcting an expired deadline, exact body/key
retry, one old-Profile GET/PUT flow, and Dashboard overflow at both widths. The
run observed 0 page errors, 2 console errors (both the unconfigured Profile API
500), and 0 real write attempts or writes. Root reviewed the focused screenshots
and found the checked areas readable; this is not global layout or signed-in
private-route acceptance. See [QA summary](../../output/playwright/profile-continuation/production-qa-summary.md)
and [result JSON](../../output/playwright/profile-continuation/production-qa-result.json).

## Database and delivery limits at this checkpoint

The migration is
`supabase/migrations/20261018180647_reality_profile_new_situation_continuation.sql`;
the pgTAP source is `supabase/tests/reality_profile_continuation_test.sql`.
Docker information recheck on 2026-10-20 exited 1 because the Linux Engine
pipe was absent. No PostgreSQL compilation, migration execution, pgTAP,
database concurrency check, Auth/RLS run, or real-account test has occurred.
Gitworker completed a normal non-force push of exact d1 to the current
development ref (`73ff..d1`, exit 0). At the push verification point, live
`ls-remote`, HEAD, and upstream all matched the full d1 SHA, ahead/behind was
0/0, and the index was empty. This is development-branch upload only, not main,
PR, deployment, DB/Auth/RLS, or nine-stage acceptance. The documentation is
handled separately as docs-only closeout; it does not change d1 feature source
or imply a new build. The feature is not a full-product PASS or
launch claim. The current priority is completing this feature; the following
B3 item is contract design only, with no code implementation.
