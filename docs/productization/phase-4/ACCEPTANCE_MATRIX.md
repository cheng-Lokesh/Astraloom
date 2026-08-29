# M1 acceptance matrix and staged test plan

This matrix is the source of truth for Phase 4 RED/GREEN evidence. Commands are
selected from the repository's existing scripts; no dependency installation,
Docker start/reset, remote migration, real AI, or Stripe action is permitted.

## M1.0 contract and gap proof

| Guarantee | Evidence |
| --- | --- |
| Phase 4 inherits the exact Phase 3 canonical commit | Branch, HEAD, upstream, and remote preflight all equal `0bbb9a76cb35c0d985e3c643535a28675d7cd192`. |
| No parallel tables or engine are planned | Asset map points to existing canonical tables and a single adapter outside `src/lib/v2/**`. |
| Scope and non-goals are explicit | `README.md` and `DECISION_RECORD.md`. |
| V2 Core is untouched | `git diff --name-only -- src/lib/v2` is empty. |

## M1.1 security precondition

RED must demonstrate the current over-broad authenticated table privileges and
the permissive-policy OR weakening on `relation_edges`. GREEN must prove:

- unnecessary `TRUNCATE`, `TRIGGER`, and `REFERENCES` privileges are absent;
- the legacy `relation_edges_select_own` policy no longer weakens the submitted
  Seed plus canonical Graph condition;
- Phase 2/3 reads and controlled RPC writes still work;
- user A/B SELECT, UPDATE, DELETE, and cross-owner association fail both ways;
- anonymous table reads and protected RPC calls fail;
- the existing Seed/Consent counts are unchanged;
- all 12 canonical migrations plus one forward migration are applied without a
  reset and `src/lib/v2/**` remains unchanged.

Evidence: Phase 2/3 pgTAP plus the new M1 security SQL test and schema/grant
inspection through the already-running local Supabase.

## M1.2 formal run bundle and atomic execution

Tests are written and observed RED before implementation. GREEN covers:

- same owner/key/payload idempotency and same key/different payload conflict;
- different owners may safely reuse a key;
- owner mismatch, unlocked Graph, incomplete chain, and unsafe input write zero
  formal outputs;
- a forced mid-transaction failure leaves no orphan completed bundle;
- retry creates no duplicate Events, Claims, or Report;
- deterministic seed and identical input yield identical structural output;
- controlled Event creation precedes Claim creation;
- every Claim references existing same-run Events;
- a completed input/result bundle is immutable;
- the adapter invokes existing V2 boundaries without modifying `src/lib/v2/**`.

Evidence: focused domain/adapter tests, repository/RPC tests, and M1 pgTAP.

## M1.3 formal APIs

For Start, Status, Result, History, and Feedback, route tests cover 401, 403 or
non-enumerating 404 as appropriate, 404, 409, 422, and sanitized 500 responses.
They also cover owner scope, idempotency, incomplete/completed Result contracts,
stable History ordering/pagination, append-only Feedback, and zero orphan writes.

## M1.4 formal Graph, Running, and Result UI

Component and route tests cover loading, true empty, typed error, bounded retry,
conflict, reload/resume, and no false completion. Browser acceptance covers
375px, 768px, 1280px, keyboard navigation, visible focus, labels, associated
errors, non-colour state cues, and long-content overflow. Formal pages do not
fall back to localStorage. Result exposes Reality, Hypothesis, Simulation, and
Symbolic Lens with a non-prediction boundary; Career is labelled Golden Case.

## M1.5 History, Feedback, and Calibration

Tests and authenticated browser evidence prove two immutable runs coexist,
stable account History can reopen both, Feedback is idempotent and append-only,
old Graph/input/Event/Claim/Report bytes do not change, bounded calibration is
read only by a new run, a new browser session recovers History, and other users
cannot see it.

## M1.6 real authenticated acceptance and final regression

Use two fresh local authenticated users and an anonymous context with fictional
inputs. Do not print credentials, UUIDs, user content, or secrets. Capture
sanitized counts/hashes/statuses only.

Required gates:

- user A completes Seed -> People -> Agents -> locked Graph -> 30-day Track A
  -> completed Result -> History -> Feedback -> calibrated new run;
- two immutable results survive refresh, sign-out/sign-in, and a new browser
  context;
- A/B cross-owner reads, mutations, deletes, links, run starts, History, and
  existence inference fail both ways; anonymous access fails;
- browser Network, server behavior, database counts/invariants, and visible UI
  agree, with no console error/warn caused by M1;
- Phase 2/3 pgTAP and new M1 pgTAP pass;
- `npm test`, `npm run test:golden`, all V2 suite scripts,
  `npm run test:coverage`, `npm run lint`, `npm run type-check`, and
  `npm run build` pass;
- `git diff --check`, secret/PII scan, changed-file audit, and V2 invariant diff
  review pass;
- local HEAD, upstream, and remote Phase 4 SHA agree and the worktree is clean.

If the local Supabase is stopped, identities cannot be proven, or any gate
fails outside the current stage's safe scope, stop at the last passed and
pushed stage commit.
