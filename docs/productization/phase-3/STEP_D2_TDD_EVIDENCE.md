# Phase 3 Step D2 — Agents UI TDD Evidence

Status: D2 code and API gates independently accepted; rendered browser
acceptance remains part of the open Step D gate. This document does not accept
Step D, Phase 3, Graph UI, Phase 4, migration work, API changes, V2 changes, or
a production deployment.

## Scope

`/app/new/agents` now reads only the current authenticated account's newest
submitted Seed, `GET /api/key-people?seed_id=...`, and
`GET /api/agents?seed_id=...`. It creates a later immutable version only via
`POST /api/agents/generate`. The browser client has no repository or
localStorage fallback and rejects unknown response fields before they reach UI
state. Existing snapshot fields have no edit control.

The page allows generation only when the recovered People ledger has at least
one `confirmed` person. It explains empty, downgraded, and safety-blocked
states; a safety-blocked later request retains and displays a prior immutable
snapshot, while keeping new generation and Graph navigation unavailable.

## RED

Command (run alone):

```text
npx vitest run src/lib/agents/formal-agents-client.test.ts --reporter=verbose
```

Observed exit code: **1**. The new test file failed to import the intentionally
missing `formal-agents-client` module. This was the intended missing-client
signal, before production implementation.

RED checkpoint: `6f97ff0 test: add formal agents UI recovery contract`.

## GREEN

Command (run alone):

```text
npx vitest run src/lib/agents/formal-agents-client.test.ts --reporter=verbose
```

Observed exit code: **0** — 1 file, 15 tests passed.

| Guarantee | Test coverage |
|---|---|
| Latest submitted Seed uses deterministic submitted-time/ID selection, then rehydrates server People and Agent state | recovery test |
| Auth, no Seed, malformed recovery, and empty snapshots remain private and safe | recovery-state tests |
| Candidate, deleted, and merged People cannot invoke generation | confirmed-People gate |
| Generation uses only selector, fresh UUID idempotency key, and parallel-self boolean | generate request test |
| Snapshot fields are server projections, immutable in UI state, and conservative downgrade has no NPCs | snapshot and downgraded tests |
| `safety_blocked` communicates zero writes, never retries, and preserves an existing immutable version | blocked tests |
| 404, 409, 500, malformed response, raw input/trace leakage, duplicate in-flight calls, and conflict recovery are fail-closed | failure, redaction, in-flight, and reload tests |
| UI synchronizes pending state immediately when generation begins and again when it settles | immediate UI synchronization test |

## Required verification

Each command below was run separately; no command was chained behind another
command's success.

| Check | Command | Exit code | Result |
|---|---|---:|---|
| D2 controller | `npx vitest run src/lib/agents/formal-agents-client.test.ts --reporter=verbose` | 0 | 15/15 passed |
| Related API regression | `npx vitest run src/lib/agents/formal-agents-client.test.ts src/app/api/agents/route.phase3.test.ts src/app/api/agents/generate/route.phase3.test.ts src/app/api/key-people/route.test.ts --reporter=verbose` | 0 | 4 files, 39/39 passed |
| Exact D2 ESLint | `npx eslint src/app/app/new/agents/page.tsx src/lib/agents/formal-agents-client.ts src/lib/agents/formal-agents-client.test.ts` | 0 | passed |
| TypeScript | `npm run type-check` | 0 | `next typegen` and `tsc --noEmit` passed |
| Whitespace | `git diff --check` | 0 | passed (Git emitted only CRLF conversion warnings) |
| Frozen V2 | `git diff --exit-code productization/phase-1-contract -- src/lib/v2` | 0 | zero diff |

## Browser and data note

Browser CLI validation could not start in this restricted environment:
`npx --package @playwright/cli playwright-cli --help` failed before a browser
opened because npm was denied permission to create its user-cache temporary
directory (`EPERM`). No browser profile, test account, Seed, People, Agent,
receipt, or Graph data was created. Consequently, 375/1280 visual and real
authenticated browser acceptance remain for the controller's browser runtime.

No migration, API, database, or V2 file was changed by D2. The prior D1
evidence records the local business-data baseline as 16 Seed Contexts and zero
People, People receipts, Agents, Agent receipts, Graph snapshots, Graph
receipts, and Relation Edges; this D2 execution did not run a database fixture
or change that baseline.

## Controller and independent review

The controller separately reran all D2 focused gates, full-repository lint, and
the 108-page production build. It also queried the migrated local database and
confirmed 16 Seed Contexts with zero People, People receipts, Agent snapshots,
Agents, Agent receipts, Graph snapshots, Graph receipts, and Relation Edges.

Independent reviewer task `01a043e2-2e52-7641-a6a4-3c1660684856` verified
candidate `106aaa8a2fda07a43187d9d44fab32cbf7be851a` and returned FINAL PASS for
D2 code and API gates. It independently reproduced 15/15 controller tests,
39/39 related API tests, exact D2 ESLint, type-check, whitespace, and both V2
zero-difference checks with exit code 0. It also confirmed the immediate
pending-state synchronization and preservation of a previous immutable
snapshot after a later safety-blocked zero-write request.

The reviewer kept the local-browser restriction separate from this code/API
decision. Step D cannot close until the combined People, Agents, and Graph
journey receives rendered 375/1280 browser acceptance in an accessible runtime.

## Non-goals

No Graph UI, Step E, Phase 4, API route, migration, V2, local repository
fallback, localStorage fallback, real LLM, push, or persistent cache was added.
