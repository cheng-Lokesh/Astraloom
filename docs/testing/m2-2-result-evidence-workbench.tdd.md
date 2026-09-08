# M2.2 Result evidence workbench candidate evidence

Status: **candidate implementation and execution evidence, not independent final acceptance**.

## Scope and boundaries

This slice covers the formal completed-Run Result projection, visible evidence
boundaries, Claim-to-step/person/relation selection, anonymous and owner access,
and append-only feedback behavior. It does not authorize push, pull request,
merge, Phase 4 completion, or changes under `src/lib/v2/**`.

The workbench reads the immutable `result_bundle.inputSnapshot` stored on the
completed Run. The Result route does not read the current Agent or Graph tables.
Facts, assumptions, simulation steps, and conditional conclusions remain
separate user-visible ledgers. Internal database and evidence identifiers are
replaced by ordinal workbench keys and are not rendered.

## TDD checkpoints

| Checkpoint | Commit | Result |
| --- | --- | --- |
| Initial Result contract RED | `58857e1` | Established the strict safe projection boundary. |
| Workbench behavior RED | `dfcf9d0` | Reproduced the missing Result workbench behavior. |
| Initial GREEN | `58f8321` | Added the safe Result projection and workbench. |
| Focused lint repair | `cda72f3`, `ec84141` | Covered stale reads and synchronous loading behavior. |
| Evidence-boundary RED | `e3b0de8` | Two expected failures proved that facts/assumptions were not visibly rendered and unrelated people/relations were over-linked. |
| Evidence-boundary GREEN | `d53da8b` | Rendered the fact/assumption ledgers and restricted Event linkage. |
| Relation-provenance RED | `7a27017` | One expected failure proved that real-evidence-backed World Relations were not connected to Claims. |
| Relation-provenance GREEN | `9327100` | Connected Claims to frozen relations only through shared real-evidence provenance and included the relation endpoints. |

No production code changed before either new RED was observed. The production
repairs are confined to the M2.2 Result page and projection.

## Real completed-bundle evidence

A read-only query selected every existing completed formal Run with a non-null
result bundle. The current strict projection parsed all 12 of 12 bundles.
Every parsed bundle's input snapshot exactly matched its persisted Run input
snapshot: 12 of 12. The projections contained 54 frozen participants and 42
frozen relations in total.

Across those real projections there were 12 Claims. All 12 had at least one
direct frozen-relation link after the provenance repair. The largest observed
Claim linkage contained 5 people and 4 relations. This linkage comes from the
Run-frozen World Relation provenance and Claim real-evidence references; it
does not substitute the account's current Graph.

## Production-browser matrix

One single-process Node Playwright run used the production build and a real
Supabase browser PKCE flow. The authentication link stayed in process memory.
No identity, authentication link, token, cookie, identifier, credential, or
stored business text was printed or retained.

| Assertion | Result |
| --- | --- |
| Anonymous Result API | 401, PASS |
| Anonymous Result page | Saved evidence hidden, PASS |
| PKCE verifier and callback | Present and accepted, PASS |
| Existing completed Result | Loaded from the server, PASS |
| Fact / assumption / simulation / conditional-claim boundaries | Visible, PASS |
| Internal identifiers in rendered text | None, PASS |
| Horizontal overflow at 375 / 768 / 1280 CSS pixels | False / false / false, PASS |
| Keyboard Claim selection | Selected, PASS |
| Visible keyboard focus | Present, PASS |
| Highlighted direct support in the selected real Claim | 10 steps / 4 people / 3 relations, PASS |
| Unexpected console errors before and after the controlled conflict | 0, PASS |
| Page errors | 0, PASS |
| Expected browser network diagnostic for the deliberate 409 | 1, classified as test-induced |

## Feedback and cleanup

One bounded `useful` feedback record with a short note was submitted through
the formal browser API. The server returned success, and the new server record
remained present after a page refresh. Reusing the same idempotency key with
different content produced exactly one 409 request. There was no automatic
retry, and the selected rating and note remained intact.

The test reused an existing local owner and created no identity. Before the
browser operation, the harness captured exact identifier sets for all formal
business tables, Auth users, Auth sessions, Auth refresh tokens, and the
owner's mail collection. In `finally`, it removed only the one new feedback
row, new session state, and new mail item. Final deltas were:

- business tables: 0
- Auth identities: 0
- Auth session plus refresh-token records: 0
- mail items: 0

