# Phase 3 Step B TDD evidence

Status: **implementation verification complete; independent review pending**.

Scope: immutable Agent snapshot persistence, controlled generation, and safe
GET/POST API projections for a current owner's submitted and frozen Track A
Seed. Relation Edge generation, graph locking, UI/browser acceptance, Phase 4,
service-role access, real LLM expansion, and frozen V2 code are not included.

## RED and hardening history

The committed RED chain is:

1. `27bf63f`, `578f912`, `0dd1bbf`, `6246fe6`, `42241c8`, and `c990b50`
   established and corrected the initial Agent snapshot database and API
   contract.
2. `90cf73f` hardened schema nullability, safety/error consistency, owner-bound
   consent fixtures, authenticated RPC execution, receipt-guard cleanup, and
   real TRIGGER/REFERENCES privilege probes.
3. `bf200fc` made a clean `plpgsql_check` result a required database contract.
4. `135db57` required exact JSON media types and strict safe response shapes,
   including UUID, version, error, evidence, and cross-object consistency.
5. `6e9ec68` required one core Agent, at most two variants, unique confirmed
   NPCs, controlled source labels, and opaque rather than raw-text evidence
   references.

The contract was repeatedly run against the authoritative local database before
the implementation was accepted. Failures exposed malformed PostgreSQL regular
expressions, incorrect test role context, Phase 2 consent/freeze fixture
violations, an RPC guard that remained enabled in the surrounding transaction,
and privilege probes that failed before reaching the intended permission check.
Each failure was repaired without relaxing RLS, table privileges, Phase 2
constraints, safety routing, or the frozen V2 boundary.

## Migration record and immutability

- `20260802020000_phase3_agent_snapshot_persistence.sql` was first proven by a
  migration-plus-test outer transaction and rollback, then applied atomically
  with its migration-history row. Its SHA-256 is
  `dd56a47682c9c58fdda758b37e3d7194d90c4116a5e7dc05919944f3d4cd9fb3`.
- Post-apply static analysis found two non-runtime PL/pgSQL diagnostics caused
  by an explicitly declared integer loop variable shadowing the loop's automatic
  variable. The applied migration was not edited.
- `20260802020100_phase3_agent_snapshot_plpgsql_hardening.sql` replaced only the
  function definition needed to remove that declaration. It was independently
  preflighted inside an outer rollback transaction, then applied atomically with
  its own history row. Its SHA-256 is
  `210bf956641f3a4dde67ec67e7e98c7abd365bcad78c98cf66d2e87402755831`.
- `plpgsql_check_function_tb` now returns zero diagnostics for the Agent writer.
  Any future database correction must use another additive migration.

## Persistence, safety, and privacy guarantees

- The authenticated client supplies only a Seed selector, UUID idempotency key,
  and the bounded parallel-self option. POST uses one controlled database RPC
  and does not read raw Seed or Key People prose in the API route.
- The `SECURITY INVOKER` writer has a fixed search path, requires a non-empty
  `auth.uid()`, re-reads an owned submitted and frozen Seed, shares the Step A
  owner/Seed lock order, and binds replay to canonical request content.
- Formal Agent types are exactly `user_core`, `user_variant`, and `npc`. Every
  snapshot has exactly one core, zero to two variants, and at most one NPC for
  each confirmed Key Person. Downgraded output contains only one conservative
  core; blocked input creates no snapshot, Agent, receipt, or Edge.
- Agent rows bind the immutable snapshot, owner, Seed, request hash, safety
  result, field-source ledger, and non-empty evidence. Schema constraints enforce
  required snapshot/hash fields and safety/error consistency.
- Browser roles have no broad Agent or receipt SELECT and no Agent/Edge table
  DML, TRUNCATE, TRIGGER, or REFERENCES path. Receipt visibility is restricted
  to the controlled RPC and the guard is closed on normal, replay, and exception
  exits.
- GET binds the owned submitted/frozen Seed to its latest immutable parent and
  then binds every Agent to that parent, owner, and Seed.
- API responses require exact UUIDs and formal versions, consistent
  safety/error state, one core, bounded variants, unique NPC references,
  controlled sources, bounded confidence, and opaque evidence references.
  Unknown fields are stripped; malformed persistence returns only the stable
  `persistence_failed` response without echoing private values.

## Verified results

| Check | Observed result |
|---|---|
| Step B pgTAP | 174/174 inside `BEGIN` / `ROLLBACK` |
| Step A regression | 74/74 |
| Phase 2 regression | 7/7 controlled Seed plus 10/10 atomic submission |
| Database function lint | Zero Agent-writer `plpgsql_check` diagnostics |
| Agent API | 19/19; strict MIME, single-RPC POST, owner/frozen/latest GET, safe projection, redaction, replay, and fail-closed malformed persistence |
| Full repository | 47 test files and 463 tests passed |
| Static/build | ESLint, TypeScript, and the 105-page production build passed |
| Runtime smoke | `/` and `/app/new/agents` returned 200; unauthenticated Agent GET and POST returned 401 |
| Frozen V2 | Zero diff from `productization/phase-1-contract` |

## Non-destructive database evidence

The authoritative local database is the instance used through
`127.0.0.1:54321`. Before migration, after every outer-transaction preview, and
after the final regression, the business-data counts were:

`seed_contexts=16`, `key_people=0`, `agent_profiles=0`, `relation_edges=0`, and
`consent_events=16`.

The test fixtures always rolled back. No database reset, persistent fixture,
deletion, service-role client, or business-data rewrite was used. The formal
Agent enum is `user_core,user_variant,npc`.

## Remaining gates

Step B is not yet formally accepted. The remaining gates are:

1. commit the verified GREEN implementation and documentation;
2. push the branch and prove local, upstream, and remote SHA equality;
3. run a separate GPT-5.6-terra high, read-only independent review against the
   pushed SHA;
4. address any blocking finding with another RED/GREEN cycle.

Only an independent PASS closes Step B and authorizes Step C.
