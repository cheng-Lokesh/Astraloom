# Complete current-model rule correction (2026-10-15)

Status: functional candidate; the narrow independent review passed, while
account, database, and full-product acceptance remain pending. This batch makes
the saved current model editable using the existing typed action and strategy
contracts. It adds no Core, API, or SQL contract.

## Scope and safety boundary

The owner can add, edit, and explicitly remove information requests, self
commitments, bounded resource allocations, and conditional relationship
responses. Strategies use at most two existing parallel-self variants, and a
strategy requires an action by that variant before it can be saved. Within one
mounted editing session, action keys remain stable and a deleted key is not
reused; behavior after a full reload or in a new session has not been
established. Dependencies are same-path, acyclic, and topologically ordered.
Removal previews the complete downstream cascade and requires explicit
confirmation.

Targets are bound to the current safe model. Information requests target only
NPC/group people connected to the user core by an existing Graph edge. A
conditional NPC response requires an explicitly selected NPC actor and an
existing locked edge connected to that actor. Changing a request target does
not transfer its old actor or edge to the new person; the rule remains invalid
until explicitly repaired or removed. No action edits Graph weights or
represents a real person's private intent.

Any mutation revokes the changed rule's confirmation, transitive dependent
confirmations, affected strategy confirmation, and associated budget, Symbolic,
and outcome permissions. Save persists only rules with all confirmation flags
false and does not create a Run. Run requires fresh confirmations. Unknown Save
or Run outcomes lock editing and source refresh until the exact original body
and idempotency key are replayed. Invalid and empty input fail closed. Previous
Run bundles remain immutable.

## RED evidence

Both failures executed the tests; neither was a discovery/import failure:

The UI RED checkpoint was `b43857e3c1004ec4717d876fd70db01932797c4a`; the
helper RED checkpoint is `6e7c79fc71564c31da992f6b033b02085b2bfbc4`.

```text
npx.cmd vitest run src/components/formal-sandbox/complete-model-rules-ui.test.ts
1 test failed; exit 1
```

The existing current-model editor had no Add Action entry point.

```text
npx.cmd vitest run src/components/formal-sandbox/model-rule-draft-operations.test.ts
10 tests: 9 failed, 1 passed; exit 1
```

The helper was still a fail-closed stub, so the real validation and mutation
cases failed.

## GREEN evidence

The focused logic result covered 10 helper tests plus one actual runtime test:
2 files, 11 tests passed, exit 0. The runtime case added a confirmed resource
allocation with amount `2` to a typed controlled Event, then verified that
cascade-deleting its preceding NPC response removed that response and the
downstream allocation Event from the new bundle. The old frozen bundle JSON
remained unchanged.
TypeScript and scoped ESLint checks also exited 0.

The UI agent's current focused command:

```text
npx vitest run src/components/formal-sandbox/complete-model-rules-ui.test.ts
1 file, 3 tests passed; exit 0
```

Its 375x812 Chrome check compiled and rendered the real React `FormalRunStarter`
with the typed browser client and mock HTTP transport.
It covered empty input without a crash; explicit NPC actor/edge repair after a
request target change; cascade preview, cancel, and confirm; adding a resource
action and strategy; Save and Run unknown-outcome locks with exact body/key
replay; all-false confirmations after Save; fresh per-item confirmations before
Run; stale-source disabled controls; no rendered UUIDs; no page errors; and no
horizontal overflow. The mocked transport is not a signed-in or database test.

The broader UI regression command reported by the UI owner covered five files
and 19 tests with exit 0: the new UI tests plus model-rule revision,
current-model draft, and Run starter/calibration tests. `npx tsc --noEmit` and
the reported scoped ESLint command each exited 0.

Independent narrow review command:

```text
npm test -- src/components/formal-sandbox/model-rule-draft-operations.test.ts src/components/formal-sandbox/model-rule-draft-runtime-integration.test.ts src/components/formal-sandbox/complete-model-rules-ui.test.ts
3 files, 14 tests passed; exit 0
```

The review ran at `6e7c79fc71564c31da992f6b033b02085b2bfbc4` on 2026-10-15 at
22:16:10 and took 14.57 seconds. The reviewer found no reproducible P1 in the
stated scope. The UI/helper GREEN changes were uncommitted.

Root reran the same three targets on 2026-10-15 at 23:02:58; the run took
21.26 seconds and passed all 14 tests across 3 files with exit 0:

```text
npm.cmd test -- src/components/formal-sandbox/model-rule-draft-operations.test.ts src/components/formal-sandbox/model-rule-draft-runtime-integration.test.ts src/components/formal-sandbox/complete-model-rules-ui.test.ts
3 files, 14 tests passed; exit 0
```

The canonical diff against `61947053e4570abe4103cdd9b8308fbcd2ec76fe` for
`src/lib/v2`, `supabase`, and `src/app/api` was empty at that recheck, and the
index was empty. No new API, SQL, or V2 Core changes are claimed.

## Remaining acceptance boundary

These are targeted source, runtime, and synthetic-browser results. No build or
push is claimed for this batch. Real signed-in behavior, database persistence,
Auth/RLS and owner isolation, concurrent CAS, cross-device recovery, and
nine-stage acceptance remain pending. No full suite or production-page visual
acceptance was performed. The feature is not a full Fork and does not establish
psychology inference, Graph-weight editing, or a real-world probability model.
