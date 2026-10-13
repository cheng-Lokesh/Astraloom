# Bounded self-response hypothesis: functional evidence

Updated 2026-10-13. Canonical branch:
`productization/phase-4-account-sandbox-loop`; this batch resumed from committed
HEAD `5403915`. Unrelated root checkpoints may advance HEAD during shared work.
This batch is still uncommitted. Existing V2 Core is unchanged. The old default
planning migration has exactly one separately authorized syntax repair below.
The fixed nine-stage product route remains the source plan; this batch is only a
bounded formal planning feature candidate, not completion of that route.

## User guarantees

- Authorize one exact self request, conditional NPC response, path, resource and
  whole-run budget; source changes require fresh authorization for a new key.
- Only the first actually selected allocation after that controlled response
  consumes the hypothesis. Unselected candidates and pre-response candidates do
  not consume it. Positive and neutral responses keep neutral quantity.
- Negative response reduces self quantity by 5%; an independently authorized
  symbolic sensitivity assumption may add 5%, capped at 10%. It never becomes
  Reality Evidence, scientific probability or private NPC intention.
- Preserve old requests/results and same-key frozen receipt recovery. Each
  strategy keeps its own trace scope; empty child traces cannot borrow main samples.

## RED and GREEN evidence

The root task supplied the retained exact historical command evidence from
2026-10-07; it is distinguished from this resumption's own executions:

`npx.cmd vitest run src/lib/formal-sandbox/relationship-response.runtime.test.ts`

- 23:27:04: exit 1, one file, two tests, one failed/one passed. Request schema and
  freeze succeeded; nine actual runtime events were produced. The first request
  and negative NPC response existed, but the third actual allocation was `1`
  instead of expected `0.9`. This was a behavioral RED, not an import/setup error.
- 23:30:55: the same command exited 0, one file/two passed after the minimum
  runtime fix. At that point the fixture imported a test module, so those two
  tests must not be described as two independent runtime scenarios.
- The later path P1 was independently reproduced with an actual Node runtime
  probe: a child containing nine commitments and three empty planner traces
  incorrectly acquired three main-path relationship samples. No retained Vitest
  RED exit/count exists for that probe; none is claimed.
- The fix passes explicit pathKey/namespace for every projection entry and adds
  the actual-runtime empty-child regression. Independent review reran five
  runtime tests with exit 0 and confirmed that changing the child path to `main`
  causes projection rejection. This is reviewer evidence, not a self-review.

Git RED/GREEN checkpoint commits were not made for this uncommitted batch.
Historical Git checkpoint completion is therefore not claimed. Root explicitly
holds staging/commit until selected-file review. UI historical RED counts are not
reconstructed. The executable tests and precise retained evidence are preserved.

## Resumption checks actually run

| Guarantee/check | Named target | Result |
| --- | --- | --- |
| Exact frozen v2 body/context before runtime; substitution rejected before writes; completed recovery; old admission | `npx vitest run src/lib/formal-sandbox/default-planning-start.server.test.ts --reporter=verbose` | exit 0, 1 file / 5 tests |
| Strict opt-in v2 and compatible v1 request | `npx vitest run src/lib/formal-planning/relationship-response.test.ts --reporter=verbose` | exit 0, 1 file / 1 test |
| Type correctness | `npx tsc --noEmit` | exit 0; repeated only after removing unused imports/bindings |
| Changed backend lint | explicit 14 changed backend source/test paths passed to `npx eslint` | exit 0, initially two unused-variable warnings; affected two files rechecked clean after mechanical repair |
| Selected diff whitespace | `git diff --check` with batch docs/source paths | exit 0; LF/CRLF notices only |
| Existing candidate synchronization | one explicit non-force hash push, then `git ls-remote` and `git rev-list --left-right --count HEAD...@{upstream}` | push exit 0; exact `5403915`; divergence `0 0` |

An earlier combined focused execution lost its output/session evidence in this
resumption; it is not counted as PASS. The named Start rerun above completed after
no matching live Start test process remained. Runtime acceptance uses the retained
independent review result instead of repeatedly restarting that heavier target.

## Database and remaining acceptance

The new CLI-created forward file
`20261007153523_formal_relationship_response_hypothesis.sql` adds exact v2 request,
effective-rule/source/frame checks and controlled causal-chain completion while
retaining old invoker/RLS admission and mandatory completion checks. Its source is
authored, not an applied migration or proven DB GREEN.

Independent source review identified a SQL operator-precedence defect in JSON
extraction followed by key deletion. The new forward file parenthesizes those
extractions and replaces the old context fingerprint helper with the equivalent
parenthesized expression. Standard `check_function_bodies=on` validates SQL body
strings at `CREATE FUNCTION`; therefore a new forward repair alone cannot fix a
fresh installation that stops at the earlier broken helper. Root separately
authorized exactly one old-file line: migration 20261007143918 line 42 now reads
`(p_source->'symbolic_lens')-'frozenAt'`. No other old line or data was changed.
The forward replacement also covers previously installed helpers. Evidence is
source review plus PostgreSQL's operator-precedence and check-function-bodies
documentation, not actual SQL RED/GREEN while the daemon is unavailable.
Sources: [PostgreSQL operator precedence](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-PRECEDENCE)
and [check_function_bodies](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-CHECK-FUNCTION-BODIES).

Read-only `docker info --format '{{.ServerVersion}}'` failed because the
DockerDesktopLinuxEngine named pipe was unavailable. No daemon workaround,
database reset or remote DB write was used. Actual owner A/B, anonymous denial,
receipt persistence, rollback, SQL execution and signed-in browser acceptance
remain pending. Mock transport and synthesized browser checks cannot replace them.

No full regression/coverage/E2E rerun was requested for this functional-priority
resumption. Final centralized product acceptance still needs those checks, real
database evidence and independent review. No overall product PASS is claimed.
