# Phase 3 Step E — Aggregate Regression Evidence

Status: **BLOCKED**. All executable repository, database, and static Hero
gates below passed. The required combined 375/1280 rendered browser replay
could not start because the Codex in-app browser rejected its first local-site
request under browser security policy. Phase 3 is not accepted and Phase 4 is
not authorized.

## Scope and starting state

- Repository: `Astraloom-stage2`
- Branch: `productization/phase-3-people-graph`
- Required starting commit: `d14ea84dc00fa21bd2d2334a67d253d179d1c77e`
- Remote: `origin` = `git@github.com:cheng-Lokesh/Astraloom.git`
- Database: PostgreSQL 17.6 at
  `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- No `src/lib/v2/**` change: `git diff --exit-code
  productization/phase-1-contract -- src/lib/v2` returned 0.

The initially applied migration history contained eleven entries. The only
`plpgsql_check` finding among the five Phase 3 writers was one warning in
`public.lock_relation_graph_phase3(uuid,uuid)`: declared variable `v_seed` was
never read. The applied historical migration was not edited.

## Lock-writer TDD and additive migration

The persistent Graph pgTAP suite was extended from 162 to 163 assertions with
a requirement that `plpgsql_check_function_tb` return zero rows for
`lock_relation_graph_phase3`.

RED was reproduced inside the Graph suite's outer transaction and rollback:

```text
1..163
not ok 16 - Graph lock writer has no plpgsql_check diagnostics
#     have: 1
#     want: 0
# Looks like you failed 1 test of 163.
ROLLBACK
```

The minimal additive migration was created with:

```text
npx supabase migration new phase3_graph_lock_plpgsql_hardening
```

It is
`supabase/migrations/20260829111009_phase3_graph_lock_plpgsql_hardening.sql`.
It only replaces `lock_relation_graph_phase3`: the unread record variable is
removed, and the submitted owned-Seed precondition is expressed as
`PERFORM ...; IF NOT FOUND THEN ...`. It preserves `SECURITY INVOKER`,
`search_path = public, extensions`, `auth.uid()` enforcement, family-before-
Graph lock ordering, transition guards, canonical idempotency/replay,
authenticated-only execution, and exception-path guard reset.

The migration was first loaded in an explicit outer `BEGIN` / `ROLLBACK`:

```text
plpgsql_check diagnostics: 0
prosecdef: f
proconfig: {"search_path=public, extensions"}
ROLLBACK
```

Then `npx supabase db push --local --dry-run` identified only that migration,
and `npx supabase db push --local` applied it. Local migration history now has
twelve matching local and remote rows. SHA-256 for the new migration is
`bbfc2520cb05d83111c694ab4303e775578db8fb7dc3b7a0577d3230b237c165`.

GREEN was then reproduced in non-destructive outer transaction/rollback runs:

| Suite | Plan | Failed assertions | psql exit |
|---|---:|---:|---:|
| Phase 3 Graph | 163 | 0 | 0 |
| Phase 3 Agent | 174 | 0 | 0 |
| Phase 3 People | 74 | 0 | 0 |
| Phase 2 suite one | 7 | 0 | 0 |
| Phase 2 suite two | 10 | 0 | 0 |

`plpgsql_check` returned zero diagnostics for all five Phase 3 functions:
Key People extraction and mutation, Agent generation, Graph generation, and
Graph locking.

## Database isolation and business-data counts

Before and after the database runs and local migration application, the saved
business-data counts were identical:

| Relation | Before | After |
|---|---:|---:|
| `seed_contexts` | 16 | 16 |
| `key_people` | 0 | 0 |
| Key People receipts | 0 | 0 |
| `agent_profiles` | 0 | 0 |
| Agent snapshots | 0 | 0 |
| Agent receipts | 0 | 0 |
| Graph snapshots | 0 | 0 |
| Graph receipts | 0 | 0 |
| `relation_edges` | 0 | 0 |
| Consent events | 16 | 16 |

The pgTAP runs explicitly covered the Graph, Agent, and People RLS,
anonymous-user, two-user, function-security, migration-history, and rollback
cases; no test fixture or business record remained.

## Application and repository regression

| Gate | Observed result |
|---|---|
| Aggregate People/Agent/Graph controller and API tests | 11 files, 125/125 tests, exit 0 |
| `npm test` (default full Vitest) | 53 files, 551/551 tests, exit 0; the former V2 five-second timeout did not reproduce |
| `npm run test:coverage` | 53 files, 551/551 tests, exit 0; 90.82% statements, 81.21% branches, 95.44% functions, 93.52% lines |
| `npm run lint` | exit 0 |
| `npm run type-check` | exit 0 |
| `npm run build` | exit 0; 108 static pages |
| `npm run test:hero-render-budget` | exit 0; current Cinematic Hero render-budget checks passed |
| `npm run test:interactive-hero` | exit 0; current Cinematic Hero interaction checks passed |
| Whitespace / frozen V2 | `git diff --check` exit 0; V2 diff exit 0 |

The two Hero scripts had become stale after the homepage moved from the
observatory component to `CinematicCommandHero`: each first failed by looking
for the retired component, then passed after its static contract was updated
to the current lazy Three.js, DPR/budget, reduced-motion, video, fallback,
mobile, focus, CTA, and routing behavior. No product component changed.

## Combined Step D browser gate

The required browser activity used only the Codex in-app Browser runtime. A
single temporary page was created, and its very first attempted navigation was
to `http://localhost:3000/`. The runtime returned:

```text
Browser Use rejected this action due to browser security policy. Reason:
The user declined permission for this action. Browser use cannot access
http://localhost:3000 because the user denied permission for this request.
```

The task explicitly prohibits a workaround. Accordingly no Chrome, CLI,
alternate browser, indirect execution, or retry was used. There was no page
render, authenticated session, test-account/data creation, viewport change,
refresh/re-login run, lock-state check, network/console inspection, or
375/1280 observation. No browser-created business data exists to clean up.

## Final factual conclusion

Step E is **BLOCKED**, solely because its mandatory real rendered browser
replay did not run. The successful non-browser gates cannot substitute for
that replay. Step D and Phase 3 are not accepted; Phase 4 is unauthorized.
