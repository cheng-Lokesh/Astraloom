# Current digital-life model draft

Status: functional candidate; bounded independent source review found no
reproducible P1, while database acceptance remains pending. The draft is an
unconfirmed owner-scoped configuration saved against the current
digital-life source. It is not a Run or a permission grant.

## RED checkpoint

The committed baseline contained valid RED checkpoints for both the UI entry
journey and the backend boundary. The pre-implementation UI test was:

    npx.cmd vitest run src/components/formal-sandbox/current-model-draft.test.ts
    1 failed, 1 passed; exit 1

With model_draft=current, StartPage returned no FormalRunStarter because the
current-draft branch was missing. The no-query route still redirected to the
blank scene. This is the valid UI RED checkpoint.

The baseline included the model-draft schema, an explicit fail-closed server
stub, the authenticated route, and the four-path backend test checkpoint. The
root reproduced the backend RED:

    npx vitest run src/lib/digital-life/model-draft.test.ts --reporter=verbose
    4 failed, 1 passed; exit 1

For a current owner's saved draft with false rules, GET was expected to return
200 but returned persistence_failed with 500. Save, replay, and stale-view
scenarios also failed; the strict authorization/request-shape case passed.
This is baseline failure evidence, not final candidate GREEN.

Three later source-level assertions each produced a RED (exit 1) before their
fixes: JavaScript ASCII word boundaries, direct UUID-validator parity, and
rejection of unsafe legacy Profile display text. The root recorded iterative
checkpoints 38dbf288… for the ASCII/UUID boundary and
5ff6fbb4fc9775556ec6f10d635321c3b2fd5df7 for the source-context/profile
boundary. These are source assertions, not evidence that the SQL migration or
database RPC ran.

## Candidate behavior and named checks

src/lib/digital-life/model-draft.test.ts covers owner-scoped reads, false
confirmation flags, strict request shape, source signature and ordered-label
binding, stale-source behavior, revision and idempotency replay, and rejection
of changed or foreign receipts. Current named cases are:

1. preserves a valid optional own-undefined rule in same-key JSON recovery
2. keeps prior saved rules when the latest chain is unavailable
3. rejects changed same-key content before looking up today's source
4. rejects changed source labels, order, or hidden source signature without an append
5. does not mark equal signatures with different visible mappings current
6. rejects foreign receipts and invalid horizon/actor rules
7. recovers owned saved false rules after a new read/refresh
8. saves a strictly unconfirmed owned draft through the actual new boundary
9. recovers the original revision before changed current source reads
10. keeps a stale saved model readable without rebinding ordinal rules
11. denies anonymous, selectors, confirmed actions, and unknown permission fields
12. uses JavaScript ASCII word boundaries for draft text surrounded by Chinese characters
13. keeps the direct draft UUID validator equal to the installed API UUID boundary
14. rejects legacy Profile display values before a direct draft can poison its saved projection

The UI test source currently names five cases:

1. opens the current account draft without selecting a historical Run
2. keeps ordinary Start and refuses duplicate or mixed source selectors
3. reads the current account only and preserves exact save content/key for recovery without calling Run
4. refuses a malformed loaded draft that silently restores Run confirmation
5. shows the actual saved version or stale/unsaved state without transport identifiers

The runtime test covers an explicitly reconfirmed revised resource amount
changing the controlled Event delta while leaving the old bundle frozen.

The producer's final focused backend run was:

    npx vitest run src/lib/digital-life/model-draft.test.ts src/lib/digital-life/model-draft-runtime.test.ts --reporter=verbose
    2 files passed, 15 tests passed; exit 0

This is 14 model-draft boundary tests and one runtime regression test for the
controlled Event delta with the old bundle remaining frozen. The producer also
reported:

    npx tsc --noEmit
    exit 0

    npx eslint src/lib/digital-life/model-draft.ts src/lib/digital-life/model-draft.server.ts src/lib/digital-life/model-draft.test.ts src/lib/digital-life/model-draft-runtime.test.ts src/app/api/sandbox/model-draft/route.ts
    exit 0

The independent reviewer reran the two focused files:

    npm test -- src/lib/digital-life/model-draft.test.ts src/lib/digital-life/model-draft-runtime.test.ts
    2 files passed, 15 tests passed; exit 0

The bounded review covered the current server, route, source binding,
receipt-first replay, false confirmation flow, stale read-only view, SQL
request/trigger/ACL source, and the three source-parity assertions; it found no
reproducible P1 within that scope. These checks are not a full repository
acceptance.

## UI and request-recovery boundary

The dashboard entry and Start flow use the saved/current source distinction.
Stale saved rules stay tied to their old labels and cannot be ordinal-rebound.
After a save receipt, the client reads current state again before declaring the
draft current. Unknown Save and Run outcomes retain their original full bodies
and keys in mounted component references; page-reload or cross-device recovery
is not claimed.

The reviewer also executed the existing 375px synthetic browser harness from
memory with its screenshot write omitted; it exited 0. It covered empty input,
exact Save replay without Run, stale/null receipt followed by GET and fresh
confirmation, edits across source reload, exact Run replay, stale read-only and
explicit blank-current configuration, no horizontal overflow, and no rendered
UUID/signature. This is synthetic UI evidence, not real Auth, database,
cross-device, or visual acceptance.

## Outstanding acceptance

The migration is authored and source-level text/UUID/source-context checks
passed, but neither the migration nor the added pgTAP cases were run against a
database. Direct-RPC behavior, Auth/RLS, owner isolation at runtime,
append-only enforcement, revision-CAS concurrency, and real cross-device
persistence remain unverified. UI source and synthetic checks do not establish
real signed-in or visual acceptance. No full test suite or database runtime
acceptance is claimed here.
