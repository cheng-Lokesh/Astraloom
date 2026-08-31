# M2.0 My Sandbox independent acceptance evidence

Status: **M2.0 milestone PASS after independent review**. This is a narrow
milestone result only: it does not mark the second phase or Phase 4 as PASS,
does not start M2.1 or M3, and has not been pushed. Career remains a Golden
Case, not Astraloom's product identity.

## Scope

M2.0 replaces the logged-in dashboard's legacy local Observatory with a
server-backed My Sandbox ledger and aligns primary navigation with formal
account routes. It adds no schema, migration, V2 Core, public landing, billing,
admin, Simple Mode, full Reality Profile, Destiny engine, resource model, or
World State work.

## TDD checkpoints

| Stage | Commit | Command | Result |
| --- | --- | --- | --- |
| RED | `9826af5467a70cd2b68105e8ba2568406ed4cabc` | `npm test -- src/lib/sandbox-overview/overview.server.test.ts src/app/api/sandbox-overview/route.test.ts src/app/app/dashboard/page.m2.test.ts src/components/app-shell.m2.test.ts` | exit 1. New overview modules were absent and existing dashboard/navigation violated the contract. |
| GREEN | `85951b57406ef5c9b88b19337874d8711c1290e2` | same focused command | exit 0, 4 files and 16 tests passed. |
| Expanded focused proof | working tree before final evidence commit | same focused command | exit 0, 4 files and 22 tests passed. |
| Anonymous browser correction | working tree before final evidence commit | `npm test -- src/app/app/dashboard/page.m2.test.ts` | exit 1 RED when the client module did not exist; exit 0 GREEN after moving anonymous authentication handling to the server page. |

## Contract summary

- `GET /api/sandbox-overview` authenticates from the server session and accepts
  no owner selector. It is `no-store` and returns a Zod-validated projection.
- All source reads carry the authenticated owner constraint. The projection
  omits sensitive fields and never renders raw database UUIDs.
- The next action is calculated from the stored Seed, People, Agent, Graph and
  formal Run chain. The current chain is the latest submitted Seed plus that
  Seed's latest Graph: current Run and Feedback reads bind both identifiers,
  while the separate account History count never drives next action. Unavailable
  domains return `not_modeled`.
- The standard response envelope returns a fresh response `trace_id`; it never
  projects a database row's persisted trace id, identity, or raw scenario.
- The dashboard has loading/error/ready states and has no repository or
  localStorage fallback. Navigation has no standalone Result destination.

## Final independent acceptance evidence

- The cross-Seed repair checkpoints are RED `5679aba` (five intended failing
  assertions), GREEN `e576505`, trace-contract documentation `91a6e0b`, and
  fixture type correction `c7c2f7d`.
- Focused M2 suite: exit 0, 4 files / 27 tests. Focused branch coverage was
  89.74%; the overview source coverage remains 89.18% branches.
- pgTAP: exit 0, 8 files / 538 assertions. `npm test`: exit 0, 62 files / 599
  tests. Full coverage: exit 0; 90.85% statements, 81.21% branches, 95.55%
  functions, and 93.52% lines. Golden: exit 0, 3 tests covering all 8 Golden
  Cases.
- All seven original V2 scripts exited 0. Lint, type-check, production build,
  `git diff --check`, changed-file secret/PII scan, and the `src/lib/v2/**`
  diff review all passed.
- Independent production-browser evidence: an anonymous dashboard made no
  overview request and direct API access returned 401; an authenticated
  overview returned 200. An older completed Seed moved to account History when
  a newer Seed was partial, whose current next action was People. With a new
  locked Graph and no Run, the current next action was to start the current
  run. After the new chain completed and received feedback, current completed
  and current feedback were each 1 while History was 2. At 375, 768, and 1280
  CSS pixels there was no horizontal overflow; mobile navigation, keyboard
  focus, and long Chinese content passed, with 0 console errors and 0 warnings.
- Final owner-scoped, sanitized database counts were Seeds 16, People 12,
  Agents 12, Graphs 2, Runs 2, Events 18, Claims 2, Reports 2, and Feedback 2.
  Every Run referenced a locked Graph and every Feedback record referenced a
  completed Run. The extra Seed and People records are formal test paths from
  multiple independent acceptance rounds in one account; they do not affect
  the current-chain assertions and are not a general product baseline.

## Gate boundary

This evidence-only closeout changes no production code, tests, configuration,
migration, or V2 Core. It does not claim local, upstream, and remote are equal;
the candidate remains unpushed. It does not authorize M2.1, M3, a push, PR, or
merge, and does not mark the second phase or Phase 4 as PASS.
