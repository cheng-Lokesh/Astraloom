# Phase 3 Step A TDD evidence

Scope: formal submitted Track A Seed and Key People persistence only. No UI,
browser implementation, LLM, service-role client, Agent/Edge writer, Track B,
Phase 4, or frozen V2 code is included.

## Checkpoint history

1. Initial contract RED: `744c0f0 test: add Phase 3 key people contract`.
2. Initial GREEN: `afa4f5e feat: persist Phase 3 key people`.
3. Independent attack review at `afa4f5e` returned **BLOCKED**:
   - an authenticated owner could bypass the API and pass fabricated candidate
     fields to `extract_key_people_phase3(uuid,uuid,jsonb)`;
   - duplicate fingerprints produced duplicate receipt UUIDs, so the first
     request succeeded but the same-key replay raised `persistence_failed`.
4. Hardening RED: `863c0e7 test: expose Phase 3 extraction trust gaps`. The
   focused route suite failed because the route still read Seed prose and sent
   `p_candidates`; the new pgTAP contract required removal of that signature.
5. Hardening GREEN: the follow-up migration removes the three-argument function
   and creates `extract_key_people_phase3(uuid,uuid)`. It re-reads the invoking
   user's immutable submitted Seed and derives the canonical candidate set
   inside the database.

## Security and replay guarantees

- The browser/API supplies only `seed_context_id` and `idempotency_key`.
- Both writers remain `SECURITY INVOKER` with fixed
  `search_path=public, extensions`, non-empty `auth.uid()`, submitted ownership,
  and transaction-local RLS guards.
- The role catalog is conservative and ordered. It stores fixed provenance
  labels, never raw Seed prose, and repeated role mentions produce one
  fingerprint and one receipt UUID.
- Receipt hashes bind the immutable Seed payload hash, Seed id, and extractor
  version. Reusing a key for another Seed conflicts; same-key replay validates
  the real unique rows before returning.
- Direct table DML, anonymous access, cross-owner access, draft Seeds, and
  browser DML for Agent/RelationEdge remain denied.

## Automated results

| Check | Result |
|---|---|
| Focused extract route | PASS - 5/5 |
| Phase 3 pgTAP | PASS - 43/43 inside `BEGIN` / `ROLLBACK` |
| Phase 2 pgTAP regression | PASS - 7/7 controlled Seed plus 10/10 atomic submission |
| Candidate injection attack | PASS - old three-argument function absent; attempted call writes zero rows |
| Duplicate/replay attack | PASS - two repeated manager mentions plus recruiter yield two unique rows and two unique receipt UUIDs; replay remains at two rows and one receipt |
| Migration strategy | PASS - follow-up migration only; no database reset and no edit to the already-applied Step A migration |
| Database function lint | PASS - `plpgsql_check` returned zero rows for both Step A RPCs |
| Frozen V2 comparison | PASS - zero diff from `productization/phase-1-contract` |
| Full tests, lint, type check, build | PASS - 45 files and 444 tests; ESLint, TypeScript, and the 103-page production build completed |

## Non-destructive database evidence

Before the hardening migration and after all rollback fixtures:
`seed_contexts=16`, `key_people=0`,
`key_people_idempotency_receipts=0`, `agent_profiles=0`,
`relation_edges=0`, and `consent_events=16`. The new migration was applied as a
single transaction. No reset, persistent fixture, deletion, or business-data
rewrite was used.

## Remaining gate

This implementation does not authorize Step B by itself. A separate read-only
review must repeat the authenticated direct-RPC attack, duplicate replay,
anonymous/two-user isolation, full repository check, V2 comparison, and
local/upstream/origin SHA verification.
