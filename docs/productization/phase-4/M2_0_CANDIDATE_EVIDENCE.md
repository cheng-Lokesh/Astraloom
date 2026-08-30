# M2.0 My Sandbox candidate evidence

Status: candidate only. This document does not mark Phase 4, the second phase,
or any later M2 slice as PASS.

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
  formal Run chain. Unavailable domains return `not_modeled`.
- The dashboard has loading/error/ready states and has no repository or
  localStorage fallback. Navigation has no standalone Result destination.

## Actual candidate evidence

- Focused M2 suite: exit 0, 4 files / 22 tests.
- Focused overview/API coverage: exit 0, 20 tests; statements 91.11%, branches
  91.54%, functions 100%, lines 100%.
- pgTAP: exit 0, 8 files / 538 assertions. `npm run test:golden`: exit 0, 3
  tests. Production `npm run build`: exit 0 after the anonymous browser fix.
- Final clean `npm test`: exit 0, 62 files / 594 tests. Final
  `npm run test:coverage`: exit 0, 62 files / 594 tests; statements 90.85%,
  branches 81.21%, functions 95.55%, lines 93.52%. Final `npm run lint`:
  exit 0.
- Browser production check: a fresh anonymous session made no
  `/api/sandbox-overview` request and had 0 errors / 0 warnings. An existing
  local authenticated full-chain account received 200 from the endpoint, had
  0 errors / 0 warnings, and showed only the server-backed counts/statuses.
  Screenshots were checked at 375, 768, and 1280 CSS pixels; no raw identifier
  was rendered. The retained evidence files are
  `output/playwright/m20-anon-{375,768,1280}.png` and
  `output/playwright/m20-full-{375,768,1280}.png`.

## Gate boundary

An earlier `npm test` exited 1 under concurrent browser/production-server load:
588/594 tests passed and six V2 timing tests exceeded their fixed limits. After
stopping the task-owned browser/service processes, the unchanged precise final
`npm test` exited 0. This evidence is still **M2.0 candidate only**: it does
not claim Phase 4 PASS, M2.1, M3, or a V2 change, push, PR, or merge.
