# Track B B3 multi-domain life-climate candidate: TDD and evidence record

Date: 2026-10-20. This is a scoped source/functional candidate record. B3 is
one feature candidate for Stage 6 of the fixed nine-stage product route. It
does not narrow the product's total goal, complete Track B, change B1/B2
history or hashes, alter V2 Core, or constitute stage PASS, release, or launch
acceptance.

## Contract under review

`life-climate-b3-v1` reads the authenticated owner's latest submitted/frozen
Seed and exact Reality Profile revision. Its frozen source includes three
scalar Reality fields, five bounded lists, all six life-model domains, declared
resources and constraints, safe evidence summaries, classifications, a
source-context digest, and the server assessment time. Unknown values remain
unknown, never numeric zero. A run contains a confirmed baseline and at least
two confirmed alternatives. The horizon is one year / four quarters, three
years / three annual stages, or five years / five annual stages.

Quantities carry an explicit decimal, unit, and `once` / `quarter` / `year`
period; the UI does not infer annual rates from quarterly inputs. Resource
effects and structural changes are applied as one planned rule only after its
guards, stage order, deadlines, and bounds are evaluated. Required recurring
flows are tracked as obligations, with unfunded and unknown states preserved.
The output retains complete stage context, six-domain state, source
constraints, obligations, resource/investment state, Events, Claims, and
baseline comparisons. Event causal links remain within one path and point to
earlier Events. Each Claim cites its supporting B3 Event(s), and the Report
references its Claims. These are conditional simulation artifacts, not
real-world occurrence evidence, probability estimates, or exact-date
predictions.

The optional future Symbolic series is separately authorized and default-off.
It is non-causal: it does not affect quantities, rules, Events, Claims, or
evidence. Raw birth and Seed safety inputs are private intent material and do
not appear in owner-readable DTOs. Public result projection strips Seed/Profile
binding identifiers and revalidates the exact frozen source, request, result,
Event-to-Claim links, and Report references before returning a saved result.

Persistence is a separate append-only B3 ledger: `life_climate_b3_intents` and
`life_climate_b3_receipts`. Owner RLS exposes only the read-only safe column
allowlist. Service-only `SECURITY INVOKER` RPCs reserve intents and finalize
receipts. Same-owner/same-key/same-body replay returns the original intent and
receipt from the reservation RPC before mutable source checks; changed body
conflicts. The submit POST replays a completed result or stable rejection code;
the owner-scoped intents GET returns the stored rejection receipt. A terminal
validation/safety rejection has a `rejected` receipt and no result bundle. A
transient post-reservation failure remains `pending` with no terminal receipt.
Only server-registered intents are guaranteed to recover across refresh or
devices. `not_registered` can release a body only on a trusted first-response
proof with the original key and matching canonical request digest; unknown
results and HTTP 401/403 alone cannot unlock or authorize changing the body or
key. Immutable delete triggers prevent physical deletion of these rows, so a
complete account-deletion workflow is not established by this schema.

The HTTP shape preserves the existing B1/B2 POST wrapper at
`/api/life-climate/runs` and dispatches `{ idempotency_key, request }` to B3.
Separate B3 GET routes read source, registered intents, and completed B3 runs.
All routes derive the owner from the authenticated session, reject anonymous
users, use `no-store`, and hide raw Seed text, internal binding identifiers,
birth inputs, safety details, and service credentials.

## RED checkpoints and reviewed fixes

- The API RED checkpoint is `9f3fa9b`; the UI RED checkpoint is `8c1c25a`.
  They preserve earlier failures and are not the final feature revision.
- During engine review, two P2 defects were independently reproduced: a
  `resource_at_least` guard did not apply its deadline, and a required
  recurring flow could leave `rule_executed` satisfied by a permanent earlier
  success instead of the latest required payment. The author added focused
  regression coverage, observed 6 failures / 2 passes across 2 files (exit 1),
  then repaired the engine. The independent review task's final rerun could not
  reproduce either original defect. Root checked and accepted its report; Root
  did not personally rerun all engine cases.
- An independent review task reproduced two UI P2 defects: deleting a middle
  rule and adding another could produce duplicate order values `[0,2,2]`,
  rejected as `invalid_b3_request`; editing a rule then rereading source could
  leave a stale edit index, causing an undefined-rule access error on Add and
  keeping Submit locked. The author repaired both. The same independent review
  task then passed `b3-ui-dom.test.ts` 13/13 and both original read-only
  Chrome-equivalent probes; Root checked and accepted the report rather than
  personally rerunning the 13 cases. No known instance of these four reviewed
  engine/UI P2s remains open in the reviewed scope.
- A non-blocking UX gap remains: the UI permits a prerequisite order the engine
  correctly rejects and does not explain the invalid ordering sufficiently
  before submit. Keep it for follow-up; the server/API rejection remains
  authoritative. The QA mock's bare 422 lock state is not evidence that the
  production flow deadlocks.

## Focused evidence (scopes are separate and may overlap)

- Engine author report after repair: 6 files / 50 tests passed; scoped ESLint
  reported 0. The independent review task reran those 6 files: 50/50 passed,
  exit 0 in 8.28 seconds, scoped ESLint 0, and neither original P2 reproduced.
  It reported no new P1/P2 in the engine-only review. Root checked and accepted
  that report; Root personally ran only selected contracts+admission (17) and
  boundaries+source (10) cases. This accepts the pure engine candidate review,
  not the entire B3 batch or Stage 6.
