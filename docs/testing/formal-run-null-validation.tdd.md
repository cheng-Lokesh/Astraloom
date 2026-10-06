# Formal Run NULL validation repair

Date: 2026-10-06. Journey: an authenticated owner can persist or replay a valid
30/90-day formal Run, while malformed required input is rejected atomically.
No source plan was supplied; the regression follows the audited RPC boundary.

## Evidence

The existing Docker Desktop installation and existing Supabase containers were
started without reset. CLI help and version were inspected first. The cached
Supabase CLI is 2.118.0, invoked through:

```powershell
$runCli = 'C:\Users\clf04\AppData\Local\npm-cache\_npx\b96a6bd565c470ce\node_modules\supabase\dist\supabase.js'
node $runCli test db --local supabase/tests/m1_formal_run_null_validation_test.sql
```

RED: exit 1, 1 file, 137 assertions, 102 failures caused by the intended input
validation bugs. SQL NULL horizon and multiple missing/null identity, version,
fingerprint, Event, and Claim fields returned `accepted`; other malformed fields
reached database casts or constraints instead of controlled validation. Setup
completed successfully. RED checkpoint: `61ea297` on the active branch.

Each attempted call is enclosed in a rollback subtransaction, including a buggy
successful call; the test itself rolls back. The final checks proved zero Run
and receipt rows for the synthetic fixture account. No actual account content
is read by this fixture.

```powershell
node $runCli migration new m1_formal_run_null_validation
node $runCli migration list --local
node $runCli migration up --local
node $runCli test db --local supabase/tests/m1_formal_run_null_validation_test.sql supabase/tests/m1_formal_run_owner_write_boundary_test.sql supabase/tests/m1_formal_run_bundle_test.sql supabase/tests/m1_formal_run_api_test.sql
```

Migration creation, local listing, and local apply: exit 0. Only the new
`20261006064439_m1_formal_run_null_validation.sql` migration was pending and
applied. An additional runtime-contract review required the deterministic seed
to be positive and at most 2,000,000,000. Three added cases first returned RED:
exit 1, 140 assertions, 3 failures (zero/negative reached a table constraint,
and 2,000,000,001 was accepted). Additional RED checkpoint: `d2422fd`.

The uncommitted forward migration candidate was then tightened and its exact
function body synchronized locally with the following non-reset command,
exit 0 (`CREATE FUNCTION`), without another migration-history entry:

```powershell
Get-Content -LiteralPath supabase/migrations/20261006064439_m1_formal_run_null_validation.sql -Raw | docker exec -i supabase_db_Astraloom-stage2 psql -U postgres -d postgres -v ON_ERROR_STOP=1
```

Final GREEN with the same four-file command: exit 0, 282 assertions (140 new NULL/input assertions,
25 owner/write-boundary assertions, 98 Bundle assertions, 19 API assertions).
The existing suites cover owner isolation, invoker/grant restrictions,
immutable artifacts, failed-write rollback, identical retry, and content
conflicts. Both valid 30/90-day controls pass in the new suite.

```powershell
node $runCli db advisors --local --type security --level warn --fail-on error
git diff --check
```

The unstaged whitespace check and Advisors both exited 0. The later staged
check identified one extra blank line at the new migration's EOF; this was
removed in a follow-up commit and the staged check then exited 0. The SQL
function body did not change. Advisors returned one existing warning: `plpgsql_check` is in
`public`; this migration does not create or relocate extensions. No security
error was reported. Supabase changelog HTTP fetch returned 200; the September
25 Postgres minor-release breaking changes do not change ordinary SQL NULL or
JSONB comparison semantics used here.

`npm.cmd test -- src/lib/formal-sandbox/runtime.test.ts` also exited 0:
1 file, 9 tests. This checks the real runtime Bundle producer's contract without
changing V2 Core or claiming a browser/end-to-end acceptance.

## Guarantees and limits

| Guarantee | Evidence |
| --- | --- |
| SQL NULL horizon and Bundle fail before persistence | New SQL NULL controls |
| Missing keys, JSON null, and wrong types fail closed | 39 required paths, three mutations each |
| Nested references and Report references require nonempty typed arrays | New array and member regressions |
| Numeric coercion/overflow cannot replace required input validation | String horizon and fractional/overflow seed regressions |
| Valid calls retain both horizons and atomic owner persistence | New controls and existing Bundle suite |
| Permissions and completed-artifact immutability remain intact | Existing owner/write-boundary and Bundle suites |

Only the same SECURITY INVOKER function is replaced; no grants, RLS policies,
V2 Core files, existing migrations, or remote database are changed. Input
validation is performed before opening the existing transaction-local guard;
its success and exception reset paths remain intact. This repair validates the
RPC's persisted field boundary; it does not add a second full V2 canonical
validator in SQL.

No SQL branch-coverage percentage is claimed. No full application suite,
browser acceptance, deployment, remote push, or final product acceptance was
performed in this bounded repair.

## Independent review closeout (2026-10-06)

Per the independent reviewer's report (recorded here as a supplied review,
not as tests rerun by this author), the strict verdict is PASS only for SQL
NULL handling and required-shape validation: the four-file pgTAP CLI run exited
0 with 282 tests, and the documented test names are the same four files listed
above. The database function body matched commit `632d83c`; `prosecdef=false`,
`search_path=public,extensions`, and EXECUTE is denied to `anon` and
`service_role` while allowed to `authenticated`. Eleven additional transactional
probes exited 0; the original matrix remained 140 ok, 0 not ok.

The review also observed accepted legacy inputs outside this bounded repair:
invalid `createdAt` dates, zero or oversized before/after revisions,
`agents[null]`, and `edges[false]`. These are pre-existing semantic gaps, not
new regressions covered by this change; track them for a future concentrated
hardening pass. This scoped PASS does not establish complete V2 SQL semantics,
browser acceptance, or whole-product acceptance.