All four final collections exactly matched their recorded baselines. The
task-owned production server, browser, and temporary harness files were also
stopped or removed.

## Executable evidence

- Affected M2.1 and M2.2 regression: 5 files / 37 tests, exit 0.
- Focused M2.2 plus live-linkage verification: 5 files / 24 tests, exit 0.
- Type check after both repairs: exit 0.
- ESLint on the affected Result projection/page files: exit 0.
- Production build after the final repair: exit 0.
- `git diff --check`: exit 0.
- `src/lib/v2/**` diff from the authorized upstream baseline: empty.

Previously supplied broader gates remain separate evidence: full Vitest 69
files / 638 tests, coverage 90.85 / 81.21 / 95.55 / 93.52, pgTAP 8 files /
538 assertions, Golden 3 tests covering 8 cases, and the seven frozen V2 suites
with 83 / 116 / 63 / 47 / 23 / 40 / 22 tests all had exit 0. They were not
repeated here.

## Secret and PII scan

The added lines from the authorized upstream baseline through the candidate
were scanned without printing match values. Actionable secret assignments,
secret literals, email literals, and local origins each had 0 matching lines in
0 files. UUID-shaped literals had 10 matching lines in 2 files; manual
classification confirmed that all were static safety fixtures in test files,
not credentials, identities, persisted object references, or browser evidence.
Actionable secret or PII findings: 0.

## Known risk

The frozen input Agent records and World Agent definitions do not expose one
shared explicit identifier in this bundle version. Relation projection therefore
accepts a World-to-frozen-Agent association only when the frozen display name is
unique. Ambiguous names fail closed by omitting the relation linkage rather than
guessing. A future separately authorized bundle-version change should add an
explicit cross-ledger binding; this M2.2 repair does not alter the frozen V2 core.

## 2026-09-08 limited repair candidate after independent FAIL

Status: **local repair candidate only; M2.2 is not PASS**. Browser final
acceptance remains reserved for a new independent task. This repair created no
identity or business data and did not change `src/lib/v2/**`.

The independent final review measured the pre-repair candidate at **69 files /
642 tests**. The earlier **69 files / 638 tests** entry above is retained as
historical candidate evidence, not the current result. After this repair added
26 executable tests, the current full result is **70 files / 668 tests**.

### TDD checkpoints

| Checkpoint | Commit | Executed evidence |
| --- | --- | --- |
| Strict-reference and Run-generation RED | `1e070c5` | Focused command exit 1: 22 projection counterexamples failed for the intended gaps, and the executable request-generation suite failed because the gate did not yet exist. |
| Minimal GREEN | `22aaa40` | The same affected surface plus route/client coverage passed: 5 files / 49 tests, exit 0. |

The projection now rejects duplicate frozen Agent or Relation ids, duplicate
directed frozen edge endpoints, conflicting repeated World Definition, Entity,
or Relation identities, duplicate within-snapshot Definition/Entity/Relation
rows or Relation endpoints, dangling World and Event references, duplicate
Event/Claim/Report references, and dangling or duplicate real-evidence
references. Event actors are resolved through their real V2 Agent Definition
ids. Explicitly targeted World Relations select the same directed frozen edge
first and use a reverse edge only when that is the sole frozen match; inferred
endpoint linkage is omitted when opposite directed edges make the relation
ambiguous. No all-relations highlight fallback was added.

Result loading is now content-bound to both `run_id` and a monotonically
increasing request generation. A changed Run renders loading before any prior
projection can be selected, late responses from a prior Run or retry are
ignored, and retry creates a new loading generation. No ESLint suppression was
added.

### Read-only real-bundle compatibility

A temporary test harness read the existing local database without writing and
was removed immediately afterward. It returned only aggregate evidence:

- completed formal bundles: 12;
- strict projections parsed: 12;
- persisted Run input snapshots exactly matching bundle input snapshots: 12;
- projected frozen participants / relations: 54 / 42;
- command exit: 0.

Ambiguous frozen display names remain accepted only as display rows; their
World linkage is omitted rather than guessed. Projection output continues to
use ordinal UI keys and does not expose UUIDs, raw evidence references, or the
current Graph.

### Current executable evidence

- Focused M2.2 GREEN: 5 files / 49 tests, exit 0.
- Affected M2.0/M2.1/M2.2 regression: 10 files / 91 tests, exit 0.
- Full Vitest: 70 files / 668 tests, exit 0.
- Full coverage: 70 files / 668 tests, exit 0; statements 90.85%, branches
  81.21%, functions 95.55%, lines 93.52%.
