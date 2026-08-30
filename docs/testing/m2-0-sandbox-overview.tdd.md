# M2.0 My Sandbox TDD evidence

## Source and journeys

The delegated M2.0 fixed plan defines these journeys:

1. A signed-in new account sees no fabricated digital-life data and starts
   formal intake.
2. A person with a partial stored chain is sent to People, Agents, or Graph.
3. A person with a locked Graph opens a running Run, latest result, or Graph to
   start a Run according to real server state.
4. An anonymous or failed request never receives a local fallback projection.
5. Desktop and mobile navigation reach formal account routes without a Result
   dead end.

## RED and GREEN

| Stage | Commit | Command | Exit | Evidence |
| --- | --- | --- | ---: | --- |
| RED | `9826af5467a70cd2b68105e8ba2568406ed4cabc` | `npm test -- src/lib/sandbox-overview/overview.server.test.ts src/app/api/sandbox-overview/route.test.ts src/app/app/dashboard/page.m2.test.ts src/components/app-shell.m2.test.ts` | 1 | New server modules did not exist; static dashboard/navigation assertions also exposed the old Observatory, repository import, static cases, and Result navigation. |
| GREEN | `85951b57406ef5c9b88b19337874d8711c1290e2` | same command | 0 | 4 test files and 16 tests passed. |
| Expanded projection proof | pending evidence commit | same command | 0 | 4 test files and 22 tests passed, including owner-constrained query recording, each next action, and bad-row Zod rejection. |
| Anonymous server branch | pending evidence commit | `npm test -- src/app/app/dashboard/page.m2.test.ts` | 1 then 0 | RED established that the client module was absent; GREEN puts session handling in the server page so anonymous visitors do not request the protected endpoint or emit a console error. |

## Guarantees

| # | Guarantee | Test |
| --- | --- | --- |
| 1 | Every Seed, People, Agent, Graph, Run, History, and Feedback state chooses one truthful next action. | `overview.server.test.ts` |
| 2 | Unmodeled fields remain explicit and invalid projections are rejected. | `overview.server.test.ts` |
| 3 | The API returns 401 without authentication, is no-store, derives owner only from session, and sanitizes persistence errors. | `route.test.ts` |
| 4 | The dashboard has server API, loading/error states, no static cases, and no repository/localStorage import. | `page.m2.test.ts` |
| 5 | Primary navigation exposes My Sandbox, Start, People, Graph, Running, and History on mobile and desktop, with focus and press states. | `app-shell.m2.test.ts` |

## Final-gate note

Focused overview/API coverage completed at 91.11% statements, 91.54% branches,
100% functions, and 100% lines. Repository coverage completed at 90.85%
statements, 81.21% branches, 95.55% functions, and 93.52% lines. Production
browser acceptance completed for a fresh anonymous session and a local
full-chain authenticated session at 375, 768, and 1280 CSS pixels, with 0
errors / 0 warnings in each checked console.

An initial repository `npm test` run timed out in six V2 cases while the
task-owned production server/browser load was still active. After those task
processes were stopped and no configuration, timeout, or V2 source was changed,
the exact final `npm test` passed: 62 files / 594 tests.
