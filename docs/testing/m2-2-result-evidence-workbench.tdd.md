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
