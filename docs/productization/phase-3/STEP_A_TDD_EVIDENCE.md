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
6. A second controller audit queried the effective database grants instead of
   relying on RLS policy names. It found that `authenticated` still had broad
   table privileges: hard DELETE/TRUNCATE/TRIGGER/REFERENCES on Key People,
   browser-readable opaque provenance columns, and owner-readable idempotency
   receipts. RLS isolated rows but could not hide those columns.
7. Privacy hardening RED: `bd2ae38 test: expose Phase 3 metadata privilege
   leaks`. The expanded pgTAP suite failed exactly 15 intended assertions
   against the then-current database, covering the excessive grants, private
   column reads, and direct receipt visibility.
8. Privacy hardening GREEN:
   `20260801230352_phase3_key_people_privacy_hardening.sql` revokes the broad
   grants, restores only product-column SELECT and RPC-required column DML,
   removes hard delete permission, hides receipts outside an RPC transaction,
   and replaces both writers so they do not SELECT private Key People columns.

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
- Direct Data API reads expose only the product-safe Key People projection.
  `trace_id`, writer/idempotency metadata, extraction fingerprints, internal
  source tags, and the field-source ledger have no browser SELECT grant.
- Receipt SELECT requires both owner RLS and the transaction-local RPC guard.
  Key People have no authenticated hard DELETE, TRUNCATE, TRIGGER, or REFERENCES
  grant; receipts have no UPDATE, DELETE, TRUNCATE, TRIGGER, or REFERENCES grant.
- A guarded update trigger preserves prior field provenance while stamping only
  the changed product fields. It is `SECURITY INVOKER`, has a fixed search path,
  and is not directly executable by browser roles.
- Extraction and mutation acquire the same owner/Seed advisory lock before
  their operation-specific idempotency lock, preventing opposite lock order and
  same-Seed state races.
- Unicode role terms are stored through SQL Unicode escapes. This avoids
  Windows-pipeline corruption while preserving Chinese manager/recruiter and
  other conservative role matching.
- Direct table writes, anonymous access, cross-owner access, draft Seeds, and
  browser DML for Agent/RelationEdge remain denied.

## Automated results

| Check | Result |
|---|---|
| Focused extract route | PASS - 5/5 |
| Phase 3 pgTAP | PASS - 74/74 inside `BEGIN` / `ROLLBACK`; includes writer/trigger privileges, least privilege, private-column denial, direct-update and receipt-insert denial, hidden receipts, provenance preservation, Unicode extraction, replay, rollback, and two-user isolation |
| Phase 2 pgTAP regression | PASS - 7/7 controlled Seed plus 10/10 atomic submission |
| Candidate injection attack | PASS - old three-argument function absent; attempted call writes zero rows |
| Duplicate/replay attack | PASS - two repeated manager mentions plus recruiter yield two unique rows and two unique receipt UUIDs; replay remains at two rows and one receipt |
| Metadata privilege attack | PASS - direct internal-column SELECT returns `42501`; direct receipt SELECT outside the RPC guard returns zero rows; broad hard privileges are absent |
| Unicode role extraction | PASS - Unicode manager and recruiter terms create exactly two conservative candidates without regex corruption |
| Migration strategy | PASS - additive follow-up migration only; no database reset and no edit to either already-applied Step A migration |
| Database function lint | PASS - `plpgsql_check` returned zero rows for both Step A RPCs and the provenance trigger |
| Focused API and coverage | PASS - 18/18; statements 98.78%, branches 93.10%, functions 92.30%, lines 100% |
| Frozen V2 comparison | PASS - zero diff from `productization/phase-1-contract` |
| Full tests, lint, type check, build | PASS - 45 files and 444 tests; ESLint, TypeScript, and the 103-page production build completed |

## Non-destructive database evidence

Before the hardening migration and after all rollback fixtures:
`seed_contexts=16`, `key_people=0`,
`key_people_idempotency_receipts=0`, `agent_profiles=0`,
`relation_edges=0`, and `consent_events=16`. The new migration was applied as a
single transaction and recorded as migration `20260801230352`. The same counts
were observed after the expanded rollback fixtures and full regression. No
reset, persistent fixture, deletion, or business-data rewrite was used.

## Independent acceptance

Independent read-only review task `019fbdaa-ccd6-77a2-a1c7-545ba6a23b74`
re-tested commit `3a6d7c2963e0b1e806a8b016deaf97229798129d` and returned **PASS**.
It independently repeated Phase 3 pgTAP 74/74, Phase 2 pgTAP 7/7 and 10/10,
the 18/18 API suite and focused coverage, `plpgsql_check`, the full 444-test
repository check and 103-page build, rollback data-count checks, and the frozen
V2 comparison. The final remote gate used the read-only GitHub connection to
confirm the branch head equals local and upstream.

Step A is closed. Step B Agent snapshot implementation is authorized; this does
not authorize Graph, UI/browser, Phase 4, or any other Phase 3 non-goal.