- Backend author report: 4 files / 40 tests passed; coverage was statements
  91.34%, branches 85.28%, functions 100%, lines 96.12%; TypeScript and scoped
  lint exited 0. Coverage is scoped to the reported backend run.
- UI author report after repair: 3 files / 16 tests passed, scoped lint 0, and
  TypeScript 0. The independent review task separately reran
  `b3-ui-dom.test.ts`: 13/13 passed, exit 0 (62.49 seconds), and both original
  read-only Chrome-equivalent probes exited 0. Root checked/accepted this
  report, not a personal rerun of all 13 cases. These reports close the two
  named P2s, not every UI combination or real-account behavior.
- The first independent API/UI review task reported 5 files / 44 tests passed;
  its scope overlaps other runs, so counts must not be added. Root's own
  selected contracts + admission run was 17 PASS, and boundaries + source was
  10 PASS; those selections also overlap and are not a whole-module total.
- Four B3 CSS files loaded in production preview; the mounted component
  identities were only `B3Client` and `B3Result` (two, not four). The reviewed
  UI QA used real React, pure engine and production CSS with mock HTTP, not a
  signed-in account.
- The authored SQL test
  [`life_climate_b3_intents_test.sql`](../../supabase/tests/life_climate_b3_intents_test.sql)
  is a candidate pgTAP specification. It has not run against PostgreSQL.

The targeted test/source files include the B3 contracts, source, engine and
server HTTP tests; `route.b3.test.ts`; B3 UI DOM tests; and the B3 intent/receipt
SQL fixture. Test counts above are attributed to the author or Root as stated;
this document does not claim that a whole-repository test suite ran.

## Delivery and acceptance boundary

The B3 feature commit is
`611460724ed075f44139258e2b3a977d50bb4eca` (34 files, `+3101/-3`), normally
pushed to the development branch with exit 0. Root independently checked live
`ls-remote` at the same SHA; at push verification HEAD/upstream divergence was
0/0 and the Git index was empty. This is not main,
a PR, deployment, or release. A later docs-only commit does not change feature
source or constitute a new build.

Root built the exact feature SHA in clean detached worktree
`C:/Users/clf04/Documents/AI推演/.astraloom-build-3d446a2` using
`npm run build -- --webpack`, session `57797`, exit 0: compile 33.3s,
TypeScript 60s, and 110 static pages in 5.6s. Root stopped old preview `30838`
and checked listener 0 before starting exact-build production preview session
`6893` at `127.0.0.1:52340`; Ready in 348ms, Build ID
`-ypTxip0IQL53S30VLw-o`.

Final production QA script exit 0 and checked source SHA/HEAD, on-disk
BUILD_ID, and served CSS bytes. Actual B3, legacy entry and archive routes at
375px and 1280px returned 200 for six documents with no horizontal overflow;
the archive was signed out.
The detailed mock-HTTP journey used actual React, pure engine and production
CSS, and exercised the 14 Profile dimensions, two alternatives, six-digit
quantity inputs with explicit amounts, units and periods, six domains, context,
obligations, Claim anchors, relocation/learning/readiness, three paths,
unknown-network to registered-intent refresh recovery, 401 lock, three
byte-identical body/key POSTs,
source/horizon confirmation reset, and history isolation for two same-digest
anchors. It performed zero real writes. Page errors were 0; console errors
were 10 (actual API 503 x6, legacy Profile 500 x2, mock network x1, 401 x1).
27 `ERR_ABORTED` requests and one deliberate `ERR_FAILED` are preserved in the
report. Root inspected four focused 375/1280 screenshots and saw no clipping in
the reviewed areas; that is not global-shell visual acceptance. Results are in
[`production-qa-result.json`](../../output/playwright/life-climate-b3/production-qa-result.json)
and [`production-qa-summary.md`](../../output/playwright/life-climate-b3/production-qa-summary.md).

QA attempts 01/02 failed because the chosen fixture used a same-quarter
phase-2 recurring flow as a phase-1 relocation prerequisite; the engine
correctly rejected the invalid phase order. With the fixture guard corrected
to `cash >= 1000`, the main journey passed; production schema was not loosened.
Actual source/intents/runs APIs returned 503 and the legacy Profile API returned
500 in the unconfigured preview. These are configuration/Auth gates, not PASS.

The migration
[`20261020140722_life_climate_b3_intents_and_receipts.sql`](../../supabase/migrations/20261020140722_life_climate_b3_intents_and_receipts.sql)
and pgTAP test remain authored source; Docker `info` most recently exited 1
because the Linux Engine pipe was unavailable. Migration execution, PostgreSQL,
pgTAP, Auth/RLS, real-account acceptance, and real cross-device recovery remain
unverified. This database gate does not make the whole Astraloom project
BLOCKED; the nine-stage goal remains active. B3 is only a Stage 6 feature
candidate, not complete Track B, Stage PASS, deployment, or launch. The known
non-blocking prerequisite-order explanation gap remains for follow-up.

The contracts live in [data contracts](../DATA_CONTRACTS.md#track-b-b3-multi-domain-life-climate-candidate-2026-10-20),
[API contracts](../API_CONTRACTS.md#track-b-b3-multi-domain-life-climate-api-candidate-2026-10-20),
and [UI acceptance](../UI_ACCEPTANCE.md#track-b-b3-multi-domain-life-climate-journey-candidate-2026-10-20).
