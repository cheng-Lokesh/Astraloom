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
| Cross-Seed chain coherence RED | `5679abac58c5d9ca1c82f365615a0240f675f7f7` | same focused command | 1 | 5 new cross-Seed/Graph assertions failed because Run and Feedback reads were only account/version scoped. |
| Cross-Seed chain coherence GREEN | `e5765055ba422096f23e5462b42a1e086ca41051` | same focused command | 0 | 4 files / 27 tests passed after current Run reads bound owner, execution version, Seed, and Graph, and Feedback bound the current completed Run. |

## Guarantees

| # | Guarantee | Test |
| --- | --- | --- |
| 1 | Every Seed, People, Agent, Graph, Run, History, and Feedback state chooses one truthful next action. | `overview.server.test.ts` |
| 2 | Unmodeled fields remain explicit and invalid projections are rejected. | `overview.server.test.ts` |
| 3 | The API returns 401 without authentication, is no-store, derives owner only from session, and sanitizes persistence errors. | `route.test.ts` |
| 4 | The dashboard has server API, loading/error states, no static cases, and no repository/localStorage import. | `page.m2.test.ts` |
| 5 | Primary navigation exposes My Sandbox, Start, People, Graph, Running, and History on mobile and desktop, with focus and press states. | `app-shell.m2.test.ts` |
| 6 | Old-Seed and old-Graph Runs or Feedback never drive the current chain; account History remains separate. | `overview.server.test.ts` |

## Final independent acceptance

M2.0 milestone PASS after independent review. This does not mark the second
phase or Phase 4 as PASS, and it does not authorize M2.1 or M3.

The final focused command passed 4 files / 27 tests (exit 0), with 89.74%
focused branch coverage; the overview source reports 89.18% branches. Final
repository `npm test` passed 62 files / 599 tests (exit 0). Full coverage
passed with 90.85% statements, 81.21% branches, 95.55% functions, and 93.52%
lines. pgTAP passed 8 files / 538 assertions; Golden passed 3 tests spanning
all 8 Golden Cases. All seven original V2 scripts, lint, type-check, production
build, `git diff --check`, changed-file secret/PII scan, and the V2 diff review
passed.

Independent browser evidence established that anonymous dashboard rendering
made no overview request and direct API access returned 401, while an
authenticated overview returned 200. It also established the two-Seed contract:
an old completed Run appears only in History when the newer Seed is partial
(current next action: People); a locked current Graph without a Run directs the
user to start that current run; after completion and feedback, current
completed/current feedback are 1/1 and History is 2. At 375, 768, and 1280 CSS
pixels, there was no horizontal overflow; mobile navigation, keyboard focus,
and long Chinese content passed, with 0 console errors / 0 warnings.

Final owner-scoped sanitized counts were Seeds 16, People 12, Agents 12,
Graphs 2, Runs 2, Events 18, Claims 2, Reports 2, and Feedback 2. Every Run
referenced a locked Graph and every Feedback record referenced a completed Run.
The larger Seed/People counts are formal paths from independent acceptance
rounds in one account, not a general product baseline, and do not affect the
current-chain assertion.

## Cross-Seed repair evidence

The added RED cases cover an old completed Seed with a new partial Seed, an old
running Seed with a new locked Graph, an old Graph within the newest Seed,
current running/completed precedence, and Feedback scoped to the current
completed Run. The focused GREEN command passed 27 tests. Final focused branch
coverage was 89.74%; overview source coverage remains 89.18% branches. The
overview envelope continues to return a fresh HTTP response
`trace_id`; it does not project persisted trace ids, identities, or raw
scenario fields.