- Full ESLint: exit 0.
- Type check (`next typegen && tsc --noEmit`): exit 0.
- Production build: exit 0.
- pgTAP: the historical `npx --no-install` wrapper exited 1 before SQL because
  its local CLI package was unavailable. The same eight local pgTAP SQL files
  were then executed directly against the running non-reset Supabase Postgres:
  538 planned / 538 ok / 0 not-ok, every file exit 0, aggregate exit 0.
- Golden: 1 file / 3 tests covering all 8 implemented cases, exit 0.
- Frozen V2 suites: Evidence 83, World 116, Trajectory 63, Analysis 47,
  Claims/Reports 23, Outcome/Calibration 40, Migration/Async 22; every command
  exit 0 with its configured coverage thresholds enforced.
- `git diff --check`: exit 0 before both code checkpoints.

### Secret and PII scan

All added lines from authorized upstream `b299e7d` through the GREEN candidate
were scanned without printing match values. Actionable secret assignments,
email literals, and local origins each matched 0 added lines. UUID-shaped
literals matched 12 added lines; manual path and context classification found
all 12 only in static test fixtures, 0 in non-test files, and 0 actionable
findings.

### Remaining acceptance boundary

This evidence does not replace authenticated browser replay. A new independent
task must still verify Run switching, late-response isolation, retry loading,
keyboard linkage, mobile overflow, console/network behavior, and the no-ID
rendering boundary in a real browser before any M2.2 acceptance decision.

## 2026-09-08 second limited repair after independent FAIL

Status: **local repair candidate only; M2.2 remains not PASS**. This second
repair addresses only the three findings from the second independent review.
It does not replace the reserved independent browser final acceptance.

### TDD checkpoints

| Checkpoint | Commit | Executed evidence |
| --- | --- | --- |
| Second-review RED | `fad3f37` | Focused command exit 1: the three projection counterexamples failed, and the real component test suite failed to import because the testable component/controller boundary did not yet exist. |
| Second-review GREEN | `a9f670e` | The same projection, component, request-gate, client, and route surface passed: 5 files / 53 tests, exit 0. |

The projection now compares a repeated World Relation identity using its
directed endpoints plus the complete canonicalized provenance object. Object
key order and the provenance reference-set order are normalized; a later
snapshot with different evidence or other provenance cannot overwrite an
earlier relation. Frozen Agent and frozen Relation `evidenceRefs` must also be
unique.

The former `page.m2-2.test.ts` source-file reads and string assertions were
removed. The replacement tests render the real React Result components to
observable HTML and execute the real feedback reducer, keyboard activation
controller, Result request-generation gate, and Run-bound Result surface. They
cover the safe projection, fact/assumption/simulation/conclusion ledgers,
Claim keyboard linkage and direct highlighting, all three feedback ratings,
note retention after failure, 40px/focus/reduced-motion/overflow contracts,
empty Run selection, A-to-B stale projection suppression, and retry request
generation.

### Current evidence after the second repair

- Read-only real-bundle compatibility: 12 rows / 12 parsed / 12 frozen-input
  matches, with 54 participants and 42 relations; exit 0. The temporary harness
  was removed and created no identity or business data.
- Focused GREEN: 5 files / 53 tests, exit 0.
- Affected M2.0/M2.1/M2.2: 10 files / 95 tests, exit 0.
- Full Vitest: 70 files / 672 tests, exit 0.
- Full coverage: 70 files / 672 tests, exit 0; statements 90.85%, branches
  81.21%, functions 95.55%, lines 93.52%.
- Full ESLint, type check, and production build: each exit 0.
- pgTAP: 8 files / 538 planned / 538 ok / 0 not-ok, exit 0.
- Golden: 1 file / 3 tests covering 8 cases, exit 0.
- Frozen V2 suites: 83 / 116 / 63 / 47 / 23 / 40 / 22 tests; every command
  exit 0 with configured coverage thresholds enforced.
- `git diff --check`: exit 0; `src/lib/v2/**` diff from `b299e7d`: empty.

### Current scan and remaining boundary

The added-line scan from authorized upstream `b299e7d` found 0 actionable
secret assignments, email literals, or local origins. Twelve UUID-shaped lines
remain confined to static test fixtures; non-test and actionable UUID findings
are 0.

Authenticated browser replay was intentionally not run in this executor task.
The candidate therefore waits for a new independent browser final acceptance
before any M2.2 decision.
