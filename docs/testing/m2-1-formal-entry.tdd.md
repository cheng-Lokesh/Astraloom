# M2.1 formal entry and legacy isolation TDD evidence

Status: **candidate only**. This record does not mark M2.1, the second phase,
or Phase 4 as PASS. No push, PR, or merge occurred.

## Scope and non-goals

This change routes public and compatibility entry points to the existing formal
account path. It does not add Track B, a Reality Profile, Destiny, resources,
World State, AI, billing, data models, schema/API/RLS/migrations, changes to
the formal overview contract, or changes under `src/lib/v2/**`.

## User journeys covered

| Guarantee | Test | Result |
| --- | --- | --- |
| Public CTA describes the personal sandbox and uses formal routes only | `m2-1-formal-entry-contract.test.ts` | PASS after GREEN |
| Old Start bookmark redirects without local trial state | same | PASS after GREEN |
| New Scene has Track A and Reality Intake only | same | PASS after GREEN |
| Running without a Run id is an honest empty state | same | PASS after GREEN |
| Missing History timestamps never reveal the Run id | same | PASS after GREEN |
| Formal navigation has no sample or standalone Result destination | same | PASS after GREEN |

## TDD checkpoints

| Stage | Commit | Command | Actual result |
| --- | --- | --- | --- |
| RED | `5c3acd6650c9dc66a7a69ce41f4dfb9c2d36f99a` | `npm.cmd test -- src/app/m2-1-formal-entry-contract.test.ts` | exit 1, 1 file, 6 tests, 5 intended failures. Existing hero, Start, Scene, no-Run state, and History fallback violated the contract. |
| GREEN | `7b012797c2624664610a3b37ece1e4cfdeca2519` | same | exit 0, 1 file, 6 tests passed. |
| M2.0 regression | working tree after GREEN | `npm.cmd test -- src/app/m2-1-formal-entry-contract.test.ts src/lib/sandbox-overview/overview.server.test.ts src/app/api/sandbox-overview/route.test.ts src/app/app/dashboard/page.m2.test.ts src/components/app-shell.m2.test.ts` | exit 0, 5 files, 33 tests passed. |
| Type check | working tree after GREEN | `npm.cmd run type-check` | exit 0. |

## Remaining gates

The full Vitest, coverage, pgTAP, Golden, seven V2 scripts, lint, build,
production-browser, secret/PII scan, and V2-diff gates remain unaccepted in
this candidate record. They must be rerun with complete logs and actual exit
codes before any acceptance decision. The local runner interrupted front-door
long commands at its 30 second execution window, and the background full-test
and lint attempts did not produce an exit code. No success is inferred from
their startup output.
