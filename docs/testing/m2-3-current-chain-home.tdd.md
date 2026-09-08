# M2.3 Current-chain home candidate evidence

Status: **local release candidate only**. This record does not publish, merge,
or advance a milestone. It does not change migrations or `src/lib/v2/**`.

## Scope and user journey

As an authenticated account owner, I need the current-chain home projection to
show only data that is safely bound to the latest submitted Seed and its current
Agent and Graph snapshots, so an incomplete chain cannot cause an unrelated
Relation Edge read or invent a relationship summary.

M2.3 adds the current-chain digital-life home projection: bounded safe People
and Relation summaries, current-chain Run and Feedback state, account-wide
History count, and one truthful next action. Lifecycle domains that are not
modeled continue to say `not_modeled`; no client-side fallback or identifier
rendering was added.

## TDD checkpoints

| Checkpoint | Commit | Executed result |
| --- | --- | --- |
| Earlier M2.3 contract RED | `2086379` | Historical development checkpoint for the current-chain home behavior. |
| Earlier M2.3 contract GREEN | `c0d7c50` | Historical development checkpoint that added the M2.3 home implementation. |
| Missing-snapshot sentinel RED | `d3395ef` | `npm test -- src/lib/sandbox-overview/overview.server.test.ts` exited 1: the new test observed an unintended Relation Edge query. |
| Missing-snapshot sentinel GREEN | `69c9149` | The same command exited 0: 1 file, 26 tests. |

The new regression supplies a Graph with no current Agent snapshot. It proves
the projection reads no Relation Edges, returns zero relation summaries, retains
the Graph's honest existence/lock state, and directs the owner to build Agents.
The smallest production change makes the edge read conditional on both Graph
and snapshot presence, eliminating the hard-coded UUID-shaped sentinel without
relaxing schema or ownership validation.

## Database, browser, and cleanup evidence from the prior M2.3 development pass

The following are prior-development evidence, not actions repeated in this
closeout pass. A read-only aggregate found three current completed Runs with
Feedback and three without Feedback. The owner production Dashboard passed at
375, 768, and 1280 CSS-pixel viewports: no rendered UUID-shaped identifier,
zero console errors, and Enter activation passed.

The new PKCE current-chain switching checks remain **BLOCKED** at the browser
security layer before business UI. They created no business data. A prior CLI
wrapper / Windows assertion failure is retained as an environment or harness
failure, not a product PASS claim.

Prior sensitive-artifact cleanup completed with aggregate deltas only: mail 0,
sessions 0, refresh records 0, and business records 0. The temporary M2.3 PKCE
helper is absent. This closeout also found no listener on either reserved task
port and no task-owned browser or driver process.

## Current executable evidence

| Command | Result |
| --- | --- |
| `npm test -- src/lib/sandbox-overview/overview.server.test.ts` | PASS, 1 file / 26 tests, exit 0 after GREEN. |
| `npm test` | PASS, 70 files / 678 tests, exit 0. |
| `npm run lint` | PASS, exit 0. |
| `npm run type-check` | PASS, exit 0 after regenerating two untracked, corrupted Next type-cache files. The original failure was limited to generated `.next/dev/types` syntax, not source code. |
| `npm run build` | PASS, exit 0. |

The source-test RED and GREEN were each committed before the next TDD stage.
No coverage command, database test command, Golden command, or frozen V2 suite
was rerun in this closeout. The preceding development pass recorded coverage
of 90.85% statements, 81.21% branches, 95.55% functions, and 93.52% lines;
pgTAP 538 assertions; Golden 3 tests covering 8 cases; and seven V2 suites
green. Those are historical evidence only, not current-run results.

## Closeout scans and non-goals

The final changed-file scan records aggregate findings only: actionable secret
assignments 0, email literals 0, local-origin literals 0, UUID-shaped literals
outside test files 0, and actionable findings 0. The diff has no V2 paths and
no migration paths; `git diff --check` exits 0.

Non-goals: browser-security-layer repair, PKCE implementation changes, new
account or business data, schema/RLS/API changes, migration changes, V2 Core
changes, push, pull request, merge, reset, amend, or rebase.
